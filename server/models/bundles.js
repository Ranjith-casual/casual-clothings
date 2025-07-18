import mongoose from "mongoose";

const bundleItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'product'
    }
});

const bundleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    bundlePrice: {
        type: Number,
        required: true,
        min: 0
    },
    // Remove discount field - will be calculated dynamically
    tag: {
        type: String,
        enum: ['Popular', 'Limited', 'Bestseller', 'New', 'Premium', 'Trending', 'Flash Sale']
    },
    items: [bundleItemSchema],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        default: 100
    },
    soldCount: {
        type: Number,
        default: 0
    },
    // Timer functionality for time-limited bundle offers
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    isTimeLimited: {
        type: Boolean,
        default: false
    },
    images: [{
        type: String
    }],
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        trim: true
    }
}, {
    timestamps: true
});

// Generate slug before saving (only if not provided)
bundleSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Calculate savings
bundleSchema.virtual('savings').get(function() {
    return this.originalPrice - this.bundlePrice;
});

// Calculate discount percentage as virtual field
bundleSchema.virtual('discount').get(function() {
    if (this.originalPrice && this.bundlePrice && this.originalPrice > this.bundlePrice) {
        return Math.round(((this.originalPrice - this.bundlePrice) / this.originalPrice) * 100);
    }
    return 0;
});

// Calculate savings percentage (alias for discount)
bundleSchema.virtual('savingsPercentage').get(function() {
    return this.discount;
});

// Include virtuals when converting to JSON
bundleSchema.set('toJSON', { virtuals: true });
bundleSchema.set('toObject', { virtuals: true });

const BundleModel = mongoose.model('bundle', bundleSchema);

export default BundleModel;