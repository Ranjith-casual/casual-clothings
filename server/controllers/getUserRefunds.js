// Add this function to your orderCancellation.controller.js file

// Get all refunds for a specific user
export const getUserRefunds = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Query for refunds belonging to this user, filter by approved status
        const userRefunds = await orderCancellationModel.find({
            userId: userId,
            status: 'APPROVED',
            'refundDetails.refundStatus': { $exists: true }
        })
        .populate({
            path: 'orderId',
            populate: {
                path: 'items.productId items.bundleId',
                select: 'name title images image price discount discountedPrice bundlePrice originalPrice'
            }
        })
        .populate('userId', 'name email')
        .sort({ 'refundDetails.refundDate': -1, 'adminResponse.processedDate': -1 });

        // Debug logging to check if price fields are populated
        if (userRefunds.length > 0) {
            console.log('🔍 Backend Refunds Debug - First refund items:');
            const firstOrder = userRefunds[0].orderId;
            if (firstOrder && firstOrder.items) {
                firstOrder.items.forEach((item, index) => {
                    if (item.productId) {
                        console.log(`Item ${index}:`, {
                            productName: item.productId.name,
                            productPrice: item.productId.price,
                            productDiscount: item.productId.discount,
                            productDiscountedPrice: item.productId.discountedPrice,
                            itemQuantity: item.quantity,
                            itemTotal: item.itemTotal,
                            itemSize: item.size
                        });
                    }
                });
            }
            
            // Debug refund percentage data
            console.log('🔍 Backend Refund Percentage Debug:', {
                adminResponse_refundPercentage: userRefunds[0].adminResponse?.refundPercentage,
                refundDetails_refundPercentage: userRefunds[0].refundDetails?.refundPercentage,
                adminResponse_full: userRefunds[0].adminResponse,
                refundDetails_full: userRefunds[0].refundDetails
            });
        }

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
