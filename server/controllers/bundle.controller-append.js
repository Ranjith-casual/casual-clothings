// Decrement bundle stock when purchased
export const decrementBundleStockController = async (request, response) => {
    try {
        const { bundleId, quantity = 1 } = request.body;
        
        if (!bundleId) {
            return response.status(400).json({
                message: "Bundle ID is required",
                error: true,
                success: false
            });
        }

        // Find the bundle
        const bundle = await BundleModel.findById(bundleId);
        
        if (!bundle) {
            return response.status(404).json({
                message: "Bundle not found",
                error: true,
                success: false
            });
        }

        // Check if bundle is active
        if (!bundle.isActive) {
            return response.status(400).json({
                message: "This bundle is not active",
                error: true,
                success: false
            });
        }

        // Check if bundle is time-limited and within time window
        if (bundle.isTimeLimited) {
            const now = new Date();
            if (now < bundle.startDate || now > bundle.endDate) {
                return response.status(400).json({
                    message: "This time-limited bundle is no longer available",
                    error: true,
                    success: false
                });
            }
        }

        // Check if enough stock is available
        if (bundle.stock < quantity) {
            return response.status(400).json({
                message: `Only ${bundle.stock} units available in stock`,
                error: true,
                success: false
            });
        }

        // Decrement stock
        bundle.stock -= quantity;
        await bundle.save();

        response.status(200).json({
            message: "Bundle stock updated successfully",
            data: {
                bundleId: bundle._id,
                remainingStock: bundle.stock
            },
            error: false,
            success: true
        });

    } catch (error) {
        response.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false
        });
    }
};
