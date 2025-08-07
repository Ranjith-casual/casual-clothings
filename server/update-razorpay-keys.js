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

// Update Razorpay credentials
const updateRazorpayCredentials = async () => {
    try {
        await connectDB();
        
        // Get your Razorpay credentials from the command line arguments or prompt
        const keyId = process.argv[2] || process.env.RAZORPAY_KEY_ID;
        const keySecret = process.argv[3] || process.env.RAZORPAY_KEY_SECRET;
        const webhookSecret = process.argv[4] || process.env.RAZORPAY_WEBHOOK_SECRET;
        
        if (!keyId || !keySecret) {
            console.log('\n🔑 How to use this script:');
            console.log('1. Add credentials via command line:');
            console.log('   node update-razorpay-keys.js <key_id> <key_secret> [webhook_secret]');
            console.log('\n2. Or add them to .env file and run:');
            console.log('   node update-razorpay-keys.js');
            console.log('\n📝 Example:');
            console.log('   node update-razorpay-keys.js rzp_test_1234567890 your_secret_key webhook_secret');
            console.log('\n⚠️  You can get these credentials from: https://dashboard.razorpay.com/app/website-app-settings/api-keys');
            process.exit(1);
        }
        
        // Update or create payment settings
        const settings = await PaymentSettingsModel.getSettings();
        
        settings.razorpay.enabled = true;
        settings.razorpay.keyId = keyId;
        settings.razorpay.keySecret = keySecret;
        if (webhookSecret) {
            settings.razorpay.webhookSecret = webhookSecret;
        }
        
        await PaymentSettingsModel.updateSettings(settings);
        
        console.log('✅ Razorpay credentials updated successfully!');
        console.log('📊 Current settings:');
        console.log(`   Key ID: ${keyId}`);
        console.log(`   Key Secret: ${'*'.repeat(keySecret.length)}`);
        console.log(`   Webhook Secret: ${webhookSecret ? '*'.repeat(webhookSecret.length) : 'Not set'}`);
        console.log(`   Status: ${settings.razorpay.enabled ? '🟢 Enabled' : '🔴 Disabled'}`);
        
        console.log('\n🎉 Razorpay is now ready to use in your application!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating Razorpay credentials:', error);
        process.exit(1);
    }
};

updateRazorpayCredentials();
