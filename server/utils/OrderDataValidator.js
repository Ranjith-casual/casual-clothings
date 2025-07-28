// Server-side script to validate and fix existing order data
import orderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import BundleModel from '../models/bundles.js';

export class OrderDataValidator {
    
    /**
     * Validate all orders in the database for pricing consistency
     */
    static async validateAllOrders() {
        try {
            console.log('🔍 Starting order data validation...');
            
            const orders = await orderModel.find({})
                .populate('items.productId')
                .populate('items.bundleId')
                .limit(100) // Process in batches
                .lean();
            
            const results = {
                totalOrders: orders.length,
                validOrders: 0,
                invalidOrders: 0,
                fixedOrders: 0,
                errors: []
            };
            
            for (const order of orders) {
                const validation = await this.validateOrderPricing(order);
                
                if (validation.isValid) {
                    results.validOrders++;
                } else {
                    results.invalidOrders++;
                    results.errors.push({
                        orderId: order.orderId,
                        errors: validation.errors,
                        discrepancies: validation.discrepancies
                    });
                    
                    // Optionally fix the order
                    if (validation.canFix) {
                        const fixed = await this.fixOrderPricing(order);
                        if (fixed) {
                            results.fixedOrders++;
                        }
                    }
                }
            }
            
            console.log('📊 Validation Results:', results);
            return results;
            
        } catch (error) {
            console.error('Error validating orders:', error);
            throw error;
        }
    }
    
    /**
     * Validate pricing for a single order
     */
    static async validateOrderPricing(order) {
        const validation = {
            isValid: true,
            errors: [],
            discrepancies: [],
            canFix: false
        };
        
        try {
            let calculatedSubTotal = 0;
            
            // Validate each item in the order
            for (const item of order.items || []) {
                const itemValidation = await this.validateOrderItem(item, order);
                
                if (!itemValidation.isValid) {
                    validation.isValid = false;
                    validation.errors.push(...itemValidation.errors);
                }
                
                calculatedSubTotal += itemValidation.calculatedTotal;
                
                if (itemValidation.discrepancy) {
                    validation.discrepancies.push(itemValidation.discrepancy);
                }
            }
            
            // Validate order totals
            const subTotalDiscrepancy = Math.abs(calculatedSubTotal - (order.subTotalAmt || 0));
            if (subTotalDiscrepancy > 0.01) {
                validation.isValid = false;
                validation.discrepancies.push({
                    type: 'subtotal',
                    stored: order.subTotalAmt,
                    calculated: calculatedSubTotal,
                    difference: subTotalDiscrepancy
                });
            }
            
            // Check delivery charge consistency - use actual delivery charge field
            const deliveryCharge = order.deliveryCharge || 0;
            if (deliveryCharge < 0) {
                validation.isValid = false;
                validation.errors.push('Negative delivery charge detected');
            }
            
            // Check if order can be fixed
            validation.canFix = validation.discrepancies.length > 0 && validation.errors.length === 0;
            
        } catch (error) {
            validation.isValid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }
        
        return validation;
    }
    
    /**
     * Validate a single order item
     */
    static async validateOrderItem(item, order) {
        const validation = {
            isValid: true,
            errors: [],
            calculatedTotal: 0,
            discrepancy: null
        };
        
        try {
            if (item.itemType === 'bundle') {
                validation.calculatedTotal = await this.calculateBundleItemTotal(item);
            } else {
                validation.calculatedTotal = await this.calculateProductItemTotal(item);
            }
            
            // Check against stored itemTotal
            const storedTotal = item.itemTotal || 0;
            const difference = Math.abs(validation.calculatedTotal - storedTotal);
            
            if (difference > 0.01) {
                validation.discrepancy = {
                    itemId: item._id,
                    type: 'item_total',
                    stored: storedTotal,
                    calculated: validation.calculatedTotal,
                    difference: difference
                };
            }
            
            // Validate unit price consistency
            const expectedUnitPrice = validation.calculatedTotal / (item.quantity || 1);
            const storedUnitPrice = item.unitPrice || 0;
            
            if (Math.abs(expectedUnitPrice - storedUnitPrice) > 0.01) {
                validation.errors.push(`Unit price mismatch for item ${item._id}`);
            }
            
        } catch (error) {
            validation.isValid = false;
            validation.errors.push(`Item validation error: ${error.message}`);
        }
        
        return validation;
    }
    
    /**
     * Calculate expected total for a bundle item
     */
    static async calculateBundleItemTotal(item) {
        const bundleInfo = item.bundleId || item.bundleDetails;
        const bundlePrice = bundleInfo?.bundlePrice || 0;
        const quantity = item.quantity || 1;
        
        return bundlePrice * quantity;
    }
    
    /**
     * Calculate expected total for a product item
     */
    static async calculateProductItemTotal(item) {
        const quantity = item.quantity || 1;
        let unitPrice = 0;
        
        // Check for size-adjusted price first
        if (item.sizeAdjustedPrice !== undefined) {
            unitPrice = item.sizeAdjustedPrice;
        } else if (item.size) {
            // Try to get size-specific pricing from product
            const productId = item.productId?._id || item.productId;
            if (productId) {
                const product = await ProductModel.findById(productId).lean();
                if (product?.sizePricing?.[item.size]) {
                    unitPrice = product.sizePricing[item.size];
                } else {
                    unitPrice = product?.price || 0;
                }
            } else {
                unitPrice = item.productDetails?.price || 0;
            }
        } else {
            // Use regular product price
            unitPrice = item.productDetails?.price || item.productId?.price || 0;
        }
        
        // Apply discount if available
        const discount = item.productDetails?.discount || item.productId?.discount || 0;
        if (discount > 0) {
            unitPrice = unitPrice * (1 - discount / 100);
        }
        
        return Math.round(unitPrice * quantity * 100) / 100;
    }
    
    /**
     * Fix pricing inconsistencies in an order
     */
    static async fixOrderPricing(order) {
        try {
            console.log(`🔧 Fixing order ${order.orderId}...`);
            
            let newSubTotal = 0;
            const updatedItems = [];
            
            // Recalculate each item
            for (const item of order.items || []) {
                let calculatedTotal;
                
                if (item.itemType === 'bundle') {
                    calculatedTotal = await this.calculateBundleItemTotal(item);
                } else {
                    calculatedTotal = await this.calculateProductItemTotal(item);
                }
                
                const unitPrice = calculatedTotal / (item.quantity || 1);
                
                const updatedItem = {
                    ...item,
                    itemTotal: calculatedTotal,
                    unitPrice: Math.round(unitPrice * 100) / 100
                };
                
                updatedItems.push(updatedItem);
                newSubTotal += calculatedTotal;
            }
            
            // Use existing delivery charge from order
            const deliveryCharge = order.deliveryCharge || 0;
            const newTotalAmt = newSubTotal + deliveryCharge;
            
            // Update the order in database
            await orderModel.findByIdAndUpdate(order._id, {
                $set: {
                    items: updatedItems,
                    subTotalAmt: Math.round(newSubTotal * 100) / 100,
                    totalAmt: Math.round(newTotalAmt * 100) / 100,
                    lastUpdated: new Date(),
                    pricingFixed: true
                }
            });
            
            console.log(`✅ Fixed order ${order.orderId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to fix order ${order.orderId}:`, error);
            return false;
        }
    }
    
    /**
     * Generate a detailed report of pricing issues
     */
    static async generatePricingReport() {
        const validationResults = await this.validateAllOrders();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalOrders: validationResults.totalOrders,
                validOrders: validationResults.validOrders,
                invalidOrders: validationResults.invalidOrders,
                fixedOrders: validationResults.fixedOrders,
                errorRate: (validationResults.invalidOrders / validationResults.totalOrders * 100).toFixed(2) + '%'
            },
            topIssues: this.analyzeCommonIssues(validationResults.errors),
            recommendations: this.generateRecommendations(validationResults)
        };
        
        return report;
    }
    
    /**
     * Analyze common pricing issues
     */
    static analyzeCommonIssues(errors) {
        const issueTypes = {};
        
        errors.forEach(error => {
            error.errors.forEach(err => {
                const type = err.includes('Unit price') ? 'unit_price_mismatch' :
                            err.includes('delivery') ? 'delivery_charge_issue' :
                            err.includes('subtotal') ? 'subtotal_mismatch' : 'other';
                
                issueTypes[type] = (issueTypes[type] || 0) + 1;
            });
        });
        
        return Object.entries(issueTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }
    
    /**
     * Generate recommendations based on validation results
     */
    static generateRecommendations(results) {
        const recommendations = [];
        
        if (results.invalidOrders > 0) {
            recommendations.push('🔧 Run the fixOrderPricing function to correct calculation errors');
        }
        
        if (results.invalidOrders / results.totalOrders > 0.1) {
            recommendations.push('⚠️ High error rate detected - review pricing logic implementation');
        }
        
        recommendations.push('✅ Implement the new PricingService for all future orders');
        recommendations.push('📊 Set up monitoring to track pricing consistency in real-time');
        recommendations.push('🧪 Run pricing validation tests before each deployment');
        
        return recommendations;
    }
}

export default OrderDataValidator;
