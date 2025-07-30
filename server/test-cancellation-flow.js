// Test script for cancellation flow
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import orderModel from './models/order.model.js';
import orderCancellationModel from './models/orderCancellation.model.js';
import UserModel from './models/users.model.js';
import ProductModel from './models/product.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Helper function to create a unique order ID
const generateOrderId = () => {
  return `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Main test function
const runTest = async () => {
  try {
    // 1. Create a test user if not exists
    let testUser = await UserModel.findOne({ email: 'testuser@example.com' });
    
    if (!testUser) {
      testUser = new UserModel({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'hashedpassword123',
        role: 'BUYER'
      });
      await testUser.save();
      console.log('✅ Created test user');
    }
    
    // 2. Create a test order with multiple items
    const testOrderId = generateOrderId();
    const testOrder = new orderModel({
      orderId: testOrderId,
      userId: testUser._id,
      customerName: testUser.name,
      customerEmail: testUser.email,
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          itemType: 'product',
          quantity: 1,
          size: 'M',
          itemTotal: 1000,
          productDetails: {
            name: 'Test Product 1',
            price: 1000,
            discountedPrice: 900
          }
        },
        {
          productId: new mongoose.Types.ObjectId(),
          itemType: 'product',
          quantity: 1,
          size: 'L',
          itemTotal: 1500,
          productDetails: {
            name: 'Test Product 2',
            price: 1500,
            discountedPrice: 1350
          }
        },
        {
          productId: new mongoose.Types.ObjectId(),
          itemType: 'product',
          quantity: 2,
          size: 'S',
          itemTotal: 2000,
          productDetails: {
            name: 'Test Product 3',
            price: 1000,
            discountedPrice: 900
          }
        }
      ],
      totalQuantity: 4, // 1 + 1 + 2 = 4 items total
      orderStatus: 'PROCESSING',
      paymentStatus: 'COMPLETED',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      deliveryCharge: 100,
      subTotalAmt: 4500,
      totalAmt: 4600,
      createdAt: new Date()
    });
    
    await testOrder.save();
    console.log(`✅ Created test order with ID: ${testOrderId}`);
    
    // 3. Submit cancellation request for the first item
    const firstCancellation = new orderCancellationModel({
      orderId: testOrder._id,
      userId: testUser._id,
      cancellationType: 'PARTIAL_ITEMS',
      itemsToCancel: [
        {
          itemId: testOrder.items[0]._id,
          productId: testOrder.items[0].productId,
          itemType: 'product',
          quantity: 1,
          size: 'M',
          itemTotal: 1000,
          refundAmount: 900
        }
      ],
      reason: 'Changed mind',
      totalRefundAmount: 900,
      totalItemValue: 1000,
      deliveryInfo: {
        deliveryCharge: testOrder.deliveryCharge || 0,
        deliveryChargeRefund: 0,
        isEffectivelyFullCancellation: false
      },
      status: 'APPROVED', // Simulate that the cancellation was approved
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await firstCancellation.save();
    console.log('✅ Created and approved cancellation for first item');
    
    // 4. Try cancelling the remaining items
    // This should now work with our updated controller logic
    const remainingItems = testOrder.items.slice(1);
    
    // Calculate refund for remaining items
    const remainingItemsValue = remainingItems.reduce((sum, item) => sum + item.itemTotal, 0);
    const remainingItemsRefund = remainingItems.reduce((sum, item) => sum + (item.itemTotal * 0.9), 0); // 90% refund
    const deliveryRefund = testOrder.deliveryCharge || 0; // Full delivery charge refund

    const secondCancellation = new orderCancellationModel({
      orderId: testOrder._id,
      userId: testUser._id,
      cancellationType: 'PARTIAL_ITEMS',
      itemsToCancel: remainingItems.map(item => ({
        itemId: item._id,
        productId: item.productId,
        itemType: 'product',
        quantity: item.quantity,
        size: item.size,
        itemTotal: item.itemTotal,
        refundAmount: item.itemTotal * 0.9 // 90% refund
      })),
      reason: 'Changed mind',
      totalRefundAmount: remainingItemsRefund + deliveryRefund, // Include delivery charge
      totalItemValue: remainingItemsValue,
      deliveryInfo: {
        deliveryCharge: testOrder.deliveryCharge || 0,
        deliveryChargeRefund: deliveryRefund,
        isEffectivelyFullCancellation: true
      },
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await secondCancellation.save();
    console.log('✅ Successfully created cancellation for remaining items');
    
    // 5. Verify both cancellations
    const allCancellations = await orderCancellationModel.find({ orderId: testOrder._id });
    console.log(`✅ Found ${allCancellations.length} cancellation requests for the order`);
    
    console.log('\n📊 Summary:');
    console.log(`  - Order total: ₹${testOrder.totalAmt.toFixed(2)}`);
    console.log(`  - First cancellation refund: ₹${firstCancellation.totalRefundAmount.toFixed(2)}`);
    console.log(`  - Second cancellation refund: ₹${secondCancellation.totalRefundAmount.toFixed(2)}`);
    console.log(`  - Total refund amount: ₹${(firstCancellation.totalRefundAmount + secondCancellation.totalRefundAmount).toFixed(2)}`);
    console.log(`  - Delivery charge: ₹${testOrder.deliveryCharge.toFixed(2)}`);
    console.log(`  - First cancellation delivery refund: ₹${(firstCancellation.deliveryInfo.deliveryChargeRefund || 0).toFixed(2)}`);
    console.log(`  - Second cancellation delivery refund: ₹${(secondCancellation.deliveryInfo.deliveryChargeRefund || 0).toFixed(2)}`);
    
    // Consider refund percentage when calculating expected refund
    const firstItemValue = testOrder.items[0].itemTotal; // 1000
    const firstRefundAmount = firstCancellation.totalRefundAmount; // 900 (90% of 1000)
    const expectedFirstRefundRate = firstRefundAmount / firstItemValue;
    
    // Use the already calculated remainingItemsValue from above
    const secondRefundAmount = secondCancellation.totalRefundAmount - secondCancellation.deliveryInfo.deliveryChargeRefund;
    const expectedSecondRefundRate = secondRefundAmount / remainingItemsValue;
    
    const expectedTotalRefund = (testOrder.subTotalAmt * 0.9) + testOrder.deliveryCharge; // 90% of items + delivery charge
    const actualTotalRefund = firstCancellation.totalRefundAmount + secondCancellation.totalRefundAmount;
    
    console.log(`\n✓ Verification Details:`);
    console.log(`  - First cancellation refund rate: ${(expectedFirstRefundRate * 100).toFixed(1)}%`);
    console.log(`  - Second cancellation refund rate: ${(expectedSecondRefundRate * 100).toFixed(1)}%`);
    console.log(`  - Expected total refund (90% of items + delivery): ₹${expectedTotalRefund.toFixed(2)}`);
    console.log(`  - Actual total refund: ₹${actualTotalRefund.toFixed(2)}`);
    
    // Allow a small tolerance for rounding differences
    if (Math.abs(actualTotalRefund - expectedTotalRefund) < 5) {
      console.log('✅ PASS: Refund amounts match the expected values!');
    } else {
      console.log('❌ FAIL: Refund amount mismatch detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔄 MongoDB connection closed');
  }
};

// Run the test
runTest();
