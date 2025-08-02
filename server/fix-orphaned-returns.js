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

const fixOrphanedReturnRequests = async () => {
    try {
        await connectDB();
        
        console.log('🔧 Fixing orphaned return requests...');
        
        // Get all return requests
        const returns = await returnProductModel.find({})
            .select('_id orderId userId itemDetails createdAt');
        
        console.log(`Found ${returns.length} return requests to check...`);
        
        const orphanedReturns = [];
        
        // Check each return request
        for (const returnReq of returns) {
            const order = await orderModel.findById(returnReq.orderId);
            if (!order) {
                orphanedReturns.push(returnReq);
            }
        }
        
        console.log(`Found ${orphanedReturns.length} orphaned return requests`);
        
        if (orphanedReturns.length === 0) {
            console.log('✅ No orphaned return requests found!');
            process.exit(0);
        }
        
        // List the orphaned returns
        console.log('\n📋 Orphaned return requests:');
        orphanedReturns.forEach((returnReq, index) => {
            console.log(`${index + 1}. Return ID: ${returnReq._id}`);
            console.log(`   Item: ${returnReq.itemDetails?.name || 'Unknown'}`);
            console.log(`   User ID: ${returnReq.userId}`);
            console.log(`   Missing Order ID: ${returnReq.orderId}`);
            console.log(`   Created: ${returnReq.createdAt}`);
            console.log('   ---');
        });
        
        // Check if --delete flag is passed
        if (process.argv.includes('--delete')) {
            console.log('\n🗑️  Deleting orphaned return requests...');
            
            const orphanedIds = orphanedReturns.map(ret => ret._id);
            const deleteResult = await returnProductModel.deleteMany({ 
                _id: { $in: orphanedIds } 
            });
            
            console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned return requests`);
            
            // Verify deletion
            const remainingReturns = await returnProductModel.find({});
            console.log(`📊 Remaining return requests: ${remainingReturns.length}`);
            
        } else {
            console.log('\n💡 To delete these orphaned return requests, run:');
            console.log('   node fix-orphaned-returns.js --delete');
            console.log('\n⚠️  WARNING: This will permanently delete the return requests!');
            console.log('   Make sure you want to do this before running with --delete flag.');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during fix:', error);
        process.exit(1);
    }
};

// Run the fix
fixOrphanedReturnRequests();
