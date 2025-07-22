import orderCancellationModel from "../models/orderCancellation.model.js";
import cancellationPolicyModel from "../models/cancellationPolicy.model.js";
import orderModel from "../models/order.model.js";
import UserModel from "../models/users.model.js";
import ProductModel from "../models/product.model.js";
import BundleModel from "../models/bundles.js";
import sendEmail from "../config/sendEmail.js";
import { sendRefundInvoiceEmail } from "./payment.controller.js";
import fs from 'fs';
import mongoose from "mongoose";

// Comprehensive Order Details Controller - Get complete order details with properly populated data
export const getComprehensiveOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid order ID format"
            });
        }
        
        // Find the order with populated address
        const order = await orderModel.findById(orderId)
            .populate('deliveryAddress')
            .lean();
            
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }
        
        // Check if user has permission to view this order
        const userId = req.userId;
        const isAdmin = req.isAdmin;
        
        if (!isAdmin && order.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: true,
                message: "You don't have permission to view this order"
            });
        }
        
        // Enhance each item with complete details
        const enhancedItems = await Promise.all(order.items.map(async (item) => {
            try {
                if (item.itemType === 'product' && item.productId) {
                    // If product details are incomplete, fetch from database
                    if (!item.productDetails || !item.productDetails.name) {
                        const product = await ProductModel.findById(item.productId).lean();
                        if (product) {
                            item.productDetails = {
                                ...product,
                                _id: product._id.toString()
                            };
                        }
                    }
                    
                    // Ensure size-specific pricing is correctly set
                    if (item.size) {
                        // If product has size-specific pricing, make sure it's included
                        const product = await ProductModel.findById(item.productId).lean();
                        if (product && product.sizePricing && product.sizePricing[item.size]) {
                            // If item doesn't have sizeAdjustedPrice, set it
                            if (item.sizeAdjustedPrice === undefined) {
                                item.sizeAdjustedPrice = product.sizePricing[item.size];
                                console.log(`Added missing sizeAdjustedPrice ${product.sizePricing[item.size]} for product ${product.name} size ${item.size}`);
                            }
                            
                            // Make sure productDetails has the size pricing
                            if (!item.productDetails.sizePricing) {
                                item.productDetails.sizePricing = {};
                            }
                            item.productDetails.sizePricing[item.size] = product.sizePricing[item.size];
                        }
                    }
                    
                    // Ensure unitPrice is correctly set
                    if (item.unitPrice === undefined) {
                        if (item.sizeAdjustedPrice !== undefined) {
                            item.unitPrice = Number(item.sizeAdjustedPrice);
                        } else if (item.productDetails?.finalPrice !== undefined) {
                            item.unitPrice = Number(item.productDetails.finalPrice);
                        } else {
                            const price = item.productDetails?.price || 0;
                            const discount = item.productDetails?.discount || 0;
                            item.unitPrice = discount > 0 ? price * (1 - discount/100) : price;
                        }
                        console.log(`Set missing unitPrice to ${item.unitPrice} for product ${item.productDetails?.name || 'unknown'}`);
                    }
                    
                } else if (item.itemType === 'bundle' && item.bundleId) {
                    // If bundle details are incomplete, fetch from database
                    if (!item.bundleDetails || !item.bundleDetails.title) {
                        const bundle = await BundleModel.findById(item.bundleId).lean();
                        if (bundle) {
                            item.bundleDetails = {
                                ...bundle,
                                _id: bundle._id.toString()
                            };
                            
                            // Ensure unitPrice is set for bundle
                            if (item.unitPrice === undefined) {
                                item.unitPrice = bundle.bundlePrice;
                            }
                        }
                    }
                }
                return item;
            } catch (error) {
                console.error(`Error processing item ${item._id}:`, error);
                return item; // Return original item if enhancement fails
            }
        }));
        
        // Update order with enhanced items
        order.items = enhancedItems;
        
        // Get user information
        const user = await UserModel.findById(order.userId).select('name email phone').lean();
        order.user = user;
        
        // Check if order has any cancellation requests
        const cancellationRequest = await orderCancellationModel.findOne({
            orderId: orderId,
            isActive: true
        }).sort({ requestDate: -1 }).lean();
        
        // Add cancellation info to response if exists
        if (cancellationRequest) {
            order.cancellationRequest = cancellationRequest;
        }
        
        return res.json({
            success: true,
            error: false,
            message: "Order details retrieved successfully",
            data: order
        });
        
    } catch (error) {
        console.error("Error fetching comprehensive order details:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error retrieving order details",
            details: error.message
        });
    }
};

// User requests order cancellation
export const requestOrderCancellation = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId, reason, additionalReason } = req.body;

        console.log('Cancellation request data:', {
            userId,
            orderId,
            reason,
            additionalReason,
            body: req.body
        });

        // Validate required fields
        if (!orderId || !reason) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID and reason are required"
            });
        }

        // Validate order exists and belongs to user
        const order = await orderModel.findOne({ 
            _id: orderId, 
            userId: userId 
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found or doesn't belong to you"
            });
        }

        // Check if order can be cancelled based on status
        const nonCancellableStatuses = ['OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (nonCancellableStatuses.includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: `Cannot cancel order with status: ${order.orderStatus}`
            });
        }
        
        // Check if payment is online and paid
        if (order.paymentMethod !== 'Online Payment' || order.paymentStatus !== 'PAID') {
            return res.status(400).json({
                success: false,
                error: true,
                message: `Only paid online orders can be cancelled`
            });
        }

        // Check if cancellation request already exists
        const existingRequest = await orderCancellationModel.findOne({
            orderId: orderId,
            status: { $in: ['PENDING', 'APPROVED'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Cancellation request already exists for this order"
            });
        }

        // Get current policy for refund calculation
        const policy = await cancellationPolicyModel.findOne({ isActive: true });
        const refundPercentage = 75;

        // Check if cancellation is past estimated delivery date
        const now = new Date();
        const wasPastDeliveryDate = order.estimatedDeliveryDate && 
            now > new Date(order.estimatedDeliveryDate) && 
            !order.actualDeliveryDate;

        // Create cancellation request with delivery information
        const cancellationRequest = new orderCancellationModel({
            orderId,
            userId,
            reason,
            additionalReason,
            deliveryInfo: {
                estimatedDeliveryDate: order.estimatedDeliveryDate,
                actualDeliveryDate: order.actualDeliveryDate,
                deliveryNotes: order.deliveryNotes,
                wasPastDeliveryDate
            },
            adminResponse: {
                refundPercentage
            }
        });

        console.log("About to save cancellation request:", cancellationRequest);
        const savedRequest = await cancellationRequest.save();
        console.log("Cancellation request saved successfully:", savedRequest._id);

        // Get user details for email
        const user = await UserModel.findById(userId);
        console.log("User found for email:", user.name, user.email);

        // Send confirmation email to user
        if (user.email) {
            await sendEmail({
                sendTo: user.email,
                subject: "Order Cancellation Request Received",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Order Cancellation Request Received</h2>
                        <p>Dear ${user.name},</p>
                        <p>We have received your cancellation request for order <strong>#${order.orderId}</strong>.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3>Request Details:</h3>
                            <p><strong>Order ID:</strong> ${order.orderId}</p>
                            <p><strong>Reason:</strong> ${reason}</p>
                            <p><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</p>
                            ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery Date:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>` : ''}
                            ${wasPastDeliveryDate ? '<p style="color: #dc3545;"><strong>Note:</strong> Cancellation requested after estimated delivery date</p>' : ''}
                            <p><strong>Expected Refund:</strong> ₹${(order.totalAmt * refundPercentage / 100).toFixed(2)} (${refundPercentage}% of order value)</p>
                        </div>
                        
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>Our team will review your request within 48 hours</li>
                            <li>You will receive an email with the decision</li>
                            <li>If approved, refund will be processed within 5-7 business days</li>
                        </ul>
                        
                        <p>Thank you for your patience.</p>
                        <p>Best regards,<br>casualclothings Team</p>
                    </div>
                `
            });
        }

        res.status(200).json({
            success: true,
            error: false,
            message: "Cancellation request submitted successfully",
            data: {
                requestId: cancellationRequest._id,
                expectedRefund: (order.totalAmt * refundPercentage / 100).toFixed(2),
                refundPercentage
            }
        });

    } catch (error) {
        console.error("Error in requestOrderCancellation:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// User function to get their own cancellation requests
export const getUserCancellationRequests = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        const requests = await orderCancellationModel.find({
            userId: userId
        })
        .populate({
            path: 'orderId',
            select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity orderQuantity productDetails',
            populate: [
                {
                    path: 'items.productId',
                    select: 'name title image price'
                },
                {
                    path: 'items.bundleId',
                    select: 'title name image price'
                }
            ]
        })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            error: false,
            message: "User cancellation requests retrieved successfully",
            data: requests
        });

    } catch (error) {
        console.error("Error in getUserCancellationRequests:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Admin function to get all cancellation requests
export const getCancellationRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        
        const filter = { isActive: true };
        if (status !== 'all') {
            filter.status = status;
        }

        const requests = await orderCancellationModel.find(filter)
            .populate({
                path: 'orderId',
                select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity orderQuantity productDetails',
                populate: [
                    {
                        path: 'items.productId',
                        select: 'name title image price'
                    },
                    {
                        path: 'items.bundleId',
                        select: 'title name image price'
                    }
                ]
            })
            .populate('userId', 'name email')
            .populate('adminResponse.processedBy', 'name')
            .sort({ requestDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await orderCancellationModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            error: false,
            data: {
                requests,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRequests: total
            }
        });

    } catch (error) {
        console.error("Error in getCancellationRequests:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Admin processes cancellation request (approve/reject)
export const processCancellationRequest = async (req, res) => {
    try {
        const adminId = req.userId;
        const { requestId, action, adminComments, customRefundPercentage } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid action. Must be APPROVED or REJECTED"
            });
        }

        const cancellationRequest = await orderCancellationModel.findById(requestId)
            .populate({
                path: 'orderId',
                populate: [
                    {
                        path: 'items.productId',
                        select: 'name title image price'
                    },
                    {
                        path: 'items.bundleId',
                        select: 'title name image price'
                    }
                ]
            })
            .populate('userId');

        if (!cancellationRequest) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Cancellation request not found"
            });
        }

        if (cancellationRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Request has already been processed"
            });
        }

        // Calculate refund amount with delivery date consideration
        const order = cancellationRequest.orderId;
        let baseRefundPercentage = customRefundPercentage || cancellationRequest.adminResponse.refundPercentage;
        
        // Adjust refund percentage based on delivery status
        if (action === 'APPROVED' && cancellationRequest.deliveryInfo) {
            const deliveryInfo = cancellationRequest.deliveryInfo;
            
            // If cancellation is requested after estimated delivery date, reduce refund
            if (deliveryInfo.wasPastDeliveryDate) {
                baseRefundPercentage = Math.max(50, baseRefundPercentage - 15); // Reduce by 15% but minimum 50%
            }
            
            // If order was already delivered, significantly reduce refund
            if (deliveryInfo.actualDeliveryDate) {
                const daysSinceDelivery = Math.floor((new Date() - new Date(deliveryInfo.actualDeliveryDate)) / (1000 * 60 * 60 * 24));
                if (daysSinceDelivery > 7) {
                    baseRefundPercentage = Math.max(25, baseRefundPercentage - 30); // Reduce by 30% but minimum 25%
                } else {
                    baseRefundPercentage = Math.max(40, baseRefundPercentage - 20); // Reduce by 20% but minimum 40%
                }
            }
        }
        
        const refundPercentage = baseRefundPercentage;
        const refundAmount = action === 'APPROVED' ? (order.totalAmt * refundPercentage / 100) : 0;

        // Update cancellation request
        cancellationRequest.status = action;
        cancellationRequest.adminResponse.processedBy = adminId;
        cancellationRequest.adminResponse.processedDate = new Date();
        cancellationRequest.adminResponse.adminComments = adminComments;
        cancellationRequest.adminResponse.refundAmount = refundAmount;
        cancellationRequest.adminResponse.refundPercentage = refundPercentage;

        if (action === 'APPROVED') {
            cancellationRequest.refundDetails.refundStatus = 'PROCESSING';
            
            // Update order status to cancelled
            await orderModel.findByIdAndUpdate(order._id, {
                orderStatus: 'CANCELLED',
                paymentStatus: 'REFUND_PROCESSING'
            });
        }

        await cancellationRequest.save();

        // Send email to user
        const user = cancellationRequest.userId;
        if (user.email) {
            const emailSubject = action === 'APPROVED' 
                ? "Order Cancellation Approved - Refund Processing"
                : "Order Cancellation Request Rejected";

            const emailContent = action === 'APPROVED' 
                ? `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #28a745;">Order Cancellation Approved</h2>
                        <p>Dear ${user.name},</p>
                        <p>Your cancellation request for order <strong>#${order.orderId}</strong> has been approved.</p>
                        
                        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                            <h3>Refund Details:</h3>
                            <p><strong>Refund Amount:</strong> ₹${refundAmount.toFixed(2)}</p>
                            <p><strong>Refund Percentage:</strong> ${refundPercentage}%</p>
                            ${cancellationRequest.deliveryInfo?.wasPastDeliveryDate ? 
                                '<p style="color: #856404;"><strong>Note:</strong> Refund percentage adjusted due to late cancellation</p>' : ''}
                            ${cancellationRequest.deliveryInfo?.actualDeliveryDate ? 
                                '<p style="color: #856404;"><strong>Note:</strong> Refund percentage adjusted as order was already delivered</p>' : ''}
                            <p><strong>Processing Time:</strong> 5-7 business days</p>
                            <p><strong>Refund Method:</strong> Original payment method</p>
                        </div>
                        
                        ${adminComments ? `<p><strong>Admin Comments:</strong> ${adminComments}</p>` : ''}
                        
                        <p>Your refund will be processed within 5-7 business days and will be credited to your original payment method.</p>
                        
                        <p>Thank you for your understanding.</p>
                        <p>Best regards,<br>casualclothings Team</p>
                    </div>
                `
                : `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc3545;">Order Cancellation Request Rejected</h2>
                        <p>Dear ${user.name},</p>
                        <p>We regret to inform you that your cancellation request for order <strong>#${order.orderId}</strong> has been rejected.</p>
                        
                        ${adminComments ? `
                            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                                <p><strong>Reason:</strong> ${adminComments}</p>
                            </div>
                        ` : ''}
                        
                        <p>Your order will continue to be processed as normal. If you have any concerns, please contact our customer support team.</p>
                        
                        <p>Thank you for your understanding.</p>
                        <p>Best regards,<br>casualclothings Team</p>
                    </div>
                `;

            await sendEmail({
                sendTo: user.email,
                subject: emailSubject,
                html: emailContent
            });
        }

        res.status(200).json({
            success: true,
            error: false,
            message: `Cancellation request ${action.toLowerCase()} successfully`,
            data: {
                status: action,
                refundAmount: refundAmount,
                refundPercentage: refundPercentage
            }
        });

    } catch (error) {
        console.error("Error in processCancellationRequest:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Admin completes refund process
export const completeRefund = async (req, res) => {
    try {
        const adminId = req.userId;
        const { requestId, transactionId, adminComments } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Request ID is required"
            });
        }

        const cancellationRequest = await orderCancellationModel.findById(requestId)
            .populate('orderId')
            .populate('userId');

        if (!cancellationRequest) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Cancellation request not found"
            });
        }

        // Check if the request is in APPROVED status
        if (cancellationRequest.status !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Only approved cancellation requests can be refunded"
            });
        }

        // Check if refund is already processed
        if (cancellationRequest.refundDetails.refundStatus === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Refund has already been processed"
            });
        }

        // Update cancellation request with refund details
        cancellationRequest.refundDetails.refundId = transactionId || `REF-${Date.now()}`;
        cancellationRequest.refundDetails.refundDate = new Date();
        cancellationRequest.refundDetails.refundStatus = 'COMPLETED';
        cancellationRequest.adminResponse.adminComments = adminComments || cancellationRequest.adminResponse.adminComments;
        
        await cancellationRequest.save();

        // Update order status
        const order = cancellationRequest.orderId;
        await orderModel.findByIdAndUpdate(order._id, {
            orderStatus: 'CANCELLED',
            paymentStatus: 'REFUND_SUCCESSFUL', // This status will be used to calculate net revenue in payment stats
            refundDetails: {
                refundId: cancellationRequest.refundDetails.refundId,
                refundAmount: cancellationRequest.adminResponse.refundAmount,
                refundPercentage: cancellationRequest.adminResponse.refundPercentage,
                refundDate: new Date(),
                retainedAmount: order.totalAmt - cancellationRequest.adminResponse.refundAmount // Calculate retained amount
            }
        });

        // Send email to user with invoice attachment
        const user = cancellationRequest.userId;
        if (user.email) {
            try {
                // Get order details with populated product info
                const orderDetails = await orderModel.findById(order._id)
                    .populate('userId', 'name email')
                    .populate('items.productId', 'name image price discount')
                    .populate('items.bundleId', 'title image images bundlePrice originalPrice')
                    .populate('deliveryAddress');

                // Prepare refund details for email
                const refundDetails = {
                    refundAmount: cancellationRequest.adminResponse.refundAmount,
                    refundPercentage: cancellationRequest.adminResponse.refundPercentage,
                    refundId: cancellationRequest.refundDetails.refundId,
                    refundDate: cancellationRequest.refundDetails.refundDate,
                    retainedAmount: order.totalAmt - cancellationRequest.adminResponse.refundAmount
                };

                // Send refund invoice email using our new function
                await sendRefundInvoiceEmail(orderDetails, refundDetails);
                
            } catch (emailError) {
                console.error('Error sending refund email:', emailError);
                // Don't throw, as the refund was successful even if the email failed
            }
        }

        res.status(200).json({
            success: true,
            error: false,
            message: "Refund processed successfully",
            data: {
                refundId: cancellationRequest.refundDetails.refundId,
                refundDate: cancellationRequest.refundDetails.refundDate,
                refundAmount: cancellationRequest.adminResponse.refundAmount,
                orderNumber: order.orderId
            }
        });

    } catch (error) {
        console.error("Error in completeRefund:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error",
            details: error.message
        });
    }
};

// Get all refunds (Admin)
export const getAllRefunds = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        
        const filter = {};
        
        // Filter by refund status
        if (status !== 'all') {
            filter['refundDetails.refundStatus'] = status;
        } else {
            // Only get requests with refund status (approved or in process)
            filter.status = 'APPROVED';
        }

        const refunds = await orderCancellationModel.find(filter)
            .populate({
                path: 'orderId',
                select: 'orderId totalAmt orderDate orderStatus paymentStatus paymentMethod items subTotalAmt totalQuantity orderQuantity productDetails estimatedDeliveryDate actualDeliveryDate deliveryNotes',
                populate: [
                    {
                        path: 'items.productId',
                        select: 'name title images image price _id'
                    },
                    {
                        path: 'items.bundleId',
                        select: 'title name images image bundlePrice price _id'
                    }
                ]
            })
            .populate('userId', 'name email')
            .populate('adminResponse.processedBy', 'name')
            .sort({ 'refundDetails.refundDate': -1, 'adminResponse.processedDate': -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        // Enhance refunds with delivery insights - safely handle null or undefined values
        const enhancedRefunds = refunds.map(refund => {
            const refundObj = refund.toObject();
            
            // Add delivery context - with null checks
            if (refund.orderId) {
                const deliveryContext = {
                    hasEstimatedDate: refund.orderId.estimatedDeliveryDate ? true : false,
                    hasActualDeliveryDate: refund.orderId.actualDeliveryDate ? true : false,
                    isOverdue: refund.orderId.estimatedDeliveryDate && 
                        new Date() > new Date(refund.orderId.estimatedDeliveryDate) && 
                        !refund.orderId.actualDeliveryDate,
                    daysBetweenOrderAndCancellation: refund.orderId.orderDate ? Math.floor(
                        (new Date(refund.requestDate) - new Date(refund.orderId.orderDate)) / (1000 * 60 * 60 * 24)
                    ) : 0
                };
                
                if (refund.orderId.actualDeliveryDate) {
                    deliveryContext.daysBetweenDeliveryAndCancellation = Math.floor(
                        (new Date(refund.requestDate) - new Date(refund.orderId.actualDeliveryDate)) / (1000 * 60 * 60 * 24)
                    );
                }
                
                refundObj.deliveryContext = deliveryContext;
            }
            
            return refundObj;
        });
        
        // Safely log the first refund's order details to debug
        if (enhancedRefunds.length > 0 && enhancedRefunds[0].orderId && enhancedRefunds[0].orderId.items) {
            try {
                console.log("First refund order items:", 
                    JSON.stringify(enhancedRefunds[0].orderId.items.map(item => ({
                        itemType: item.itemType,
                        productId: item.productId && typeof item.productId === 'object' ? item.productId._id : item.productId,
                        bundleId: item.bundleId && typeof item.bundleId === 'object' ? item.bundleId._id : item.bundleId,
                        productDetails: item.productDetails,
                        bundleDetails: item.bundleDetails
                    })))
                );
            } catch (logError) {
                console.error("Error logging refund items:", logError);
                // Continue execution even if logging fails
            }
        }

        const total = await orderCancellationModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            error: false,
            data: {
                refunds: enhancedRefunds,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRefunds: total
            }
        });

    } catch (error) {
        console.error("Error in getAllRefunds:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Get cancellation policy
export const getCancellationPolicy = async (req, res) => {
    try {
        const policy = await cancellationPolicyModel.findOne({ isActive: true });
        
        if (!policy) {
            // Create default policy if none exists
            const defaultPolicy = new cancellationPolicyModel({
                refundPercentage: 65,
                responseTimeHours: 48,
                allowedReasons: [
                    { reason: 'Changed mind' },
                    { reason: 'Found better price' },
                    { reason: 'Wrong item ordered' },
                    { reason: 'Delivery delay' },
                    { reason: 'Product defect expected' },
                    { reason: 'Financial constraints' },
                    { reason: 'Duplicate order' },
                    { reason: 'Other' }
                ],
                timeBasedRules: [
                    { description: 'Within 1 hour of order', timeFrameHours: 1, refundPercentage: 65 },
                    { description: 'Within 24 hours of order', timeFrameHours: 24, refundPercentage: 65 },
                    { description: 'After 24 hours', timeFrameHours: 999999, refundPercentage: 65 }
                ],
                orderStatusRules: [
                    { orderStatus: 'ORDER PLACED', canCancel: true, refundPercentage: 65 },
                    { orderStatus: 'PROCESSING', canCancel: true, refundPercentage: 65 },
                    { orderStatus: 'OUT FOR DELIVERY', canCancel: false, refundPercentage: 0 },
                    { orderStatus: 'DELIVERED', canCancel: false, refundPercentage: 0 }
                ],
                terms: [
                    { title: 'Response Time', content: 'We will respond to your cancellation request within 48 hours.' },
                    { title: 'Refund Processing', content: 'Approved refunds will be processed within 5-7 business days.' },
                    { title: 'Refund Amount', content: 'Refund amount depends on order status and time of cancellation request.' }
                ]
            });
            
            await defaultPolicy.save();
            return res.status(200).json({
                success: true,
                error: false,
                data: defaultPolicy
            });
        }

        res.status(200).json({
            success: true,
            error: false,
            data: policy
        });

    } catch (error) {
        console.error("Error in getCancellationPolicy:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Get refund statistics with delivery insights
export const getRefundStatsWithDelivery = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                requestDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }
        
        const refunds = await orderCancellationModel.find(dateFilter)
            .populate({
                path: 'orderId',
                select: 'orderDate estimatedDeliveryDate actualDeliveryDate orderStatus',
            });
            
        const stats = {
            totalRefunds: refunds.length,
            deliveryInsights: {
                cancelledBeforeDelivery: 0,
                cancelledAfterDelivery: 0,
                cancelledWithOverdueDelivery: 0,
                averageDaysBeforeCancellation: 0,
                refundsByDeliveryStatus: {
                    noDeliveryDate: 0,
                    pendingDelivery: 0,
                    delivered: 0,
                    overdue: 0
                }
            },
            refundAmountsByDeliveryStatus: {
                beforeDelivery: 0,
                afterDelivery: 0,
                overdueDelivery: 0
            }
        };
        
        let totalDaysBeforeCancellation = 0;
        let validDayCount = 0;
        
        refunds.forEach(refund => {
            if (refund.orderId) {
                const orderDate = new Date(refund.orderId.orderDate);
                const cancellationDate = new Date(refund.requestDate);
                const estimatedDelivery = refund.orderId.estimatedDeliveryDate ? new Date(refund.orderId.estimatedDeliveryDate) : null;
                const actualDelivery = refund.orderId.actualDeliveryDate ? new Date(refund.orderId.actualDeliveryDate) : null;
                
                // Calculate days before cancellation
                const daysBeforeCancellation = Math.floor((cancellationDate - orderDate) / (1000 * 60 * 60 * 24));
                totalDaysBeforeCancellation += daysBeforeCancellation;
                validDayCount++;
                
                // Delivery status analysis
                if (!estimatedDelivery) {
                    stats.deliveryInsights.refundsByDeliveryStatus.noDeliveryDate++;
                } else if (actualDelivery) {
                    stats.deliveryInsights.refundsByDeliveryStatus.delivered++;
                    stats.deliveryInsights.cancelledAfterDelivery++;
                    if (refund.refundDetails?.refundAmount) {
                        stats.refundAmountsByDeliveryStatus.afterDelivery += refund.refundDetails.refundAmount;
                    }
                } else if (new Date() > estimatedDelivery) {
                    stats.deliveryInsights.refundsByDeliveryStatus.overdue++;
                    stats.deliveryInsights.cancelledWithOverdueDelivery++;
                    if (refund.refundDetails?.refundAmount) {
                        stats.refundAmountsByDeliveryStatus.overdueDelivery += refund.refundDetails.refundAmount;
                    }
                } else {
                    stats.deliveryInsights.refundsByDeliveryStatus.pendingDelivery++;
                    stats.deliveryInsights.cancelledBeforeDelivery++;
                    if (refund.refundDetails?.refundAmount) {
                        stats.refundAmountsByDeliveryStatus.beforeDelivery += refund.refundDetails.refundAmount;
                    }
                }
            }
        });
        
        stats.deliveryInsights.averageDaysBeforeCancellation = validDayCount > 0 ? 
            Math.round(totalDaysBeforeCancellation / validDayCount) : 0;
        
        res.status(200).json({
            success: true,
            error: false,
            data: stats
        });
    } catch (error) {
        console.error('Error getting refund stats with delivery:', error);
        res.status(500).json({
            success: false,
            error: true,
            message: 'Internal server error'
        });
    }
};

// Update cancellation policy (Admin only)
export const updateCancellationPolicy = async (req, res) => {
    try {
        const adminId = req.userId;
        const updateData = req.body;

        const policy = await cancellationPolicyModel.findOneAndUpdate(
            { isActive: true },
            {
                ...updateData,
                lastUpdated: new Date(),
                updatedBy: adminId
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            error: false,
            message: "Cancellation policy updated successfully",
            data: policy
        });

    } catch (error) {
        console.error("Error in updateCancellationPolicy:", error);
        res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Get all refunds for a specific user
export const getUserRefunds = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Query for all cancellation/refund requests belonging to this user
        const userRefunds = await orderCancellationModel.find({
            userId: userId,
        })
        .populate({
            path: 'orderId',
            select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity',
            populate: [
                {
                    path: 'items.productId',
                    select: 'name title images image price discount'
                },
                {
                    path: 'items.bundleId',
                    select: 'title name images image bundlePrice price'
                }
            ]
        })
        .populate('userId', 'name email')
        .sort({ 
            requestDate: -1, 
            'refundDetails.refundDate': -1, 
            'adminResponse.processedDate': -1 
        });

        // Return the refunds
        return res.status(200).json({
            success: true,
            error: false,
            message: "User refunds retrieved successfully",
            data: userRefunds
        });
    } catch (error) {
        console.error("Error getting user refunds:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error while getting user refunds"
        });
    }
};

// Get refund invoice
export const getRefundInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        const refundId = req.params.refundId;
        
        if (!refundId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Refund ID is required"
            });
        }
        
        // Find the refund record
        const refund = await orderCancellationModel.findOne({
            userId: userId,
            'refundDetails.refundId': refundId,
            status: 'APPROVED',
            'refundDetails.refundStatus': 'COMPLETED'
        })
        .populate({
            path: 'orderId',
            populate: [
                {
                    path: 'items.productId',
                    select: 'name image price discount description brand category'
                },
                {
                    path: 'items.bundleId',
                    select: 'title image bundlePrice originalPrice description items'
                },
                {
                    path: 'deliveryAddress',
                    select: 'address_line city state pincode country landmark addressType mobile'
                }
            ]
        })
        .populate('userId', 'name email phone');
        
        if (!refund) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Refund not found or not authorized to access"
            });
        }
        
        // Check if invoice file exists
        const invoicePath = `./invoices/refund-${refundId}.pdf`;
        
        if (!fs.existsSync(invoicePath)) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Invoice file not found"
            });
        }
        
        // Send the file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=refund-invoice-${refundId}.pdf`);
        
        const fileStream = fs.createReadStream(invoicePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error("Error getting refund invoice:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error while getting refund invoice"
        });
    }
};

// Get cancellation details by order ID
export const getCancellationByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Order ID is required"
            });
        }

        // Find the order first to get the object ID
        const order = await orderModel.findOne({ orderId: orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "Order not found"
            });
        }

        // Find cancellation request by order object ID
        const cancellationRequest = await orderCancellationModel.findOne({ orderId: order._id })
            .populate({
                path: 'orderId',
                select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity'
            })
            .populate({
                path: 'userId',
                select: 'name email'
            })
            .populate({
                path: 'adminResponse.processedBy',
                select: 'name email'
            });

        if (!cancellationRequest) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "No cancellation request found for this order"
            });
        }

        return res.status(200).json({
            success: true,
            error: false,
            message: "Cancellation details retrieved successfully",
            data: cancellationRequest
        });

    } catch (error) {
        console.error("Error getting cancellation details by order ID:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error while getting cancellation details"
        });
    }
};
