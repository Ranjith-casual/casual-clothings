import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const UploadImage = async(image)=>{
    try {
        const formData = new FormData()
        formData.append('image',image)

        const response = await Axios({
            ...SummaryApi.uploadImage,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // Add timeout to prevent long-hanging requests
            timeout: 30000
        })

        return response
    } catch (error) {
        console.error('Image upload error:', error);
        
        // Create a structured error object with useful information
        const errorResponse = {
            data: {
                success: false,
                message: error.message || 'Upload failed',
                error: true
            },
            originalError: error
        };
        
        // Throw the error instead of returning it to trigger proper error handling
        throw errorResponse;
    }
}

export default UploadImage