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
        console.log("DB Name: " + mongoose.connection.name);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const fixNullOrderIds = async () => {
    try {
        await connectDB();
        
        console.log('🔍 Checking for return requests with null orderId...');
        
        // Find all return requests with null orderId
        const nullOrderIdReturns = await returnProductModel.find({ 
            orderId: null 
        });
        
        console.log(`Found ${nullOrderIdReturns.length} return requests with null orderId`);
        
        if (nullOrderIdReturns.length === 0) {
            console.log('✅ No null orderId issues found!');
            process.exit(0);
        }
        
        // Log details of problematic records
        console.log('\n📋 Problematic return requests:');
        nullOrderIdReturns.forEach((returnReq, index) => {
            console.log(`${index + 1}. Return ID: ${returnReq._id}`);
            console.log(`   User ID: ${returnReq.userId}`);
            console.log(`   Item ID: ${returnReq.itemId}`);
            console.log(`   Status: ${returnReq.status}`);
            console.log(`   Created: ${returnReq.createdAt}`);
            console.log(`   Item Name: ${returnReq.itemDetails?.name || 'Unknown'}`);
            console.log('   ---');
        });
        
        // Option 1: Try to find matching orders by userId and itemId
        console.log('\n🔧 Attempting to fix by finding matching orders...');
        let fixedCount = 0;
        
        for (const returnReq of nullOrderIdReturns) {
            if (returnReq.userId && returnReq.itemId) {
                // Find orders for this user that contain this item
                const matchingOrders = await orderModel.find({
                    userId: returnReq.userId,
                    'items._id': returnReq.itemId
                });
                
                if (matchingOrders.length === 1) {
                    // Perfect match - update the return request
                    returnReq.orderId = matchingOrders[0]._id;
                    await returnReq.save();
                    console.log(`✅ Fixed return ${returnReq._id} - linked to order ${matchingOrders[0]._id}`);
                    fixedCount++;
                } else if (matchingOrders.length > 1) {
                    // Multiple matches - use the most recent delivered order
                    const deliveredOrder = matchingOrders.find(order => order.orderStatus === 'DELIVERED');
                    if (deliveredOrder) {
                        returnReq.orderId = deliveredOrder._id;
                        await returnReq.save();
                        console.log(`✅ Fixed return ${returnReq._id} - linked to delivered order ${deliveredOrder._id}`);
                        fixedCount++;
                    } else {
                        console.log(`⚠️  Multiple orders found for return ${returnReq._id}, but none delivered`);
                    }
                } else {
                    console.log(`❌ No matching order found for return ${returnReq._id}`);
                }
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total problematic returns: ${nullOrderIdReturns.length}`);
        console.log(`   Successfully fixed: ${fixedCount}`);
        console.log(`   Still need manual attention: ${nullOrderIdReturns.length - fixedCount}`);
        
        // If there are still unfixed returns, offer to delete them
        const stillBrokenReturns = await returnProductModel.find({ orderId: null });
        
        if (stillBrokenReturns.length > 0) {
            console.log(`\n⚠️  ${stillBrokenReturns.length} return requests still have null orderId`);
            console.log('These may be orphaned records that should be deleted.');
            console.log('Review them manually or run this script with --delete flag to remove them.');
            
            // Check if delete flag is passed
            if (process.argv.includes('--delete')) {
                console.log('\n🗑️  Deleting orphaned return requests...');
                const deleteResult = await returnProductModel.deleteMany({ orderId: null });
                console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned return requests`);
            }
        }
        
        console.log('\n✅ Cleanup complete!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
};

// Run the fix
fixNullOrderIds();
