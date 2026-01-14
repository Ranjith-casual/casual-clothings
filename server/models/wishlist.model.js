import mongoose from "mongoose";

const wishlistSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "users"
    },
    products: [{
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: "product"
        },
        bundleId: {
            type: mongoose.Schema.ObjectId,
            ref: "bundles"
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add validation to ensure either productId or bundleId is provided
wishlistSchema.pre('save', function(next) {
    for (let product of this.products) {
        if (!product.productId && !product.bundleId) {
            return next(new Error('Either productId or bundleId must be provided'));
        }
        if (product.productId && product.bundleId) {
            return next(new Error('Cannot have both productId and bundleId for the same item'));
        }
    }
    next();
});

const WishlistModel = mongoose.model("wishlist", wishlistSchema);

export default WishlistModel;
