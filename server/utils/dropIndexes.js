import mongoose from 'mongoose';
import ProductModel from '../models/product.model.js';

const dropProblematicIndexes = async () => {
    try {
        console.log('Connecting to database...');
        
        // Get the collection
        const collection = ProductModel.collection;
        
        // Get existing indexes
        const indexes = await collection.listIndexes().toArray();
        console.log('Existing indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
        
        // Drop problematic compound indexes that involve both category and gender
        const problematicIndexes = [
            'publish_1_gender_1_category_1',
            'gender_1_publish_1',
            'category_1_publish_1'
        ];
        
        for (const indexName of problematicIndexes) {
            try {
                await collection.dropIndex(indexName);
                console.log(`✅ Dropped index: ${indexName}`);
            } catch (error) {
                if (error.code === 27 || error.message.includes('index not found')) {
                    console.log(`ℹ️  Index ${indexName} does not exist (already dropped)`);
                } else {
                    console.log(`❌ Error dropping index ${indexName}:`, error.message);
                }
            }
        }
        
        // Try to drop any other compound indexes with both category and gender
        for (const index of indexes) {
            const keys = Object.keys(index.key);
            if (keys.includes('category') && keys.includes('gender') && keys.length > 1) {
                try {
                    await collection.dropIndex(index.name);
                    console.log(`✅ Dropped compound index with parallel arrays: ${index.name}`);
                } catch (error) {
                    console.log(`❌ Error dropping compound index ${index.name}:`, error.message);
                }
            }
        }
        
        console.log('✅ Index cleanup completed');
        
        // List remaining indexes
        const remainingIndexes = await collection.listIndexes().toArray();
        console.log('Remaining indexes:', remainingIndexes.map(idx => ({ name: idx.name, key: idx.key })));
        
    } catch (error) {
        console.error('❌ Error during index cleanup:', error);
    }
};

export default dropProblematicIndexes;
