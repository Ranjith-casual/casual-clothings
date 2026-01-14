import mongoose from 'mongoose';

// Define a schema for individual sizes with more metadata
const sizeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ''
    },
    measurements: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { _id: false }
);

const sizeConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      default: 'clothing',
      enum: ['clothing', 'shoes', 'accessories'],
    },
    // Simple array of size codes for backward compatibility
    sizes: {
      type: [String],
      required: true,
      default: ['XS', 'S', 'M', 'L', 'XL'],
    },
    // Enhanced size definitions with metadata
    sizeDefinitions: {
      type: [sizeSchema],
      default: [
        { code: 'XS', displayName: 'Extra Small', sortOrder: 10 },
        { code: 'S', displayName: 'Small', sortOrder: 20 },
        { code: 'M', displayName: 'Medium', sortOrder: 30 },
        { code: 'L', displayName: 'Large', sortOrder: 40 },
        { code: 'XL', displayName: 'Extra Large', sortOrder: 50 }
      ]
    }
  },
  {
    timestamps: true,
  }
);

const SizeConfig = mongoose.model('SizeConfig', sizeConfigSchema);

export default SizeConfig;
