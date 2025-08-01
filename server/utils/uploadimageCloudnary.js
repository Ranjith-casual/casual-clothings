import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
})

const uploadImageClodinary = async(image) => {
    try {
        // Validate Cloudinary configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET_KEY) {
            throw new Error('Cloudinary configuration is incomplete. Please check environment variables.');
        }

        if (!image || !image.buffer) {
            throw new Error('Invalid image data provided');
        }

        const buffer = image.buffer || Buffer.from(await image.arrayBuffer())

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { 
                    folder: "Casual Clothing Fashion",
                    resource_type: "image",
                    quality: "auto",
                    fetch_format: "auto"
                },
                (error, uploadResult) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('Cloudinary upload success:', {
                            public_id: uploadResult.public_id,
                            url: uploadResult.secure_url
                        });
                        resolve(uploadResult);
                    }
                }
            ).end(buffer)
        })

        return uploadResult
        
    } catch (error) {
        console.error('uploadImageClodinary error:', error);
        throw error;
    }
}

export default uploadImageClodinary