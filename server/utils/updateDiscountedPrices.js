import ProductModel from "../models/product.model.js";
import connectdb from "../config/connectdb.js";

/**
 * Utility script to update all existing products with calculated discounted prices
 * Run this once after adding the discountedPrice field to the product model
 */

async function updateAllProductDiscountedPrices() {
    try {
        // Connect to database
        await connectdb();
        console.log('Connected to database');

        // Find all products
        const products = await ProductModel.find({});
        console.log(`Found ${products.length} products to update`);

        let updatedCount = 0;

        for (const product of products) {
            try {
                // Calculate discounted price
                let discountedPrice = product.price || 0;
                if (product.price && product.discount && product.discount > 0) {
                    discountedPrice = product.price * (1 - product.discount / 100);
                }

                // Update the product
                await ProductModel.updateOne(
                    { _id: product._id },
                    { $set: { discountedPrice: discountedPrice } }
                );

                updatedCount++;
                
                if (updatedCount % 10 === 0) {
                    console.log(`Updated ${updatedCount} products...`);
                }
            } catch (error) {
                console.error(`Error updating product ${product._id}:`, error.message);
            }
        }

        console.log(`✅ Successfully updated ${updatedCount} products with discounted prices`);
        
        // Verify the updates
        const sampleProducts = await ProductModel.find({}).limit(5);
        console.log('\nSample updated products:');
        sampleProducts.forEach(product => {
            console.log(`${product.name}: Price: ₹${product.price}, Discount: ${product.discount}%, Discounted: ₹${product.discountedPrice}`);
        });

    } catch (error) {
        console.error('Error updating products:', error);
    } finally {
        process.exit(0);
    }
}

// Run the update script
updateAllProductDiscountedPrices();
