import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart } from "react-icons/fa";
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { PricingService } from '../utils/PricingService';

const SimpleProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Extract product information
  const price = product.price || 0;
  const discount = product.discount || 0;
  const discountedPrice = PricingService.applyDiscount(price, discount);
  const productImage = product.image?.[0] || '';
  const productName = product.name || 'Product';
  const categoryName = product.category?.[0]?.name || product.category?.name || 'Fashion';
  const productId = product._id;
  
  return (
    <div className="relative">
      <Link 
        to={`/product/${productName?.toLowerCase().replace(/ /g, '-')}-${productId}`} 
        className="block group"
      >
        {/* Product Image */}
        <div className="aspect-square border border-gray-200 overflow-hidden bg-gray-50 rounded-md relative mb-4 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
          )}
          {productImage ? (
            <img 
              src={productImage} 
              alt={productName} 
              className={`w-full h-full object-contain p-3 transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FaShoppingCart className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="text-center px-2">
          <div className="uppercase text-xs tracking-wider font-medium text-gray-500 mb-2 font-['Poppins']">{categoryName}</div>
          <div className="font-medium text-sm mb-2 line-clamp-2 h-10 group-hover:text-black transition-colors font-['Poppins']">{productName}</div>
          <div className="flex justify-center items-center gap-2">
            <span className="font-bold text-gray-900 font-['Poppins']">
              {DisplayPriceInRupees(discountedPrice)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xs text-gray-400 line-through font-['Poppins']">
                  {DisplayPriceInRupees(price)}
                </span>
                <span className="text-xs font-medium text-green-600 font-['Poppins']">
                  ({discount}% OFF)
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SimpleProductCard;
