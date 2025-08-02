import mongoose from 'mongoose';
import { connectDB } from './config/connectdb.js';
import { generateInvoicePdf } from './utils/generateInvoicePdf.js';
import orderModel from './models/order.model.js';

async function testRefundInvoice() {
    try {
        // Connect to database
        await connectDB();
        
        // Find a recent order to test with
        const testOrder = await orderModel.findOne({
            paymentStatus: { $in: ['PAID', 'PARTIAL_REFUND_PROCESSING', 'REFUND_SUCCESSFUL'] }
        })
        .populate('userId', 'name email')
        .populate('items.productId', 'name image price discount discountedPrice')
        .populate('items.bundleId', 'title image images bundlePrice originalPrice')
        .populate('deliveryAddress')
        .sort({ orderDate: -1 });

        if (!testOrder) {
            console.log('No test order found');
            return;
        }

        console.log('=== Test Order Data ===');
        console.log('Order ID:', testOrder.orderId);
        console.log('Items count:', testOrder.items.length);
        
        testOrder.items.forEach((item, index) => {
            console.log(`\n--- Item ${index + 1} ---`);
            console.log('Item Type:', item.itemType);
            console.log('Quantity:', item.quantity);
            console.log('itemTotal:', item.itemTotal);
            console.log('sizeAdjustedPrice:', item.sizeAdjustedPrice);
            console.log('unitPrice:', item.unitPrice);
            
            if (item.itemType === 'product' && item.productId) {
                console.log('Product Name:', item.productId.name);
                console.log('Product Price:', item.productId.price);
                console.log('Product Discounted Price:', item.productId.discountedPrice);
            }
            
            if (item.productDetails) {
                console.log('Product Details Price:', item.productDetails.price);
            }
            
            if (item.itemType === 'bundle' && item.bundleId) {
                console.log('Bundle Title:', item.bundleId.title);
                console.log('Bundle Price:', item.bundleId.bundlePrice);
            }
            
            if (item.bundleDetails) {
                console.log('Bundle Details Price:', item.bundleDetails.bundlePrice);
            }
        });

        // Test refund details
        const refundDetails = {
            refundAmount: 500,
            refundPercentage: 75,
            refundId: 'TEST_REF_001',
            refundDate: new Date(),
            refundReason: 'Test Refund',
            retainedAmount: testOrder.totalAmt - 500
        };

        console.log('\n=== Generating Test Refund Invoice ===');
        
        // Generate PDF to test pricing
        const pdfBuffer = generateInvoicePdf(testOrder, 'refund', refundDetails);
        
        console.log('PDF generated successfully, buffer length:', pdfBuffer.length);
        
    } catch (error) {
        console.error('Test error:', error);
    } finally {
        mongoose.disconnect();
    }
}

testRefundInvoice();
