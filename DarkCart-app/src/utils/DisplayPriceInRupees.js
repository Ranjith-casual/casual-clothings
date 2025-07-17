export const DisplayPriceInRupees = (price) => {
    // Handle invalid input values
    if (price === undefined || price === null || isNaN(price)) {
        console.warn(`Invalid price value: ${price}`);
        return '₹0.00';
    }
    
    // Ensure price is a number
    const numericPrice = Number(price);
    
    // Format price in Indian Rupees
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericPrice);
    } catch (error) {
        console.error('Error formatting price:', error);
        return `₹${numericPrice.toFixed(2)}`;
    }
}