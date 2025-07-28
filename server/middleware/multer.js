import multer from 'multer'

const storage = multer.memoryStorage()

// Configure multer with file size limits
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
})

export default upload