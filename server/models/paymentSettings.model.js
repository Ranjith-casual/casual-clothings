import mongoose from "mongoose";

const paymentSettingsSchema = new mongoose.Schema({
    razorpay: {
        enabled: {
            type: Boolean,
            default: false
        },
        keyId: {
            type: String,
            default: ''
        },
        keySecret: {
            type: String,
            default: ''
        },
        webhookSecret: {
            type: String,
            default: ''
        }
    },
    cod: {
        enabled: {
            type: Boolean,
            default: true
        },
        minimumAmount: {
            type: Number,
            default: 0
        },
        maximumAmount: {
            type: Number,
            default: 50000
        }
    },
    general: {
        defaultPaymentMethod: {
            type: String,
            enum: ['cod', 'razorpay'],
            default: 'cod'
        },
        autoRefundEnabled: {
            type: Boolean,
            default: false
        },
        paymentTimeout: {
            type: Number,
            default: 15 // minutes
        }
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists
paymentSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

paymentSettingsSchema.statics.updateSettings = async function(updateData) {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create(updateData);
    } else {
        Object.assign(settings, updateData);
        await settings.save();
    }
    return settings;
};

const PaymentSettingsModel = mongoose.model('PaymentSettings', paymentSettingsSchema);

export default PaymentSettingsModel;
