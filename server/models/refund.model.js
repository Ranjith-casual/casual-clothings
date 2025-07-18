import mongoose from "mongoose";

const refundSchema = mongoose.Schema({
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'users',
        required: true
    },
    refundId: {
        type: String,
        unique: true
    },
    refundAmount: {
        type: Number,
        required: true
    },
    originalAmount: {
        type: Number,
        required: true
    },
    refundReason: {
        type: String,
        default: 'order_cancelled'
    },
    refundStatus: {
        type: String,
        enum: [
            'pending',
            'processing',
            'completed',
            'failed'
        ],
        default: 'pending'
    },
    refundMethod: {
        type: String,
        enum: [
            'original_payment_method',
            'bank_transfer',
            'wallet'
        ],
        default: 'original_payment_method'
    },
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
        bankName: String
    },
    refundRequestDate: {
        type: Date,
        default: Date.now
    },
    refundCompletedDate: {
        type: Date
    },
    adminNotes: {
        type: String,
        default: ""
    },
    refundTransactionId: {
        type: String,
        default: ""
    },
    processedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'users'
    }
}, {
    timestamps: true
});

// Generate unique refund ID before saving
refundSchema.pre('save', async function(next) {
    if (this.isNew && !this.refundId) {
        const count = await mongoose.model('refund').countDocuments();
        this.refundId = `REF${Date.now()}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

const refundModel = mongoose.model('refund', refundSchema);

export default refundModel;
