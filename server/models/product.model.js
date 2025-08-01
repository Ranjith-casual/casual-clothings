import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: Array,
        default: []
    },
    gender: [{
        type: String,
        enum: ['Men', 'Women', 'Kids', 'Unisex', "Boys", "Girls"]
    }],
    category: [{
        type: mongoose.Schema.ObjectId,
        ref: 'category',
        required: true
    }],
    // Legacy stock field for backward compatibility
    stock: {
        type: Number,
        default: 0
    },
    // New sizes inventory with stock per size
    sizes: {
        XS: { type: Number, default: 0 },
        S: { type: Number, default: 0 },
        M: { type: Number, default: 0 },
        L: { type: Number, default: 0 },
        XL: { type: Number, default: 0 }
    },
    // Available sizes array for quick filtering
    availableSizes: {
        type: [String],
        default: []
    },
    // Size-specific pricing
    sizePricing: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    price: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    discountedPrice: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    more_details: {
        type: Object,
        default: {}
    },
    washCare: {
        type: String,
        default: "Machine wash"
    },
    packageContains: {
        type: String,
        default: ""
    },
    sizeModel: {
        type: String,
        default: "XS,S,M,L,XL,XXL,XXXL"
    },
    fabric: {
        type: String,
        default: "80% cotton, 19% polyester, 1% elastane"
    },
    marketedBy: {
        type: String,
        default: "casualclothings Fashion (India) Pvt. Ltd."
    },
    importedBy: {
        type: String,
        default: "casualclothings Fashion (India) Pvt. Ltd."
    },
    countryOfOrigin: {
        type: String,
        default: "India"
    },
    customerCareAddress: {
        type: String,
        default: "Sivsakthi Nagar, 5th Street, Tirupur, Tamil Nadu - 641604"
    },
    publish: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to automatically calculate discounted price
productSchema.pre('save', function(next) {
    if (this.price && this.discount) {
        this.discountedPrice = this.price * (1 - this.discount / 100);
    } else {
        this.discountedPrice = this.price || 0;
    }
    next();
});

// Static method to calculate discounted price for a given price and discount
productSchema.statics.calculateDiscountedPrice = function(price, discount) {
    if (price && discount && discount > 0) {
        return price * (1 - discount / 100);
    }
    return price || 0;
};

// Instance method to get the effective price (discounted if available, otherwise original)
productSchema.methods.getEffectivePrice = function() {
    return this.discountedPrice || this.price || 0;
};

// Create text index on name and description for better search results
productSchema.index({ name: 'text', description: 'text' });

// Create separate indexes for regex-based searches
productSchema.index({ name: 1 });
productSchema.index({ description: 1 });

// Create individual indexes for array fields (cannot create compound indexes with parallel arrays)
productSchema.index({ gender: 1 });
productSchema.index({ category: 1 });
productSchema.index({ publish: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Create compound indexes with non-array fields only
productSchema.index({ publish: 1, price: 1 });
productSchema.index({ publish: 1, createdAt: -1 });

const ProductModel = mongoose.model('product', productSchema);

export default ProductModel;