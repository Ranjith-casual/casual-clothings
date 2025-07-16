import CartProductModel from "../models/cartProduct.model.js";
import UserModel from "../models/users.model.js";
import mongoose from "mongoose";
import BundleModel from "../models/bundles.js";

export const addToCartItemController = async (req, res) => {
    try {
        const userId = req?.userId;
        const { productId } = req?.body;

        if(!productId){
            return res.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false,
            });
        }

        const checkItemCart = await CartProductModel.findOne({
            userId: userId,
            productId: productId,
        });

        if(checkItemCart) {
            return res.status(400).json({
                message: "Product already exists in cart",
                error: true,
                success: false,
            });
        }

        const cartItem = new CartProductModel({
            quantity: 1,
            userId: userId,
            productId: productId,
            itemType: 'product'
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

        return res.json({
            message: "Product added to cart successfully",
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

export const getCartItemController = async (req, res) => {
    try {
        const userId = req?.userId;
        console.log('=== CART CONTROLLER DEBUG START ===');
        console.log('Fetching cart items for user:', userId);
        
        const cartItems = await CartProductModel.find({ userId: userId })
            .populate({
                path: "productId",
                select: "name price discount image primaryImage size brand" 
            })
            .populate({
                path: "bundleId",
                select: "title bundlePrice discount images originalPrice"
            });

        console.log('Raw cart items:', cartItems.length);
        cartItems.forEach((item, index) => {
            console.log(`Cart item ${index}:`, {
                _id: item._id,
                itemType: item.itemType,
                quantity: item.quantity,
                hasProductId: !!item.productId,
                hasBundleId: !!item.bundleId,
                productId: item.productId ? {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price
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
        const { _id,qty } = request.body

        if(!_id || qty === undefined)
            {
            return response.status(400).json({
                message : "provide _id, qty"
            })
        }

        const updateCartitem = await CartProductModel.updateOne({
            _id : _id,
            userId : userId
        },{
            quantity : qty
        })

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
        const { cartItemIds } = req.body;
        
        if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
            return res.status(400).json({
                message: "Please provide valid cart item IDs",
                error: true,
                success: false
            });
        }
        
        // Find all the cart items
        const cartItems = await CartProductModel.find({
            _id: { $in: cartItemIds }
        })
        .populate('productId')
        .populate('bundleId');
        
        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({
                message: "No cart items found",
                error: true,
                success: false
            });
        }
        
        const invalidItems = [];
        
        // Check each cart item for validity
        for (const item of cartItems) {
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
                
                // Check if bundle is active
                if (!item.bundleId.isActive) {
                    invalidItems.push({
                        cartItemId: item._id,
                        reason: "Bundle is not active",
                        bundleTitle: item.bundleId.title
                    });
                    continue;
                }
                
                // Check if bundle has stock
                if (item.bundleId.stock !== undefined && item.bundleId.stock < item.quantity) {
                    invalidItems.push({
                        cartItemId: item._id,
                        reason: "Insufficient stock",
                        bundleTitle: item.bundleId.title,
                        requested: item.quantity,
                        available: item.bundleId.stock
                    });
                    continue;
                }
                
                // Check if time-limited bundle is still valid
                if (item.bundleId.isTimeLimited) {
                    const now = new Date();
                    const startDate = new Date(item.bundleId.startDate);
                    const endDate = new Date(item.bundleId.endDate);
                    
                    if (now < startDate || now > endDate) {
                        invalidItems.push({
                            cartItemId: item._id,
                            reason: "Time-limited bundle is no longer available",
                            bundleTitle: item.bundleId.title
                        });
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
                    continue;
                }
                
                // Check if product is active
                if (!item.productId.isActive) {
                    invalidItems.push({
                        cartItemId: item._id,
                        reason: "Product is not active",
                        productName: item.productId.name
                    });
                    continue;
                }
                
                // Check if product has stock
                if (item.productId.stock !== undefined && item.productId.stock < item.quantity) {
                    invalidItems.push({
                        cartItemId: item._id,
                        reason: "Insufficient stock",
                        productName: item.productId.name,
                        requested: item.quantity,
                        available: item.productId.stock
                    });
                    continue;
                }
            } else {
                invalidItems.push({
                    cartItemId: item._id,
                    reason: "Invalid item type or missing product/bundle reference",
                    itemType: item.itemType
                });
            }
        }
        
        if (invalidItems.length > 0) {
            return res.status(400).json({
                message: "Some items in your cart are unavailable for purchase",
                error: true,
                success: false,
                invalidItems: invalidItems
            });
        }
        
        return res.json({
            message: "All items in cart are valid",
            error: false,
            success: true
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