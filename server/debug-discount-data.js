import mongoose from 'mongoose';
import ProductModel from './models/product.model.js';
import orderModel from './models/order.model.js';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/CasualClothings');
        console.log('MongoDB connected for debugging');
        
        // Check products with discounts
        console.log('\n🔍 Products with discount > 0:');
        const productsWithDiscount = await ProductModel.find({ discount: { $gt: 0 } })
            .select('name price discount discountedPrice')
            .limit(10);
        
        productsWithDiscount.forEach(product => {
            console.log(`- ${product.name}: price=${product.price}, discount=${product.discount}%, discountedPrice=${product.discountedPrice}`);
        });
        
        // Check recent orders with populated product data
        console.log('\n🔍 Recent orders with product population:');
        const recentOrders = await orderModel.find()
            .populate("items.productId", "name price discount discountedPrice")
            .sort({ orderDate: -1 })
            .limit(3);
            
        recentOrders.forEach((order, orderIndex) => {
            console.log(`\nOrder ${orderIndex + 1} (${order.orderId}):`);
            order.items.forEach((item, itemIndex) => {
                if (item.productId) {
                    console.log(`  Item ${itemIndex + 1}: ${item.productId.name}`);
                    console.log(`    Price: ${item.productId.price}`);
                    console.log(`    Discount: ${item.productId.discount}%`);
                    console.log(`    DiscountedPrice: ${item.productId.discountedPrice}`);
                    console.log(`    ItemTotal: ${item.itemTotal}`);
                }
            });
        });
        
        mongoose.connection.close();
        console.log('\n✅ Debug complete, connection closed');
        
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

connectDB();
