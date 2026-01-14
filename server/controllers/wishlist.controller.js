import WishlistModel from "../models/wishlist.model.js";
import UserModel from "../models/users.model.js";
import Logger from "../utils/logger.js";

// Add item to wishlist
export const addToWishlistController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, bundleId } = req.body;

        if (!productId && !bundleId) {
            return res.status(400).json({
                message: "Either Product ID or Bundle ID is required",
                success: false,
                error: true
            });
        }

        if (productId && bundleId) {
            return res.status(400).json({
                message: "Cannot add both product and bundle at the same time",
                success: false,
                error: true
            });
        }

        // Check if user has a wishlist
        let wishlist = await WishlistModel.findOne({ userId });

        if (!wishlist) {
            // Create new wishlist if none exists
            const newItem = productId ? { productId } : { bundleId };
            wishlist = new WishlistModel({
                userId,
                products: [newItem]
            });
            await wishlist.save();
        } else {
            // Check if item already exists in wishlist
            const itemExists = wishlist.products.some(item => {
                if (productId) {
                    return item.productId && item.productId.toString() === productId.toString();
                } else {
                    return item.bundleId && item.bundleId.toString() === bundleId.toString();
                }
            });

            if (itemExists) {
                return res.status(200).json({
                    message: productId ? "Product already in wishlist" : "Bundle already in wishlist",
                    success: true,
                    isInWishlist: true
                });
            }

            // Add item to existing wishlist
            const newItem = productId ? { productId } : { bundleId };
            wishlist.products.push(newItem);
            await wishlist.save();
        }

        return res.status(201).json({
            message: productId ? "Product added to wishlist" : "Bundle added to wishlist",
            success: true,
            error: false,
            data: wishlist
        });
    } catch (error) {
        Logger.error("Error adding to wishlist", { error: error.message, userId: req.userId });
        return res.status(500).json({
            message: "Error adding item to wishlist",
            success: false,
            error: true
        });
    }
};

// Remove item from wishlist
export const removeFromWishlistController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, bundleId } = req.body;

        if (!productId && !bundleId) {
            return res.status(400).json({
                message: "Either Product ID or Bundle ID is required",
                success: false,
                error: true
            });
        }

        // Find user's wishlist and remove the item
        const wishlist = await WishlistModel.findOne({ userId });

        if (!wishlist) {
            return res.status(404).json({
                message: "Wishlist not found",
                success: false,
                error: true
            });
        }

        // Filter out the item
        wishlist.products = wishlist.products.filter(item => {
            if (productId) {
                return !item.productId || item.productId.toString() !== productId.toString();
            } else {
                return !item.bundleId || item.bundleId.toString() !== bundleId.toString();
            }
        });

        await wishlist.save();

        return res.status(200).json({
            message: productId ? "Product removed from wishlist" : "Bundle removed from wishlist",
            success: true,
            error: false,
            data: wishlist
        });
    } catch (error) {
        Logger.error("Error removing from wishlist", { error: error.message, userId: req.userId });
        return res.status(500).json({
            message: "Error removing item from wishlist",
            success: false,
            error: true
        });
    }
};

// Get user's wishlist with populated product details
export const getWishlistController = async (req, res) => {
    try {
        const userId = req.userId;

        // Find user's wishlist and populate both product and bundle details
        const wishlist = await WishlistModel.findOne({ userId })
            .populate({
                path: 'products.productId',
                model: 'product',
                select: 'name price discount image description category stock'
            })
            .populate({
                path: 'products.bundleId',
                model: 'bundle',
                select: 'title bundlePrice originalPrice images description items stock discount tag'
            });

        if (!wishlist) {
            // Return empty array if no wishlist exists
            return res.status(200).json({
                message: "No wishlist found",
                success: true,
                data: []
            });
        }

        // Filter out any null entries and format the response
        const validItems = wishlist.products.filter(item => item.productId || item.bundleId);

        return res.status(200).json({
            message: "Wishlist retrieved successfully",
            success: true,
            error: false,
            data: validItems
        });
    } catch (error) {
        Logger.error("Error fetching wishlist", { error: error.message, userId: req.userId });
        return res.status(500).json({
            message: "Error retrieving wishlist",
            success: false,
            error: true
        });
    }
};

// Check if a product is in user's wishlist
export const checkWishlistItemController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.params;

        Logger.debug("Checking wishlist item", { userId, productId });

        if (!userId) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
                error: true
            });
        }

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        // Find user's wishlist and check if product exists
        const wishlist = await WishlistModel.findOne({ userId });

        if (!wishlist) {
            return res.status(200).json({
                isInWishlist: false,
                success: true
            });
        }

        // Check if the item exists in wishlist (either as product or bundle)
        const isInWishlist = wishlist.products.some(item => {
            // Check if it's a product
            if (item.productId && item.productId.toString() === productId.toString()) {
                return true;
            }
            // Check if it's a bundle
            if (item.bundleId && item.bundleId.toString() === productId.toString()) {
                return true;
            }
            return false;
        });

        return res.status(200).json({
            isInWishlist,
            success: true
        });
    } catch (error) {
        Logger.error("Error checking wishlist item", { error: error.message, userId: req.userId });
        return res.status(500).json({
            message: "Error checking wishlist item",
            success: false,
            success: false,
            error: true
        });
    }
};

// Clear entire wishlist
export const clearWishlistController = async (req, res) => {
    try {
        const userId = req.userId;

        // Find user's wishlist and clear all products
        const wishlist = await WishlistModel.findOne({ userId });

        if (!wishlist) {
            return res.status(404).json({
                message: "Wishlist not found",
                success: false,
                error: true
            });
        }

        wishlist.products = [];
        await wishlist.save();

        return res.status(200).json({
            message: "Wishlist cleared successfully",
            success: true,
            error: false
        });
    } catch (error) {
        console.error("Error clearing wishlist:", error);
        return res.status(500).json({
            message: "Error clearing wishlist",
            success: false,
            error: true
        });
    }
};
