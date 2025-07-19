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
                select: 'name title images image'
            }
        })
        .populate('userId', 'name email')
        .sort({ 'refundDetails.refundDate': -1, 'adminResponse.processedDate': -1 });

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
