import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGlobalContext } from "../provider/GlobalProvider";
import { Link } from "react-router-dom";
import { FaRegHeart, FaHeart, FaShoppingCart, FaTrash ,FaChevronRight ,FaSearch} from "react-icons/fa";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { pricewithDiscount } from "../utils/PriceWithDiscount";
import AddToCartButton from "../components/AddToCartButton";
import ErrorBoundary from "../components/ErrorBoundary";
import toast from "react-hot-toast";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { fetchWishlist, removeFromWishlist } = useGlobalContext();
  const wishlistItems = useSelector((state) => state.wishlist.wishlistItems);
  const loading = useSelector((state) => state.wishlist.loading);
  const [imageLoaded, setImageLoaded] = useState({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Debug: Log wishlist items
  useEffect(() => {
    console.log("Wishlist Items:", wishlistItems);
  }, [wishlistItems]);

  const handleRemoveFromWishlist = async (itemId) => {
    const toastId = toast.loading("Removing from wishlist...");
    try {
      await removeFromWishlist(itemId);
      toast.success("Item removed from wishlist", { id: toastId });
    } catch (error) {
      toast.error("Failed to remove item", { id: toastId });
    }
  };

  const handleImageLoad = (itemId) => {
    setImageLoaded(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="bg-black text-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold font-serif mb-2">My Wishlist</h1>
          <p className="theme-text-secondary text-sm">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaRegHeart className="text-gray-400 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Add items you love to your wishlist. Review them anytime and easily move them to the bag.
            </p>
            <Link
              to="/"
              className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                discountedPrice = pricewithDiscount(price, discount);
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
                <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 relative group">
                  {/* Remove from wishlist button */}
                  <button
                    onClick={() => handleRemoveFromWishlist(item._id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    title="Remove from wishlist"
                  >
                    <FaTrash className="text-red-500 w-4 h-4" />
                  </button>

                  {/* Product Link */}
                  <Link to={productUrl} className="block">
                    {/* Product Image */}
                    <div className="w-full h-48 overflow-hidden bg-gray-100 relative">
                      {!imageLoaded[item._id] && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                      )}
                      <img
                        src={productImage}
                        alt={productName}
                        className={`w-full h-full object-contain transition-all duration-500 ${
                          imageLoaded[item._id] ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(item._id)}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                        {isBundle ? 'Bundle' : (product.category?.[0]?.name || 'Fashion')}
                      </div>
                      <h3 className="text-gray-900 font-medium text-sm line-clamp-2 h-10 mb-2">
                        {productName}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-bold text-gray-900">
                          {DisplayPriceInRupees(discountedPrice)}
                        </span>
                        {discount > 0 && (
                          <span className="text-sm text-gray-500 line-through">
                            {DisplayPriceInRupees(price)}
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="text-xs text-green-600 font-semibold">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <AddToCartButton data={product} customClass="w-full py-2" />
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