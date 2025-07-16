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
    userId : {
        type: mongoose.Schema.ObjectId,
        ref : 'users'
    },
    itemType: {
        type: String,
        enum: ['product', 'bundle'],
        required: true,
        default: 'product'
    }
},{
    timestamps:true
})
const CartProductModel = mongoose.model('cartProduct',cartProductSchema)
export default CartProductModel;