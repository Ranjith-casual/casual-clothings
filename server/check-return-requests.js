import mongoose from 'mongoose';
import dotenv from 'dotenv';
import returnProductModel from './models/returnProduct.model.js';
import orderModel from './models/order.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("Please provide MONGODB_URI in .env file");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkReturnRequests = async () => {
    try {
        await connectDB();
        
        console.log('🔍 Checking all return requests...');
        
        // Get all return requests with their orderId status
        const allReturns = await returnProductModel.find({})
            .select('_id orderId userId itemId status createdAt itemDetails')
            .limit(10)
            .sort({ createdAt: -1 });
        
        console.log(`Found ${allReturns.length} return requests (showing latest 10):`);
        
        allReturns.forEach((returnReq, index) => {
            console.log(`\n${index + 1}. Return ID: ${returnReq._id}`);
            console.log(`   Order ID: ${returnReq.orderId} (type: ${typeof returnReq.orderId})`);
            console.log(`   User ID: ${returnReq.userId}`);
            console.log(`   Item ID: ${returnReq.itemId}`);
            console.log(`   Status: ${returnReq.status}`);
            console.log(`   Created: ${returnReq.createdAt}`);
            console.log(`   Item Name: ${returnReq.itemDetails?.name || 'Unknown'}`);
            
            // Check if orderId is null, undefined, or invalid
            if (!returnReq.orderId) {
                console.log(`   ⚠️  PROBLEMATIC: orderId is ${returnReq.orderId}`);
            }
        });
        
        // Also check with population to see if that's causing issues
        console.log('\n🔍 Checking with population...');
        const populatedReturns = await returnProductModel.find({})
            .populate({
                path: 'orderId',
                select: 'orderId orderDate actualDeliveryDate'
            })
            .select('_id orderId userId itemId status')
            .limit(5)
            .sort({ createdAt: -1 });
        
        console.log(`\nPopulated returns (showing latest 5):`);
        populatedReturns.forEach((returnReq, index) => {
            console.log(`\n${index + 1}. Return ID: ${returnReq._id}`);
            console.log(`   Order ID: ${returnReq.orderId} (type: ${typeof returnReq.orderId})`);
            if (returnReq.orderId && typeof returnReq.orderId === 'object') {
                console.log(`   Order Details: ${JSON.stringify(returnReq.orderId, null, 2)}`);
            }
            if (!returnReq.orderId) {
                console.log(`   ⚠️  PROBLEMATIC AFTER POPULATION: orderId is ${returnReq.orderId}`);
            }
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during check:', error);
        process.exit(1);
    }
};

// Run the check
checkReturnRequests();
