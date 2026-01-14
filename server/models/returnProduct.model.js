import mongoose from "mongoose";

const returnProductSchema = mongoose.Schema({
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
    itemId: {
        type: String,
        required: true // This will be the index of the item in the order's items array
    },
    // Product/Bundle details for the return
    itemDetails: {
        itemType: {
            type: String,
            enum: ['product', 'bundle'],
            required: true
        },
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: 'product'
        },
        bundleId: {
            type: mongoose.Schema.ObjectId,
            ref: 'bundle'
        },
        name: String,
        image: String,
        size: String,
        quantity: {
            type: Number,
            required: true
        },
        originalPrice: {
            type: Number,
            required: true
        },
        refundAmount: {
            type: Number,
            required: true // This will be 65% of original price
        }
    },
    returnReason: {
        type: String,
        required: true,
        enum: [
            'DEFECTIVE_PRODUCT',
            'WRONG_SIZE',
            'WRONG_ITEM',
            'QUALITY_ISSUE',
            'NOT_AS_DESCRIBED',
            'DAMAGED_IN_SHIPPING',
            'OTHER'
        ]
    },
    returnDescription: {
        type: String,
        maxlength: 500
    },
    returnImages: [{
        type: String // URLs of images showing the product condition
    }],
    requestDate: {
        type: Date,
        default: Date.now
    },
    eligibilityExpiryDate: {
        type: Date,
        required: true // 1 day after delivery
    },
    status: {
        type: String,
        enum: [
            'REQUESTED',
            'UNDER_REVIEW',
            'APPROVED',
            'REJECTED',
            'PICKUP_SCHEDULED',
            'PICKED_UP',
            'INSPECTED',
            'REFUND_PROCESSED',
            'COMPLETED',
            'CANCELLED'
        ],
        default: 'REQUESTED'
    },
    adminResponse: {
        processedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'users'
        },
        processedDate: {
            type: Date
        },
        adminComments: {
            type: String,
            maxlength: 500
        },
        inspectionNotes: {
            type: String,
            maxlength: 500
        }
    },
    refundDetails: {
        refundId: {
            type: String
        },
        refundMethod: {
            type: String,
            enum: ['ORIGINAL_PAYMENT_METHOD', 'BANK_TRANSFER', 'WALLET_CREDIT'],
            default: 'ORIGINAL_PAYMENT_METHOD'
        },
        refundStatus: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            default: 'PENDING'
        },
        refundDate: {
            type: Date
        },
        actualRefundAmount: {
            type: Number // Might be different if deductions applied
        }
    },
    pickupDetails: {
        pickupAddress: {
            type: mongoose.Schema.ObjectId,
            ref: 'address'
        },
        pickupDate: {
            type: Date
        },
        pickupTimeSlot: {
            type: String
        },
        courierPartner: {
            type: String
        },
        trackingNumber: {
            type: String
        }
    },
    timeline: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }]
}, {
    timestamps: true
});

// Index for efficient queries
returnProductSchema.index({ orderId: 1, userId: 1 });
returnProductSchema.index({ status: 1 });
returnProductSchema.index({ eligibilityExpiryDate: 1 });

const returnProductModel = mongoose.model('returnProduct', returnProductSchema);

export default returnProductModel;
