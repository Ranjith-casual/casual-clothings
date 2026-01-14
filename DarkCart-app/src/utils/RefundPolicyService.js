// Frontend Refund Policy Service
// Mirrors the server-side implementation for consistent calculation

export class RefundPolicyService {
    
    /**
     * Calculate refund amount based on comprehensive business rules
     * @param {Object} order - Order details
     * @param {Object} cancellationContext - Cancellation request context
     * @param {number} customRefundPercentage - Custom refund percentage if any
     * @param {Object} customerInfo - Optional customer info for loyalty bonuses
     * @returns {Object} Refund calculation result
     */
    static calculateRefundAmount(order, cancellationContext, customRefundPercentage = null, customerInfo = null) {
        try {
            // Base refund policy configuration
            const refundPolicy = {
                // Base percentages for different timing scenarios
                earlyRefundPercentage: 90,  // Within 24 hours
                standardRefundPercentage: 75, // After 24 hours, up to 7 days
                lateRefundPercentage: 50,   // After 7 days
                
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
            const orderDate = new Date(order.orderDate || order.createdAt);
            const requestDate = new Date(); // Use current date for frontend calculations
            const hoursSinceOrder = (requestDate - orderDate) / (1000 * 60 * 60);
            const daysSinceOrder = Math.floor(hoursSinceOrder / 24);
            
            if (hoursSinceOrder <= 24) {
                // Early cancellation (within 24 hours)
                basePercentage = refundPolicy.earlyRefundPercentage;
            } else if (daysSinceOrder <= 7) {
                // Standard cancellation (after 24 hours, up to 7 days)
                basePercentage = refundPolicy.standardRefundPercentage;
            } else {
                // Late cancellation (7+ days)
                basePercentage = refundPolicy.lateRefundPercentage;
            }
            
            // Use custom percentage if provided
            let refundPercentage = customRefundPercentage || basePercentage;
            
            // Calculate penalties based on delivery status and timing
            const penalties = this.calculateRefundPenalties(order, cancellationContext, refundPolicy);
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
                daysSinceOrder,
                penalties: penalties,
                bonuses: bonuses,
                cancellationTiming: hoursSinceOrder <= 24 ? 'EARLY' : (daysSinceOrder <= 7 ? 'STANDARD' : 'LATE'),
                appliedPolicy: refundPolicy
            };
        } catch (error) {
            console.error('Error calculating refund amount:', error);
            return {
                success: false,
                error: error.message,
                refundPercentage: 75, // Default to 75% if calculation fails
                refundAmount: Math.round((order.totalAmt * 75 / 100) * 100) / 100,
                retainedAmount: Math.round((order.totalAmt * 25 / 100) * 100) / 100,
                originalAmount: order.totalAmt
            };
        }
    }
    
    /**
     * Calculate refund penalties based on order status and timing
     * @param {Object} order - Order details
     * @param {Object} cancellationContext - Cancellation context
     * @param {Object} refundPolicy - Refund policy configuration
     * @returns {Object} Penalty details
     */
    static calculateRefundPenalties(order, cancellationContext, refundPolicy) {
        const penalties = {
            deliveryPenalty: 0,
            timingPenalty: 0,
            statusPenalty: 0,
            totalPenalty: 0,
            reasons: []
        };
        
        const orderDate = new Date(order.orderDate || order.createdAt);
        const requestDate = new Date();
        
        // Check delivery status penalties
        const estimatedDeliveryDate = order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate) : null;
        const actualDeliveryDate = order.actualDeliveryDate ? new Date(order.actualDeliveryDate) : null;
        
        // Penalty for requesting cancellation after estimated delivery date
        if (estimatedDeliveryDate && requestDate > estimatedDeliveryDate) {
            penalties.timingPenalty += refundPolicy.pastEstimatedDatePenalty;
            penalties.reasons.push(`Request made after estimated delivery date (${refundPolicy.pastEstimatedDatePenalty}% penalty)`);
        }
        
        // Penalty for already delivered orders
        if (actualDeliveryDate) {
            const daysSinceDelivery = Math.floor((requestDate - actualDeliveryDate) / (1000 * 60 * 60 * 24));
            
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
        
        // Check order status penalties
        // Don't apply this penalty if we've already applied a delivery-based penalty
        // to avoid double-counting the delivered status penalty
        if (order.orderStatus === 'DELIVERED' && !actualDeliveryDate) {
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
     * Get refund percentage text label based on cancellation timing
     * @param {string} timing - Cancellation timing (EARLY, STANDARD, LATE)
     * @returns {string} Human-readable refund policy description
     */
    static getRefundTimingLabel(timing) {
        switch(timing) {
            case 'EARLY':
                return 'Early cancellation (within 24 hours) - 90% base refund';
            case 'STANDARD':
                return 'Standard cancellation (after 24 hours, up to 7 days) - 75% base refund';
            case 'LATE':
                return 'Late cancellation (7+ days) - 50% base refund';
            default:
                return 'Standard cancellation - 75% base refund';
        }
    }
    
    /**
     * Format penalty or bonus reasons for display
     * @param {Array} reasons - Array of reason strings
     * @param {boolean} isBonus - Whether these are bonus (true) or penalty (false) reasons
     * @returns {string} HTML formatted reasons
     */
    static formatReasons(reasons, isBonus = false) {
        if (!reasons || !reasons.length) return '';
        
        const color = isBonus ? '#28a745' : '#856404';
        return reasons.map(reason => 
            `<li style="color: ${color}; margin-left: 15px;">• ${reason}</li>`
        ).join('');
    }
}

export default RefundPolicyService;
