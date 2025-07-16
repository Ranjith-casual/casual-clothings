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
            default: 7 // 7% refund by default
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
