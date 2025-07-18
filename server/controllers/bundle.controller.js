import BundleModel from "../models/bundles.js";

// Create a new bundle
export const createBundleController = async (request, response) => {
    try {
        const {
            title,
            description,
            originalPrice,
            bundlePrice,
            // Remove discount from destructuring
            tag,
            items,
            isActive,
            featured,
            stock,
            images,
            metaTitle,
            metaDescription,
            // Add timer-related fields
            startDate,
            endDate,
            isTimeLimited
        } = request.body;

        // Validate required fields
        if (!title || !originalPrice || !bundlePrice || !items || items.length === 0) {
            return response.status(400).json({
                message: "Please provide all required fields",
                error: true,
                success: false
            });
        }

        // Validate pricing
        if (bundlePrice >= originalPrice) {
            return response.status(400).json({
                message: "Bundle price must be less than original price",
                error: true,
                success: false
            });
        }

        // Generate unique slug
        const generateSlug = (title) => {
            return title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        };

        let slug = generateSlug(title);
        let counter = 1;
        
        // Check for duplicate slugs and append counter if needed
        while (await BundleModel.findOne({ slug })) {
            slug = `${generateSlug(title)}-${counter}`;
            counter++;
        }

        const bundle = new BundleModel({
            title,
            description,
            originalPrice,
            bundlePrice,
            // Remove discount field - will be calculated as virtual
            tag,
            items,
            isActive: isActive !== undefined ? isActive : true,
            featured: featured || false,
            stock: stock || 100,
            images: images || [],
            metaTitle,
            metaDescription,
            slug,
            // Add timer-related fields
            startDate: isTimeLimited ? startDate : null,
            endDate: isTimeLimited ? endDate : null,
            isTimeLimited: isTimeLimited || false
        });

        const savedBundle = await bundle.save();

        response.status(201).json({
            message: "Bundle created successfully",
            data: savedBundle,
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

// Get all bundles
export const getBundlesController = async (request, response) => {
    try {
        const { includeInactive, clientView } = request.query;
        
        // Base query - include all for admin, only active for client by default
        let query = includeInactive === 'true' ? {} : { isActive: true };
        
        // If client view is true, filter by additional conditions
        if (clientView === 'true') {
            // For client view, also check stock and time limits
            const now = new Date();
            
            // Only show bundles that have stock > 0
            query.stock = { $gt: 0 };
            
            // For time-limited bundles, only show if within date range
            query.$or = [
                // Not time limited
                { isTimeLimited: false },
                // Time limited but within range
                { 
                    isTimeLimited: true,
                    startDate: { $lte: now },
                    endDate: { $gte: now }
                }
            ];
        }

        const bundles = await BundleModel.find(query)
            .populate('items.productId')
            .sort({ createdAt: -1 });

        response.status(200).json({
            message: "Bundles retrieved successfully",
            data: bundles,
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

// Get bundle by ID
export const getBundleByIdController = async (request, response) => {
    try {
        const { bundleId } = request.params;
        const { clientView } = request.query;
        
        const bundle = await BundleModel.findById(bundleId)
            .populate('items.productId');

        if (!bundle) {
            return response.status(404).json({
                message: "Bundle not found",
                error: true,
                success: false
            });
        }

        // If it's a client view, perform additional validations
        if (clientView === 'true') {
            // Check if bundle is active
            if (!bundle.isActive) {
                return response.status(404).json({
                    message: "This bundle is currently unavailable",
                    error: true,
                    success: false
                });
            }

            // Check if bundle is in stock
            if (bundle.stock <= 0) {
                return response.status(404).json({
                    message: "This bundle is out of stock",
                    error: true,
                    success: false
                });
            }

            // Check if bundle is within time limits if time-limited
            if (bundle.isTimeLimited) {
                const now = new Date();
                if (now < bundle.startDate || now > bundle.endDate) {
                    return response.status(404).json({
                        message: "This time-limited bundle is no longer available",
                        error: true,
                        success: false
                    });
                }
            }
        }

        response.status(200).json({
            message: "Bundle retrieved successfully",
            data: bundle,
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

// Update bundle
export const updateBundleController = async (request, response) => {
    try {
        const { bundleId } = request.params;
        const updateData = request.body;

        // Remove discount from update data as it's now calculated
        delete updateData.discount;

        // If prices are being updated, validate them
        if (updateData.originalPrice || updateData.bundlePrice) {
            const bundle = await BundleModel.findById(bundleId);
            const originalPrice = updateData.originalPrice || bundle.originalPrice;
            const bundlePrice = updateData.bundlePrice || bundle.bundlePrice;
            
            if (bundlePrice >= originalPrice) {
                return response.status(400).json({
                    message: "Bundle price must be less than original price",
                    error: true,
                    success: false
                });
            }
        }

        // If title is being updated, generate new unique slug
        if (updateData.title) {
            const generateSlug = (title) => {
                return title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            };

            let slug = generateSlug(updateData.title);
            let counter = 1;
            
            // Check for duplicate slugs (excluding current bundle)
            while (await BundleModel.findOne({ slug, _id: { $ne: bundleId } })) {
                slug = `${generateSlug(updateData.title)}-${counter}`;
                counter++;
            }
            
            updateData.slug = slug;
        }

        const updatedBundle = await BundleModel.findByIdAndUpdate(
            bundleId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedBundle) {
            return response.status(404).json({
                message: "Bundle not found",
                error: true,
                success: false
            });
        }

        response.status(200).json({
            message: "Bundle updated successfully",
            data: updatedBundle,
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

// Delete bundle
export const deleteBundleController = async (request, response) => {
    try {
        const { bundleId } = request.params;

        const deletedBundle = await BundleModel.findByIdAndDelete(bundleId);

        if (!deletedBundle) {
            return response.status(404).json({
                message: "Bundle not found",
                error: true,
                success: false
            });
        }

        response.status(200).json({
            message: "Bundle deleted successfully",
            data: deletedBundle,
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

// Toggle bundle status
export const toggleBundleStatusController = async (request, response) => {
    try {
        const { bundleId } = request.params;

        const bundle = await BundleModel.findById(bundleId);
        if (!bundle) {
            return response.status(404).json({
                message: "Bundle not found",
                error: true,
                success: false
            });
        }

        bundle.isActive = !bundle.isActive;
        await bundle.save();

        response.status(200).json({
            message: "Bundle status updated successfully",
            data: bundle,
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

// Get featured bundles
export const getFeaturedBundlesController = async (request, response) => {
    try {
        const now = new Date();
        
        // Query for featured bundles that are active, have stock, and are within time limits if applicable
        const query = {
            featured: true,
            isActive: true,
            stock: { $gt: 0 },
            $or: [
                // Not time limited
                { isTimeLimited: false },
                // Time limited but within range
                { 
                    isTimeLimited: true,
                    startDate: { $lte: now },
                    endDate: { $gte: now }
                }
            ]
        };

        const bundles = await BundleModel.find(query)
            .populate('items.productId')
            .sort({ createdAt: -1 });

        response.status(200).json({
            message: "Featured bundles retrieved successfully",
            data: bundles,
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

// Get bundle statistics
export const getBundleStatsController = async (request, response) => {
    try {
        const totalBundles = await BundleModel.countDocuments();
        const activeBundles = await BundleModel.countDocuments({ isActive: true });
        
        // Get all bundles to calculate average discount
        const allBundles = await BundleModel.find({});
        const totalDiscount = allBundles.reduce((sum, bundle) => sum + (bundle.discount || 0), 0);
        const averageDiscount = totalBundles > 0 ? totalDiscount / totalBundles : 0;
        
        const totalRating = allBundles.reduce((sum, bundle) => sum + (bundle.rating || 0), 0);
        const averageRating = totalBundles > 0 ? totalRating / totalBundles : 0;

        response.status(200).json({
            message: "Bundle statistics retrieved successfully",
            data: {
                totalBundles,
                activeBundles,
                averageDiscount: Math.round(averageDiscount),
                averageRating: parseFloat(averageRating.toFixed(1))
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
