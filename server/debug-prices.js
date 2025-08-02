import mongoose from 'mongoose';
import ProductModel from './models/product.model.js';
import OrderModel from './models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkOrdersAndPrices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        console.log('=== CHECKING RECENT ORDERS ===');
        
        const recentOrders = await OrderModel.find({})
            .sort({ createdAt: -1 })
            .limit(3);
        
        console.log(`Found ${recentOrders.length} recent orders`);
        
        recentOrders.forEach((order, index) => {
            console.log(`\n=== ORDER ${index + 1} ===`);
            console.log('Order ID:', order.orderId);
            console.log('Total Amount:', order.totalAmt);
            console.log('Items:');
            
            order.items.forEach((item, itemIndex) => {
                console.log(`  Item ${itemIndex + 1}:`);
                console.log('    - itemType:', item.itemType);
                console.log('    - unitPrice:', item.unitPrice);
                console.log('    - itemTotal:', item.itemTotal);
                console.log('    - quantity:', item.quantity);
                console.log('    - productId:', item.productId);
                console.log('    - bundleId:', item.bundleId);
                
                // Check if there are productDetails or bundleDetails in the item
                if (item.productDetails) {
                    console.log('    - productDetails.price:', item.productDetails.price);
                    console.log('    - productDetails.name:', item.productDetails.name);
                }
                if (item.bundleDetails) {
                    console.log('    - bundleDetails.bundlePrice:', item.bundleDetails.bundlePrice);
                    console.log('    - bundleDetails.title:', item.bundleDetails.title);
                }
            });
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkOrdersAndPrices();
