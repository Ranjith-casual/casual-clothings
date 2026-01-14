import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Axios from "../utils/Axios.js";
import { Link } from "react-router-dom";
import { FaRegHeart, FaHeart, FaShoppingCart, FaTrash ,FaChevronRight ,FaSearch} from "react-icons/fa";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { PricingService } from "../utils/PricingService";
import AddToCartButton from "../components/AddToCartButton";
import ErrorBoundary from "../components/ErrorBoundary";
import toast from "react-hot-toast";
import { setWishlistItems, removeWishlistItem, setWishlistLoading } from "../store/wishlistSlice.js";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.wishlistItems);
  const loading = useSelector((state) => state.wishlist.loading);
  const [imageLoaded, setImageLoaded] = useState({});

  // Implement wishlist functions directly
  const fetchWishlist = async () => {
    dispatch(setWishlistLoading(true));
    try {
      const response = await Axios({
        url: '/api/wishlist/get',
        method: 'get'
      });
      
      if (response.data.success) {
        dispatch(setWishlistItems(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Could not load wishlist items");
    } finally {
      dispatch(setWishlistLoading(false));
    }
  };
  
  const removeFromWishlist = async (wishlistItemId) => {
    try {
      // Find the item in the wishlist to get productId or bundleId
      const item = wishlistItems.find(item => item._id === wishlistItemId);
      
      if (!item) {
        throw new Error("Item not found in wishlist");
      }
      
      // Determine if it's a product or bundle
      const isBundle = !!item.bundleId;
      const itemId = isBundle ? item.bundleId._id : item.productId._id;
      const data = isBundle ? { bundleId: itemId } : { productId: itemId };
      
      console.log(`Removing ${isBundle ? 'bundle' : 'product'} with ID:`, itemId);
      
      const response = await Axios({
        url: "/api/wishlist/remove",
        method: 'post',
        data: data
      });
      
      console.log("API response:", response.data);
      
      if (response.data.success) {
        // Remove from local state using the wishlist item ID
        dispatch(removeWishlistItem(wishlistItemId));
        return true;
      } else {
        console.error("API returned success:false:", response.data);
        throw new Error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Debug: Log wishlist items
  useEffect(() => {
    console.log("Wishlist Items:", wishlistItems);
  }, [wishlistItems]);

  const handleRemoveFromWishlist = async (itemId) => {
    if (!itemId) {
      toast.error("Invalid item ID");
      return;
    }
    
    const toastId = toast.loading("Removing from wishlist...");
    try {
      const success = await removeFromWishlist(itemId);
      if (success) {
        toast.success("Item removed from wishlist", { id: toastId });
      } else {
        // This branch shouldn't execute since errors are thrown, but just in case
        toast.error("Couldn't remove item from wishlist", { id: toastId });
      }
    } catch (error) {
      console.error("Error in handleRemoveFromWishlist:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Failed to remove item";
      toast.error(errorMessage, { id: toastId });
      
      // Refresh wishlist to ensure UI is in sync with the backend
      fetchWishlist();
    }
  };

  const handleImageLoad = (itemId) => {
    setImageLoaded(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  return (
    <div className="bg-white min-h-screen font-['Inter']">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold font-['Playfair_Display'] text-black mb-2">My Wishlist</h1>
          <p className="text-gray-600 text-sm">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white rounded border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100"></div>
                <div className="p-3">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5 mt-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded border border-gray-100 p-6 sm:p-8 text-center max-w-md mx-auto">
            <FaRegHeart className="text-gray-300 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-medium text-black mb-2 font-['Playfair_Display']">Your wishlist is empty</h2>
            <p className="text-gray-600 text-sm mb-6">
              Add items you love to your wishlist. Review them anytime and easily move them to the bag.
            </p>
            <Link
              to="/"
              className="inline-block bg-black text-white px-5 sm:px-6 py-2 sm:py-3 rounded hover:bg-gray-800 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {wishlistItems.map((item) => {
              // Handle both product and bundle items
              const product = item.productId || item.bundleId;
              if (!product) return null;
              
              const isBundle = !!item.bundleId;
              
              // Handle different pricing structures
              let price, discount, discountedPrice, productImage, productName;
              
              if (isBundle) {
                price = product.originalPrice || 0;
                discount = product.discount || 0;
                discountedPrice = product.bundlePrice || price;
                productImage = product.images?.[0] || '';
                productName = product.title || 'Bundle';
              } else {
                price = product.price || 0;
                discount = product.discount || 0;
                discountedPrice = PricingService.applyDiscount(price, discount);
                productImage = product.image?.[0] || '';
                productName = product.name || 'Product';
              }
              
              // Create clean URL-friendly name
              const cleanName = productName
                .trim()
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')  // Remove special chars except spaces and hyphens
                .replace(/\s+/g, '-');      // Replace spaces with hyphens
                
              const productUrl = isBundle
                ? `/bundle/${cleanName}-${product._id}`
                : `/product/${cleanName}-${product._id}`;
              
              return (
                <div key={item._id} className="bg-white border border-gray-100 overflow-hidden relative group transition-all hover:border-gray-300">
                  {/* Remove from wishlist button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFromWishlist(item._id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white border border-gray-100 rounded-full z-10 opacity-0 md:opacity-0 group-hover:opacity-100 transition-all hover:border-gray-300"
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <FaTrash className="text-gray-500 hover:text-red-500 w-3 h-3" />
                  </button>

                  {/* Product Link */}
                  <Link to={productUrl} className="block">
                    {/* Product Image */}
                    <div className="w-full aspect-square overflow-hidden bg-gray-50 relative">
                      {!imageLoaded[item._id] && (
                        <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
                      )}
                      <img
                        src={productImage}
                        alt={productName}
                        className={`w-full h-full object-contain transition-all duration-300 ${
                          imageLoaded[item._id] ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(item._id)}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {isBundle ? 'Bundle' : (product.category?.[0]?.name || 'Fashion')}
                      </div>
                      <h3 className="text-black font-medium text-sm line-clamp-2 h-10 mb-1">
                        {productName}
                      </h3>
                      <div className="flex items-center flex-wrap gap-1.5 mb-3">
                        <span className="font-semibold text-black text-sm">
                          {DisplayPriceInRupees(discountedPrice)}
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-gray-500 line-through">
                            {DisplayPriceInRupees(price)}
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="text-xs text-green-600 font-medium ml-auto">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      <div>
                        <AddToCartButton data={product} customClass="w-full py-1.5 text-sm" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap with ErrorBoundary for better error handling
const WishlistPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <WishlistPage />
  </ErrorBoundary>
);

export default WishlistPageWithErrorBoundary;