import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    userId : {
        type: mongoose.Schema.ObjectId,
        ref : 'users',
        required: true
    },
    orderId : {
        type: String,
        required: true,
        unique: true
    },
    // Updated to support multiple items in single order (both products and bundles)
    items: [{
        // For products
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: 'product',
            required: function() { return this.itemType === 'product'; }
        },
        productDetails: {
            name: String,
            image: Array,
            price: Number,
            size: String  // Add size to product details
        },
        size: {
            type: String,
            enum: ['XS', 'S', 'M', 'L', 'XL'],
            required: function() { return this.itemType === 'product'; }
        },
        // For bundles
        bundleId: {
            type: mongoose.Schema.ObjectId,
            ref: 'bundle', // Fixed: should be 'bundle' not 'bundles'
            required: function() { return this.itemType === 'bundle'; }
        },
        bundleDetails: {
            title: String,
            image: String,
            bundlePrice: Number
        },
        // Item type to distinguish between product and bundle
        itemType: {
            type: String,
            enum: ['product', 'bundle'],
            default: 'product'
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        itemTotal: {
            type: Number,
            required: true
        }
    }],
    orderDate: {
        type: Date,
        default: Date.now
    },
    totalQuantity: {
        type: Number,
        required: true
    },
    paymentId: {
        type: String,
        default: ""
    },
    paymentStatus: {
        type: String,
        default: ""
    },
    paymentMethod: {
        type: String,
        default: "Online Payment"
    },
    orderStatus: {
        type: String,
        default: "ORDER PLACED"
    },
    deliveryAddress: {
        type: mongoose.Schema.ObjectId,
        ref: 'address'
    },
    // Delivery tracking fields
    estimatedDeliveryDate: {
        type: Date
    },
    actualDeliveryDate: {
        type: Date
    },
    deliveryDistance: {
        type: Number,
        default: 0
    },
    deliveryDays: {
        type: Number,
        default: 0
    },
    deliveryNotes: {
        type: String,
        default: ""
    },
    subTotalAmt: {
        type: Number,
        default: 0
    },
    totalAmt: {
        type: Number,
        default: 0
    },
    refundDetails: {
        refundId: {
            type: String
        },
        refundAmount: {
            type: Number
        },
        refundPercentage: {
            type: Number
        },
        refundDate: {
            type: Date
        },
        retainedAmount: {
            type: Number
        }
    }
}, {
    timestamps: true
});

const orderModel = mongoose.model('order', orderSchema);

export default orderModel;