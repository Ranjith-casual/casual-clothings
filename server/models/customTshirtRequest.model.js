import mongoose from "mongoose";

const customTshirtRequestSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // Reference to user model
        default: null // Allow null for guest requests
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    tshirtType: {
        type: String,
        required: true
        // Removed enum to allow any custom t-shirt type
    },
    color: {
        type: String,
        required: true
        // Removed enum to allow any custom color
    },
    size: {
        type: String,
        required: true
        // Removed enum to allow any custom size
    },
    genders: [{
        type: String,
        required: true,
        enum: ['Men', 'Women', 'Kids', 'Unisex']
    }],
    genderImages: {
        type: Map,
        of: String, // URLs to gender-specific images
        default: {}
    },
    designDescription: {
        type: String,
        required: true,
        maxlength: 1000
    },
    uploadedImage: {
        type: String, // URL to uploaded image/logo
        default: ""
    },
    preferredDeliveryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'In Production', 'Completed'],
        default: 'Pending'
    },
    adminNotes: {
        type: String,
        default: ""
    },
    estimatedPrice: {
        type: Number,
        default: 0
    },
    rejectionReason: {
        type: String,
        default: ""
    },
    completedAt: {
        type: Date
    },
    acceptedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
customTshirtRequestSchema.index({ status: 1 });
customTshirtRequestSchema.index({ createdAt: -1 });
customTshirtRequestSchema.index({ email: 1 });
customTshirtRequestSchema.index({ userId: 1 });
customTshirtRequestSchema.index({ preferredDeliveryDate: 1 });

const CustomTshirtRequestModel = mongoose.model('customTshirtRequest', customTshirtRequestSchema);

export default CustomTshirtRequestModel;
