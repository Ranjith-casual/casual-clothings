import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import noCart from '../assets/Empty-cuate.png'; // Import fallback image

/**
 * ProductImageLink - A reusable component for displaying clickable product images 
 * that navigate to the product display page when clicked.
 * 
 * @param {Object} props - Component props
 * @param {string} props.imageUrl - URL of the product image
 * @param {string} props.productId - ID of the product
 * @param {string} props.alt - Alternative text for the image
 * @param {Object} props.imageStyle - Custom styles for the image
 * @param {Object} props.containerStyle - Custom styles for the container
 * @param {string} props.className - Additional CSS classes for the container
 * @param {string} props.imageClassName - Additional CSS classes for the image
 * @param {Function} props.onClick - Optional click handler
 * @param {boolean} props.disableNavigation - If true, will not navigate (useful for modals)
 * @param {number} props.width - Width of the image container
 * @param {number} props.height - Height of the image container
 * @returns {React.Element} A clickable product image component
 */
const ProductImageLink = ({ 
  imageUrl, 
  productId, 
  alt = "Product Image",
  imageStyle = {},
  containerStyle = {},
  className = "", 
  imageClassName = "",
  onClick,
  disableNavigation = false,
  width,
  height
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  // If the image URL is an array, use the first image
  const finalImageUrl = Array.isArray(imageUrl) && imageUrl.length > 0 
    ? imageUrl[0] 
    : (imageUrl || noCart);
  
  // Handle click event
  const handleClick = (e) => {
    // Call the optional onClick handler if provided
    if (onClick && typeof onClick === 'function') {
      onClick(e);
    }
    
    // Navigate to product page if navigation is not disabled
    if (!disableNavigation && productId) {
      // Generate a SEO-friendly URL with product ID at the end
      // We'll use "product-" prefix and then ID
      navigate(`/product/product-${productId}`);
      
      // If you want to use just the ID without prefix, uncomment this:
      // navigate(`/product/${productId}`);
    }
  };

  // Default container dimensions
  const containerDimensions = {
    width: width || 'auto',
    height: height || 'auto',
  };

  // Hover effect styles
  const hoverStyles = isHovered ? {
    transform: 'scale(1.05)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  } : {};

  return (
    <div 
      className={`cursor-pointer relative overflow-hidden transition-all duration-300 ${className}`}
      style={{ 
        ...containerDimensions,
        ...containerStyle
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-product-id={productId}
      role="button"
      aria-label={`View details for ${alt}`}
    >
      <img
        src={finalImageUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-300 ${imageClassName}`}
        style={{
          ...imageStyle,
          ...hoverStyles
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = noCart;
        }}
        loading="lazy"
      />
      {isHovered && (
        <div className="absolute inset-0 bg-opacity-10 flex items-center justify-center transition-opacity duration-300">
        
        </div>
      )}
    </div>
  );
};

ProductImageLink.propTypes = {
  imageUrl: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  productId: PropTypes.string.isRequired,
  alt: PropTypes.string,
  imageStyle: PropTypes.object,
  containerStyle: PropTypes.object,
  className: PropTypes.string,
  imageClassName: PropTypes.string,
  onClick: PropTypes.func,
  disableNavigation: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default ProductImageLink;
