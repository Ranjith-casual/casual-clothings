import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema({
    productId : {
        type:mongoose.Schema.ObjectId,
        ref: 'product'
    },
    bundleId : {
        type:mongoose.Schema.ObjectId,
        ref: 'bundle'
    },
    quantity : {
        type:Number,
        default : 1,
    },
    // Add size field for products
    size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL'],
        // Only required if the item is a product
        required: function() { return this.itemType === 'product'; }
    },
    userId : {
        type: mongoose.Schema.ObjectId,
        ref : 'users'
    },
    itemType: {
        type: String,
        enum: ['product', 'bundle'],
        required: true,
        default: 'product'
    },
    // Store the price adjusted for size
    sizeAdjustedPrice: {
        type: Number
    }
},{
    timestamps:true
})
const CartProductModel = mongoose.model('cartProduct',cartProductSchema)
export default CartProductModel;