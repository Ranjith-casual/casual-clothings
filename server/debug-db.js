import mongoose from 'mongoose';
import CustomTshirtRequestModel from './models/customTshirtRequest.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all custom t-shirt requests
        const allRequests = await CustomTshirtRequestModel.find({});
        console.log('\n=== ALL CUSTOM T-SHIRT REQUESTS ===');
        console.log('Total requests found:', allRequests.length);
        
        allRequests.forEach((request, index) => {
            console.log(`\nRequest ${index + 1}:`);
            console.log('ID:', request._id.toString());
            console.log('User ID:', request.userId);
            console.log('Name:', request.name);
            console.log('Email:', request.email);
            console.log('Created At:', request.createdAt);
            console.log('Status:', request.status);
        });

        // Find requests with null userId
        const nullUserRequests = await CustomTshirtRequestModel.find({ userId: null });
        console.log('\n=== REQUESTS WITH NULL USER ID ===');
        console.log('Count:', nullUserRequests.length);

        // Find requests with actual user IDs
        const userRequests = await CustomTshirtRequestModel.find({ userId: { $ne: null } });
        console.log('\n=== REQUESTS WITH USER IDS ===');
        console.log('Count:', userRequests.length);
        
        userRequests.forEach((request, index) => {
            console.log(`User Request ${index + 1}:`);
            console.log('User ID:', request.userId);
            console.log('Name:', request.name);
        });

    } catch (error) {
        console.error('Database check error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkDatabase();
