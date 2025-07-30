// Test script to create sample return requests with admin comments
// Run with: node test-admin-comments.js

import mongoose from 'mongoose';
import orderModel from './models/order.model.js';
import returnProductModel from './models/returnProduct.model.js';
import userModel from './models/users.model.js';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/darkcart');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const createTestData = async () => {
    try {
        // Check if we already have test data
        const existingReturns = await returnProductModel.countDocuments();
        if (existingReturns > 0) {
            console.log('✅ Test data already exists');
            return;
        }

        // Create a test user if it doesn't exist
        let testUser = await userModel.findOne({ email: 'testuser@example.com' });
        if (!testUser) {
            testUser = new userModel({
                name: 'Test User',
                email: 'testuser@example.com',
                mobile: 1234567890,
                password: 'hashedpassword'
            });
            await testUser.save();
            console.log('✅ Created test user');
        }

        // Create a test admin user
        let testAdmin = await userModel.findOne({ email: 'admin@example.com' });
        if (!testAdmin) {
            testAdmin = new userModel({
                name: 'Admin User',
                email: 'admin@example.com',
                mobile: 1234567891,
                password: 'hashedpassword'
            });
            await testAdmin.save();
            console.log('✅ Created test admin');
        }

        // Create a simple product for reference
        let productId = new mongoose.Types.ObjectId();

        // Create a test order
        const testOrder = new orderModel({
            orderId: 'TEST001',
            userId: testUser._id,
            orderStatus: 'DELIVERED',
            orderDate: new Date(),
            actualDeliveryDate: new Date(),
            items: [
                {
                    productId: productId,
                    itemType: 'product',
                    productDetails: {
                        name: 'Black Tshirt',
                        image: ['test-image.jpg'],
                        price: 450,
                        size: 'XS'
                    },
                    size: 'XS',
                    quantity: 1,
                    unitPrice: 450,
                    sizeAdjustedPrice: 450,
                    itemTotal: 450,
                    status: 'Active'
                }
            ],
            totalQuantity: 1,
            totalAmount: 450,
            deliveryCharges: 0,
            totalPayableAmount: 450,
            paymentStatus: 'COMPLETED',
            paymentMethod: 'ONLINE'
        });
        await testOrder.save();
        console.log('✅ Created test order');

        // Create return requests with admin comments
        const returnRequest1 = new returnProductModel({
            orderId: testOrder._id,
            userId: testUser._id,
            itemId: testOrder.items[0]._id.toString(),
            itemDetails: {
                itemType: 'product',
                name: 'Black Tshirt',
                size: 'XS',
                quantity: 1,
                originalPrice: 450,
                refundAmount: 292 // 65% of original price
            },
            returnReason: 'QUALITY_ISSUE',
            returnDescription: 'Quality issue with the product',
            eligibilityExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'REQUESTED',
            timeline: [
                {
                    status: 'REQUESTED',
                    timestamp: new Date(),
                    note: 'Return request created by customer'
                }
            ]
        });

        const returnRequest2 = new returnProductModel({
            orderId: testOrder._id,
            userId: testUser._id,
            itemId: testOrder.items[0]._id.toString(),
            itemDetails: {
                itemType: 'product',
                name: 'Black Tshirt',
                size: 'XS',
                quantity: 1,
                originalPrice: 450,
                refundAmount: 292
            },
            returnReason: 'DEFECTIVE_PRODUCT',
            returnDescription: 'Product has manufacturing defects',
            eligibilityExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'APPROVED',
            adminResponse: {
                processedBy: testAdmin._id,
                processedDate: new Date(),
                adminComments: 'Approved after reviewing the defect images. Full refund will be processed.',
                inspectionNotes: 'Clear defect visible in customer photos.'
            },
            refundDetails: {
                refundStatus: 'PENDING',
                actualRefundAmount: 292
            },
            timeline: [
                {
                    status: 'REQUESTED',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    note: 'Return request created by customer'
                },
                {
                    status: 'APPROVED',
                    timestamp: new Date(),
                    note: 'Return request approved by admin'
                }
            ]
        });

        const returnRequest3 = new returnProductModel({
            orderId: testOrder._id,
            userId: testUser._id,
            itemId: testOrder.items[0]._id.toString(),
            itemDetails: {
                itemType: 'product',
                name: 'Black Tshirt',
                size: 'XS',
                quantity: 1,
                originalPrice: 450,
                refundAmount: 292
            },
            returnReason: 'WRONG_SIZE',
            returnDescription: 'Size is not fitting properly',
            eligibilityExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'REJECTED',
            adminResponse: {
                processedBy: testAdmin._id,
                processedDate: new Date(),
                adminComments: 'Rejected as size chart was available during purchase. Customer should have checked sizing.',
                inspectionNotes: 'No defect found, customer error in size selection.'
            },
            timeline: [
                {
                    status: 'REQUESTED',
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                    note: 'Return request created by customer'
                },
                {
                    status: 'REJECTED',
                    timestamp: new Date(),
                    note: 'Return request rejected by admin'
                }
            ]
        });

        await returnRequest1.save();
        await returnRequest2.save();
        await returnRequest3.save();

        console.log('✅ Created test return requests with admin comments');
        console.log('📊 Summary:');
        console.log('  - 1 REQUESTED return (pending admin action)');
        console.log('  - 1 APPROVED return with admin comments');
        console.log('  - 1 REJECTED return with admin comments');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
    }
};

const main = async () => {
    await connectDB();
    await createTestData();
    
    // Verify the data
    const returnCount = await returnProductModel.countDocuments();
    const orderCount = await orderModel.countDocuments();
    const userCount = await userModel.countDocuments();
    
    console.log('\n🔍 Database Status:');
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Orders: ${orderCount}`);
    console.log(`  - Return Requests: ${returnCount}`);
    
    // Show sample admin comments
    const returnsWithComments = await returnProductModel
        .find({ 'adminResponse.adminComments': { $exists: true, $ne: '' } })
        .populate('adminResponse.processedBy', 'name email');
        
    console.log('\n💬 Admin Comments Preview:');
    returnsWithComments.forEach((ret, index) => {
        console.log(`  ${index + 1}. Status: ${ret.status}`);
        console.log(`     Comment: "${ret.adminResponse.adminComments}"`);
        console.log(`     By: ${ret.adminResponse.processedBy?.name || 'Unknown Admin'}`);
        console.log('');
    });
    
    await mongoose.connection.close();
    console.log('✅ Test completed successfully!');
};

main().catch(console.error);
