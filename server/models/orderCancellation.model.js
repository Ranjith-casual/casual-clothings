import mongoose from "mongoose";

const orderCancellationSchema = mongoose.Schema({
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        required: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'users',
        required: true
    },
    // For partial cancellations - specify which items to cancel
    cancellationType: {
        type: String,
        enum: ['FULL_ORDER', 'PARTIAL_ITEMS'],
        default: 'FULL_ORDER'
    },
    itemsToCancel: [{
        itemId: {
            type: mongoose.Schema.ObjectId,
            required: function() { return this.parent().cancellationType === 'PARTIAL_ITEMS'; }
        },
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: 'product'
        },
        bundleId: {
            type: mongoose.Schema.ObjectId,
            ref: 'bundle'
        },
        itemType: {
            type: String,
            enum: ['product', 'bundle']
        },
        quantity: {
            type: Number,
            default: 1
        },
        size: String,
        itemTotal: Number,
        refundAmount: {
            type: Number,
            default: 0
        }
    }],
    requestDate: {
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'Changed mind',
            'Found better price',
            'Wrong item ordered',
            'Delivery delay',
            'Product defect expected',
            'Financial constraints',
            'Duplicate order',
            'Other'
        ]
    },
    additionalReason: {
        type: String,
        maxlength: 500
    },
    // Delivery information at the time of cancellation
    deliveryInfo: {
        estimatedDeliveryDate: Date,
        actualDeliveryDate: Date,
        deliveryNotes: String,
        wasPastDeliveryDate: {
            type: Boolean,
            default: false
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'],
        default: 'PENDING'
    },
    adminResponse: {
        processedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'users'
        },
        processedDate: Date,
        adminComments: String,
        refundAmount: {
            type: Number,
            default: 0
        },
        refundPercentage: {
            type: Number,
            default: 75 // 
        }
    },
    refundDetails: {
        refundId: String,
        refundDate: Date,
        refundMethod: {
            type: String,
            enum: ['ORIGINAL_PAYMENT_METHOD', 'BANK_TRANSFER', 'WALLET_CREDIT'],
            default: 'ORIGINAL_PAYMENT_METHOD'
        },
        refundStatus: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            default: 'PENDING'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
orderCancellationSchema.index({ orderId: 1 });
orderCancellationSchema.index({ userId: 1 });
orderCancellationSchema.index({ status: 1 });
orderCancellationSchema.index({ requestDate: -1 });

const orderCancellationModel = mongoose.model('orderCancellation', orderCancellationSchema);

export default orderCancellationModel;
