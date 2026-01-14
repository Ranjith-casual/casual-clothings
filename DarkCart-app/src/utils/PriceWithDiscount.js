export const pricewithDiscount = (price, dis = 0) => {
    // Ensure price and discount are valid numbers
    const numPrice = Number(price) || 0;
    const numDiscount = Number(dis) || 0;
    
    // Validate inputs
    if (numDiscount < 0 || numDiscount > 100) {
        console.warn(`Invalid discount percentage: ${numDiscount}%. Using 0% discount.`);
        return numPrice;
    }
    
    // If no discount or invalid price, return original price
    if (numDiscount <= 0 || numPrice <= 0) {
        return numPrice;
    }
    
    // Calculate discount amount and final price with proper rounding
    // Use Math.round instead of Math.ceil to avoid overcharging customers
    const discountAmount = Math.round((numPrice * numDiscount) / 100 * 100) / 100; // Round to 2 decimal places
    const actualPrice = Math.round((numPrice - discountAmount) * 100) / 100; // Round final price to 2 decimal places
    
    // Ensure we don't return negative prices
    return Math.max(0, actualPrice);
}