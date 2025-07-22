/**
 * Size-based price adjustment utility
 * Calculates product prices based on size-specific pricing
 */

/**
 * Calculate the adjusted price based on the selected size and product data
 * @param {number} basePrice - The base price of the product
 * @param {string} size - The selected size (XS, S, M, L, XL, etc.)
 * @param {Object} product - The product data containing sizePricing information
 * @returns {number} - The price for the selected size
 */
export const calculateSizeAdjustedPrice = (basePrice, size, product) => {
  // If no product data or size is provided, return the base price
  if (!size || !product) {
    return basePrice;
  }
  
  // If the product has size-specific pricing and a price exists for this size, use that
  if (product.sizePricing && product.sizePricing[size] !== undefined) {
    return product.sizePricing[size];
  }
  
  // Otherwise, return the base price
  return basePrice;
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
