import React, { useState, useEffect } from "react";
import { FaGift, FaShoppingCart, FaHeart, FaStar, FaFilter, FaSearch, FaChevronLeft, FaChevronRight, FaEye } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import useCart from "../hooks/useCart";
import { useSelector } from "react-redux";
import CountdownTimer from "../components/CountdownTimer";
import NoHeaderLayout from "../layout/NoHeaderLayout";

const BundleOffers = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [imageIndexes, setImageIndexes] = useState({}); // Track current image index for each bundle
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});

  // Cart hook and user state
  const { addBundleToCart, loading: cartLoading } = useCart();
  const user = useSelector(state => state?.user);

  // Fetch bundles from API
  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`${SummaryApi.getBundles.url}?clientView=true`);
      
      if (response.data.success) {
        const bundleData = Array.isArray(response.data.data) ? response.data.data : [];
        setBundles(bundleData); // Backend already filters for active, time-valid bundles
      }
    } catch (error) {
      console.error("Error fetching bundles:", error);
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  };

  // Load bundles on component mount
  useEffect(() => {
    fetchBundles();
  }, []);

  // Auto-rotate images for better showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndexes(prev => {
        const newIndexes = { ...prev };
        bundles.forEach(bundle => {
          // Skip if paused (on hover)
          if (prev[`${bundle._id}_paused`]) return;
          
          const allImages = getAllBundleImages(bundle);
          if (allImages.length > 1) {
            newIndexes[bundle._id] = ((newIndexes[bundle._id] || 0) + 1) % allImages.length;
          }
        });
        return newIndexes;
      });
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [bundles]);

  // Fetch wishlist data when user logs in
  useEffect(() => {
    if (user?._id) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  // Fetch wishlist data
  const fetchWishlist = async () => {
    if (!user?._id) return;
    
    try {
      const response = await Axios.get(SummaryApi.getWishlist.url);
      if (response.data.success) {
        // Handle different possible data structures
        const wishlistData = response.data.data || response.data.wishlist || [];
        console.log("Wishlist data:", wishlistData); // Debug log
        
        if (Array.isArray(wishlistData)) {
          const wishlistBundleIds = wishlistData
            .filter(item => item.bundleId)
            .map(item => item.bundleId._id);
          setWishlistItems(wishlistBundleIds);
        } else {
          console.warn("Wishlist data is not an array:", wishlistData);
          setWishlistItems([]);
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (e, bundleId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?._id) {
      toast.error('Please login to manage wishlist');
      return;
    }

    setWishlistLoading(prev => ({ ...prev, [bundleId]: true }));
    
    try {
      const isInWishlist = wishlistItems.includes(bundleId);
      
      if (isInWishlist) {
        // Remove from wishlist
        console.log("Removing from wishlist, bundleId:", bundleId);
        const response = await Axios.post(SummaryApi.removeFromWishlist.url, {
          bundleId
        });
        console.log("Remove response:", response.data);
        
        if (response.data.success) {
          setWishlistItems(prev => prev.filter(id => id !== bundleId));
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
          setWishlistItems(prev => [...prev, bundleId]);
          toast.success('Added to wishlist');
        } else {
          toast.error(response.data.message || 'Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      console.error("Error details:", error.response?.data);
      
      const isInWishlist = wishlistItems.includes(bundleId);
      const errorMessage = error.response?.data?.message || 
                          (isInWishlist ? 'Failed to remove from wishlist' : 'Failed to add to wishlist');
      toast.error(errorMessage);
    } finally {
      setWishlistLoading(prev => ({ ...prev, [bundleId]: false }));
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
  const nextImage = (e, bundleId, totalImages) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndexes(prev => ({
      ...prev,
      [bundleId]: ((prev[bundleId] || 0) + 1) % totalImages
    }));
  };

  // Navigate to previous image  
  const prevImage = (e, bundleId, totalImages) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndexes(prev => ({
      ...prev,
      [bundleId]: ((prev[bundleId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  // Generate enhanced description based on items
  const getEnhancedDescription = (bundle) => {
    if (bundle.description) {
      return bundle.description;
    }
    
    if (bundle.items && bundle.items.length > 0) {
      const itemNames = bundle.items.slice(0, 3).map(item => item.name).join(', ');
      const remaining = bundle.items.length > 3 ? ` and ${bundle.items.length - 3} more items` : '';
      return `Complete bundle featuring ${itemNames}${remaining}. Save big with this curated collection!`;
    }
    
    return 'Amazing bundle deal with great savings!';
  };

  // Filter and sort bundles
  const getFilteredAndSortedBundles = () => {
    let filtered = bundles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bundle => 
        bundle.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bundle.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by price range
    if (priceRange !== "all") {
      switch (priceRange) {
        case "under-1000":
          filtered = filtered.filter(bundle => (bundle.bundlePrice || 0) < 1000);
          break;
        case "1000-2500":
          filtered = filtered.filter(bundle => (bundle.bundlePrice || 0) >= 1000 && (bundle.bundlePrice || 0) <= 2500);
          break;
        case "2500-5000":
          filtered = filtered.filter(bundle => (bundle.bundlePrice || 0) > 2500 && (bundle.bundlePrice || 0) <= 5000);
          break;
        case "above-5000":
          filtered = filtered.filter(bundle => (bundle.bundlePrice || 0) > 5000);
          break;
        default:
          break;
      }
    }

    // Sort bundles
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => (a.bundlePrice || 0) - (b.bundlePrice || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.bundlePrice || 0) - (a.bundlePrice || 0));
        break;
      case "discount":
        filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    return filtered;
  };

  const filteredBundles = getFilteredAndSortedBundles();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Handle adding bundle to cart
  const handleAddToCart = async (bundleId) => {
    if (!user?._id) {
      toast.error('Please login to add items to cart');
      return;
    }

    console.log('Adding bundle to cart:', bundleId);
    
    try {
      const result = await addBundleToCart(bundleId);
      console.log('Add to cart result:', result);
      
      if (result.success) {
        // Optional: You can add any additional success handling here
      } else {
        console.error('Failed to add bundle to cart:', result.error);
      }
    } catch (error) {
      console.error('Error adding bundle to cart:', error);
    }
  };

  return (
    <NoHeaderLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative bg-black text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <FaGift className="text-6xl md:text-8xl animate-bounce text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white">
              Complete Bundle Collection
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
              Explore our entire collection of curated bundle offers with amazing savings
            </p>
            
            {/* Countdown Timer */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto border border-gray-700">
              <p className="text-sm mb-4 font-medium text-gray-200">⚡ Limited Time Offer:</p>
              <CountdownTimer 
                endDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
                startDate={new Date().toISOString()}
              />
            </div>
          </motion.div>
        </div>
        </div>

      {/* Filters and Search Section */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Price:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="all">All Prices</option>
                <option value="under-1000">Under ₹1,000</option>
                <option value="1000-2500">₹1,000 - ₹2,500</option>
                <option value="2500-5000">₹2,500 - ₹5,000</option>
                <option value="above-5000">Above ₹5,000</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Container for Bundle Section */}
      <div className="container mx-auto px-4 py-8 bg-white">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredBundles.length} of {bundles.length} bundles
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Bundle Collection Section */}
        <div className="mb-12">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">Bundle Collection</h2>
            <p className="text-gray-600">Discover amazing bundle deals with great savings</p>
          </div>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <AnimatePresence>
            {loading ? (
              // Loading skeletons
              [...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
                  {/* Mobile/Tablet Layout */}
                  <div className="block lg:hidden">
                    <div className="h-64 bg-gray-300"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  {/* Large Screen Layout */}
                  <div className="hidden lg:flex">
                    <div className="w-1/2 h-80 bg-gray-300"></div>
                    <div className="w-1/2 p-6 flex flex-col justify-between">
                      <div>
                        <div className="h-6 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded mb-4"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                      </div>
                      <div className="h-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              filteredBundles.map((bundle) => (
                <motion.div
                  key={bundle._id}
                  variants={itemVariants}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-gray-400 transition-all duration-500 relative group transform hover:-translate-y-1"
                  onMouseEnter={() => {
                    // Pause auto-rotation on hover
                    const allImages = getAllBundleImages(bundle);
                    if (allImages.length > 1) {
                      setImageIndexes(prev => ({ ...prev, [`${bundle._id}_paused`]: true }));
                    }
                  }}
                  onMouseLeave={() => {
                    // Resume auto-rotation on mouse leave
                    setImageIndexes(prev => {
                      const { [`${bundle._id}_paused`]: removed, ...rest } = prev;
                      return rest;
                    });
                  }}
                >
                  {/* Mobile/Tablet Layout (Vertical) */}
                  <div className="block lg:hidden">
                    {/* Tag */}
                    {bundle.tag && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-black">
                          {bundle.tag}
                        </span>
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => handleWishlistToggle(e, bundle._id)}
                      disabled={wishlistLoading[bundle._id]}
                      className={`absolute top-4 right-4 z-10 p-2 rounded-full border transition-all duration-200 ${
                        wishlistItems.includes(bundle._id)
                          ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100'
                          : 'bg-white border-gray-300 text-gray-400 hover:border-black hover:text-black'
                      } ${wishlistLoading[bundle._id] ? 'animate-pulse' : ''}`}
                    >
                      <FaHeart className={`w-4 h-4 ${wishlistItems.includes(bundle._id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center justify-center">
                      <Link
                        to={`/bundle/${bundle._id}`}
                        className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0"
                      >
                        <FaEye className="w-4 h-4" />
                        Quick View
                      </Link>
                    </div>

                    {/* Clickable Content */}
                    <Link 
                      to={`/bundle/${bundle._id}`}
                      className="block"
                    >
                      {/* Enhanced Product Images Carousel */}
                      <div className="relative h-72 bg-gray-100 overflow-hidden rounded-t-2xl">
                        {(() => {
                          const allImages = getAllBundleImages(bundle);
                          const currentIndex = imageIndexes[bundle._id] || 0;
                          const currentImage = allImages[currentIndex];
                          
                          return (
                            <>
                              {/* Main Image */}
                              <motion.img
                                key={currentIndex}
                                src={currentImage}
                                alt={bundle.title}
                                className="w-full h-full object-cover"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                              
                              {/* Navigation Arrows - Only show if multiple images */}
                              {allImages.length > 1 && (
                                <>
                                  <button
                                    onClick={(e) => prevImage(e, bundle._id, allImages.length)}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  >
                                    <FaChevronLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => nextImage(e, bundle._id, allImages.length)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  >
                                    <FaChevronRight className="w-3 h-3" />
                                  </button>
                                  
                                  {/* Image Indicators */}
                                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                                    {allImages.map((_, index) => (
                                      <button
                                        key={index}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setImageIndexes(prev => ({
                                            ...prev,
                                            [bundle._id]: index
                                          }));
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                          index === currentIndex ? 'bg-white' : 'bg-white/50'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                              
                              {/* Bundle composition overlay for item-based bundles */}
                              {bundle.items && bundle.items.length > 0 && allImages.length > bundle.images?.length && (
                                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
                                  {bundle.items.length} Items
                                </div>
                              )}
                            </>
                          );
                        })()}
                        
                        {/* Discount Badge */}
                        <div className="absolute bottom-4 right-4 bg-black text-white px-3 py-1 rounded-full font-bold text-sm">
                          {bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% OFF
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-black mb-2">{bundle.title}</h3>
                        
                        {/* Enhanced Description */}
                        <div className="mb-4">
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {getEnhancedDescription(bundle)}
                          </p>
                        </div>

                        {/* Enhanced Price Section */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg mb-4 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-2xl font-bold text-black">
                                ₹{bundle.bundlePrice?.toLocaleString()}
                              </span>
                              <span className="text-lg text-gray-500 line-through ml-2">
                                ₹{bundle.originalPrice?.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-green-600 font-bold text-lg">
                                Save ₹{((bundle.originalPrice || 0) - (bundle.bundlePrice || 0)).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% OFF
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stock Status */}
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          {bundle.stock > 0 ? (
                            <span className={`font-medium ${bundle.stock < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                              {bundle.stock < 10 ? `Only ${bundle.stock} left in stock!` : 'In Stock'}
                            </span>
                          ) : (
                            <span className="text-red-500 font-medium">Out of Stock</span>
                          )}
                        </div>
                        
                        {/* Time-Limited Offer Countdown */}
                        {bundle.isTimeLimited && (
                          <div className="mb-4">
                            <CountdownTimer 
                              endDate={bundle.endDate}
                              startDate={bundle.startDate}
                              onExpire={() => fetchBundles()} // Refresh when expired
                            />
                          </div>
                        )}

                        {/* Enhanced Items List with Descriptions */}
                        {bundle.items && bundle.items.length > 0 && (
                          <motion.div
                            initial={{ opacity: 1, height: "auto" }}
                            className="mb-4"
                          >
                            <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                              <FaGift className="w-4 h-4" />
                              What's Included ({bundle.items.length} items):
                            </h4>
                            <div className="space-y-2">
                              {bundle.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                  <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-black truncate">{item.name}</p>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                    )}
                                    {item.price && (
                                      <p className="text-xs text-gray-600 font-medium">₹{item.price.toLocaleString()}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {bundle.items.length > 3 && (
                                <div className="text-center">
                                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                                    +{bundle.items.length - 3} more premium items included
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </Link>

                    {/* Action Button - Outside Link */}
                    <div className="px-6 pb-6">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(bundle._id);
                        }}
                        disabled={cartLoading || (bundle.stock && bundle.stock <= 0)}
                        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
                      >
                        <FaShoppingCart className={`w-4 h-4 ${cartLoading ? 'animate-spin' : ''}`} />
                        {cartLoading ? 'Adding...' : bundle.stock && bundle.stock <= 0 ? 'Out of Stock' : 'Add Bundle to Cart'}
                      </button>
                    </div>
                  </div>

                  {/* Large Screen Layout (Horizontal) */}
                  <div className="hidden lg:flex h-80">
                    {/* Left Side - Images */}
                    <div className="w-1/2 relative">
                      {/* Tag */}
                      {bundle.tag && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-black">
                            {bundle.tag}
                          </span>
                        </div>
                      )}

                      {/* Enhanced Product Images Carousel */}
                      <div className="relative h-full bg-gray-100 overflow-hidden rounded-l-2xl">
                        {(() => {
                          const allImages = getAllBundleImages(bundle);
                          const currentIndex = imageIndexes[bundle._id] || 0;
                          const currentImage = allImages[currentIndex];
                          
                          return (
                            <>
                              {/* Main Image */}
                              <motion.img
                                key={currentIndex}
                                src={currentImage}
                                alt={bundle.title}
                                className="w-full h-full object-cover"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                              
                              {/* Navigation Arrows - Only show if multiple images */}
                              {allImages.length > 1 && (
                                <>
                                  <button
                                    onClick={(e) => prevImage(e, bundle._id, allImages.length)}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  >
                                    <FaChevronLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => nextImage(e, bundle._id, allImages.length)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  >
                                    <FaChevronRight className="w-3 h-3" />
                                  </button>
                                  
                                  {/* Image Indicators */}
                                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                                    {allImages.map((_, index) => (
                                      <button
                                        key={index}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setImageIndexes(prev => ({
                                            ...prev,
                                            [bundle._id]: index
                                          }));
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                          index === currentIndex ? 'bg-white' : 'bg-white/50'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                              
                              {/* Bundle composition overlay for item-based bundles */}
                              {bundle.items && bundle.items.length > 0 && allImages.length > bundle.images?.length && (
                                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
                                  {bundle.items.length} Items
                                </div>
                              )}
                            </>
                          );
                        })()}
                        
                        {/* Discount Badge */}
                        <div className="absolute bottom-4 right-4 bg-black text-white px-3 py-1 rounded-full font-bold text-sm">
                          {bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% OFF
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Description */}
                    <div className="w-1/2 flex flex-col">
                      {/* Wishlist Button */}
                      <button 
                        onClick={(e) => handleWishlistToggle(e, bundle._id)}
                        disabled={wishlistLoading[bundle._id]}
                        className={`absolute top-4 right-4 z-10 p-2 rounded-full border transition-all duration-200 ${
                          wishlistItems.includes(bundle._id)
                            ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100'
                            : 'bg-white border-gray-300 text-gray-400 hover:border-black hover:text-black'
                        } ${wishlistLoading[bundle._id] ? 'animate-pulse' : ''}`}
                      >
                        <FaHeart className={`w-4 h-4 ${wishlistItems.includes(bundle._id) ? 'fill-current' : ''}`} />
                      </button>

                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center justify-center">
                        <Link
                          to={`/bundle/${bundle._id}`}
                          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0"
                        >
                          <FaEye className="w-4 h-4" />
                          Quick View
                        </Link>
                      </div>

                      {/* Clickable Content */}
                      <Link 
                        to={`/bundle/${bundle._id}`}
                        className="flex-1 flex flex-col"
                      >
                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-black mb-2">{bundle.title}</h3>
                            
                            {/* Enhanced Description */}
                            <div className="mb-4">
                              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                                {getEnhancedDescription(bundle)}
                              </p>
                            </div>
                            
                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-4">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(bundle.rating || 0)
                                        ? "text-black"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                {(bundle.rating || 0).toFixed(1)} ({bundle.reviews || 0})
                              </span>
                            </div>

                            {/* Enhanced Items List - Condensed for side layout */}
                            {bundle.items && bundle.items.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold text-black mb-2 flex items-center gap-2 text-sm">
                                  <FaGift className="w-3 h-3" />
                                  Includes {bundle.items.length} items:
                                </h4>
                                <div className="text-xs text-gray-600 space-y-1">
                                  {bundle.items.slice(0, 2).map((item, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                      <div className="w-1 h-1 bg-black rounded-full"></div>
                                      <span className="truncate">{item.name}</span>
                                    </div>
                                  ))}
                                  {bundle.items.length > 2 && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                      <span className="text-gray-500">+{bundle.items.length - 2} more items</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            {/* Enhanced Price Section */}
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg mb-4 border border-green-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xl font-bold text-black">
                                    ₹{bundle.bundlePrice?.toLocaleString()}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ₹{bundle.originalPrice?.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-green-600 font-bold text-sm">
                                    Save ₹{((bundle.originalPrice || 0) - (bundle.bundlePrice || 0)).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% OFF
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Stock Status */}
                            <div className="flex items-center gap-2 mb-3 text-sm">
                              {bundle.stock > 0 ? (
                                <span className={`font-medium ${bundle.stock < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                                  {bundle.stock < 10 ? `Only ${bundle.stock} left!` : 'In Stock'}
                                </span>
                              ) : (
                                <span className="text-red-500 font-medium">Out of Stock</span>
                              )}
                            </div>
                            
                            {/* Time-Limited Offer Countdown */}
                            {bundle.isTimeLimited && (
                              <div className="mb-4">
                                <CountdownTimer 
                                  endDate={bundle.endDate}
                                  startDate={bundle.startDate}
                                  onExpire={() => fetchBundles()} // Refresh when expired
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Action Button - Outside Link */}
                      <div className="px-6 pb-6">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(bundle._id);
                          }}
                          disabled={cartLoading || (bundle.stock && bundle.stock <= 0)}
                          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
                        >
                          <FaShoppingCart className={`w-4 h-4 ${cartLoading ? 'animate-spin' : ''}`} />
                          {cartLoading ? 'Adding...' : bundle.stock && bundle.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {!loading && filteredBundles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FaGift className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-black mb-2">No bundles found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No bundles match your search "${searchTerm}"`
                : "Try adjusting your filters or check back later for new offers!"
              }
            </p>
            {(searchTerm || priceRange !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPriceRange("all");
                  setSortBy("newest");
                }}
                className="bg-black text-white px-6 py-2 rounded-lg font-semibold"
              >
                Clear All Filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-black text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Found the Perfect Bundle?
          </h2>
          <p className="text-lg mb-6 max-w-xl mx-auto text-gray-200">
            Continue shopping for individual items or explore more collections
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors border-2 border-white"
          >
            <FaShoppingCart />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
    </NoHeaderLayout>
  );
};

export default BundleOffers;
