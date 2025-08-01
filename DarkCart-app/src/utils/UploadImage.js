import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const UploadImage = async(image)=>{
    try {
        // Add file validation
        if (!image) {
            throw new Error('No image file provided');
        }
        
        // Check file size (limit to 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (image.size > maxSize) {
            throw new Error('File size too large. Maximum size is 5MB.');
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(image.type)) {
            throw new Error('Invalid file type. Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
        }
        
        console.log('Uploading image:', {
            name: image.name,
            size: image.size,
            type: image.type
        });
        
        const formData = new FormData()
        formData.append('image', image)

        const response = await Axios({
            ...SummaryApi.uploadImage,
            data: formData
        })
        
        console.log('Upload response received:', response);
        return response
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Return a structured error response instead of just the error
        return {
            data: {
                success: false,
                error: true,
                message: error.response?.data?.message || error.message || 'Upload failed'
            }
        };
    }
}

export default UploadImage