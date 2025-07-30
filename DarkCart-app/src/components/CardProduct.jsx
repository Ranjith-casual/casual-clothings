import React, { useState, useEffect } from "react";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { validURLConvert } from "../utils/validURLConvert";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PricingService } from "../utils/PricingService";
import { useGlobalContext } from "../provider/GlobalProvider";
import { FaShoppingCart, FaBolt} from "react-icons/fa";
import { useSelector } from "react-redux";
import AddToCartButton from "./AddToCartButton";
import BuyNowButton from "./BuyNowButton";
import toast from "react-hot-toast";
import Axios from "../utils/Axios.js";
import SummaryApi from "../common/SummaryApi.js";

// Component to display product name with search highlighting
const ProductNameWithHighlight = ({ name, searchTerm }) => {
  if (!searchTerm || !name) return name || '';
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = name.split(regex);
  
  return (
    <span>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 font-semibold rounded px-1">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

function CardProduct({ data, hideProductInfo = false }) {
  // Early return if data is not available
  if (!data || !data._id) {
    return (
      <div className="bg-white rounded-xl overflow-hidden animate-pulse h-[450px] w-full mx-auto">
        <div className="h-[280px] bg-gray-200"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [processingWishlist, setProcessingWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToWishlist, removeFromWishlist, checkWishlistItem, fetchCartItems } = useGlobalContext();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(state => state.user);
  const cartItems = useSelector((state) => state.cartItem.cart) || [];
  
  // Extract search term from URL params
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('search') || '';
  
  // Safe URL generation with fallbacks
  const productName = data.name || 'product';
  const productId = data._id || '';
  const url = `/product/${validURLConvert(productName)}-${productId}`;

  // Auto-select the first available in-stock size
  useEffect(() => {
    if (!data) return;
    
    // Select the first available size with stock
    if (data.sizes) {
      const availableSizes = Object.entries(data.sizes)
        .filter(([size, stock]) => stock > 0)
        .map(([size]) => size);
      
      if (availableSizes.length > 0) {
        setSelectedSize(availableSizes[0]);
        console.log(`Auto-selected size ${availableSizes[0]} for ${data.name}`);
      }
    } else if (data.stock > 0) {
      // Fallback to a default size if there's general stock but no size-specific stock
      setSelectedSize('L');
    }
  }, [data]);

  // Check if product is in wishlist when component mounts
  useEffect(() => {
    const checkWishlist = async () => {
      // Only check wishlist if user is logged in
      if (productId && user?._id) {
        const isInWishlist = await checkWishlistItem(productId);
        setIsWishlisted(isInWishlist);
      } else {
        setIsWishlisted(false);
      }
    };
    
    checkWishlist();
  }, [productId, user?._id]);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (processingWishlist) return;
    
    setProcessingWishlist(true);
    
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
        setIsWishlisted(false);
      } else {
        await addToWishlist(productId);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
    } finally {
      setProcessingWishlist(false);
    }
  };

  const getStockStatus = () => {
    const stock = data.stock || 0;
    if (stock <= 0) {
      return { text: "Out of Stock", color: "text-red-700 bg-red-100" };
    } else if (stock <= 5) {
      return { text: `Only ${stock} left`, color: "text-amber-700 bg-amber-100" };
    } else if (stock <= 10) {
      return { text: "Limited Stock", color: "text-orange-700 bg-orange-100" };
    } else {
      return { text: "In Stock", color: "text-green-700 bg-green-100" };
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Quick view for:', data.name);
  };
  
  // Add to cart handler
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    // Validate product and size
    if (!data || !data._id) {
      toast.error("Invalid product data");
      return;
    }
    
    if (!selectedSize) {
      toast.error("No available size to select");
      return;
    }
    
    // Check stock
    if (data.sizes && data.sizes[selectedSize] !== undefined) {
      if (data.sizes[selectedSize] <= 0) {
        toast.error(`Size ${selectedSize} is out of stock`);
        return;
      }
    } else if (data.stock !== undefined && data.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if this product with the same size is already in cart
      const existingCartItem = cartItems.find(item => 
        item?.productId && 
        (item.productId === data._id || item.productId?._id === data._id) &&
        item.size === selectedSize
      );
      
      if (existingCartItem) {
        // If already in cart, update quantity
        await Axios({
          ...SummaryApi.updateCartItemQty,
          data: { id: existingCartItem._id, quantity: existingCartItem.quantity + 1 }
        });
        toast.success(`Increased quantity of ${data.name} in cart`);
      } else {
        // Add to cart with selected size
        const sizePrice = selectedSize && data.sizePricing && data.sizePricing[selectedSize] !== undefined
          ? data.sizePricing[selectedSize]
          : data.price;
        
        await Axios({
          ...SummaryApi.addToCart,
          data: { 
            productId: data._id,
            size: selectedSize,
            price: parseFloat(sizePrice)
          }
        });
        toast.success(`Added ${data.name} to cart`);
      }
      
      // Refresh cart items
      fetchCartItems();
      
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login to add items to cart");
        navigate("/login");
      } else {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Buy now handler
  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    // Validate product and size
    if (!data || !data._id) {
      toast.error("Invalid product data");
      return;
    }
    
    if (!selectedSize) {
      toast.error("No available size to select");
      return;
    }
    
    // Check stock
    if (data.sizes && data.sizes[selectedSize] !== undefined) {
      if (data.sizes[selectedSize] <= 0) {
        toast.error(`Size ${selectedSize} is out of stock`);
        return;
      }
    } else if (data.stock !== undefined && data.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if this product with the same size is already in cart
      const existingCartItem = cartItems.find(item => 
        item?.productId && 
        (item.productId === data._id || item.productId?._id === data._id) &&
        item.size === selectedSize
      );
      
      if (existingCartItem) {
        // If already in cart, just navigate to cart page
        toast.success("Item already in your bag, redirecting to checkout");
      } else {
        // Add to cart first
        const sizePrice = selectedSize && data.sizePricing && data.sizePricing[selectedSize] !== undefined
          ? data.sizePricing[selectedSize]
          : data.price;
        
        await Axios({
          ...SummaryApi.addToCart,
          data: { 
            productId: data._id,
            size: selectedSize,
            price: parseFloat(sizePrice)
          }
        });
        
        // Refresh cart items
        fetchCartItems();
      }
      
      // Navigate to cart/checkout page
      navigate('/checkout/bag');
      
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login to buy items");
        navigate("/login");
      } else {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Safe value extraction with fallbacks
  const stockStatus = getStockStatus();
  const price = data.price || 0;
  const discount = data.discount || 0;
  const discountedPrice = PricingService.applyDiscount(price, discount);
  const savings = price - discountedPrice;
  const productImage = data.image?.[0] || '';
  const categoryName = data.category?.[0]?.name || 'Fashion';
  const description = data.description || '';
  const moreDetails = data.more_details || {};
  const createdAt = data.createdAt || new Date();

  return (
    <div className="w-full h-full">
      <Link
        to={url}
        className={`bg-white rounded-lg overflow-hidden flex flex-col w-full relative ${
          hideProductInfo ? 'h-full' : 'h-[440px]'
        }`}
      >
        {/* Product Image Container - Flexible Height */}
        <div className={`relative bg-gray-50 overflow-hidden ${
          hideProductInfo ? 'h-full' : 'h-[240px]'
        }`}>
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
            {/* Stock Status Badge */}
          

            {/* Wishlist Button */}
          </div>

          

          {/* Product Image */}
          <div className="w-full h-full flex items-center justify-center p-6">
            {productImage && !imageError ? (
              <>
                {!imageLoaded && (
                  <div className="w-full h-full bg-gray-200 animate-pulse rounded-md"></div>
                )}
                <img
                  src={productImage}
                  alt={productName}
                  className={`w-full h-full object-contain ${
                    data.stock <= 0 ? 'grayscale opacity-60' : ''
                  } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
                <FaShoppingCart className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Quick View Overlay */}
          {/* <div className={`absolute inset-0 bg-black/10 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center ${
            showQuickActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <button
              onClick={handleQuickView}
              className={`bg-black text-white px-4 py-2 rounded-md shadow-lg transition-all duration-300 hover:bg-gray-800 flex items-center gap-2 text-sm font-medium ${
                showQuickActions ? 'scale-100 translate-y-0' : 'scale-90 translate-y-2'
              }`}
              title="Quick View"
            >
              <FaEye className="w-4 h-4" />
              Quick View
            </button>
          </div> */}
        </div>

        {/* Product Info - Show only if not hidden */}
        {!hideProductInfo && (
          <div className="p-5 flex flex-col h-[200px] justify-center">{/* Increased height to accommodate description */}
            {/* Category */}
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 text-center">
              {categoryName}
            </div>

            {/* Product Name */}
            <div className="font-medium text-gray-900 text-sm leading-tight text-center mb-2 h-10 flex items-center justify-center font-serif">
              <ProductNameWithHighlight name={productName} searchTerm={searchTerm} />
            </div>
            
            {/* Product Description */}
            <div className="text-xs text-gray-500 text-center mb-2 line-clamp-2 h-10 italic font-serif">
              {description ? description.substring(0, 60) + (description.length > 60 ? '...' : '') : 'No description available'}
            </div>

            {/* Price Section */}
            <div className="flex flex-row items-center justify-center gap-2 flex-wrap mb-3">
              {discount > 0 && (
                <span className="text-sm text-gray-400 line-through">
                  {DisplayPriceInRupees(price)}
                </span>
              )}
              <div className="font-semibold text-gray-900 text-lg">
                {DisplayPriceInRupees(discountedPrice)}
              </div>
              {discount > 0 && (
                <span className="text-xs text-red-500 font-medium">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Action Buttons: Add to Cart and Buy Now */}
            <div className="mt-auto flex justify-between w-full gap-2" onClick={(e) => e.preventDefault()}>
              {/* Add to Cart Button */}
           
              
              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={loading || !selectedSize || (data.sizes && data.sizes[selectedSize] <= 0)}
                className="flex-1 bg-white text-black border border-black hover:bg-black hover:text-white transition py-2 text-sm font-medium rounded-md flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaBolt size={14} />
                    <span>Buy Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}

export default CardProduct;
