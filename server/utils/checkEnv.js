// Environment variables checker for debugging
export const checkCloudinaryConfig = () => {
    console.log('🔍 Checking Cloudinary Configuration:');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('CLOUDINARY_API_SECRET_KEY:', process.env.CLOUDINARY_API_SECRET_KEY ? '✅ Set' : '❌ Missing');
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET_KEY) {
        console.log('⚠️  Cloudinary configuration is incomplete!');
        console.log('Please check your .env file and ensure all Cloudinary variables are set.');
        return false;
    }
    
    console.log('✅ Cloudinary configuration looks good!');
    return true;
};

export const logServerInfo = () => {
    console.log('🚀 Server Environment Info:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('PORT:', process.env.PORT || '8080');
    console.log('FRONT_URL:', process.env.FRONT_URL || 'Not set');
    checkCloudinaryConfig();
};
