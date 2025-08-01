import uploadImageClodinary from "../utils/uploadimageCloudnary.js"

const uploadImageController = async(request, response) => {
    try {
        const file = request.file
        console.log('Upload request received:', {
            file: file ? {
                fieldname: file.fieldname,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            } : 'No file'
        });

        if (!file) {
            return response.status(400).json({
                message: "No file uploaded",
                error: true,
                success: false
            });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return response.status(400).json({
                message: "Invalid file type. Please upload a valid image file.",
                error: true,
                success: false
            });
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return response.status(400).json({
                message: "File size too large. Maximum size is 5MB.",
                error: true,
                success: false
            });
        }

        const uploadResult = await uploadImageClodinary(file)
        
        if (!uploadResult || !uploadResult.secure_url) {
            throw new Error('Failed to upload image to cloud storage');
        }

        console.log('Upload successful:', {
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url
        });

        return response.json({
            message: "Upload done",
            data: {
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            },
            success: true,
            error: false
        })
        
    } catch (error) {
        console.error('Upload controller error:', error);
        return response.status(500).json({
            message: error.message || 'Internal server error during upload',
            error: true,
            success: false
        })
    }
}

export default uploadImageController