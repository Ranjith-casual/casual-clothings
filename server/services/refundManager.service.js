import orderModel from '../models/order.model.js';
import razorpayService from './razorpay.service.js';

class RefundManager {
    constructor() {
        this.razorpayService = razorpayService;
    }

    /**
     * Process a complete refund with order status updates
     * @param {string} orderId - The order ID to refund
     * @param {number} refundAmount - Amount to refund (optional, defaults to full amount)
     * @param {string} reason - Reason for refund
     * @param {string} adminId - ID of admin processing refund
     * @returns {Object} Refund result
     */
    async processRefund(orderId, refundAmount = null, reason = '', adminId = null) {
        try {
            // Find the order
            const order = await orderModel.findOne({ orderId: orderId });
            
            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }

            // Validate refund eligibility
            this.validateRefundEligibility(order);

            // Calculate refund amount if not provided
            const finalRefundAmount = refundAmount || this.calculateRefundAmount(order);
            
            // Update order status to indicate refund initiation
            await orderModel.findByIdAndUpdate(order._id, {
                paymentStatus: "REFUND_INITIATED",
                'refundDetails.refundAmount': finalRefundAmount,
                'refundDetails.refundDate': new Date(),
                'refundDetails.reason': reason,
                'refundDetails.processedBy': adminId
            });

            // Process refund with Razorpay if payment method is Razorpay
            let refundResult = null;
            if (order.paymentMethod === "Razorpay" && order.paymentId) {
                refundResult = await this.razorpayService.createRefund(
                    order.paymentId,
                    finalRefundAmount,
                    {
                        reason: reason,
                        order_id: orderId,
                        processed_by: adminId
                    }
                );

                // Update order with Razorpay refund ID
                await orderModel.findByIdAndUpdate(order._id, {
                    'refundDetails.refundId': refundResult.id,
                    'refundDetails.razorpayRefundStatus': refundResult.status
                });
            }

            return {
                success: true,
                orderId: orderId,
                refundAmount: finalRefundAmount,
                refundId: refundResult?.id || null,
                status: refundResult?.status || 'PENDING_MANUAL_PROCESSING',
                message: order.paymentMethod === "Razorpay" 
                    ? "Refund initiated with Razorpay successfully"
                    : "Refund marked for manual processing"
            };

        } catch (error) {
            console.error(`Error processing refund for order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Process partial refund for specific items
     * @param {string} orderId - The order ID
     * @param {Array} items - Array of items to refund with amounts
     * @param {string} reason - Reason for partial refund
     * @param {string} adminId - Admin processing the refund
     */
    async processPartialRefund(orderId, items, reason, adminId) {
        try {
            const order = await orderModel.findOne({ orderId: orderId });
            
            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }

            const totalRefundAmount = items.reduce((sum, item) => sum + item.refundAmount, 0);
            
            // Validate total refund amount doesn't exceed available amount
            const availableAmount = this.getAvailableRefundAmount(order);
            if (totalRefundAmount > availableAmount) {
                throw new Error(`Refund amount ${totalRefundAmount} exceeds available amount ${availableAmount}`);
            }

            // Process each item refund
            const refundResults = [];
            
            for (const item of items) {
                if (order.paymentMethod === "Razorpay" && order.paymentId) {
                    const refundResult = await this.razorpayService.createRefund(
                        order.paymentId,
                        item.refundAmount,
                        {
                            reason: `Partial refund: ${reason}`,
                            item_id: item.itemId,
                            order_id: orderId
                        }
                    );
                    refundResults.push(refundResult);
                }

                // Update refund summary
                await orderModel.findByIdAndUpdate(order._id, {
                    $push: {
                        refundSummary: {
                            itemId: item.itemId,
                            amount: item.refundAmount,
                            status: 'Processing',
                            processedDate: new Date(),
                            reason: reason,
                            refundId: refundResults[refundResults.length - 1]?.id
                        }
                    }
                });
            }

            // Update overall order refund details
            const currentRefundAmount = order.refundDetails?.refundAmount || 0;
            const newTotalRefundAmount = currentRefundAmount + totalRefundAmount;
            
            await orderModel.findByIdAndUpdate(order._id, {
                'refundDetails.refundAmount': newTotalRefundAmount,
                'refundDetails.refundDate': new Date(),
                paymentStatus: newTotalRefundAmount >= order.totalAmt ? "REFUND_INITIATED" : "PARTIAL_REFUND_INITIATED"
            });

            return {
                success: true,
                orderId: orderId,
                totalRefundAmount: totalRefundAmount,
                refundResults: refundResults,
                message: "Partial refund processed successfully"
            };

        } catch (error) {
            console.error(`Error processing partial refund for order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Check refund status and update order accordingly
     * @param {string} orderId - Order ID to check
     */
    async checkRefundStatus(orderId) {
        try {
            const order = await orderModel.findOne({ orderId: orderId });
            
            if (!order || !order.refundDetails?.refundId) {
                throw new Error(`No refund found for order ${orderId}`);
            }

            // Get refund status from Razorpay
            const refunds = await this.razorpayService.getAllRefunds(order.paymentId);
            
            const currentRefund = refunds.items.find(
                refund => refund.id === order.refundDetails.refundId
            );

            if (currentRefund) {
                // Update order with current refund status
                await orderModel.findByIdAndUpdate(order._id, {
                    'refundDetails.razorpayRefundStatus': currentRefund.status,
                    paymentStatus: this.mapRazorpayStatusToOrderStatus(currentRefund.status)
                });

                return {
                    success: true,
                    orderId: orderId,
                    refundStatus: currentRefund.status,
                    refundAmount: currentRefund.amount / 100,
                    updatedAt: currentRefund.created_at
                };
            }

            throw new Error(`Refund ${order.refundDetails.refundId} not found in Razorpay`);

        } catch (error) {
            console.error(`Error checking refund status for order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Validate if order is eligible for refund
     */
    validateRefundEligibility(order) {
        if (order.paymentStatus === "REFUNDED" || order.paymentStatus === "REFUND_SUCCESSFUL") {
            throw new Error("Order has already been refunded");
        }

        if (order.paymentMethod === "Cash on Delivery" && order.orderStatus !== "DELIVERED") {
            throw new Error("COD orders can only be refunded after delivery");
        }

        if (!order.paymentId && order.paymentMethod === "Razorpay") {
            throw new Error("No payment ID found for Razorpay order");
        }

        if (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED") {
            throw new Error("Cannot refund unpaid or failed orders");
        }
    }

    /**
     * Calculate refund amount based on business rules
     */
    calculateRefundAmount(order) {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);

        let refundPercentage = 100; // Default to full refund

        // Apply time-based refund policy
        if (hoursSinceOrder > 24 && hoursSinceOrder <= 48) {
            refundPercentage = 90;
        } else if (hoursSinceOrder > 48 && hoursSinceOrder <= 72) {
            refundPercentage = 75;
        } else if (hoursSinceOrder > 72) {
            refundPercentage = 50;
        }

        // Check if there's a custom refund percentage from cancellation request
        if (order.refundDetails?.refundPercentage) {
            refundPercentage = order.refundDetails.refundPercentage;
        }

        return Math.round((order.totalAmt * refundPercentage) / 100);
    }

    /**
     * Get available amount for refund (total - already refunded)
     */
    getAvailableRefundAmount(order) {
        const totalAmount = order.totalAmt;
        const alreadyRefunded = order.refundDetails?.refundAmount || 0;
        return totalAmount - alreadyRefunded;
    }

    /**
     * Map Razorpay refund status to order payment status
     */
    mapRazorpayStatusToOrderStatus(razorpayStatus) {
        const statusMap = {
            'pending': 'REFUND_PROCESSING',
            'processed': 'REFUND_SUCCESSFUL',
            'failed': 'REFUND_FAILED'
        };

        return statusMap[razorpayStatus] || 'REFUND_PROCESSING';
    }

    /**
     * Get refund summary for reporting
     */
    async getRefundSummary(startDate, endDate) {
        try {
            const refunds = await orderModel.aggregate([
                {
                    $match: {
                        'refundDetails.refundDate': {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        },
                        paymentStatus: { $in: ['REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_FAILED'] }
                    }
                },
                {
                    $group: {
                        _id: '$paymentStatus',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$refundDetails.refundAmount' }
                    }
                }
            ]);

            return {
                success: true,
                period: { startDate, endDate },
                summary: refunds
            };

        } catch (error) {
            console.error('Error generating refund summary:', error);
            throw error;
        }
    }
}

export default RefundManager;
