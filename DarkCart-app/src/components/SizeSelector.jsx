import React from 'react';
import { SIZE_PRICE_ADJUSTMENTS, formatPrice } from '../utils/sizePricing';

/**
 * Size selector component for product pages
 * 
 * @param {Object} props Component props
 * @param {Array} props.availableSizes Array of available sizes for the product
 * @param {String} props.selectedSize Currently selected size
 * @param {Function} props.onSizeSelect Function to call when size is selected
 * @param {Boolean} props.required Whether size selection is required
 * @param {Object} props.sizes Object containing inventory count for each size
 * @param {Number} props.basePrice The base price of the product
 * @param {Array} props.addedSizes Array of sizes that have been added to cart
 */
const SizeSelector = ({ availableSizes = [], selectedSize, onSizeSelect, required = true, sizes = {}, basePrice = 0, addedSizes = [] }) => {
  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];
  
  // If no explicit available sizes, calculate from the sizes inventory object
  const effectiveAvailableSizes = availableSizes?.length > 0 
    ? availableSizes 
    : Object.entries(sizes || {})
        .filter(([_, count]) => count > 0)
        .map(([size]) => size);
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Size {required && <span className="text-red-500">*</span>}
        </label>
        <button 
          type="button"
          className="text-xs text-gray-500 hover:text-black underline"
          onClick={() => window.open('/size-guide', '_blank')}
        >
          Size Guide
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {allSizes.map((size) => {
          const isAvailable = effectiveAvailableSizes.includes(size);
          const isSelected = selectedSize === size;
          const isInCart = addedSizes && addedSizes.includes(size);
          const inventory = sizes[size] || 0;
          
          const priceAdjustment = SIZE_PRICE_ADJUSTMENTS[size];
          
          return (
            <div key={size} className="flex flex-col items-center">
              <div className="relative">
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    if (isAvailable) {
                      onSizeSelect(size);
                      // Reset cart item display since we're selecting a different size
                    }
                  }}
                  className={`
                    h-10 w-10 flex items-center justify-center rounded-md
                    transition-all duration-200 font-medium text-sm
                    ${isSelected 
                      ? 'bg-black text-white border-2 border-black' 
                      : isInCart
                        ? 'bg-gray-800 text-white border-2 border-gray-800'
                        : isAvailable 
                          ? 'bg-white text-black border border-gray-300 hover:border-black' 
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}
                  `}
                  title={!isAvailable ? 'Out of stock' : isInCart ? 'Already in cart' : inventory > 0 ? `${inventory} in stock` : ''}
                >
                  {size}
                </button>
                
                {/* Add cart indicator */}
                {isAvailable && isInCart && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-green-600 text-white rounded-full border border-white" title="In your cart">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                    </svg>
                  </span>
                )}
                
                {/* Add low-stock indicator */}
                {isAvailable && !isInCart && inventory > 0 && inventory <= 3 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white"></span>
                )}
                
                {/* Add out-of-stock cross */}
                {!isAvailable && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-gray-300 transform rotate-45 absolute"></div>
                    <div className="w-full h-0.5 bg-gray-300 transform -rotate-45 absolute"></div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center mt-1">
                {isAvailable && (
                  <span className="text-xs text-gray-600">+₹{priceAdjustment}</span>
                )}
                
                {/* Show in cart indicator */}
                {isAvailable && isInCart && (
                  <span className="text-xxs text-green-600 font-medium mt-0.5">In cart</span>
                )}
                
                {/* Show remaining stock for low inventory */}
                {isAvailable && !isInCart && inventory > 0 && inventory <= 5 && (
                  <span className="text-xxs text-orange-600 mt-0.5">({inventory} left)</span>
                )}
                
                {/* Show out of stock text */}
                {!isAvailable && (
                  <span className="text-xxs text-gray-500 mt-0.5">Sold out</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {required && !selectedSize && (
        <p className="text-xs text-red-500 mt-1">Please select a size</p>
      )}
      
      {selectedSize && sizes[selectedSize] <= 5 && sizes[selectedSize] > 0 && (
        <p className="text-xs text-orange-500 mt-1">
          Only {sizes[selectedSize]} left in this size
        </p>
      )}
    </div>
  );
};

export default SizeSelector;
