import mongoose from 'mongoose';
import PaymentSettingsModel from './models/paymentSettings.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Setup initial payment settings
const setupPaymentSettings = async () => {
    try {
        await connectDB();
        
        // Check if settings already exist
        const existingSettings = await PaymentSettingsModel.findOne();
        
        if (existingSettings) {
            console.log('Payment settings already exist. Updating Razorpay to enabled...');
            
            // Enable Razorpay if it's not already enabled
            existingSettings.razorpay.enabled = true;
            
            // Add your Razorpay credentials here
            existingSettings.razorpay.keyId = process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id_here';
            existingSettings.razorpay.keySecret = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret_here';
            
            await existingSettings.save();
            console.log('Payment settings updated successfully');
        } else {
            console.log('Creating initial payment settings...');
            
            const initialSettings = {
                razorpay: {
                    enabled: true,
                    keyId: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id_here',
                    keySecret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret_here',
                    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here'
                },
                cod: {
                    enabled: true,
                    minimumAmount: 0,
                    maximumAmount: 50000
                },
                general: {
                    defaultPaymentMethod: 'razorpay',
                    autoRefundEnabled: false,
                    paymentTimeout: 15
                }
            };
            
            const settings = new PaymentSettingsModel(initialSettings);
            await settings.save();
            console.log('Initial payment settings created successfully');
        }
        
        // Show current settings
        const currentSettings = await PaymentSettingsModel.getSettings();
        console.log('\nCurrent payment settings:');
        console.log('Razorpay enabled:', currentSettings.razorpay.enabled);
        console.log('COD enabled:', currentSettings.cod.enabled);
        console.log('Currency:', currentSettings.general.currency);
        
        process.exit(0);
    } catch (error) {
        console.error('Error setting up payment settings:', error);
        process.exit(1);
    }
};

setupPaymentSettings();
