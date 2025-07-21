import ProductModel from "../models/product.model.js";
import BundleModel from "../models/bundles.js";

export const validateStockAvailability = async (req, res, next) => {
    try {
        const { list_items } = req.body;
        
        console.log("=== STOCK VALIDATION MIDDLEWARE START ===");
        console.log("List items:", JSON.stringify(list_items, null, 2));
        
        if (!list_items || !Array.isArray(list_items)) {
            console.log("Invalid list_items:", list_items);
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid order items"
            });
        }

        // Check stock for each item
        for (const item of list_items) {
            console.log("Processing item:", JSON.stringify(item, null, 2));
            
            // Determine if this is a bundle or product item
            const isBundle = !!(item.bundleId && (
                (typeof item.bundleId === 'object' && item.bundleId._id) || 
                (typeof item.bundleId === 'string')
            ));
            
            const isProduct = !!(item.productId && (
                (typeof item.productId === 'object' && item.productId._id) || 
                (typeof item.productId === 'string')
            ));
            
            console.log(`Item type - isBundle: ${isBundle}, isProduct: ${isProduct}`);
            
            if (isBundle) {
                // Validate bundle exists
                const bundleId = (typeof item.bundleId === 'object' && item.bundleId._id) ? item.bundleId._id : item.bundleId;
                const bundle = await BundleModel.findById(bundleId);
                
                if (!bundle) {
                    return res.status(404).json({
                        success: false,
                        error: true,
                        message: `Bundle not found: ${item.bundleId?.title || bundleId || 'Unknown Bundle'}`
                    });
                }
                
                // Check if bundle is active
                if (!bundle.isActive) {
                    return res.status(400).json({
                        success: false,
                        error: true,
                        message: `Bundle "${bundle.title}" is not available for purchase`
                    });
                }
                
                console.log(`Bundle ${bundle.title} validated successfully`);
                
            } else if (isProduct) {
                // Validate product exists and has sufficient stock
                const productId = (typeof item.productId === 'object' && item.productId._id) ? item.productId._id : item.productId;
                const product = await ProductModel.findById(productId);
                
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        error: true,
                        message: `Product not found: ${item.productId?.name || productId || 'Unknown Product'}`
                    });
                }

                // Check size-specific inventory if size is provided
                if (item.size && product.sizes) {
                    const sizeStock = product.sizes[item.size] || 0;
                    if (sizeStock < item.quantity) {
                        return res.status(400).json({
                            success: false,
                            error: true,
                            message: `Insufficient stock for "${product.name}" in size ${item.size}. Available: ${sizeStock}, Requested: ${item.quantity}`,
                            productId: product._id,
                            size: item.size,
                            availableStock: sizeStock,
                            requestedQuantity: item.quantity
                        });
                    }
                }
                // Fallback to legacy stock check
                else if (product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        error: true,
                        message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
                        productId: product._id,
                        availableStock: product.stock,
                        requestedQuantity: item.quantity
                    });
                }

                // Check if product is published
                if (!product.publish) {
                    return res.status(400).json({
                        success: false,
                        error: true,
                        message: `Product "${product.name}" is not available for purchase`
                    });
                }
                
                console.log(`Product ${product.name} validated successfully`);
                
            } else {
                console.log('Invalid item - neither product nor bundle:', item);
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: `Invalid item: neither product nor bundle - ${JSON.stringify({
                        hasProductId: !!item.productId,
                        hasBundleId: !!item.bundleId,
                        productIdType: typeof item.productId,
                        bundleIdType: typeof item.bundleId
                    })}`
                });
            }
        }

        console.log("=== STOCK VALIDATION MIDDLEWARE PASSED ===");
        next();
    } catch (error) {
        console.error("=== STOCK VALIDATION ERROR ===");
        console.error("Error details:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error validating stock availability",
            details: error.message
        });
    }
};