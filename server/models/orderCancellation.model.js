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
        },
        // Enhanced pricing information from OrderCancellationModal
        totalPrice: Number, // Total price customer paid for this item (discounted)
        itemPrice: Number,  // Unit price customer paid (discounted)
        originalPrice: Number, // Original retail price
        productName: String, // Product name for reference
        pricingBreakdown: {
            unitPrice: Number,           // Original unit price
            unitCustomerPaid: Number,    // Discounted unit price customer paid
            totalCustomerPaid: Number,   // Total amount customer paid for this item
            originalPrice: Number,       // Original retail price
            discountPercentage: Number,  // Discount percentage applied
            refundAmount: Number         // Calculated refund amount for this item
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
    // Enhanced pricing information from OrderCancellationModal
    pricingInformation: {
        totalAmountCustomerPaid: Number,     // Total discounted amount customer actually paid
        totalOriginalRetailPrice: Number,    // Total original retail price
        totalCustomerSavings: Number,        // Total savings from discounts
        calculatedRefundAmount: Number,      // Calculated refund amount
        refundPercentage: Number,           // Refund percentage used
        note: String                        // Additional pricing notes
    },
    // For partial cancellations - total values
    totalRefundAmount: Number,  // Total refund amount for partial cancellations
    totalItemValue: Number,     // Total value of items being cancelled
    // Delivery information at the time of cancellation
    deliveryInfo: {
        estimatedDeliveryDate: Date,
        actualDeliveryDate: Date,
        deliveryNotes: String,
        deliveryCharge: {
            type: Number,
            default: 0
        },
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
        },
        // Enhanced refund data for refund management integration
        enhancedRefundData: {
            finalRefundAmount: Number,
            totalItemValue: Number,
            customerPaidAmount: Number,
            refundPercentage: Number,
            cancellationType: {
                type: String,
                enum: ['FULL_ORDER', 'PARTIAL_ITEMS']
            },
            basedOnDiscountedPricing: {
                type: Boolean,
                default: false
            },
            pricingBreakdown: mongoose.Schema.Types.Mixed, // Flexible object for pricing information
            processedAt: Date,
            processedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
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
