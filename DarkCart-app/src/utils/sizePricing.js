/**
 * Size-based price adjustment utility
 * Maps clothing sizes to their price adjustments
 */

// Map sizes to their price adjustments
export const SIZE_PRICE_ADJUSTMENTS = {
  'XS': 30,
  'S': 50,
  'M': 60,
  'L': 70,
  'XL': 80
};

/**
 * Calculate the adjusted price based on the selected size
 * @param {number} basePrice - The base price of the product
 * @param {string} size - The selected size (XS, S, M, L, XL)
 * @returns {number} - The price after size adjustment
 */
export const calculateSizeAdjustedPrice = (basePrice, size) => {
  // If no size is selected or size doesn't exist in our mapping, return the base price
  if (!size || !SIZE_PRICE_ADJUSTMENTS[size]) {
    return basePrice;
  }
  
  // Add the size-specific adjustment to the base price
  return basePrice + SIZE_PRICE_ADJUSTMENTS[size];
};

// Export as calculateAdjustedPrice for compatibility with existing code
export const calculateAdjustedPrice = calculateSizeAdjustedPrice;

/**
 * Format a price with currency symbol
 * @param {number} price - The price to format
 * @returns {string} - Formatted price with ₹ symbol
 */
export const formatPrice = (price) => {
  return `₹${price.toFixed(0)}`;
};
