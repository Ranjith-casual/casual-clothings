import returnProductModel from "../models/returnProduct.model.js";
import orderModel from "../models/order.model.js";
import userModel from "../models/users.model.js";
import mongoose from "mongoose";

// Helper function to check if return is eligible
const isReturnEligible = (deliveryDate) => {
    if (!deliveryDate) return false;
    const currentTime = new Date();
    const deliveryTime = new Date(deliveryDate);
    const timeDifference = currentTime - deliveryTime;
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    return timeDifference <= thirtyDaysInMs;
};

// Calculate refund amount (65% of original price)
const calculateRefundAmount = (originalPrice) => {
    return Math.round(originalPrice * 0.65 * 100) / 100; // Round to 2 decimal places
};

// Get eligible items for return (all delivered orders within return window)
export const getEligibleReturnItems = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId } = req.query; // Get orderId from query parameters

        console.log('Getting eligible return items for userId:', userId, 'orderId:', orderId);

        // Build query - if orderId is provided, filter by specific order
        let orderQuery = {
            userId: userId,
            orderStatus: 'DELIVERED'
        };

        if (orderId) {
            orderQuery._id = orderId;
        }

        console.log('Order query:', orderQuery);

        // Find delivered orders for the user (all or specific order)
        const orders = await orderModel.find(orderQuery)
        .populate('deliveryAddress')
        .populate({
            path: 'items.productId',
            select: 'name image price discountPrice'
        })
        .populate({
            path: 'items.bundleId',
            select: 'title image price discountPrice'
        })
        .sort({ actualDeliveryDate: -1 });

        console.log('Found orders:', orders.length);
        orders.forEach(order => {
            console.log('Order:', order._id, 'Status:', order.orderStatus, 'Delivery Date:', order.actualDeliveryDate);
        });

        if (!orders || orders.length === 0) {
            return res.status(200).json({
                message: "No delivered orders found",
                success: true,
                data: {
                    eligibleItems: [],
                    orderInfo: null
                }
            });
        }

        const eligibleItems = [];

        for (const order of orders) {
            console.log('Processing order:', order._id, 'Delivery date:', order.actualDeliveryDate);
            
            // Check if order has actualDeliveryDate and return period is still valid
            if (!order.actualDeliveryDate) {
                console.log('Order has no delivery date, skipping');
                continue;
            }
            
            const isEligible = isReturnEligible(order.actualDeliveryDate);
            console.log('Order eligibility check:', isEligible);
            
            if (!isEligible) {
                console.log('Order outside return window, skipping');
                continue; // Skip orders outside return window
            }

            // Get already requested returns for this order
            const existingReturns = await returnProductModel.find({
                orderId: order._id,
                status: { $nin: ['rejected', 'cancelled'] }
            });

            // Create a map of returned items
            const returnedItems = new Map();
            if (existingReturns && existingReturns.length > 0) {
                existingReturns.forEach(returnReq => {
                    const key = returnReq.itemId; // itemId is the orderItem's _id as string
                    returnedItems.set(key, (returnedItems.get(key) || 0) + returnReq.itemDetails.quantity);
                });
            }

            // Process each item in the order
            if (order.items && order.items.length > 0) {
                for (let i = 0; i < order.items.length; i++) {
                    const item = order.items[i];
                    const itemId = item._id.toString();
                    const returnedQuantity = returnedItems.get(itemId) || 0;
                    const availableQuantity = item.quantity - returnedQuantity;

                    if (availableQuantity > 0) {
                        // Calculate prices based on item type
                        let originalPrice, refundAmount, itemName, itemImage;
                        
                        if (item.itemType === 'bundle' && item.bundleId) {
                            originalPrice = item.bundleId.discountPrice || item.bundleId.price || item.unitPrice || 0;
                            itemName = item.bundleId.title || 'Bundle Item';
                            itemImage = item.bundleId.image?.[0] || '';
                        } else if (item.itemType === 'product' && item.productId) {
                            originalPrice = item.unitPrice || item.productId.discountPrice || item.productId.price || 0;
                            itemName = item.productId.name || 'Product Item';
                            itemImage = item.productId.image?.[0] || '';
                        } else {
                            // Fallback for items without proper population
                            originalPrice = item.unitPrice || 0;
                            itemName = 'Unknown Item';
                            itemImage = '';
                        }

                        refundAmount = calculateRefundAmount(originalPrice);

                        eligibleItems.push({
                            _id: itemId,
                            orderId: order._id,
                            orderNumber: order.orderId,
                            itemType: item.itemType,
                            productId: item.productId,
                            bundleId: item.bundleId,
                            name: itemName,
                            image: itemImage,
                            size: item.size,
                            unitPrice: originalPrice,
                            quantity: availableQuantity,
                            originalPrice: originalPrice,
                            refundAmount: refundAmount,
                            totalRefundAmount: refundAmount * availableQuantity,
                            deliveredAt: order.actualDeliveryDate,
                            eligibilityExpiryDate: new Date(order.actualDeliveryDate.getTime() + 30 * 24 * 60 * 60 * 1000)
                        });
                    }
                }
            }
        }

        res.status(200).json({
            message: "Eligible return items retrieved successfully",
            success: true,
            data: {
                eligibleItems: eligibleItems,
                orderInfo: orders.length > 0 ? {
                    orderId: orders[0]._id,
                    orderNumber: orders[0].orderId,
                    deliveryDate: orders[0].actualDeliveryDate
                } : null
            }
        });

    } catch (error) {
        console.error("Error getting eligible return items:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Create a return request
export const createReturnRequest = async (req, res) => {
    try {
        const { items } = req.body;
        const userId = req.userId;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Items array is required",
                success: false
            });
        }

        // Validate each item
        for (const item of items) {
            if (!item.orderItemId || !item.reason) {
                return res.status(400).json({
                    message: "Each item must have orderItemId and reason",
                    success: false
                });
            }
        }

        // For now, create individual return requests for each item
        // In a more sophisticated system, you might want to group them
        const createdReturns = [];

        for (const item of items) {
            // Find the order that contains this item
            const orders = await orderModel.find({
                userId: userId,
                orderStatus: 'DELIVERED',
                'items._id': new mongoose.Types.ObjectId(item.orderItemId)
            })
            .populate({
                path: 'items.productId',
                select: 'name image price discountPrice'
            })
            .populate({
                path: 'items.bundleId',
                select: 'title image price discountPrice'
            });

            if (!orders || orders.length === 0) {
                continue; // Skip invalid items
            }

            const order = orders[0];
            const orderItem = order.items.find(oi => oi._id.toString() === item.orderItemId);

            if (!orderItem) {
                continue; // Skip if item not found
            }

            // Check if return period is still valid
            if (!isReturnEligible(order.actualDeliveryDate)) {
                return res.status(400).json({
                    message: "Return period has expired (1 day after delivery)",
                    success: false
                });
            }

            // Check if return already exists for this item
            const existingReturn = await returnProductModel.findOne({
                orderId: order._id,
                itemId: item.orderItemId,
                status: { $nin: ['rejected', 'cancelled'] }
            });

            if (existingReturn) {
                continue; // Skip items that already have return requests
            }

            // Calculate prices
            let originalPrice, itemName, itemImage;
            if (orderItem.itemType === 'bundle' && orderItem.bundleId) {
                originalPrice = orderItem.bundleId.discountPrice || orderItem.bundleId.price || orderItem.unitPrice || 0;
                itemName = orderItem.bundleId.title || 'Bundle Item';
                itemImage = orderItem.bundleId.image?.[0] || '';
            } else if (orderItem.itemType === 'product' && orderItem.productId) {
                originalPrice = orderItem.unitPrice || orderItem.productId.discountPrice || orderItem.productId.price || 0;
                itemName = orderItem.productId.name || 'Product Item';
                itemImage = orderItem.productId.image?.[0] || '';
            } else {
                // Fallback for items without proper population
                originalPrice = orderItem.unitPrice || 0;
                itemName = 'Unknown Item';
                itemImage = '';
            }

            const refundAmount = calculateRefundAmount(originalPrice);
            const eligibilityExpiryDate = new Date(order.actualDeliveryDate.getTime() + 24 * 60 * 60 * 1000);

            // Create return request
            const returnRequest = new returnProductModel({
                orderId: order._id,
                userId: userId,
                itemId: item.orderItemId,
                itemDetails: {
                    itemType: orderItem.itemType,
                    productId: orderItem.productId,
                    bundleId: orderItem.bundleId,
                    name: itemName,
                    image: itemImage,
                    size: orderItem.size,
                    quantity: item.requestedQuantity || orderItem.quantity,
                    originalPrice: originalPrice,
                    refundAmount: refundAmount
                },
                returnReason: item.reason,
                returnDescription: item.additionalComments || '',
                returnImages: [],
                status: 'REQUESTED',
                eligibilityExpiryDate: eligibilityExpiryDate,
                timeline: [{
                    status: 'REQUESTED',
                    timestamp: new Date(),
                    note: 'Return request submitted by customer'
                }]
            });

            await returnRequest.save();
            createdReturns.push(returnRequest);
        }

        if (createdReturns.length === 0) {
            return res.status(400).json({
                message: "No valid items found for return",
                success: false
            });
        }

        const totalRefundAmount = createdReturns.reduce((total, returnReq) => {
            return total + (returnReq.itemDetails.refundAmount * returnReq.itemDetails.quantity);
        }, 0);

        res.status(201).json({
            message: "Return request(s) created successfully",
            success: true,
            data: {
                returnIds: createdReturns.map(r => r._id),
                totalRefundAmount: totalRefundAmount,
                createdCount: createdReturns.length
            }
        });

    } catch (error) {
        console.error("Error creating return request:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get user's return requests
export const getUserReturnRequests = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const query = { userId: userId };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const returnRequests = await returnProductModel.find(query)
            .populate('orderId', 'orderId orderDate actualDeliveryDate')
            .populate('adminResponse.processedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await returnProductModel.countDocuments(query);

        res.status(200).json({
            message: "Return requests retrieved successfully",
            success: true,
            data: {
                returns: returnRequests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error("Error getting user return requests:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get return request details
export const getReturnRequestDetails = async (req, res) => {
    try {
        const { returnId } = req.params;
        const userId = req.userId;

        const returnRequest = await returnProductModel.findOne({
            _id: returnId,
            userId: userId
        }).populate('orderId', 'orderId orderDate actualDeliveryDate deliveryAddress')
          .populate('adminResponse.processedBy', 'name email');

        if (!returnRequest) {
            return res.status(404).json({
                message: "Return request not found",
                success: false
            });
        }

        res.status(200).json({
            message: "Return request details retrieved successfully",
            success: true,
            data: returnRequest
        });

    } catch (error) {
        console.error("Error getting return request details:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Cancel return request (only if status is REQUESTED)
export const cancelReturnRequest = async (req, res) => {
    try {
        const { returnId } = req.params;
        const userId = req.userId;

        const returnRequest = await returnProductModel.findOne({
            _id: returnId,
            userId: userId,
            status: 'REQUESTED'
        });

        if (!returnRequest) {
            return res.status(404).json({
                message: "Return request not found or cannot be cancelled",
                success: false
            });
        }

        returnRequest.status = 'CANCELLED';
        returnRequest.timeline.push({
            status: 'CANCELLED',
            timestamp: new Date(),
            note: 'Return request cancelled by customer'
        });

        await returnRequest.save();

        res.status(200).json({
            message: "Return request cancelled successfully",
            success: true,
            data: {
                returnId: returnRequest._id,
                status: returnRequest.status
            }
        });

    } catch (error) {
        console.error("Error cancelling return request:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Admin: Get all return requests
export const getAllReturnRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', dateFrom, dateTo, search } = req.body;

        const query = {};
        if (status && status !== '') {
            query.status = status.toUpperCase();
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        // Search filter (search in user name, email, or order ID)
        if (search && search.trim() !== '') {
            // We'll use $or to search across multiple fields
            query.$or = [
                { 'orderId.orderId': { $regex: search, $options: 'i' } },
                { 'itemDetails.name': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const returnRequests = await returnProductModel.find(query)
            .populate('orderId', 'orderId orderDate actualDeliveryDate')
            .populate('userId', 'name email')
            .populate('adminResponse.processedBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await returnProductModel.countDocuments(query);

        res.status(200).json({
            message: "Return requests retrieved successfully",
            success: true,
            data: {
                returns: returnRequests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error("Error getting all return requests:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Admin: Process return request (approve/reject)
export const processReturnRequest = async (req, res) => {
    try {
        const { returnId } = req.params;
        const { action, adminComments, inspectionNotes, customRefundAmount } = req.body;
        const adminId = req.userId;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                message: "Invalid action. Must be 'approve' or 'reject'",
                success: false
            });
        }

        const returnRequest = await returnProductModel.findOne({
            _id: returnId,
            status: { $in: ['REQUESTED', 'UNDER_REVIEW'] }
        });

        if (!returnRequest) {
            return res.status(404).json({
                message: "Return request not found or already processed",
                success: false
            });
        }

        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        
        returnRequest.status = newStatus;
        returnRequest.adminResponse = {
            processedBy: adminId,
            processedDate: new Date(),
            adminComments: adminComments || '',
            inspectionNotes: inspectionNotes || ''
        };

        returnRequest.timeline.push({
            status: newStatus,
            timestamp: new Date(),
            note: `Return request ${action}d by admin`
        });

        // If approved, set refund details with custom amount if provided
        if (action === 'approve') {
            const defaultRefundAmount = returnRequest.itemDetails.refundAmount * returnRequest.itemDetails.quantity;
            const finalRefundAmount = customRefundAmount && customRefundAmount > 0 ? 
                parseFloat(customRefundAmount) : defaultRefundAmount;

            returnRequest.refundDetails = {
                refundStatus: 'PENDING',
                actualRefundAmount: finalRefundAmount,
                originalCalculatedAmount: defaultRefundAmount,
                isCustomAmount: customRefundAmount && customRefundAmount > 0
            };

            // Add note if custom amount was used
            if (customRefundAmount && customRefundAmount > 0) {
                returnRequest.timeline.push({
                    status: 'CUSTOM_REFUND_SET',
                    timestamp: new Date(),
                    note: `Custom refund amount set by admin: ₹${finalRefundAmount} (Original: ₹${defaultRefundAmount})`
                });
            }
        }

        await returnRequest.save();

        res.status(200).json({
            message: `Return request ${action}d successfully`,
            success: true,
            data: {
                returnId: returnRequest._id,
                status: returnRequest.status,
                refundAmount: action === 'approve' ? returnRequest.refundDetails.actualRefundAmount : 0
            }
        });

    } catch (error) {
        console.error("Error processing return request:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Admin: Process refund
export const processRefund = async (req, res) => {
    try {
        const { returnId } = req.params;
        const { refundId, refundMethod } = req.body;

        const returnRequest = await returnProductModel.findOne({
            _id: returnId,
            status: 'APPROVED'
        });

        if (!returnRequest) {
            return res.status(404).json({
                message: "Return request not found or not approved",
                success: false
            });
        }

        returnRequest.status = 'REFUND_PROCESSED';
        returnRequest.refundDetails.refundId = refundId;
        returnRequest.refundDetails.refundMethod = refundMethod || 'ORIGINAL_PAYMENT_METHOD';
        returnRequest.refundDetails.refundStatus = 'COMPLETED';
        returnRequest.refundDetails.refundDate = new Date();

        returnRequest.timeline.push({
            status: 'REFUND_PROCESSED',
            timestamp: new Date(),
            note: 'Refund processed successfully'
        });

        await returnRequest.save();

        res.status(200).json({
            message: "Refund processed successfully",
            success: true,
            data: {
                returnId: returnRequest._id,
                status: returnRequest.status,
                refundId: refundId,
                refundAmount: returnRequest.refundDetails.actualRefundAmount
            }
        });

    } catch (error) {
        console.error("Error processing refund:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Update return request (for customer use)
export const updateReturnRequest = async (req, res) => {
    try {
        const { returnId, items, additionalComments } = req.body;
        const userId = req.userId;

        const returnRequest = await returnProductModel.findOne({
            _id: returnId,
            userId: userId,
            status: 'pending'
        });

        if (!returnRequest) {
            return res.status(404).json({
                message: "Return request not found or cannot be updated",
                success: false
            });
        }

        // Update the return request
        if (items) returnRequest.items = items;
        if (additionalComments) returnRequest.additionalComments = additionalComments;
        
        returnRequest.timeline.push({
            status: 'UPDATED',
            timestamp: new Date(),
            note: 'Return request updated by customer'
        });

        await returnRequest.save();

        res.status(200).json({
            message: "Return request updated successfully",
            success: true,
            data: returnRequest
        });

    } catch (error) {
        console.error("Error updating return request:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Confirm product received (admin function)
export const confirmProductReceived = async (req, res) => {
    try {
        const { returnId } = req.body;

        const returnRequest = await returnProductModel.findById(returnId)
            .populate('userId', 'name email')
            .populate('orderId')
            .populate('items.orderItemId');

        if (!returnRequest) {
            return res.status(404).json({
                message: "Return request not found",
                success: false
            });
        }

        if (returnRequest.status !== 'picked_up') {
            return res.status(400).json({
                message: "Product must be picked up before confirming receipt",
                success: false
            });
        }

        // Update status to received
        returnRequest.status = 'received';
        returnRequest.timeline.push({
            status: 'RECEIVED',
            timestamp: new Date(),
            note: 'Product received and verified by admin'
        });

        await returnRequest.save();

        res.status(200).json({
            message: "Product receipt confirmed successfully",
            success: true,
            data: returnRequest
        });

    } catch (error) {
        console.error("Error confirming product receipt:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Admin: Update refund status
export const updateRefundStatus = async (req, res) => {
    try {
        console.log('=== UPDATE REFUND STATUS API CALLED ===');
        const { returnId } = req.params;
        const { refundStatus, refundId, refundMethod, refundAmount, adminNotes } = req.body;
        const adminId = req.userId;
        
        console.log('Return ID:', returnId);
        console.log('Request body:', { refundStatus, refundId, refundMethod, refundAmount, adminNotes });
        console.log('Admin ID:', adminId);

        // Validate refund status
        const validRefundStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
        if (!validRefundStatuses.includes(refundStatus)) {
            return res.status(400).json({
                message: "Invalid refund status. Must be one of: PENDING, PROCESSING, COMPLETED, FAILED",
                success: false
            });
        }

        // Find the return request - allow any status for refund management
        let returnRequest = await returnProductModel.findById(returnId);
        
        console.log('Database search result:', returnRequest);
        
        if (!returnRequest) {
            return res.status(404).json({
                message: "Return request not found in database",
                success: false
            });
        }
        
        console.log('Return status:', returnRequest.status);
        console.log('Proceeding with refund status update for any return status');

        // Initialize refundDetails if it doesn't exist
        if (!returnRequest.refundDetails) {
            returnRequest.refundDetails = {
                refundStatus: 'PENDING',
                actualRefundAmount: returnRequest.itemDetails.refundAmount * returnRequest.itemDetails.quantity
            };
        }

        // Update refund details
        returnRequest.refundDetails.refundStatus = refundStatus;
        
        if (refundId) returnRequest.refundDetails.refundId = refundId;
        if (refundMethod) returnRequest.refundDetails.refundMethod = refundMethod;
        if (refundAmount) returnRequest.refundDetails.actualRefundAmount = refundAmount;

        // Update main status based on refund status
        if (refundStatus === 'COMPLETED') {
            returnRequest.status = 'REFUND_PROCESSED';
            returnRequest.refundDetails.refundDate = new Date();
        } else if (refundStatus === 'FAILED') {
            // Keep current status but add note about failed refund
        }

        // Add timeline entry
        const statusNote = adminNotes || `Refund status updated to ${refundStatus} by admin`;
        returnRequest.timeline.push({
            status: `REFUND_${refundStatus}`,
            timestamp: new Date(),
            note: statusNote
        });

        // Update admin response if needed
        if (!returnRequest.adminResponse) {
            returnRequest.adminResponse = {};
        }
        returnRequest.adminResponse.lastUpdatedBy = adminId;
        returnRequest.adminResponse.lastUpdatedDate = new Date();

        await returnRequest.save();

        res.status(200).json({
            message: "Refund status updated successfully",
            success: true,
            data: {
                returnId: returnRequest._id,
                refundStatus: returnRequest.refundDetails.refundStatus,
                refundAmount: returnRequest.refundDetails.actualRefundAmount,
                refundId: returnRequest.refundDetails.refundId,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error("Error updating refund status:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get order details with return information for admin (new function)
export const getOrderWithReturnDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Find the order with all items
        const order = await orderModel.findById(orderId)
            .populate('userId', 'name email phone')
            .populate('deliveryAddress')
            .populate({
                path: 'items.productId',
                select: 'name image price discountPrice'
            })
            .populate({
                path: 'items.bundleId',
                select: 'title image price discountPrice'
            });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                success: false
            });
        }

        // Get all return requests for this order
        const returnRequests = await returnProductModel.find({
            orderId: orderId
        }).sort({ createdAt: -1 });

        // Create a map of return requests by itemId
        const returnsByItemId = new Map();
        returnRequests.forEach(returnReq => {
            const itemId = returnReq.itemId;
            if (!returnsByItemId.has(itemId)) {
                returnsByItemId.set(itemId, []);
            }
            returnsByItemId.get(itemId).push(returnReq);
        });

        // Process order items with return information
        const orderItemsWithReturns = order.items.map(item => {
            const itemId = item._id.toString();
            const itemReturns = returnsByItemId.get(itemId) || [];
            
            // Calculate returned quantity
            const returnedQuantity = itemReturns
                .filter(ret => !['rejected', 'cancelled'].includes(ret.status))
                .reduce((sum, ret) => sum + (ret.itemDetails.quantity || 0), 0);

            // Calculate prices
            let originalPrice, itemName, itemImage;
            if (item.itemType === 'bundle' && item.bundleId) {
                originalPrice = item.bundleId.discountPrice || item.bundleId.price || item.unitPrice || 0;
                itemName = item.bundleId.title || 'Bundle Item';
                itemImage = item.bundleId.image?.[0] || '';
            } else if (item.itemType === 'product' && item.productId) {
                originalPrice = item.unitPrice || item.productId.discountPrice || item.productId.price || 0;
                itemName = item.productId.name || 'Product Item';
                itemImage = item.productId.image?.[0] || '';
            } else {
                originalPrice = item.unitPrice || 0;
                itemName = 'Unknown Item';
                itemImage = '';
            }

            return {
                _id: itemId,
                itemType: item.itemType,
                productId: item.productId,
                bundleId: item.bundleId,
                name: itemName,
                image: itemImage,
                size: item.size,
                originalQuantity: item.quantity,
                unitPrice: originalPrice,
                totalPrice: originalPrice * item.quantity,
                returnedQuantity: returnedQuantity,
                remainingQuantity: item.quantity - returnedQuantity,
                returnRequests: itemReturns
            };
        });

        // Calculate order totals
        const totalOrderValue = orderItemsWithReturns.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalRefundProcessed = returnRequests
            .filter(ret => ret.refundDetails && ret.refundDetails.refundStatus === 'COMPLETED')
            .reduce((sum, ret) => sum + (ret.refundDetails.actualRefundAmount || 0), 0);

        res.status(200).json({
            message: "Order with return details retrieved successfully",
            success: true,
            data: {
                order: {
                    _id: order._id,
                    orderId: order.orderId,
                    orderDate: order.orderDate,
                    orderStatus: order.orderStatus,
                    actualDeliveryDate: order.actualDeliveryDate,
                    totalAmount: order.totalAmount,
                    deliveryCharges: order.deliveryCharges,
                    customer: order.userId,
                    deliveryAddress: order.deliveryAddress
                },
                items: orderItemsWithReturns,
                summary: {
                    totalItems: orderItemsWithReturns.length,
                    totalOrderValue: totalOrderValue,
                    totalReturnRequests: returnRequests.length,
                    totalRefundProcessed: totalRefundProcessed,
                    pendingRefunds: returnRequests.filter(ret => ret.status === 'APPROVED' && (!ret.refundDetails || ret.refundDetails.refundStatus !== 'COMPLETED')).length
                },
                allReturnRequests: returnRequests
            }
        });

    } catch (error) {
        console.error("Error getting order with return details:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get return dashboard statistics (admin function)
export const getReturnDashboardStats = async (req, res) => {
    try {
        const totalReturns = await returnProductModel.countDocuments();
        const pendingReturns = await returnProductModel.countDocuments({ status: 'pending' });
        const approvedReturns = await returnProductModel.countDocuments({ status: { $in: ['approved', 'picked_up', 'received', 'refund_processed', 'completed'] } });
        
        // Calculate total refund amount
        const refundStats = await returnProductModel.aggregate([
            {
                $match: {
                    'refundDetails.refundStatus': 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRefundAmount: { $sum: '$refundDetails.actualRefundAmount' }
                }
            }
        ]);

        const totalRefundAmount = refundStats.length > 0 ? refundStats[0].totalRefundAmount : 0;

        // Get recent return requests
        const recentReturns = await returnProductModel.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            message: "Dashboard stats fetched successfully",
            success: true,
            data: {
                totalReturns,
                pendingReturns,
                approvedReturns,
                totalRefundAmount,
                recentReturns
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Re-request return for rejected items
export const reRequestReturn = async (req, res) => {
    try {
        const { returnId } = req.body;
        const userId = req.userId;

        // Find the rejected return request
        const existingReturn = await returnProductModel.findOne({
            _id: returnId,
            userId: userId,
            status: 'REJECTED'
        });

        if (!existingReturn) {
            return res.status(404).json({
                message: "Rejected return request not found",
                success: false
            });
        }

        // Check if enough time has passed since rejection (optional: 24 hours)
        const rejectionDate = existingReturn.adminResponse?.processedDate;
        if (rejectionDate) {
            const timeSinceRejection = new Date() - new Date(rejectionDate);
            const oneDayInMs = 24 * 60 * 60 * 1000;
            
            if (timeSinceRejection < oneDayInMs) {
                return res.status(400).json({
                    message: "You can re-request a return 24 hours after rejection",
                    success: false
                });
            }
        }

        // Update the return request status back to REQUESTED
        existingReturn.status = 'REQUESTED';
        existingReturn.adminResponse = null; // Clear previous admin response
        
        // Add to timeline
        existingReturn.timeline.push({
            status: 'RE_REQUESTED',
            timestamp: new Date(),
            note: 'Return request resubmitted by customer after rejection'
        });

        await existingReturn.save();

        res.status(200).json({
            message: "Return request resubmitted successfully",
            success: true,
            data: existingReturn
        });

    } catch (error) {
        console.error("Error re-requesting return:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};
