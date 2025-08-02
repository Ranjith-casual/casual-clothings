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

const checkOrdersExistence = async () => {
    try {
        await connectDB();
        
        console.log('🔍 Checking if referenced orders exist...');
        
        // Get return requests with their orderIds
        const returns = await returnProductModel.find({})
            .select('_id orderId itemDetails.name')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${returns.length} return requests. Checking their orders...`);
        
        for (const returnReq of returns) {
            console.log(`\nReturn ${returnReq._id}:`);
            console.log(`  Item: ${returnReq.itemDetails?.name}`);
            console.log(`  Points to orderId: ${returnReq.orderId}`);
            
            // Check if this order exists
            const order = await orderModel.findById(returnReq.orderId);
            
            if (order) {
                console.log(`  ✅ Order exists: ${order.orderId} (${order.orderStatus})`);
            } else {
                console.log(`  ❌ Order does NOT exist! This is the problem.`);
                
                // Try to find any orders for this user
                const userOrders = await orderModel.find({})
                    .select('_id orderId orderStatus userId')
                    .limit(5)
                    .sort({ createdAt: -1 });
                
                console.log(`  📋 Available orders in database:`);
                userOrders.forEach(order => {
                    console.log(`    - ${order._id} (${order.orderId}) - ${order.orderStatus}`);
                });
            }
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during check:', error);
        process.exit(1);
    }
};

// Run the check
checkOrdersExistence();
