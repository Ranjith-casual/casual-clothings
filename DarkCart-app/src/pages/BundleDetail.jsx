import React, { useState, useEffect, useRef } from "react";
import { FaGift, FaShoppingCart, FaHeart, FaStar, FaArrowLeft, FaCheck, FaShoppingBag, FaChevronLeft, FaChevronRight, FaTimes, FaEye } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import useCart from "../hooks/useCart";
import { useSelector } from "react-redux";
import CountdownTimer from "../components/CountdownTimer";
import { useGlobalContext } from "../provider/GlobalProvider";

const BundleDetail = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [cartBundleQuantity, setCartBundleQuantity] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Cart hook and user state
  const { addBundleToCart, loading: cartLoading, fetchCartData, cartData, updateBundleInCart } = useCart();
  const { fetchCartItems } = useGlobalContext();
  const user = useSelector(state => state?.user);
  const cartItem = useSelector(state => state.cartItem.cart); // Listen to global cart state

  // Fetch bundle details from API
  const fetchBundleDetails = async () => {
    try {
      setLoading(true);
      // Extract the actual ID if it comes from a URL like "/bundle/name-id"
      const actualBundleId = bundleId.includes('-') 
        ? bundleId.split('-').pop() 
        : bundleId;
        
      console.log("Fetching bundle with ID:", actualBundleId);
      const response = await Axios.get(`${SummaryApi.getBundles.url}/${actualBundleId}`);
      
      if (response.data.success) {
        setBundle(response.data.data);
      } else {
        toast.error("Bundle not found");
        // Don't auto-navigate, let user go back manually
      }
    } catch (error) {
      console.error("Error fetching bundle details:", error);
      toast.error("Failed to load bundle details");
      // Don't auto-navigate, let user go back manually
    } finally {
      setLoading(false);
    }
  };

  // Load bundle details on component mount
  useEffect(() => {
    if (bundleId) {
      fetchBundleDetails();
    }
  }, [bundleId]);

  // Check if bundle is in cart and wishlist
  useEffect(() => {
    if (user?._id && bundle?._id) {
      checkCartAndWishlistStatus();
    }
  }, [user, bundle, cartData]);

  // Listen to global cart changes and refresh local cart data
  useEffect(() => {
    if (user?._id && bundleId && cartItem) {
      // When global cart state changes, refresh local cart data
      fetchCartData(false); // false to avoid infinite loops
      
      // Update local cart bundle quantity from global state
      const cartBundle = cartItem.find(item => 
        item.itemType === 'bundle' && item.bundleId?._id === bundleId
      );
      setCartBundleQuantity(cartBundle ? cartBundle.quantity : 0);
    }
  }, [cartItem, user, bundleId, fetchCartData]);

  // Check cart and wishlist status
  const checkCartAndWishlistStatus = async () => {
    try {
      // Check cart status - prioritize global cart state for real-time updates
      let cartBundle = null;
      
      // First check global cart state (most up-to-date)
      if (cartItem && cartItem.length > 0) {
        cartBundle = cartItem.find(item => 
          item.itemType === 'bundle' && item.bundleId?._id === bundleId
        );
      }
      
      // If not found in global state, check local cart data
      if (!cartBundle && cartData && cartData.length > 0) {
        cartBundle = cartData.find(item => item.bundleId?._id === bundleId);
      }
      
      setCartBundleQuantity(cartBundle ? cartBundle.quantity : 0);

      // Check wishlist status
      const response = await Axios.get(SummaryApi.getWishlist.url);
      if (response.data.success) {
        // Handle different possible data structures
        const wishlistData = response.data.data || response.data.wishlist || [];
        console.log("Wishlist data:", wishlistData); // Debug log
        
        if (Array.isArray(wishlistData)) {
          const isInList = wishlistData.some(item => 
            item.bundleId && item.bundleId._id === bundleId
          );
          setIsInWishlist(isInList);
        } else {
          console.warn("Wishlist data is not an array:", wishlistData);
          setIsInWishlist(false);
        }
      }
    } catch (error) {
      console.error("Error checking cart/wishlist status:", error);
      // Set defaults on error to prevent crashes
      setIsInWishlist(false);
    }
  };

  // Helper function to get all images for a bundle (bundle images + item images)
  const getAllBundleImages = (bundle) => {
    const images = [];
    
    // Add bundle images first
    if (bundle.images && bundle.images.length > 0) {
      images.push(...bundle.images);
    }
    
    // Add item images
    if (bundle.items && bundle.items.length > 0) {
      bundle.items.forEach(item => {
        if (item.image) {
          images.push(item.image);
        }
      });
    }
    
    return images.length > 0 ? images : ['/placeholder.jpg'];
  };

  // Navigate to next image
  const nextImage = () => {
    const allImages = getAllBundleImages(bundle);
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  // Navigate to previous image  
  const prevImage = () => {
    const allImages = getAllBundleImages(bundle);
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Handle product click to show modal
  const handleProductClick = (item) => {
    setSelectedProduct(item);
    setShowProductModal(true);
  };

  // Close product modal
  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // Handle adding bundle to cart
  const handleAddToCart = async () => {
    if (!user?._id) {
      toast.error('Please login to add items to cart');
      return;
    }

    const result = await addBundleToCart(bundleId, quantity);
    if (result.success) {
      setCartBundleQuantity(prev => prev + quantity);
      // Optional: You can add any additional success handling here
    }
  };

  // Handle cart quantity update
  const handleUpdateCartQuantity = async (newQuantity) => {
    if (!user?._id) {
      toast.error('Please login to update cart');
      return;
    }

    console.log('=== BUNDLE DETAIL: Updating cart quantity ===');
    console.log('Bundle ID:', bundleId);
    console.log('Current quantity:', cartBundleQuantity);
    console.log('New quantity:', newQuantity);
    console.log('Bundle stock:', bundle?.stock);

    try {
      const result = await updateBundleInCart(bundleId, newQuantity);
      console.log('Update result:', result);
      
      if (result.success) {
        setCartBundleQuantity(newQuantity);
        
        // Fetch both local cart data and global cart state
        await fetchCartData(); // Update useCart hook state
        await fetchCartItems(); // Update GlobalProvider and Redux state
        
        toast.success(`Quantity updated to ${newQuantity}`);
      } else {
        toast.error(result.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      toast.error("Failed to update cart");
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!user?._id) {
      toast.error('Please login to manage wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        // Remove from wishlist
        console.log("Removing from wishlist, bundleId:", bundleId);
        const response = await Axios.post(SummaryApi.removeFromWishlist.url, {
          bundleId
        });
        console.log("Remove response:", response.data);
        
        if (response.data.success) {
          setIsInWishlist(false);
          toast.success('Removed from wishlist');
        } else {
          toast.error(response.data.message || 'Failed to remove from wishlist');
        }
      } else {
        // Add to wishlist
        console.log("Adding to wishlist, bundleId:", bundleId);
        const response = await Axios.post(SummaryApi.addToWishlist.url, {
          bundleId: bundleId
        });
        console.log("Add response:", response.data);
        
        if (response.data.success) {
          setIsInWishlist(true);
          toast.success('Added to wishlist');
        } else {
          toast.error(response.data.message || 'Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      console.error("Error details:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          (isInWishlist ? 'Failed to remove from wishlist' : 'Failed to add to wishlist');
      toast.error(errorMessage);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation with back button */}
        <div className="bg-gray-50 border-b border-gray-200 py-4">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-gray-300 rounded w-32 animate-pulse"></div>
              <button 
                onClick={() => navigate(-1)} 
                className="text-sm text-gray-600 hover:text-black flex items-center"
              >
                <span className="mr-1">←</span> Back
              </button>
            </div>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <FaGift className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Bundle Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the bundle you're looking for.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              ← Go Back
            </button>
            <Link
              to="/bundle-offers"
              className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              View All Bundles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
            <nav className="flex items-center space-x-2 text-sm">
              <Link to="/" className="text-gray-600 hover:text-black">Home</Link>
              <span className="text-gray-400">/</span>
              <Link to="/bundle-offers" className="text-gray-600 hover:text-black">Bundle Offers</Link>
              <span className="text-gray-400">/</span>
              <span className="text-black font-medium">{bundle.title}</span>
            </nav>
            
            <button 
              onClick={() => navigate(-1)}
              className="text-sm text-gray-600 hover:text-black flex items-center"
            >
              <span className="mr-1">←</span> Back
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Bundle Details */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Bundle Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative">
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                {(() => {
                  const allImages = getAllBundleImages(bundle);
                  const currentImage = allImages[selectedImageIndex];
                  
                  return (
                    <>
                      {currentImage ? (
                        <motion.img
                          key={selectedImageIndex}
                          src={currentImage}
                          alt={bundle.title}
                          className="w-full h-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaGift className="text-8xl text-gray-400" />
                        </div>
                      )}

                      {/* Navigation Arrows - Only show if multiple images */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200"
                          >
                            <FaChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200"
                          >
                            <FaChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}

                {/* Bundle Tag */}
                {bundle.tag && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-sm font-bold text-white bg-black">
                      {bundle.tag}
                    </span>
                  </div>
                )}

                {/* Discount Badge */}
                <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-full font-bold text-sm">
                  {bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% OFF
                </div>
              </div>
            </div>

            {/* Enhanced Thumbnail Images */}
            {(() => {
              const allImages = getAllBundleImages(bundle);
              return allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index ? 'border-black' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${bundle.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Bundle Information */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">{bundle.title}</h1>
            </div>

            {/* Enhanced Price Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-black">
                  ₹{bundle.bundlePrice?.toLocaleString()}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ₹{bundle.originalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="text-green-600 font-bold text-lg">
                You Save ₹{((bundle.originalPrice || 0) - (bundle.bundlePrice || 0)).toLocaleString()} ({bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% off)
              </div>
            </div>
            
            {/* Timer countdown for limited-time bundles */}
            {bundle.isTimeLimited && (
              <CountdownTimer 
                endDate={bundle.endDate}
                startDate={bundle.startDate}
                onExpire={() => toast.error("This bundle offer has expired!")}
              />
            )}
            
            {/* Stock Status and Count */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {bundle.stock > 0 ? (
                    <>
                      <FaCheck className="text-green-500" />
                      <span className={`font-medium ${bundle.stock < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                        {bundle.stock < 10 ? `Only ${bundle.stock} left in stock!` : 'In Stock'}
                      </span>
                    </>
                  ) : (
                    <span className="text-red-500 font-medium">Out of Stock</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Available Stock</p>
                  <p className={`text-lg font-bold ${bundle.stock < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                    {bundle.stock || 0} units
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {bundle.description && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">About This Bundle</h3>
                <p className="text-gray-600 leading-relaxed">{bundle.description}</p>
              </div>
            )}

            {/* Enhanced Bundle Items */}
            {bundle.items && bundle.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                  <FaGift className="w-5 h-5" />
                  What's Included ({bundle.items.length} items)
                </h3>
                <p className="text-sm text-gray-600 mb-4">Click on any item to view details</p>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {bundle.items.map((item, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleProductClick(item)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                        {item.image ? (
                          <>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                              <FaEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaShoppingBag className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-black group-hover:text-blue-600 transition-colors">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        )}
                        {item.price && (
                          <p className="text-sm text-green-600 font-semibold mt-1">₹{item.price.toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <FaCheck className="text-green-600 w-5 h-5" />
                        <span className="text-xs text-gray-500">View Details</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector - Only show when item is NOT in cart */}
            {/* {cartBundleQuantity === 0 && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-16 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )} */}

            {/* Action Buttons */}
            <div className="space-y-3">
              {cartBundleQuantity > 0 ? (
                // Show quantity controls if item is in cart
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3 text-center">This bundle is in your cart</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleUpdateCartQuantity(Math.max(0, cartBundleQuantity - 1))}
                      disabled={cartLoading}
                      className="w-12 h-12 border-2 border-black rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-black">{cartBundleQuantity}</span>
                      <p className="text-xs text-gray-500">in cart</p>
                    </div>
                    <button
                      onClick={() => handleUpdateCartQuantity(cartBundleQuantity + 1)}
                      disabled={cartLoading || (bundle.stock && cartBundleQuantity >= bundle.stock)}
                      className="w-12 h-12 border-2 border-black rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  {bundle.stock && cartBundleQuantity >= bundle.stock && (
                    <p className="text-xs text-amber-600 text-center mt-2">Maximum stock reached</p>
                  )}
                </div>
              ) : (
                // Show add to cart button if item is not in cart
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading || (bundle.stock && bundle.stock <= 0)}
                  className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-add-to-cart
                >
                  <FaShoppingCart className={`w-5 h-5 ${cartLoading ? 'animate-spin' : ''}`} />
                  {cartLoading ? 'Adding to Cart...' : bundle.stock && bundle.stock <= 0 ? 'Out of Stock' : `Add ${quantity} Bundle${quantity > 1 ? 's' : ''} to Cart`}
                </button>
              )}

              <button 
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isInWishlist 
                    ? 'bg-red-50 border-2 border-red-500 text-red-600 hover:bg-red-100' 
                    : 'border-2 border-black text-black hover:bg-gray-50'
                }`}
              >
                <FaHeart className={`w-5 h-5 ${wishlistLoading ? 'animate-pulse' : ''} ${isInWishlist ? 'fill-current' : ''}`} />
                {wishlistLoading 
                  ? 'Updating...' 
                  : isInWishlist 
                    ? 'Remove from Wishlist' 
                    : 'Add to Wishlist'
                }
              </button>
            </div>

            {/* Additional Info */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FaCheck className="text-green-600" />
                <span>Free shipping on orders over ₹999</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FaCheck className="text-green-600" />
                <span>Easy returns within 30 days</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FaCheck className="text-green-600" />
                <span>Cash on delivery available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeProductModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-black">Product Details</h2>
                <button
                  onClick={closeProductModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Image */}
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      {selectedProduct.image ? (
                        <img
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaShoppingBag className="text-6xl text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">{selectedProduct.name}</h3>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Included in Bundle
                      </span>
                    </div>

                    {selectedProduct.price && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Individual Price</p>
                        <p className="text-2xl font-bold text-black">₹{selectedProduct.price.toLocaleString()}</p>
                      </div>
                    )}

                    {selectedProduct.description && (
                      <div>
                        <h4 className="font-semibold text-black mb-2">Product Description</h4>
                        <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                      </div>
                    )}

                    {/* Product Features */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <FaCheck className="w-4 h-4" />
                        Bundle Benefits
                      </h4>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>✓ Included in bundle at discounted price</li>
                        <li>✓ Premium quality product</li>
                        <li>✓ Perfect compatibility with other bundle items</li>
                        <li>✓ Covered under bundle warranty</li>
                      </ul>
                    </div>

                    {/* Bundle Value Proposition */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Why Buy as Bundle?</h4>
                      <p className="text-sm text-green-700">
                        Get this product along with {bundle.items.length - 1} other premium items at a heavily discounted price. 
                        You save ₹{((bundle.originalPrice || 0) - (bundle.bundlePrice || 0)).toLocaleString()} compared to buying individually!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={closeProductModal}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Close Details
                  </button>
                  <button
                    onClick={() => {
                      closeProductModal();
                      // Scroll to bundle action buttons
                      const actionButtons = document.querySelector('[data-add-to-cart]') || document.querySelector('.space-y-3');
                      if (actionButtons) {
                        actionButtons.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaShoppingCart className="w-4 h-4" />
                    View Bundle Options
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Bundles Section */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">More Bundle Offers</h2>
            <p className="text-gray-600">Discover more amazing bundle deals</p>
          </div>
          
          <div className="flex justify-center">
            <Link
              to="/bundle-offers"
              className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              View All Bundles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleDetail;
