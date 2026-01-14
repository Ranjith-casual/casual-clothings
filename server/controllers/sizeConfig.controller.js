import SizeConfig from '../models/sizeConfig.model.js';
import ProductModel from '../models/product.model.js';

// Get available sizes
export const getSizes = async (req, res) => {
  try {
    const type = req.query.type || 'clothing';
    const userId = req.query.userId || null;
    
    // Get the configured sizes
    let sizeConfig = await SizeConfig.findOne({ type });
    
    if (!sizeConfig) {
      // Create default configuration if none exists
      sizeConfig = await SizeConfig.create({
        type,
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      });
    }
    
    // If we have a userId, check for any custom sizes they might have used
    let customSizes = [];
    if (userId) {
      // Find all products with custom sizes that might not be in the global config
      const products = await ProductModel.find({ 
        "sizes": { $exists: true, $ne: {} }
      }).select('sizes');
      
      // Extract all size keys from products
      products.forEach(product => {
        if (product.sizes) {
          Object.keys(product.sizes).forEach(size => {
            if (product.sizes[size] > 0 && !sizeConfig.sizes.includes(size)) {
              customSizes.push(size);
            }
          });
        }
      });
    }
    
    // Combine default sizes with any custom sizes found
    const allSizes = [...new Set([...sizeConfig.sizes, ...customSizes])].sort();
    
    return res.status(200).json({
      success: true,
      sizes: allSizes,
      defaultSizes: sizeConfig.sizes,
      customSizes
    });
  } catch (error) {
    console.error('Error getting sizes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get sizes',
      error: error.message
    });
  }
};

// Update available sizes
export const updateSizes = async (req, res) => {
  try {
    const { sizes, sizeDefinitions } = req.body;
    const type = req.query.type || 'clothing';
    
    if (!Array.isArray(sizes)) {
      return res.status(400).json({
        success: false,
        message: 'Sizes must be an array'
      });
    }
    
    // Prepare update object
    const updateData = { sizes };
    
    // If size definitions are provided, update those too
    if (Array.isArray(sizeDefinitions)) {
      updateData.sizeDefinitions = sizeDefinitions;
    }
    
    // Find and update or create if doesn't exist
    const sizeConfig = await SizeConfig.findOneAndUpdate(
      { type },
      updateData,
      { new: true, upsert: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Sizes updated successfully',
      sizes: sizeConfig.sizes,
      sizeDefinitions: sizeConfig.sizeDefinitions
    });
  } catch (error) {
    console.error('Error updating sizes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update sizes',
      error: error.message
    });
  }
};

// Get size chart information
export const getSizeChart = async (req, res) => {
  try {
    const type = req.query.type || 'clothing';
    const gender = req.query.gender || 'unisex';
    
    // Get the size configuration
    const sizeConfig = await SizeConfig.findOne({ type });
    
    if (!sizeConfig) {
      return res.status(404).json({
        success: false,
        message: 'Size configuration not found'
      });
    }
    
    // Return size chart information
    return res.status(200).json({
      success: true,
      type,
      gender,
      sizes: sizeConfig.sizes,
      sizeDefinitions: sizeConfig.sizeDefinitions || sizeConfig.sizes.map(size => ({
        code: size,
        displayName: size,
        sortOrder: sizeConfig.sizes.indexOf(size) * 10
      })),
      measurements: {
        // Default measurements by gender and size
        // You would customize this based on your actual size chart data
        chest: {
          'XS': gender === 'Women' ? '32-34' : '34-36',
          'S': gender === 'Women' ? '34-36' : '36-38',
          'M': gender === 'Women' ? '36-38' : '38-40',
          'L': gender === 'Women' ? '38-40' : '40-42',
          'XL': gender === 'Women' ? '40-42' : '42-44'
        },
        waist: {
          'XS': gender === 'Women' ? '24-26' : '28-30',
          'S': gender === 'Women' ? '26-28' : '30-32',
          'M': gender === 'Women' ? '28-30' : '32-34',
          'L': gender === 'Women' ? '30-32' : '34-36',
          'XL': gender === 'Women' ? '32-34' : '36-38'
        }
      }
    });
  } catch (error) {
    console.error('Error getting size chart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get size chart',
      error: error.message
    });
  }
};
