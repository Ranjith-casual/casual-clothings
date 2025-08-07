import Razorpay from 'razorpay';
import PaymentSettingsModel from '../models/paymentSettings.model.js';

class RazorpayService {
    constructor() {
        this.razorpayInstance = null;
    }

    async initializeRazorpay() {
        try {
            const settings = await PaymentSettingsModel.getSettings();
            
            if (!settings.razorpay.enabled || !settings.razorpay.keyId || !settings.razorpay.keySecret) {
                throw new Error('Razorpay is not properly configured');
            }

            this.razorpayInstance = new Razorpay({
                key_id: settings.razorpay.keyId,
                key_secret: settings.razorpay.keySecret,
            });

            return this.razorpayInstance;
        } catch (error) {
            console.error('Error initializing Razorpay:', error);
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            await this.initializeRazorpay();

            const options = {
                amount: Math.round(orderData.amount * 100), // Convert to paisa
                currency: 'INR',
                receipt: orderData.receipt,
                notes: orderData.notes || {},
            };

            const order = await this.razorpayInstance.orders.create(options);
            return order;
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw error;
        }
    }

    async verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        try {
            const settings = await PaymentSettingsModel.getSettings();
            
            if (!settings.razorpay.keySecret) {
                throw new Error('Razorpay key secret not found');
            }

            const crypto = await import('crypto');
            
            const expectedSignature = crypto.createHmac('sha256', settings.razorpay.keySecret)
                .update(razorpayOrderId + '|' + razorpayPaymentId)
                .digest('hex');

            return expectedSignature === razorpaySignature;
        } catch (error) {
            console.error('Error verifying payment signature:', error);
            throw error;
        }
    }

    async getPaymentDetails(paymentId) {
        try {
            await this.initializeRazorpay();
            const payment = await this.razorpayInstance.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            console.error('Error fetching payment details:', error);
            throw error;
        }
    }

    async createRefund(paymentId, amount, notes = {}) {
        try {
            await this.initializeRazorpay();
            
            const refundData = {
                amount: Math.round(amount * 100), // Convert to paisa
                notes: notes
            };

            const refund = await this.razorpayInstance.payments.refund(paymentId, refundData);
            return refund;
        } catch (error) {
            console.error('Error creating refund:', error);
            throw error;
        }
    }

    async getAllRefunds(paymentId) {
        try {
            await this.initializeRazorpay();
            const refunds = await this.razorpayInstance.payments.fetchMultipleRefund(paymentId);
            return refunds;
        } catch (error) {
            console.error('Error fetching refunds:', error);
            throw error;
        }
    }

    // Webhook signature verification
    async verifyWebhookSignature(webhookBody, webhookSignature) {
        try {
            const settings = await PaymentSettingsModel.getSettings();
            
            if (!settings.razorpay.webhookSecret) {
                throw new Error('Webhook secret not configured');
            }

            const crypto = await import('crypto');
            
            const expectedSignature = crypto.createHmac('sha256', settings.razorpay.webhookSecret)
                .update(webhookBody)
                .digest('hex');

            return expectedSignature === webhookSignature;
        } catch (error) {
            console.error('Error verifying webhook signature:', error);
            throw error;
        }
    }
}

export default new RazorpayService();
