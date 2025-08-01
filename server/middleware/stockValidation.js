import ProductModel from "../models/product.model.js";
import BundleModel from "../models/bundles.js";

export const validateStockAvailability = async (req, res, next) => {
    try {
        const { list_items } = req.body;
        
        if (!list_items || !Array.isArray(list_items)) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Invalid order items"
            });
        }

        // Check stock for each item
        for (const item of list_items) {
            // Determine if this is a bundle or product item
            const isBundle = !!(item.bundleId && (
                (typeof item.bundleId === 'object' && item.bundleId._id) || 
                (typeof item.bundleId === 'string')
            ));
            
            const isProduct = !!(item.productId && (
                (typeof item.productId === 'object' && item.productId._id) || 
                (typeof item.productId === 'string')
            ));
            
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
                    // Convert size to uppercase for consistency
                    const normalizedSize = item.size.toUpperCase();
                    const sizeStock = product.sizes[normalizedSize] || 0;
                    
                    // Check if size exists in available sizes
                    if (!product.availableSizes.includes(normalizedSize)) {
                        return res.status(400).json({
                            success: false,
                            error: true,
                            message: `Size ${normalizedSize} is not available for "${product.name}"`,
                            productId: product._id,
                            size: normalizedSize,
                            availableSizes: product.availableSizes
                        });
                    }
                    
                    // Check if there's enough stock for the requested size
                    if (sizeStock < item.quantity) {
                        return res.status(400).json({
                            success: false,
                            error: true,
                            message: `Insufficient stock for "${product.name}" in size ${normalizedSize}. Available: ${sizeStock}, Requested: ${item.quantity}`,
                            productId: product._id,
                            size: normalizedSize,
                            availableStock: sizeStock,
                            requestedQuantity: item.quantity
                        });
                    }
                    
                }
                // Fallback to legacy stock check only if no size is specified
                else if (!item.size && product.stock < item.quantity) {
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
                
            } else {
                return res.status(400).json({
                    success: false,
                    error: true,
                    message: `Invalid item: neither product nor bundle specified`
                });
            }
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Error validating stock availability",
            details: error.message
        });
    }
};