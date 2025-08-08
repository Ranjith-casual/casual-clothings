// Centralized Pricing Service for consistent calculations across the application
export class PricingService {
    
    /**
     * Calculate item price with size adjustments and discounts
     * @param {Object} item - Cart/Order item
     * @param {Object} product - Product details
     * @returns {Object} Pricing breakdown
     */
    static calculateItemPricing(item, product = null) {
        try {
            const productInfo = product || item.productId || item.productDetails;
            const isBundle = item.itemType === 'bundle' || !!item.bundleId;
            
            if (isBundle) {
                return this.calculateBundlePricing(item);
            } else {
                return this.calculateProductPricing(item, productInfo);
            }
        } catch (error) {
            console.error('Error in calculateItemPricing:', error);
            return this.getFallbackPricing(item);
        }
    }
    
    /**
     * Calculate bundle pricing
     * @param {Object} item - Bundle item
     * @returns {Object} Pricing breakdown
     */
    static calculateBundlePricing(item) {
        const bundleInfo = item.bundleId || item.bundleDetails;
        const originalPrice = bundleInfo?.originalPrice || bundleInfo?.bundlePrice || 0;
        const bundlePrice = bundleInfo?.bundlePrice || 0;
        const quantity = item.quantity || 1;
        
        return {
            unitPrice: bundlePrice,
            originalPrice: originalPrice,
            discount: originalPrice > bundlePrice ? ((originalPrice - bundlePrice) / originalPrice) * 100 : 0,
            totalPrice: bundlePrice * quantity,
            totalOriginalPrice: originalPrice * quantity,
            isBundle: true,
            hasDiscount: originalPrice > bundlePrice
        };
    }
    
    /**
     * Calculate product pricing with size adjustments
     * @param {Object} item - Product item
     * @param {Object} productInfo - Product details
     * @returns {Object} Pricing breakdown
     */
    static calculateProductPricing(item, productInfo) {
        const quantity = item.quantity || 1;
        let basePrice = 0;
        let originalPrice = 0;
        let discount = productInfo?.discount || 0;
        
        // Step 1: Determine base price - prioritize stored pricing values
        // First priority: Use stored sizeAdjustedPrice if available
        if (item.sizeAdjustedPrice !== undefined && Number(item.sizeAdjustedPrice) > 0) {
            // Use explicit size-adjusted price
            basePrice = Number(item.sizeAdjustedPrice);
            originalPrice = basePrice; // For size-adjusted, this is already the adjusted original
        } 
        // Second priority: Use stored unitPrice if available
        else if (item.unitPrice !== undefined && Number(item.unitPrice) > 0) {
            basePrice = Number(item.unitPrice);
            originalPrice = basePrice;
        }
        // Third priority: Use stored itemTotal divided by quantity if available
        else if (item.itemTotal !== undefined && Number(item.itemTotal) > 0) {
            basePrice = Number(item.itemTotal) / quantity;
            originalPrice = basePrice;
        }
        // Fourth priority: Use size-specific pricing from product
        else if (item.size && productInfo?.sizePricing?.[item.size] !== undefined) {
            basePrice = Number(productInfo.sizePricing[item.size]);
            originalPrice = basePrice;
        }
        // Fifth priority: Apply size multipliers to base price
        else if (item.size && this.hasSizeMultipliers(item.size)) {
            const multiplier = this.getSizeMultiplier(item.size);
            const productPrice = productInfo?.price || 0;
            basePrice = productPrice * multiplier;
            originalPrice = basePrice;
        } 
        // Last priority: Use regular product price
        else {
            basePrice = productInfo?.price || 0;
            originalPrice = basePrice;
        }
        
        // Step 2: Apply discount if available
        const finalPrice = discount > 0 ? this.applyDiscount(basePrice, discount) : basePrice;
        
        return {
            unitPrice: finalPrice,
            originalPrice: originalPrice,
            discount: discount,
            totalPrice: Math.round(finalPrice * quantity * 100) / 100,
            totalOriginalPrice: Math.round(originalPrice * quantity * 100) / 100,
            isBundle: false,
            hasDiscount: discount > 0,
            size: item.size,
            sizeAdjusted: !!item.sizeAdjustedPrice
        };
    }
    
    /**
     * Apply discount with proper rounding
     * @param {number} price - Base price
     * @param {number} discountPercent - Discount percentage
     * @returns {number} Discounted price
     */
    static applyDiscount(price, discountPercent) {
        if (discountPercent <= 0 || discountPercent > 100) return price;
        
        const discountAmount = (price * discountPercent) / 100;
        const finalPrice = price - discountAmount;
        
        // Round to 2 decimal places
        return Math.round(finalPrice * 100) / 100;
    }
    
    /**
     * Get size multiplier for pricing
     * @param {string} size - Size code
     * @returns {number} Multiplier
     */
    static getSizeMultiplier(size) {
        const sizeMultipliers = {
            'XS': 0.95,
            'S': 1.0,
            'M': 1.05,
            'L': 1.1,
            'XL': 1.15,
            'XXL': 1.2,
            'XXXL': 1.25
        };
        
        return sizeMultipliers[size?.toUpperCase()] || 1.0;
    }
    
    /**
     * Check if size has multipliers
     * @param {string} size - Size code
     * @returns {boolean} Has multipliers
     */
    static hasSizeMultipliers(size) {
        const sizeMultipliers = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        return sizeMultipliers.includes(size?.toUpperCase());
    }
    
    /**
     * Calculate totals for multiple items
     * @param {Array} items - Array of items
     * @returns {Object} Total calculations
     */
    static calculateTotals(items) {
        return items.reduce((totals, item) => {
            const pricing = this.calculateItemPricing(item);
            
            return {
                totalQty: totals.totalQty + (item.quantity || 1),
                totalPrice: Math.round((totals.totalPrice + pricing.totalPrice) * 100) / 100,
                totalOriginalPrice: Math.round((totals.totalOriginalPrice + pricing.totalOriginalPrice) * 100) / 100,
                totalDiscount: Math.round((totals.totalDiscount + (pricing.totalOriginalPrice - pricing.totalPrice)) * 100) / 100
            };
        }, { totalQty: 0, totalPrice: 0, totalOriginalPrice: 0, totalDiscount: 0 });
    }
    
    /**
     * Calculate delivery charge - now uses fixed ₹100 for all orders
     * @param {number} totalAmount - Order total (kept for compatibility)
     * @param {number} distance - Delivery distance (kept for compatibility)
     * @param {Object} deliveryRules - Delivery pricing rules (kept for compatibility)
     * @returns {number} Delivery charge (always 100)
     */
    static calculateDeliveryCharge(totalAmount = 0, distance = 0, deliveryRules = {}) {
        // Fixed delivery charge of ₹100 for all orders
        // This overrides any previous calculation logic for consistency
        return 100;
    }
    
    /**
     * Calculate refund amount based on policy
     * @param {Object} order - Order details
     * @param {Object} refundPolicy - Refund policy rules
     * @returns {Object} Refund calculation
     */
    static calculateRefundAmount(order, refundPolicy = {}) {
        const {
            baseRefundPercentage = 75,
            deliveredOrderPenalty = 25,
            lateRequestPenalty = 15,
            minimumRefundPercentage = 25
        } = refundPolicy;
        
        let refundPercentage = baseRefundPercentage;
        const orderDate = new Date(order.orderDate);
        const currentDate = new Date();
        const daysSinceOrder = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
        
        // Apply penalties based on order status and timing
        if (order.orderStatus === 'DELIVERED') {
            refundPercentage -= deliveredOrderPenalty;
        }
        
        if (daysSinceOrder > 7) {
            refundPercentage -= lateRequestPenalty;
        }
        
        // Ensure minimum refund percentage
        refundPercentage = Math.max(refundPercentage, minimumRefundPercentage);
        
        const refundAmount = Math.round((order.totalAmt * refundPercentage / 100) * 100) / 100;
        const retainedAmount = Math.round((order.totalAmt - refundAmount) * 100) / 100;
        
        return {
            refundPercentage,
            refundAmount,
            retainedAmount,
            originalAmount: order.totalAmt
        };
    }
    
    /**
     * Fallback pricing for error cases
     * @param {Object} item - Item details
     * @returns {Object} Basic pricing
     */
    static getFallbackPricing(item) {
        const quantity = item.quantity || 1;
        
        // Prioritize stored pricing values in fallback calculation
        let price = 0;
        
        // First priority: Use sizeAdjustedPrice if available
        if (item.sizeAdjustedPrice !== undefined && Number(item.sizeAdjustedPrice) > 0) {
            price = Number(item.sizeAdjustedPrice);
        }
        // Second priority: Use unitPrice if available
        else if (item.unitPrice !== undefined && Number(item.unitPrice) > 0) {
            price = Number(item.unitPrice);
        }
        // Third priority: Calculate from itemTotal if available
        else if (item.itemTotal !== undefined && Number(item.itemTotal) > 0) {
            price = Number(item.itemTotal) / quantity;
        }
        // Last priority: Use basic price or default to 0
        else {
            price = item.price || 0;
        }
        
        return {
            unitPrice: price,
            originalPrice: price,
            discount: 0,
            totalPrice: price * quantity,
            totalOriginalPrice: price * quantity,
            isBundle: false,
            hasDiscount: false,
            error: true
        };
    }
    
    /**
     * Validate pricing calculations
     * @param {Object} pricing - Pricing object to validate
     * @returns {Object} Validation result
     */
    static validatePricing(pricing) {
        const errors = [];
        
        if (pricing.unitPrice < 0) errors.push('Unit price cannot be negative');
        if (pricing.totalPrice < 0) errors.push('Total price cannot be negative');
        if (pricing.discount < 0 || pricing.discount > 100) errors.push('Discount must be between 0-100%');
        if (pricing.totalOriginalPrice < pricing.totalPrice && !pricing.isBundle) {
            errors.push('Original price cannot be less than final price');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Format currency display
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency symbol
     * @returns {string} Formatted amount
     */
    static formatCurrency(amount, currency = '₹') {
        const numAmount = Number(amount) || 0;
        return `${currency}${numAmount.toFixed(2)}`;
    }
}

export default PricingService;
