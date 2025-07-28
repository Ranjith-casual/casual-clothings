import uploadImageClodinary from "../utils/uploadimageCloudnary.js"

const uploadImageController = async(request, response) => {
    try {
        const file = request.file
        if (!file) {
            return response.status(400).json({
                message: "No file uploaded",
                error: true,
                success: false
            });
        }
        
        console.log('Uploading file:', file.originalname);

        const uploadImage = await uploadImageClodinary(file)

        // Ensure proper CORS headers are set
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        response.header('Access-Control-Allow-Credentials', true);
        
        return response.json({
            message: "Upload done",
            data: uploadImage,
            success: true,
            error: false
        })
    } catch (error) {
        console.error('File upload error:', error);
        return response.status(500).json({
            message: error.message || "File upload failed",
            error: true,
            success: false
        })
    }
}

export default uploadImageController