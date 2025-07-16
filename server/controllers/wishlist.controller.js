import WishlistModel from "../models/wishlist.model.js";
import UserModel from "../models/users.model.js";

// Add item to wishlist
export const addToWishlistController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        // Check if user has a wishlist
        let wishlist = await WishlistModel.findOne({ userId });

        if (!wishlist) {
            // Create new wishlist if none exists
            wishlist = new WishlistModel({
                userId,
                products: [{ productId }]
            });
            await wishlist.save();
        } else {
            // Check if product already exists in wishlist
            const productExists = wishlist.products.some(item => 
                item.productId.toString() === productId.toString()
            );

            if (productExists) {
                return res.status(200).json({
                    message: "Product already in wishlist",
                    success: true,
                    isInWishlist: true
                });
            }

            // Add product to existing wishlist
            wishlist.products.push({ productId });
            await wishlist.save();
        }

        return res.status(201).json({
            message: "Product added to wishlist",
            success: true,
            error: false,
            data: wishlist
        });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
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
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        // Find user's wishlist and remove the product
        const wishlist = await WishlistModel.findOne({ userId });

        if (!wishlist) {
            return res.status(404).json({
                message: "Wishlist not found",
                success: false,
                error: true
            });
        }

        // Filter out the product
        wishlist.products = wishlist.products.filter(
            item => item.productId.toString() !== productId.toString()
        );

        await wishlist.save();

        return res.status(200).json({
            message: "Product removed from wishlist",
            success: true,
            error: false,
            data: wishlist
        });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
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

        // Find user's wishlist and populate product details
        const wishlist = await WishlistModel.findOne({ userId })
            .populate({
                path: 'products.productId',
                model: 'product',
                select: 'name price discount image description category stock'
            });

        if (!wishlist) {
            // Return empty array if no wishlist exists
            return res.status(200).json({
                message: "No wishlist found",
                success: true,
                data: { products: [] }
            });
        }

        // Filter out any null productId entries that might occur if products were deleted
        const validProducts = wishlist.products.filter(item => item.productId);

        return res.status(200).json({
            message: "Wishlist retrieved successfully",
            success: true,
            error: false,
            data: {
                products: validProducts
            }
        });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
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

        const isInWishlist = wishlist.products.some(
            item => item.productId.toString() === productId.toString()
        );

        return res.status(200).json({
            isInWishlist,
            success: true
        });
    } catch (error) {
        console.error("Error checking wishlist item:", error);
        return res.status(500).json({
            message: "Error checking wishlist item",
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
