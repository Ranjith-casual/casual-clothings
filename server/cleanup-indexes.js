import mongoose from 'mongoose';
import connectDB from './config/connectdb.js';
import dropProblematicIndexes from './utils/dropIndexes.js';

const runIndexCleanup = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('🔌 Connected to database');
        
        // Run index cleanup
        await dropProblematicIndexes();
        
        console.log('🎉 Index cleanup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Index cleanup failed:', error);
        process.exit(1);
    }
};

runIndexCleanup();
