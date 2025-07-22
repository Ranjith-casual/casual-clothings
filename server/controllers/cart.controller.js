import CartProductModel from "../models/cartProduct.model.js";
import UserModel from "../models/users.model.js";
import mongoose from "mongoose";
import BundleModel from "../models/bundles.js";

export const addToCartItemController = async (req, res) => {
    try {
        const userId = req?.userId;
        const { productId, size, price } = req?.body;

        console.log('=== ADD TO CART DEBUG START ===');
        console.log('User ID:', userId);
        console.log('Request body:', req.body);
        console.log('Product ID:', productId);
        console.log('Size:', size);
        console.log('Price:', price);

        if(!productId){
            console.log('Error: Product ID is required');
            return res.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false,
            });
        }
        
        // If it's a product, size is required
        if (!size) {
            console.log('Error: Size is required');
            return res.status(400).json({
                message: "Size is required for products",
                error: true,
                success: false,
            });
        }

        // Check if the same product with the same size already exists in cart
        const checkItemCart = await CartProductModel.findOne({
            userId: userId,
            productId: productId,
            size: size
        });

        if(checkItemCart) {
            return res.status(400).json({
                message: "Product with this size already exists in cart",
                error: true,
                success: false,
            });
        }
        
        // Get product to check stock
        const product = await mongoose.model('product').findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                error: true,
                success: false,
            });
        }
        
        // Check size-specific stock
        if (product.sizes && product.sizes[size] < 1) {
            return res.status(400).json({
                message: `Not enough stock for size ${size}`,
                error: true,
                success: false,
            });
        }
        
        // Calculate total remaining stock across all sizes
        const totalRemainingStock = Object.values(product.sizes).reduce((a, b) => a + b, 0);
        
        // Count how many items of this product (any size) are already in the cart
        const existingCartItems = await CartProductModel.find({
            userId: userId,
            productId: productId
        });
        
        const totalQuantityInCart = existingCartItems.reduce((acc, item) => acc + item.quantity, 0);
        
        // Check total product stock
        if (totalQuantityInCart + 1 > totalRemainingStock) {
            return res.status(400).json({
                message: "Not enough total stock for this product",
                error: true,
                success: false,
            });
        }

        const cartItem = new CartProductModel({
            quantity: 1,
            userId: userId,
            productId: productId,
            size: size,
            itemType: 'product',
            sizeAdjustedPrice: price // Store the size-adjusted price
        });

        const save = await cartItem.save();

        const updateCartUser = await UserModel.findByIdAndUpdate(
            {_id:userId},
            {
                $push: {
                    shopping_cart : productId
                },
            },
            { new: true }
        );

        console.log('Cart item saved successfully:', save);
        console.log('User shopping cart updated:', updateCartUser);
        console.log('=== ADD TO CART DEBUG END ===');

        return res.json({
            message: "Product added to cart successfully",
            error: false,
            success: true,
            data: save,
        });
    } catch (error) {
        console.log('=== ADD TO CART ERROR ===');
        console.log('Error:', error);
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
        console.log('=== ADD TO CART DEBUG END ===');

        return res.status(500).json({
            message: "Internal server error: " + error.message,
            error: true,
            success: false,
        });
    }
}

export const getCartItemController = async (req, res) => {
    try {
        const userId = req?.userId;
        console.log('=== CART CONTROLLER DEBUG START ===');
        console.log('Fetching cart items for user:', userId);
        
        const cartItems = await CartProductModel.find({ userId: userId })
            .populate({
                path: "productId",
                select: "name price discount image primaryImage size brand stock publish sizes sizePricing" 
            })
            .populate({
                path: "bundleId",
                select: "title bundlePrice discount images originalPrice stock isActive"
            });

        console.log('Raw cart items:', cartItems.length);
        cartItems.forEach((item, index) => {
            console.log(`Cart item ${index}:`, {
                _id: item._id,
                itemType: item.itemType,
                quantity: item.quantity,
                size: item.size,
                sizeAdjustedPrice: item.sizeAdjustedPrice,
                hasProductId: !!item.productId,
                hasBundleId: !!item.bundleId,
                productId: item.productId ? {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    sizes: item.productId.sizes,
                    sizePricing: item.productId.sizePricing
                } : null,
                bundleId: item.bundleId ? {
                    _id: item.bundleId._id,
                    title: item.bundleId.title,
                    bundlePrice: item.bundleId.bundlePrice
                } : null
            });
        });

        // Filter out invalid cart items and remove them from database
        const validCartItems = [];
        const invalidCartItemIds = [];

        for (const item of cartItems) {
            const hasValidProduct = item.productId && item.productId._id;
            const hasValidBundle = item.bundleId && item.bundleId._id;
            
            if (hasValidProduct || hasValidBundle) {
                validCartItems.push(item);
            } else {
                invalidCartItemIds.push(item._id);
                console.log("Found invalid cart item:", item._id, "productId:", item.productId, "bundleId:", item.bundleId);
            }
        }

        // Remove invalid cart items from database
        if (invalidCartItemIds.length > 0) {
            await CartProductModel.deleteMany({ _id: { $in: invalidCartItemIds } });
            console.log(`Removed ${invalidCartItemIds.length} invalid cart items`);
        }

        console.log('Valid cart items to return:', validCartItems.length);
        validCartItems.forEach((item, index) => {
            console.log(`Valid item ${index}:`, {
                _id: item._id,
                itemType: item.itemType,
                productName: item.productId?.name,
                bundleTitle: item.bundleId?.title,
                productPrice: item.productId?.price,
                bundlePrice: item.bundleId?.bundlePrice
            });
        });
        console.log('=== CART CONTROLLER DEBUG END ===');

        return res.json({
            message: "Cart items fetched successfully",
            error: false,
            success: true,
            data: validCartItems,
        });
    } catch (error) {
        console.error("Error in getCartItemController:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: true,
            success: false,
        });
    }
}
export const updateCartItemQtyController = async(request,response)=>{
    try {
        const userId = request.userId 
        const { _id, qty } = request.body

        if(!_id || qty === undefined) {
            return response.status(400).json({
                message : "provide _id, qty"
            });
        }
        
        // Get cart item with product details
        const cartItem = await CartProductModel.findOne({
            _id: _id,
            userId: userId
        });
        
        if (!cartItem) {
            return response.status(404).json({
                message: "Cart item not found",
                success: false,
                error: true
            });
        }
        
        // Check if it's a product (not a bundle)
        if (cartItem.itemType === 'product' && cartItem.productId) {
            // Get product to check stock
            const product = await mongoose.model('product').findById(cartItem.productId);
            if (!product) {
                return response.status(404).json({
                    message: "Product not found",
                    success: false,
                    error: true
                });
            }
            
            // Check size-specific stock
            if (product.sizes && cartItem.size) {
                const sizeStock = product.sizes[cartItem.size];
                if (sizeStock < qty) {
                    return response.status(400).json({
                        message: `Not enough stock for size ${cartItem.size}`,
                        success: false,
                        error: true,
                        available: sizeStock
                    });
                }
            }
            
            // Calculate total remaining stock across all sizes
            const totalRemainingStock = Object.values(product.sizes).reduce((a, b) => a + b, 0);
            
            // Count how many items of this product (any size) are already in the cart except this one
            const existingCartItems = await CartProductModel.find({
                userId: userId,
                productId: cartItem.productId,
                _id: { $ne: _id }
            });
            
            const otherItemsQuantity = existingCartItems.reduce((acc, item) => acc + item.quantity, 0);
            
            // Check total product stock
            if (otherItemsQuantity + qty > totalRemainingStock) {
                return response.status(400).json({
                    message: "Not enough total stock for this product across all sizes",
                    success: false,
                    error: true,
                    requested: qty,
                    otherQuantities: otherItemsQuantity,
                    available: totalRemainingStock
                });
            }
        }
        
        const updateCartitem = await CartProductModel.updateOne({
            _id : _id,
            userId : userId
        },{
            quantity : qty
        });
        
        return response.json({
            message : "Update cart",
            success : true,
            error : false, 
            data : updateCartitem
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const deleteCartItemQtyController = async(request,response)=>{
    try {
      const userId = request.userId // middleware
      const { _id } = request.body 
      
      if(!_id){
        return response.status(400).json({
            message : "Provide _id",
            error : true,
            success : false
        })
      }

      const deleteCartItem  = await CartProductModel.deleteOne({_id : _id, userId : userId })

      return response.json({
        message : "Item remove",
        error : false,
        success : true,
        data : deleteCartItem
      })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const addBundleToCartController = async (req, res) => {
    try {
        const userId = req?.userId;
        const { bundleId } = req?.body;

        if(!bundleId){
            return res.status(400).json({
                message: "Bundle ID is required",
                error: true,
                success: false,
            });
        }
        
        // First check if the bundle exists and is active
        const bundle = await BundleModel.findById(bundleId);
        if (!bundle) {
            return res.status(404).json({
                message: "Bundle not found",
                error: true,
                success: false,
            });
        }
        
        // Check if the bundle is active
        if (!bundle.isActive) {
            return res.status(400).json({
                message: "This bundle is not active and cannot be added to cart",
                error: true,
                success: false,
            });
        }
        
        // Check if the bundle is time-limited and within valid dates
        if (bundle.isTimeLimited) {
            const now = new Date();
            const startDate = new Date(bundle.startDate);
            const endDate = new Date(bundle.endDate);
            
            if (now < startDate) {
                return res.status(400).json({
                    message: "This bundle is not yet available for purchase",
                    error: true,
                    success: false,
                });
            }
            
            if (now > endDate) {
                return res.status(400).json({
                    message: "This bundle offer has expired",
                    error: true,
                    success: false,
                });
            }
        }
        
        // Check if the bundle has stock
        if (bundle.stock !== undefined && bundle.stock <= 0) {
            return res.status(400).json({
                message: "This bundle is out of stock",
                error: true,
                success: false,
            });
        }

        const checkBundleInCart = await CartProductModel.findOne({
            userId: userId,
            bundleId: bundleId,
            itemType: 'bundle'
        });

        if(checkBundleInCart) {
            return res.status(400).json({
                message: "Bundle already exists in cart",
                error: true,
                success: false,
            });
        }

        const cartItem = new CartProductModel({
            quantity: 1,
            userId: userId,
            bundleId: bundleId,
            itemType: 'bundle'
        });

        const save = await cartItem.save();

        const updateCartUser = await UserModel.findByIdAndUpdate(
            {_id:userId},
            {
                $push: {
                    shopping_cart : bundleId
                },
            },
            { new: true }
        );

        return res.json({
            message: "Bundle added to cart successfully",
            error: false,
            success: true,
            data: save,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: true,
            success: false,
        });
    }
}

// Validate cart items before checkout
export const validateCartItemsController = async (req, res) => {
    try {
        const userId = req?.userId;
        const { cartItemIds } = req.body;
        
        // Validate input
        if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
            return res.status(400).json({
                message: "Please provide valid cart item IDs",
                error: true,
                success: false
            });
        }
        
        // Find all the cart items with userId check for security
        const cartItems = await CartProductModel.find({
            _id: { $in: cartItemIds },
            ...(userId ? { userId } : {})  // Add userId check if available
        })
        .populate({
            path: 'productId',
            select: 'name price stock sizes availableSizes publish discount image'
        })
        .populate({
            path: 'bundleId',
            select: 'title bundlePrice stock isActive isTimeLimited startDate endDate discount images originalPrice'
        });
        
        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({
                message: "No cart items found",
                error: true,
                success: false
            });
        }
        
        const invalidItems = [];
        const validItems = [];
        let subtotal = 0;
        
        // Check each cart item for validity
        for (const item of cartItems) {
            let isValid = true;
            const validationResult = {
                cartItemId: item._id,
                quantity: item.quantity,
                itemType: item.itemType
            };
            
            // Check for bundles
            if (item.itemType === 'bundle' && item.bundleId) {
                // Check if bundle exists
                if (!item.bundleId._id) {
                    invalidItems.push({
                        cartItemId: item._id,
                        reason: "Bundle not found",
                        bundleId: item.bundleId
                    });
                    continue;
                }
                
                validationResult.bundleId = item.bundleId._id;
                validationResult.bundleTitle = item.bundleId.title;
                validationResult.price = item.bundleId.bundlePrice;
                validationResult.discount = item.bundleId.discount || 0;
                
                // Calculate item price with discount
                const itemPrice = item.bundleId.bundlePrice * (1 - (item.bundleId.discount || 0) / 100);
                validationResult.finalPrice = itemPrice;
                validationResult.totalPrice = itemPrice * item.quantity;
                
                // Check if bundle is active
                if (!item.bundleId.isActive) {
                    invalidItems.push({
                        ...validationResult,
                        reason: "Bundle is not active"
                    });
                    isValid = false;
                    continue;
                }
                
                // Check if bundle has stock
                if (item.bundleId.stock !== undefined && item.bundleId.stock < item.quantity) {
                    invalidItems.push({
                        ...validationResult,
                        reason: "Insufficient stock",
                        requested: item.quantity,
                        available: item.bundleId.stock
                    });
                    isValid = false;
                    continue;
                }
                
                // Check if time-limited bundle is still valid
                if (item.bundleId.isTimeLimited) {
                    const now = new Date();
                    const startDate = new Date(item.bundleId.startDate);
                    const endDate = new Date(item.bundleId.endDate);
                    
                    if (now < startDate || now > endDate) {
                        invalidItems.push({
                            ...validationResult,
                            reason: "Time-limited bundle is no longer available"
                        });
                        isValid = false;
                        continue;
                    }
                }
            } 
            // Check for regular products
            else if (item.itemType === 'product' && item.productId) {
                // Check if product exists
                if (!item.productId._id) {
                    invalidItems.push({
                        cartItemId: item._id,
                        reason: "Product not found",
                        productId: item.productId
                    });
                    isValid = false;
                    continue;
                }
                
                validationResult.productId = item.productId._id;
                validationResult.productName = item.productId.name;
                validationResult.price = item.productId.price;
                validationResult.discount = item.productId.discount || 0;
                validationResult.size = item.size;
                validationResult.color = item.color;
                
                // Calculate item price with discount
                const itemPrice = item.productId.price * (1 - (item.productId.discount || 0) / 100);
                validationResult.finalPrice = itemPrice;
                validationResult.totalPrice = itemPrice * item.quantity;
                
                // Check if product is published (active)
                if (!item.productId.publish) {
                    invalidItems.push({
                        ...validationResult,
                        reason: "Product is not available"
                    });
                    isValid = false;
                    continue;
                }
                
                // Check if product has size-specific stock
                if (item.productId.sizes && item.size) {
                    // Safely access size stock with error handling
                    try {
                        const sizeStock = item.productId.sizes[item.size];
                        
                        // Check if sizeStock is a valid number
                        if (typeof sizeStock !== 'number' || isNaN(sizeStock)) {
                            invalidItems.push({
                                ...validationResult,
                                reason: `Invalid stock information for size ${item.size}`,
                                requested: item.quantity,
                                available: 0,
                                size: item.size
                            });
                            isValid = false;
                            continue;
                        }
                        
                        if (sizeStock < item.quantity) {
                            invalidItems.push({
                                ...validationResult,
                                reason: `Insufficient stock for size ${item.size}`,
                                requested: item.quantity,
                                available: sizeStock,
                                size: item.size
                            });
                            isValid = false;
                            continue;
                        }
                    } catch (sizeError) {
                        console.error(`Error processing size ${item.size} for product ${item.productId._id}:`, sizeError);
                        invalidItems.push({
                            ...validationResult,
                            reason: `Error processing size information`,
                            requested: item.quantity,
                            size: item.size
                        });
                        isValid = false;
                        continue;
                    }
                } 
                // Fallback to legacy stock check
                else if (item.productId.stock !== undefined && item.productId.stock < item.quantity) {
                    invalidItems.push({
                        ...validationResult,
                        reason: "Insufficient stock",
                        requested: item.quantity,
                        available: item.productId.stock
                    });
                    isValid = false;
                    continue;
                }
                
                // Check total product stock across all sizes vs all items of this product in the cart
                if (item.productId.sizes) {
                    // Calculate total remaining stock
                    const totalRemainingStock = Object.values(item.productId.sizes).reduce((a, b) => a + b, 0);
                    
                    // Get all cart items for this product to check total quantities
                    const productCartItems = await CartProductModel.find({
                        productId: item.productId._id,
                        _id: { $in: cartItemIds }
                    });
                    
                    const totalQuantityInCart = productCartItems.reduce((acc, cartItem) => acc + cartItem.quantity, 0);
                    
                    if (totalQuantityInCart > totalRemainingStock) {
                        invalidItems.push({
                            ...validationResult,
                            reason: "Total requested quantity exceeds available stock across all sizes",
                            totalRequested: totalQuantityInCart,
                            totalAvailable: totalRemainingStock
                        });
                        isValid = false;
                        continue;
                    }
                }
            } else {
                invalidItems.push({
                    cartItemId: item._id,
                    reason: "Invalid item type or missing product/bundle reference",
                    itemType: item.itemType
                });
                isValid = false;
                continue;
            }
            
            // If item is valid, add to valid items list and update subtotal
            if (isValid) {
                validItems.push(validationResult);
                subtotal += validationResult.totalPrice;
            }
        }
        
        if (invalidItems.length > 0) {
            return res.status(400).json({
                message: "Some items in your cart are unavailable for purchase",
                error: true,
                success: false,
                invalidItems: invalidItems,
                validItems: validItems.length > 0 ? validItems : undefined
            });
        }
        
        // Calculate potential shipping costs or tax information
        const estimatedTax = subtotal * 0.05; // Example: 5% tax
        
        return res.json({
            message: "All items in cart are valid",
            error: false,
            success: true,
            validItems,
            summary: {
                subtotal,
                estimatedTax,
                estimatedTotal: subtotal + estimatedTax
            }
        });
        
    } catch (error) {
        console.error("Error validating cart items:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: true,
            success: false
        });
    }
}