import RefundManager from '../services/refundManager.service.js';
import orderModel from '../models/order.model.js';

const refundManager = new RefundManager();

/**
 * Enhanced refund initiation with complete order management
 */
export const processCompleteRefund = async (req, res) => {
    try {
        const { orderId, refundAmount, reason, adminNotes } = req.body;
        const adminId = req.user?.id; // Assuming auth middleware provides user info

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }

        const result = await refundManager.processRefund(
            orderId,
            refundAmount,
            reason || 'Admin initiated refund',
            adminId
        );

        return res.status(200).json({
            success: true,
            error: false,
            message: result.message,
            data: result
        });

    } catch (error) {
        console.error("Error in processCompleteRefund:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Error processing refund"
        });
    }
};

/**
 * Process partial refund for specific items
 */
export const processPartialRefund = async (req, res) => {
    try {
        const { orderId, items, reason } = req.body;
        const adminId = req.user?.id;

        if (!orderId || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID and items array are required"
            });
        }

        // Validate items structure
        for (const item of items) {
            if (!item.itemId || !item.refundAmount) {
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: "Each item must have itemId and refundAmount"
                });
            }
        }

        const result = await refundManager.processPartialRefund(
            orderId,
            items,
            reason || 'Partial refund',
            adminId
        );

        return res.status(200).json({
            success: true,
            error: false,
            message: result.message,
            data: result
        });

    } catch (error) {
        console.error("Error in processPartialRefund:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Error processing partial refund"
        });
    }
};

/**
 * Check refund status for an order
 */
export const checkRefundStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }

        const result = await refundManager.checkRefundStatus(orderId);

        return res.status(200).json({
            success: true,
            error: false,
            message: "Refund status retrieved successfully",
            data: result
        });

    } catch (error) {
        console.error("Error in checkRefundStatus:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Error checking refund status"
        });
    }
};

/**
 * Get refund history for an order
 */
export const getOrderRefundHistory = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderModel.findOne({ orderId: orderId })
            .select('refundDetails refundSummary paymentStatus orderStatus totalAmt');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        const refundHistory = {
            orderId: orderId,
            totalOrderAmount: order.totalAmt,
            currentPaymentStatus: order.paymentStatus,
            refundDetails: order.refundDetails || {},
            refundSummary: order.refundSummary || [],
            availableForRefund: refundManager.getAvailableRefundAmount(order)
        };

        return res.status(200).json({
            success: true,
            error: false,
            message: "Refund history retrieved successfully",
            data: refundHistory
        });

    } catch (error) {
        console.error("Error in getOrderRefundHistory:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving refund history"
        });
    }
};

/**
 * Get refund analytics for admin dashboard
 */
export const getRefundAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        // Default to last 30 days if no dates provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const matchQuery = {
            'refundDetails.refundDate': {
                $gte: start,
                $lte: end
            }
        };

        // Add status filter if provided
        if (status) {
            matchQuery.paymentStatus = status;
        } else {
            matchQuery.paymentStatus = { 
                $in: ['REFUND_SUCCESSFUL', 'REFUND_PROCESSING', 'REFUND_FAILED', 'REFUND_INITIATED'] 
            };
        }

        const analytics = await orderModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$refundDetails.refundAmount' },
                    avgAmount: { $avg: '$refundDetails.refundAmount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get daily refund trends
        const dailyTrends = await orderModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$refundDetails.refundDate"
                        }
                    },
                    count: { $sum: 1 },
                    amount: { $sum: '$refundDetails.refundAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            success: true,
            error: false,
            message: "Refund analytics retrieved successfully",
            data: {
                period: { startDate: start, endDate: end },
                statusBreakdown: analytics,
                dailyTrends: dailyTrends,
                totalRefunds: analytics.reduce((sum, item) => sum + item.count, 0),
                totalRefundAmount: analytics.reduce((sum, item) => sum + item.totalAmount, 0)
            }
        });

    } catch (error) {
        console.error("Error in getRefundAnalytics:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving refund analytics"
        });
    }
};

/**
 * Bulk refund processing for multiple orders
 */
export const processBulkRefunds = async (req, res) => {
    try {
        const { orders, reason } = req.body;
        const adminId = req.user?.id;

        if (!orders || !Array.isArray(orders)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Orders array is required"
            });
        }

        const results = [];
        const errors = [];

        for (const orderData of orders) {
            try {
                const result = await refundManager.processRefund(
                    orderData.orderId,
                    orderData.refundAmount,
                    reason || 'Bulk refund processing',
                    adminId
                );
                results.push(result);
            } catch (error) {
                errors.push({
                    orderId: orderData.orderId,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            error: false,
            message: `Processed ${results.length} refunds successfully, ${errors.length} failed`,
            data: {
                successful: results,
                failed: errors,
                summary: {
                    total: orders.length,
                    successful: results.length,
                    failed: errors.length
                }
            }
        });

    } catch (error) {
        console.error("Error in processBulkRefunds:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error processing bulk refunds"
        });
    }
};
