export const pricewithDiscount = (price, dis = 0) => {
    // Ensure price and discount are valid numbers
    const numPrice = Number(price) || 0;
    const numDiscount = Number(dis) || 0;
    
    // If no discount or invalid price, return original price
    if (numDiscount <= 0 || numPrice <= 0) {
        return numPrice;
    }
    
    // Calculate discount amount and final price
    const discountAmount = Math.ceil((numPrice * numDiscount) / 100);
    const actualPrice = numPrice - discountAmount;
    
    // Ensure we don't return negative prices
    return Math.max(0, actualPrice);
}