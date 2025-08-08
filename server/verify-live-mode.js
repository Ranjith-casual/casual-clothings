import PaymentSettingsModel from './models/paymentSettings.model.js';
import mongoose from 'mongoose';
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

// Verify live mode configuration
const verifyLiveMode = async () => {
    try {
        await connectDB();
        
        console.log('🔍 Verifying Razorpay Live Mode Configuration...\n');
        
        // Get settings from database
        const settings = await PaymentSettingsModel.getSettings();
        
        console.log('📊 Current Configuration:');
        console.log('========================');
        console.log(`🔑 Key ID: ${settings.razorpay.keyId}`);
        console.log(`🔐 Key Secret: ${'*'.repeat(settings.razorpay.keySecret.length)}`);
        console.log(`🎣 Webhook Secret: ${settings.razorpay.webhookSecret ? 'Configured' : 'Not Set'}`);
        console.log(`🟢 Status: ${settings.razorpay.enabled ? 'Enabled' : 'Disabled'}`);
        
        // Verify live mode
        const isLiveMode = settings.razorpay.keyId.startsWith('rzp_live_');
        const isTestMode = settings.razorpay.keyId.startsWith('rzp_test_');
        
        console.log('\n🎯 Mode Detection:');
        console.log('==================');
        if (isLiveMode) {
            console.log('✅ LIVE MODE - Ready for production!');
            console.log('⚠️  Make sure to:');
            console.log('   • Update webhook URL to production domain');
            console.log('   • Enable HTTPS on your server');
            console.log('   • Complete KYC verification');
            console.log('   • Test with small amounts first');
        } else if (isTestMode) {
            console.log('🧪 TEST MODE - For development only');
        } else {
            console.log('❌ UNKNOWN MODE - Invalid key format');
        }
        
        // Environment verification
        console.log('\n🌐 Environment Check:');
        console.log('=====================');
        console.log(`Frontend URL: ${process.env.FRONT_URL}`);
        console.log(`Admin Email: ${process.env.ADMIN_EMAIL}`);
        
        const frontendUrl = process.env.FRONT_URL;
        if (isLiveMode && frontendUrl && frontendUrl.includes('localhost')) {
            console.log('⚠️  WARNING: Live mode detected but frontend URL is localhost');
            console.log('   Update FRONT_URL to your production domain');
        }
        
        console.log('\n🎉 Verification Complete!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying configuration:', error);
        process.exit(1);
    }
};

verifyLiveMode();
