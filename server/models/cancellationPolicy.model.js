import mongoose from "mongoose";

const cancellationPolicySchema = mongoose.Schema({
    policyName: {
        type: String,
        default: 'Order Cancellation Policy'
    },
    refundPercentage: {
        type: Number,
        default: 7,
        min: 0,
        max: 100
    },
    responseTimeHours: {
        type: Number,
        default: 48 // 2 days = 48 hours
    },
    allowedReasons: [{
        reason: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    timeBasedRules: [{
        description: String,
        timeFrameHours: Number, // Time after order placement
        refundPercentage: Number,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    orderStatusRules: [{
        orderStatus: {
            type: String,
            enum: ['ORDER PLACED', 'PROCESSING', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED']
        },
        canCancel: Boolean,
        refundPercentage: Number
    }],
    paymentMethodRules: [{
        paymentMethod: String,
        refundMethod: String,
        processingDays: Number
    }],
    terms: [{
        title: String,
        content: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'users'
    }
}, {
    timestamps: true
});

// Ensure only one active policy at a time
cancellationPolicySchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

const cancellationPolicyModel = mongoose.model('cancellationPolicy', cancellationPolicySchema);

export default cancellationPolicyModel;
