import mongoose from "mongoose";
import orderModel from "../models/order.model.js";
import UserModel from "../models/users.model.js";

export const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 15, search, status, method, dateFilter } = req.body;
        
        // Build query filters
        let query = {};
        
        // Search filter
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { paymentId: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Status filter
        if (status) {
            query.paymentStatus = { $regex: status, $options: 'i' };
        }
        
        // Payment method filter
        if (method) {
            query.paymentMethod = { $regex: method, $options: 'i' };
        }
        
        // Date filter
        if (dateFilter) {
            const now = new Date();
            let startDate;
            
            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                query.orderDate = { $gte: startDate };
            }
        }
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get payments with user details and order items
        const payments = await orderModel.find(query)
            .populate('userId', 'name email')
            .populate('deliveryAddress')
            .populate("items.productId", "name image price stock") // Add product population
            .populate("items.bundleId", "title image images bundlePrice stock") // Include both image and images for bundles
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Add customer name to each payment
        const formattedPayments = payments.map(payment => ({
            ...payment.toObject(),
            customerName: payment.userId?.name || 'Unknown Customer'
        }));
        
        // Get total count for pagination
        const totalPayments = await orderModel.countDocuments(query);
        const totalPages = Math.ceil(totalPayments / limit);
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payments retrieved successfully",
            data: {
                payments: formattedPayments,
                currentPage: parseInt(page),
                totalPages,
                totalPayments,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
        
    } catch (error) {
        console.error("Error in getAllPayments:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving payments",
            details: error.message
        });
    }
};

export const getPaymentStats = async (req, res) => {
    try {
        // Get current date for filtering
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Aggregate payment statistics
        const stats = await orderModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmt" },
                    totalPayments: { $sum: 1 },
                    successfulPayments: {
                        $sum: {
                            $cond: [
                                { $or: [
                                    { $eq: ["$paymentStatus", "PAID"] },
                                    { $eq: ["$orderStatus", "DELIVERED"] }
                                ]},
                                1,
                                0
                            ]
                        }
                    },
                    failedPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "FAILED"] },
                                1,
                                0
                            ]
                        }
                    },
                    codOrders: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentMethod", "Cash on Delivery"] },
                                1,
                                0
                            ]
                        }
                    },
                    onlinePayments: {
                        $sum: {
                            $cond: [
                                { $ne: ["$paymentMethod", "Cash on Delivery"] },
                                1,
                                0
                            ]
                        }
                    },
                    refundedAmount: {
                        $sum: {
                            $cond: [
                                { $or: [
                                    { $eq: ["$paymentStatus", "REFUNDED"] },
                                    { $eq: ["$paymentStatus", "REFUND_SUCCESSFUL"] }
                                ]},
                                "$totalAmt",
                                0
                            ]
                        }
                    },
                    pendingPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "PENDING"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalRevenue: 0,
            totalPayments: 0,
            successfulPayments: 0,
            failedPayments: 0,
            codOrders: 0,
            onlinePayments: 0,
            refundedAmount: 0,
            pendingPayments: 0
        };

        // Calculate net revenue (total revenue minus refunded amounts)
        const netRevenue = result.totalRevenue - result.refundedAmount;
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payment statistics retrieved successfully",
            data: {
                ...result,
                netRevenue: netRevenue, // Net revenue after refunds
                grossRevenue: result.totalRevenue, // Original total revenue before refunds
                totalRevenue: netRevenue // Update totalRevenue to be net revenue
            }
        });
        
    } catch (error) {
        console.error("Error in getPaymentStats:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving payment statistics",
            details: error.message
        });
    }
};

export const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }
        
        // Find the order
        const order = await orderModel.findOne({ orderId })
            .populate('userId', 'name email')
            .populate('deliveryAddress')
            .populate({
                path: 'items.productId',
                select: 'name title image price'
            })
            .populate({
                path: 'items.bundleId',
                select: 'title name image images bundlePrice price'
            });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }
        
        // For now, return order data that can be used to generate PDF on frontend
        // In a real implementation, you would generate PDF here using libraries like puppeteer or jsPDF
        return res.status(200).json({
            success: true,
            error: false,
            message: "Invoice data retrieved successfully",
            data: {
                ...order.toObject(),
                customerName: order.userId?.name || 'Unknown Customer'
            }
        });
        
    } catch (error) {
        console.error("Error in downloadInvoice:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error generating invoice",
            details: error.message
        });
    }
};

export const initiateRefund = async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Payment ID is required"
            });
        }
        
        // Find the order by payment ID or order ID
        const order = await orderModel.findOne({
            $or: [
                { _id: paymentId },
                { paymentId: paymentId }
            ]
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Payment not found"
            });
        }
        
        // Check if refund is possible
        if (order.paymentStatus === "REFUNDED") {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Payment has already been refunded"
            });
        }
        
        if (order.paymentMethod === "Cash on Delivery" && order.orderStatus !== "DELIVERED") {
            return res.status(400).json({
                success: false,
                error: true,
                message: "COD orders can only be refunded if delivered"
            });
        }
        
        // Update order status to indicate refund initiated
        await orderModel.findByIdAndUpdate(order._id, {
            paymentStatus: "REFUND_INITIATED",
            orderStatus: "CANCELLED"
        });
        
        // Here you would integrate with actual payment gateway to process refund
        // For Razorpay: await razorpay.payments.refund(paymentId, { amount: order.totalAmt * 100 });
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Refund initiated successfully. It may take 3-5 business days to reflect in customer's account."
        });
        
    } catch (error) {
        console.error("Error in initiateRefund:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error initiating refund",
            details: error.message
        });
    }
};

export const getPaymentSettings = async (req, res) => {
    try {
        // In a real application, you would store these settings in database
        // For now, return default settings
        const defaultSettings = {
            razorpay: {
                enabled: false,
                keyId: '',
                keySecret: '',
                webhookSecret: ''
            },
            cod: {
                enabled: true,
                minimumAmount: 0,
                maximumAmount: 50000
            },
            general: {
                defaultPaymentMethod: 'cod',
                autoRefundEnabled: false,
                paymentTimeout: 15
            }
        };
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payment settings retrieved successfully",
            data: defaultSettings
        });
        
    } catch (error) {
        console.error("Error in getPaymentSettings:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving payment settings",
            details: error.message
        });
    }
};

export const updatePaymentSettings = async (req, res) => {
    try {
        const settings = req.body;
        
        // In a real application, you would save these settings to database
        // For now, just validate and return success
        
        if (!settings) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Settings data is required"
            });
        }
        
        // Validate Razorpay settings if enabled
        if (settings.razorpay?.enabled) {
            if (!settings.razorpay.keyId || !settings.razorpay.keySecret) {
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: "Razorpay Key ID and Secret are required when Razorpay is enabled"
                });
            }
        }
        
        // Here you would save to database:
        // await PaymentSettings.findOneAndUpdate({}, settings, { upsert: true });
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "Payment settings updated successfully"
        });
        
    } catch (error) {
        console.error("Error in updatePaymentSettings:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error updating payment settings",
            details: error.message
        });
    }
};
