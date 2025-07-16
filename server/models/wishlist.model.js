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
            required: true,
            ref: "product"
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

const WishlistModel = mongoose.model("wishlist", wishlistSchema);

export default WishlistModel;
