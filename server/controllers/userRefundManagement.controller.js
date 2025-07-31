import orderCancellationModel from "../models/orderCancellation.model.js";
import orderModel from "../models/order.model.js";
import UserModel from "../models/users.model.js";
import mongoose from "mongoose";

// Get comprehensive refund dashboard data for a user
export const getUserRefundDashboard = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get user details
        const user = await UserModel.findById(userId).select('name email');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "User not found"
            });
        }

        // Get all orders for the user to calculate summary stats
        const allOrders = await orderModel.find({ userId: userId })
            .select('orderId totalAmt orderDate orderStatus');

        // Get all refund/cancellation requests for the user
        const userRefunds = await orderCancellationModel.find({
            userId: userId,
        })
        .populate({
            path: 'orderId',
            select: 'orderId totalAmt orderDate orderStatus paymentMethod paymentStatus items subTotalAmt totalQuantity deliveryCharge',
            populate: [
                {
                    path: 'items.productId',
                    select: 'name title images image price discount discountedPrice'
                },
                {
                    path: 'items.bundleId',
                    select: 'title name images image bundlePrice price originalPrice'
                }
            ]
        })
        .populate('userId', 'name email')
        .sort({ 
            requestDate: -1, 
            'refundDetails.refundDate': -1, 
            'adminResponse.processedDate': -1 
        });

        // Calculate summary statistics
        const totalOrdersPlaced = allOrders.length;
        const totalCancelledOrders = userRefunds.filter(refund => 
            refund.cancellationType === 'FULL_ORDER' && refund.status === 'APPROVED'
        ).length;
        
        // Calculate partial cancellations (items)
        const partialCancellations = userRefunds.filter(refund => 
            refund.cancellationType === 'PARTIAL_ITEMS' && refund.status === 'APPROVED'
        );

        // Calculate total refund amounts
        let totalRefundedAmount = 0;
        let totalRefundsProcessed = 0;

        userRefunds.forEach(refund => {
            if (refund.status === 'APPROVED' && refund.adminResponse?.refundAmount) {
                totalRefundedAmount += refund.adminResponse.refundAmount;
                totalRefundsProcessed++;
            }
        });

        // Prepare refund breakdown data
        const refundBreakdown = userRefunds.map(refund => {
            const order = refund.orderId;
            const items = [];

            if (refund.cancellationType === 'PARTIAL_ITEMS' && refund.itemsToCancel) {
                // For partial cancellations, show both cancelled and active items
                const cancelledItemIds = refund.itemsToCancel.map(item => item.itemId.toString());
                
                // Add cancelled items first
                refund.itemsToCancel.forEach(cancelItem => {
                    const orderItem = order.items?.find(item => 
                        item._id.toString() === cancelItem.itemId.toString()
                    );
                    
                    if (orderItem) {
                        // Calculate price for cancelled items more comprehensively
                        let itemPrice = cancelItem.totalPrice;
                        let originalPrice = 0;
                        let discountAmount = 0;
                        let discountPercentage = 0;
                        
                        if (!itemPrice) {
                            if (orderItem.itemType === 'bundle') {
                                itemPrice = orderItem.itemTotal || 
                                           orderItem.bundleDetails?.price || 
                                           orderItem.bundleId?.bundlePrice || 
                                           orderItem.bundleId?.price || 
                                           orderItem.bundleId?.originalPrice || 0;
                                originalPrice = orderItem.bundleId?.originalPrice || orderItem.bundleId?.price || itemPrice;
                            } else {
                                // For products, check for discounted vs original price
                                const productPrice = orderItem.productId?.price || orderItem.productDetails?.price || 0;
                                const discountedPrice = orderItem.productId?.discountedPrice || orderItem.productDetails?.discountedPrice;
                                const discount = orderItem.productId?.discount || orderItem.productDetails?.discount || 0;
                                
                                itemPrice = orderItem.itemTotal || discountedPrice || productPrice;
                                originalPrice = productPrice;
                                
                                // Calculate discount information
                                if (discountedPrice && productPrice && discountedPrice < productPrice) {
                                    discountAmount = (productPrice - discountedPrice) * (cancelItem.quantity || orderItem.quantity || 1);
                                    discountPercentage = Math.round(((productPrice - discountedPrice) / productPrice) * 100);
                                } else if (discount && discount > 0) {
                                    discountPercentage = discount;
                                    discountAmount = (productPrice * (discount / 100)) * (cancelItem.quantity || orderItem.quantity || 1);
                                }
                            }
                        }
                        
                        items.push({
                            _id: orderItem._id,
                            productName: getItemName(orderItem),
                            quantity: cancelItem.quantity || orderItem.quantity,
                            price: itemPrice,
                            originalPrice: originalPrice,
                            discountAmount: discountAmount,
                            discountPercentage: discountPercentage,
                            refundStatus: getRefundStatus(refund),
                            refundedAmount: cancelItem.refundAmount || 0,
                            cancellationReason: refund.reason,
                            refundedOn: refund.refundDetails?.refundDate || refund.adminResponse?.processedDate,
                            itemType: orderItem.itemType || 'product',
                            image: getItemImage(orderItem),
                            itemStatus: 'Cancelled'
                        });
                    }
                });
                
                // Add active (non-cancelled) items
                order.items?.forEach(item => {
                    if (!cancelledItemIds.includes(item._id.toString())) {
                        // Calculate price for active items more comprehensively
                        let itemPrice = 0;
                        let originalPrice = 0;
                        let discountAmount = 0;
                        let discountPercentage = 0;
                        
                        if (item.itemType === 'bundle') {
                            itemPrice = item.itemTotal || 
                                       item.bundleDetails?.price || 
                                       item.bundleId?.bundlePrice || 
                                       item.bundleId?.price || 
                                       item.bundleId?.originalPrice || 0;
                            originalPrice = item.bundleId?.originalPrice || item.bundleId?.price || itemPrice;
                        } else {
                            // For products, check for discounted vs original price
                            const productPrice = item.productId?.price || item.productDetails?.price || 0;
                            const discountedPrice = item.productId?.discountedPrice || item.productDetails?.discountedPrice;
                            const discount = item.productId?.discount || item.productDetails?.discount || 0;
                            
                            itemPrice = item.itemTotal || discountedPrice || productPrice;
                            originalPrice = productPrice;
                            
                            // Calculate discount information
                            if (discountedPrice && productPrice && discountedPrice < productPrice) {
                                discountAmount = (productPrice - discountedPrice) * (item.quantity || 1);
                                discountPercentage = Math.round(((productPrice - discountedPrice) / productPrice) * 100);
                            } else if (discount && discount > 0) {
                                discountPercentage = discount;
                                discountAmount = (productPrice * (discount / 100)) * (item.quantity || 1);
                            }
                        }
                        
                        console.log(`💰 Active Item Pricing Debug:`, {
                            productName: getItemName(item),
                            itemPrice,
                            originalPrice,
                            discountAmount,
                            discountPercentage,
                            quantity: item.quantity,
                            itemType: item.itemType,
                            productDetails: item.productDetails,
                            productId: item.productId
                        });
                        
                        items.push({
                            _id: item._id,
                            productName: getItemName(item),
                            quantity: item.quantity,
                            price: itemPrice,
                            originalPrice: originalPrice,
                            discountAmount: discountAmount,
                            discountPercentage: discountPercentage,
                            refundStatus: 'N/A', // Not applicable for active items
                            refundedAmount: 0, // No refund for active items
                            cancellationReason: 'N/A', // Not cancelled
                            refundedOn: null, // Not refunded
                            itemType: item.itemType || 'product',
                            image: getItemImage(item),
                            itemStatus: 'Active' // Still being processed
                        });
                    }
                });
            } else {
                // For full order cancellations, show all items
                order.items?.forEach(item => {
                    // Calculate price for full order cancellation items more comprehensively
                    let itemPrice = 0;
                    let originalPrice = 0;
                    let discountAmount = 0;
                    let discountPercentage = 0;
                    
                    if (item.itemType === 'bundle') {
                        itemPrice = item.itemTotal || 
                                   item.bundleDetails?.price || 
                                   item.bundleId?.bundlePrice || 
                                   item.bundleId?.price || 
                                   item.bundleId?.originalPrice || 0;
                        originalPrice = item.bundleId?.originalPrice || item.bundleId?.price || itemPrice;
                    } else {
                        // For products, check for discounted vs original price
                        const productPrice = item.productId?.price || item.productDetails?.price || 0;
                        const discountedPrice = item.productId?.discountedPrice || item.productDetails?.discountedPrice;
                        const discount = item.productId?.discount || item.productDetails?.discount || 0;
                        
                        itemPrice = item.itemTotal || discountedPrice || productPrice;
                        originalPrice = productPrice;
                        
                        // Calculate discount information
                        if (discountedPrice && productPrice && discountedPrice < productPrice) {
                            discountAmount = (productPrice - discountedPrice) * (item.quantity || 1);
                            discountPercentage = Math.round(((productPrice - discountedPrice) / productPrice) * 100);
                        } else if (discount && discount > 0) {
                            discountPercentage = discount;
                            discountAmount = (productPrice * (discount / 100)) * (item.quantity || 1);
                        }
                    }
                    
                    items.push({
                        _id: item._id,
                        productName: getItemName(item),
                        quantity: item.quantity,
                        price: itemPrice,
                        originalPrice: originalPrice,
                        discountAmount: discountAmount,
                        discountPercentage: discountPercentage,
                        refundStatus: getRefundStatus(refund),
                        refundedAmount: 0, // Not needed for full order - total shown in summary
                        cancellationReason: refund.reason,
                        refundedOn: refund.refundDetails?.refundDate || refund.adminResponse?.processedDate,
                        itemType: item.itemType || 'product',
                        image: getItemImage(item),
                        itemStatus: 'Cancelled' // All items cancelled in full order
                    });
                });
            }

            // Debug log for refund percentage
            console.log(`🔍 Refund ${refund._id} Debug:`, {
                adminResponseRefundPercentage: refund.adminResponse?.refundPercentage,
                enhancedRefundAmount: refund.refundDetails?.enhancedRefundData?.finalRefundAmount,
                enhancedTotalItemValue: refund.refundDetails?.enhancedRefundData?.totalItemValue,
                cancellationType: refund.cancellationType,
                adminResponseFull: refund.adminResponse,
                refundDetailsFull: refund.refundDetails
            });

            // Calculate actual refund percentage for partial cancellations
            let actualRefundPercentage = refund.adminResponse?.refundPercentage || 0;
            let actualRefundAmount = refund.adminResponse?.refundAmount || 0;
            
            if (refund.cancellationType === 'PARTIAL_ITEMS' && 
                refund.refundDetails?.enhancedRefundData?.finalRefundAmount && 
                refund.refundDetails?.enhancedRefundData?.totalItemValue) {
                
                const finalAmount = refund.refundDetails.enhancedRefundData.finalRefundAmount;
                const totalValue = refund.refundDetails.enhancedRefundData.totalItemValue;
                actualRefundPercentage = Math.round((finalAmount / totalValue) * 100);
                actualRefundAmount = finalAmount; // Use the correct final refund amount for partial orders
                
                console.log(`🔧 Calculated actual values for partial order: ${actualRefundPercentage}% (${finalAmount}/${totalValue}), Amount: ₹${actualRefundAmount}`);
            }

            return {
                _id: refund._id,
                orderId: order.orderId,
                orderDate: order.orderDate,
                cancellationType: refund.cancellationType,
                status: refund.status,
                refundId: refund.refundDetails?.refundId,
                totalRefundAmount: actualRefundAmount,
                refundPercentage: actualRefundPercentage,
                requestDate: refund.requestDate,
                processedDate: refund.adminResponse?.processedDate,
                refundStatus: refund.refundDetails?.refundStatus || 'PENDING',
                items: items,
                reason: refund.reason,
                adminComments: refund.adminResponse?.adminComments
            };
        });

        // Calculate refund percentage (average or based on total amounts)
        const totalOrderValue = allOrders.reduce((sum, order) => sum + (order.totalAmt || 0), 0);
        const overallRefundPercentage = totalOrderValue > 0 ? 
            ((totalRefundedAmount / totalOrderValue) * 100).toFixed(2) : 0;

        const dashboardData = {
            userDetails: {
                name: user.name,
                email: user.email,
                userId: user._id
            },
            summary: {
                totalOrdersPlaced,
                totalCancelledOrders,
                totalPartialCancellations: partialCancellations.length,
                totalRefundsProcessed,
                totalRefundedAmount: parseFloat(totalRefundedAmount.toFixed(2)),
                overallRefundPercentage: parseFloat(overallRefundPercentage)
            },
            refundBreakdown
        };

        return res.status(200).json({
            success: true,
            error: false,
            message: "User refund dashboard data retrieved successfully",
            data: dashboardData
        });

    } catch (error) {
        console.error("Error getting user refund dashboard:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error while retrieving refund dashboard",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Helper function to get item name
const getItemName = (item) => {
    if (item.itemType === 'bundle') {
        return item.bundleId?.title || item.bundleId?.name || 
               item.bundleDetails?.title || item.bundleDetails?.name || 
               'Bundle Item';
    } else {
        return item.productId?.name || item.productId?.title || 
               item.productDetails?.name || item.productDetails?.title || 
               'Product Item';
    }
};

// Helper function to get item image
const getItemImage = (item) => {
    if (item.itemType === 'bundle') {
        if (item.bundleId?.images && item.bundleId.images.length > 0) {
            return item.bundleId.images[0];
        } else if (item.bundleId?.image) {
            return Array.isArray(item.bundleId.image) ? item.bundleId.image[0] : item.bundleId.image;
        } else if (item.bundleDetails?.images && item.bundleDetails.images.length > 0) {
            return item.bundleDetails.images[0];
        } else if (item.bundleDetails?.image) {
            return Array.isArray(item.bundleDetails.image) ? item.bundleDetails.image[0] : item.bundleDetails.image;
        }
    } else {
        if (item.productId?.images && item.productId.images.length > 0) {
            return item.productId.images[0];
        } else if (item.productId?.image) {
            return Array.isArray(item.productId.image) ? item.productId.image[0] : item.productId.image;
        } else if (item.productDetails?.images && item.productDetails.images.length > 0) {
            return item.productDetails.images[0];
        } else if (item.productDetails?.image) {
            return Array.isArray(item.productDetails.image) ? item.productDetails.image[0] : item.productDetails.image;
        }
    }
    return null;
};

// Helper function to get refund status
const getRefundStatus = (refund) => {
    if (refund.status === 'REJECTED') return 'Rejected';
    if (refund.status === 'PENDING') return 'Pending';
    if (refund.status === 'APPROVED') {
        if (refund.refundDetails?.refundStatus === 'COMPLETED') return 'Refunded';
        return 'Approved';
    }
    return 'Active';
};

// Helper function to calculate item refund amount (only for partial cancellations)
const calculateItemRefundAmount = (item, refund) => {
    if (refund.cancellationType === 'PARTIAL_ITEMS') {
        const cancelItem = refund.itemsToCancel?.find(cancelItem => 
            cancelItem.itemId.toString() === item._id.toString()
        );
        return cancelItem?.refundAmount || 0;
    } else {
        // For full order cancellations, individual item refunds are not needed
        // The total refund amount is shown in the summary
        return 0;
    }
};

// Get refund statistics for user
export const getUserRefundStats = async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate } = req.query;
        
        let dateFilter = { userId: userId };
        if (startDate && endDate) {
            dateFilter.requestDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const refunds = await orderCancellationModel.find(dateFilter)
            .populate('orderId', 'totalAmt orderDate')
            .sort({ requestDate: -1 });
        
        const stats = {
            totalRefundRequests: refunds.length,
            approvedRefunds: refunds.filter(r => r.status === 'APPROVED').length,
            rejectedRefunds: refunds.filter(r => r.status === 'REJECTED').length,
            pendingRefunds: refunds.filter(r => r.status === 'PENDING').length,
            totalRefundAmount: refunds
                .filter(r => r.status === 'APPROVED')
                .reduce((sum, r) => sum + (r.adminResponse?.refundAmount || 0), 0),
            averageProcessingTime: calculateAverageProcessingTime(refunds),
            refundsByMonth: groupRefundsByMonth(refunds)
        };
        
        return res.status(200).json({
            success: true,
            error: false,
            message: "User refund statistics retrieved successfully",
            data: stats
        });
        
    } catch (error) {
        console.error("Error getting user refund stats:", error);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error"
        });
    }
};

// Helper function to calculate average processing time
const calculateAverageProcessingTime = (refunds) => {
    const processedRefunds = refunds.filter(r => 
        r.status === 'APPROVED' && r.adminResponse?.processedDate && r.requestDate
    );
    
    if (processedRefunds.length === 0) return 0;
    
    const totalTime = processedRefunds.reduce((sum, refund) => {
        const requestTime = new Date(refund.requestDate);
        const processedTime = new Date(refund.adminResponse.processedDate);
        return sum + (processedTime - requestTime);
    }, 0);
    
    return Math.round(totalTime / processedRefunds.length / (1000 * 60 * 60 * 24)); // Days
};

// Helper function to group refunds by month
const groupRefundsByMonth = (refunds) => {
    const grouped = {};
    
    refunds.forEach(refund => {
        const date = new Date(refund.requestDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                month: monthKey,
                totalRequests: 0,
                approvedRequests: 0,
                totalRefundAmount: 0
            };
        }
        
        grouped[monthKey].totalRequests++;
        if (refund.status === 'APPROVED') {
            grouped[monthKey].approvedRequests++;
            grouped[monthKey].totalRefundAmount += refund.adminResponse?.refundAmount || 0;
        }
    });
    
    return Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
};
