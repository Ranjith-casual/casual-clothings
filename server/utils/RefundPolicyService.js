// Server-side Refund Policy Service
export class RefundPolicyService {
    
    /**
     * Calculate refund amount based on comprehensive business rules
     * @param {Object} order - Order details
     * @param {Object} cancellationRequest - Cancellation request details
     * @param {number} customRefundPercentage - Custom refund percentage if any
     * @param {Object} customerInfo - Optional customer info for loyalty bonuses
     * @returns {Object} Refund calculation result
     */
    static calculateRefundAmount(order, cancellationRequest, customRefundPercentage = null, customerInfo = null) {
        try {
            // Base refund policy configuration
            const refundPolicy = {
                // Base percentages for different timing scenarios
                earlyRefundPercentage: 90,  // 1-2 days
                standardRefundPercentage: 75, // 3-7 days - fallback only
                lateRefundPercentage: 50,   // 7+ days
                
                // Penalties
                deliveredOrderPenalty: 25,
                lateRequestPenalty: 15,
                minimumRefundPercentage: 25,
                maximumRefundPercentage: 100,
                pastEstimatedDatePenalty: 15,
                weekAfterDeliveryPenalty: 20,
                monthAfterDeliveryPenalty: 30,
                
                // Customer loyalty bonuses
                vipCustomerBonus: 10,
                regularCustomerBonus: 5
            };
            
            // Calculate base refund percentage based on cancellation timing
            let basePercentage;
            const orderDate = new Date(order.orderDate);
            const requestDate = new Date(cancellationRequest.requestDate || cancellationRequest.createdAt);
            const daysSinceOrder = Math.floor((requestDate - orderDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceOrder <= 2) {
                // Early cancellation (1-2 days)
                basePercentage = refundPolicy.earlyRefundPercentage;
            } else if (daysSinceOrder <= 7) {
                // Standard cancellation (3-7 days)
                basePercentage = refundPolicy.standardRefundPercentage;
            } else {
                // Late cancellation (7+ days)
                basePercentage = refundPolicy.lateRefundPercentage;
            }
            
            // Use custom percentage if provided (from admin response), otherwise calculate base
            let refundPercentage;
            if (customRefundPercentage !== null && customRefundPercentage !== undefined) {
                // Admin has set a custom refund percentage - use it directly
                refundPercentage = customRefundPercentage;
            } else if (cancellationRequest.adminResponse?.refundPercentage) {
                // Admin response contains refund percentage - use it
                refundPercentage = cancellationRequest.adminResponse.refundPercentage;
            } else {
                // Fall back to calculated base percentage
                refundPercentage = basePercentage;
            }
            
            // Calculate penalties based on delivery status and timing
            const penalties = this.calculateRefundPenalties(order, cancellationRequest, refundPolicy);
            refundPercentage -= penalties.totalPenalty;
            
            // Apply customer loyalty bonuses if customer info is provided
            const bonuses = this.calculateCustomerLoyaltyBonuses(customerInfo, refundPolicy);
            refundPercentage += bonuses.totalBonus;
            
            // Ensure refund percentage is within bounds
            refundPercentage = Math.max(
                refundPolicy.minimumRefundPercentage,
                Math.min(refundPercentage, refundPolicy.maximumRefundPercentage)
            );
            
            // Calculate amounts with proper rounding
            const refundAmount = Math.round((order.totalAmt * refundPercentage / 100) * 100) / 100;
            const retainedAmount = Math.round((order.totalAmt - refundAmount) * 100) / 100;
            
            return {
                success: true,
                refundPercentage: Math.round(refundPercentage * 100) / 100,
                refundAmount,
                retainedAmount,
                originalAmount: order.totalAmt,
                daysSinceOrder: Math.floor((new Date(cancellationRequest.requestDate) - new Date(order.orderDate)) / (1000 * 60 * 60 * 24)),
                penalties: penalties,
                bonuses: bonuses || { totalBonus: 0, reasons: [] },
                cancellationTiming: daysSinceOrder <= 2 ? 'EARLY' : (daysSinceOrder <= 7 ? 'STANDARD' : 'LATE'),
                appliedPolicy: refundPolicy
            };
            
        } catch (error) {
            console.error('Error calculating refund amount:', error);
            return {
                success: false,
                error: error.message,
                refundPercentage: 0,
                refundAmount: 0,
                retainedAmount: order.totalAmt,
                originalAmount: order.totalAmt
            };
        }
    }
    
    /**
     * Calculate refund penalties based on order status and timing
     * @param {Object} order - Order details
     * @param {Object} cancellationRequest - Cancellation request details
     * @param {Object} refundPolicy - Refund policy configuration
     * @returns {Object} Penalty details
     */
    static calculateRefundPenalties(order, cancellationRequest, refundPolicy) {
        const penalties = {
            deliveryPenalty: 0,
            timingPenalty: 0,
            statusPenalty: 0,
            totalPenalty: 0,
            reasons: []
        };
        
        const orderDate = new Date(order.orderDate);
        const requestDate = new Date(cancellationRequest.requestDate || cancellationRequest.createdAt);
        const currentDate = new Date();
        
        // Check delivery status penalties
        if (cancellationRequest.deliveryInfo) {
            const deliveryInfo = cancellationRequest.deliveryInfo;
            
            // Penalty for requesting cancellation after estimated delivery date
            if (deliveryInfo.wasPastDeliveryDate) {
                penalties.timingPenalty += refundPolicy.pastEstimatedDatePenalty;
                penalties.reasons.push(`Request made after estimated delivery date (${refundPolicy.pastEstimatedDatePenalty}% penalty)`);
            }
            
            // Penalty for already delivered orders
            if (deliveryInfo.actualDeliveryDate) {
                const deliveryDate = new Date(deliveryInfo.actualDeliveryDate);
                const daysSinceDelivery = Math.floor((requestDate - deliveryDate) / (1000 * 60 * 60 * 24));
                
                if (daysSinceDelivery <= 7) {
                    penalties.deliveryPenalty += refundPolicy.weekAfterDeliveryPenalty;
                    penalties.reasons.push(`Request within a week of delivery (${refundPolicy.weekAfterDeliveryPenalty}% penalty)`);
                } else if (daysSinceDelivery <= 30) {
                    penalties.deliveryPenalty += refundPolicy.monthAfterDeliveryPenalty;
                    penalties.reasons.push(`Request within a month of delivery (${refundPolicy.monthAfterDeliveryPenalty}% penalty)`);
                } else {
                    penalties.deliveryPenalty += refundPolicy.deliveredOrderPenalty;
                    penalties.reasons.push(`Request after extended period post-delivery (${refundPolicy.deliveredOrderPenalty}% penalty)`);
                }
            }
        }
        
        // Check order status penalties
        if (order.orderStatus === 'DELIVERED') {
            penalties.statusPenalty += refundPolicy.deliveredOrderPenalty;
            penalties.reasons.push(`Order already delivered (${refundPolicy.deliveredOrderPenalty}% penalty)`);
        }
        
        // Late request penalty (more than 7 days after order)
        const daysSinceOrder = Math.floor((requestDate - orderDate) / (1000 * 60 * 60 * 24));
        if (daysSinceOrder > 7) {
            penalties.timingPenalty += refundPolicy.lateRequestPenalty;
            penalties.reasons.push(`Late cancellation request (${refundPolicy.lateRequestPenalty}% penalty)`);
        }
        
        penalties.totalPenalty = penalties.deliveryPenalty + penalties.timingPenalty + penalties.statusPenalty;
        
        return penalties;
    }
    
    /**
     * Calculate customer loyalty bonuses
     * @param {Object} customerInfo - Customer information including order history, VIP status
     * @param {Object} refundPolicy - Refund policy configuration
     * @returns {Object} Customer loyalty bonuses
     */
    static calculateCustomerLoyaltyBonuses(customerInfo, refundPolicy) {
        const bonuses = {
            loyaltyBonus: 0,
            vipBonus: 0,
            totalBonus: 0,
            reasons: []
        };
        
        if (!customerInfo) {
            return bonuses;
        }
        
        // Check if customer is VIP
        if (customerInfo.isVip || customerInfo.membershipTier === 'VIP' || customerInfo.membershipTier === 'PREMIUM') {
            bonuses.vipBonus = refundPolicy.vipCustomerBonus;
            bonuses.reasons.push(`VIP customer bonus (${refundPolicy.vipCustomerBonus}%)`);
        }
        
        // Check order history for loyalty bonus
        if (customerInfo.orderHistory && customerInfo.orderHistory.length >= 5) {
            bonuses.loyaltyBonus = refundPolicy.regularCustomerBonus;
            bonuses.reasons.push(`Regular customer bonus (${refundPolicy.regularCustomerBonus}%)`);
        }
        
        bonuses.totalBonus = bonuses.vipBonus + bonuses.loyaltyBonus;
        
        return bonuses;
    }
    
    /**
     * Calculate partial refund for specific items
     * @param {Object} order - Order details
     * @param {Array} itemsToCancel - Items to be cancelled
     * @param {Object} refundPolicy - Refund policy
     * @returns {Object} Partial refund calculation
     */
    static calculatePartialRefund(order, itemsToCancel, refundPolicy = {}) {
        try {
            let totalCancelledAmount = 0;
            const processedItems = [];
            
            // Calculate total amount for cancelled items
            itemsToCancel.forEach(cancelItem => {
                const orderItem = order.items.find(item => 
                    item._id.toString() === cancelItem.itemId.toString()
                );
                
                if (orderItem) {
                    const itemAmount = cancelItem.itemPrice * cancelItem.quantity;
                    totalCancelledAmount += itemAmount;
                    processedItems.push({
                        itemId: cancelItem.itemId,
                        quantity: cancelItem.quantity,
                        unitPrice: cancelItem.itemPrice,
                        totalAmount: itemAmount
                    });
                }
            });
            
            // Apply refund percentage to cancelled items total
            // Check if there's an admin-set refund percentage in the refund policy
            let baseRefundPercentage;
            if (refundPolicy.adminRefundPercentage) {
                baseRefundPercentage = refundPolicy.adminRefundPercentage;
            } else if (refundPolicy.customRefundPercentage) {
                baseRefundPercentage = refundPolicy.customRefundPercentage;
            } else {
                baseRefundPercentage = refundPolicy.baseRefundPercentage || 75; // fallback only
            }
            
            const refundAmount = Math.round((totalCancelledAmount * baseRefundPercentage / 100) * 100) / 100;
            
            return {
                success: true,
                totalCancelledAmount: Math.round(totalCancelledAmount * 100) / 100,
                refundPercentage: baseRefundPercentage,
                refundAmount,
                retainedAmount: Math.round((totalCancelledAmount - refundAmount) * 100) / 100,
                processedItems
            };
            
        } catch (error) {
            console.error('Error calculating partial refund:', error);
            return {
                success: false,
                error: error.message,
                totalCancelledAmount: 0,
                refundAmount: 0
            };
        }
    }
    
    /**
     * Validate refund calculation
     * @param {Object} refundCalculation - Refund calculation to validate
     * @returns {Object} Validation result
     */
    static validateRefundCalculation(refundCalculation) {
        const errors = [];
        
        if (refundCalculation.refundAmount < 0) {
            errors.push('Refund amount cannot be negative');
        }
        
        if (refundCalculation.refundPercentage < 0 || refundCalculation.refundPercentage > 100) {
            errors.push('Refund percentage must be between 0-100%');
        }
        
        if (refundCalculation.refundAmount > refundCalculation.originalAmount) {
            errors.push('Refund amount cannot exceed original amount');
        }
        
        const calculatedTotal = refundCalculation.refundAmount + refundCalculation.retainedAmount;
        const expectedTotal = refundCalculation.originalAmount;
        
        if (Math.abs(calculatedTotal - expectedTotal) > 0.01) {
            errors.push('Refund and retained amounts do not sum to original amount');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Get refund policy configuration
     * @returns {Object} Current refund policy
     */
    static getRefundPolicy() {
        return {
            baseRefundPercentage: 75,
            deliveredOrderPenalty: 25,
            lateRequestPenalty: 15,
            minimumRefundPercentage: 25,
            maximumRefundPercentage: 100,
            pastEstimatedDatePenalty: 15,
            weekAfterDeliveryPenalty: 20,
            monthAfterDeliveryPenalty: 30,
            description: {
                baseRefundPercentage: "Standard refund percentage for eligible cancellations",
                deliveredOrderPenalty: "Penalty for orders that have been delivered",
                lateRequestPenalty: "Penalty for requests made more than 7 days after order",
                minimumRefundPercentage: "Minimum refund amount regardless of penalties",
                pastEstimatedDatePenalty: "Penalty for requests after estimated delivery date",
                weekAfterDeliveryPenalty: "Penalty for requests within a week of delivery",
                monthAfterDeliveryPenalty: "Penalty for requests within a month of delivery"
            }
        };
    }
}

export default RefundPolicyService;
