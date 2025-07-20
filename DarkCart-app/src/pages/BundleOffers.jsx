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

  // Set up infinite carousel rotation on hover
  useEffect(() => {
    // Initialize all bundles to show the first image
    const initialIndexes = {};
    bundles.forEach(bundle => {
      initialIndexes[bundle._id] = 0;
    });
    setImageIndexes(prev => ({...prev, ...initialIndexes}));
    
    // Set up interval for hovering bundles
    const interval = setInterval(() => {
      setImageIndexes(prev => {
        const newIndexes = {...prev};
        
        // Only rotate images for bundles that are being hovered
        Object.keys(prev).forEach(key => {
          // If it's a bundle ID that's being hovered (has _hover suffix)
          if (key.endsWith('_hover')) {
            const bundleId = key.replace('_hover', '');
            const bundle = bundles.find(b => b._id === bundleId);
            if (bundle) {
              const allImages = getAllBundleImages(bundle);
              if (allImages.length > 1) {
                // Move to next image in carousel
                newIndexes[bundleId] = ((newIndexes[bundleId] || 0) + 1) % allImages.length;
              }
            }
          }
        });
        
        return newIndexes;
      });
    }, 2000); // Change image every 2 seconds when hovering
    
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
      <div className="min-h-screen bg-white font-['Inter']">
        {/* Hero Section */}
      
      {/* Filters and Search Section */}
      <div className="bg-white border-b border-gray-100 py-5 sm:py-6">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-200 rounded focus:ring-1 focus:ring-black focus:border-black font-light text-sm bg-white transition-all"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {/* Sort By */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <FaFilter className="text-gray-500 text-xs" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-1 py-1 bg-transparent appearance-none focus:outline-none text-gray-700 text-xs sm:text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <span className="text-gray-700 text-sm">Price:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-1 py-1 bg-transparent appearance-none focus:outline-none text-gray-700 text-xs sm:text-sm"
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
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-black rounded-full"></span>
            Showing <span className="font-medium text-black">{filteredBundles.length}</span> of <span className="font-medium text-black">{bundles.length}</span> bundles
            {searchTerm && <span className="font-medium"> for "<span className="text-black italic">{searchTerm}</span>"</span>}
          </p>
        </div>

        {/* Bundle Collection Section */}
        <div className="mb-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 font-['Playfair_Display']">Bundle Collection</h2>
            <p className="text-gray-600 text-sm">Discover amazing bundle deals with great savings</p>
          </div>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        >
          <AnimatePresence>
            {loading ? (
              // Loading skeletons for grid layout
              [...Array(10)].map((_, index) => (
                <div key={index} className="bg-white rounded border border-gray-100 overflow-hidden animate-pulse h-full">
                  {/* Vertical Layout */}
                  <div className="h-full flex flex-col">
                    <div className="aspect-square bg-gray-100"></div>
                    <div className="p-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mt-auto"></div>
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
                  className="bg-white rounded border border-gray-100 overflow-hidden hover:border-gray-300 transition-all duration-300 relative group h-full flex flex-col"
                  onMouseEnter={() => {
                    // Start auto-rotation when hovering the card
                    const allImages = getAllBundleImages(bundle);
                    if (allImages.length > 1) {
                      setImageIndexes(prev => ({ 
                        ...prev, 
                        [`${bundle._id}_hover`]: true 
                      }));
                    }
                  }}
                  onMouseLeave={() => {
                    // Stop carousel and reset to first image when leaving the card
                    setImageIndexes(prev => {
                      const { [`${bundle._id}_hover`]: removed, ...rest } = prev;
                      // Reset to first image
                      return {...rest, [bundle._id]: 0};
                    });
                  }}
                >
                  {/* Vertical Layout for All Devices */}
                  <div className="flex flex-col h-full">
                    {/* Tag */}
                    {bundle.tag && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium text-white bg-black">
                          {bundle.tag}
                        </span>
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => handleWishlistToggle(e, bundle._id)}
                      disabled={wishlistLoading[bundle._id]}
                      className={`absolute top-2 right-2 z-10 p-1 rounded-full border transition-all duration-200 ${
                        wishlistItems.includes(bundle._id)
                          ? 'bg-white border-gray-300 text-black'
                          : 'bg-white border-gray-200 text-gray-400 hover:text-black hover:border-gray-300'
                      } ${wishlistLoading[bundle._id] ? 'animate-pulse' : ''}`}
                    >
                      <FaHeart className={`w-2.5 h-2.5 ${wishlistItems.includes(bundle._id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Clickable Content */}
                    <Link 
                      to={`/bundle/${bundle._id}`}
                      className="flex flex-col flex-1"
                    >
                      {/* Enhanced Product Images Carousel */}
                      <div className="relative aspect-square bg-white overflow-hidden">
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
                                className="w-full h-full object-contain p-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                              
                              {/* Navigation Arrows - Only show if multiple images and only on image hover */}
                              {allImages.length > 1 && (
                                <div className="image-controls opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={(e) => prevImage(e, bundle._id, allImages.length)}
                                    className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 p-1 rounded-full transition-all duration-200 border border-gray-200"
                                  >
                                    <FaChevronLeft className="w-2 h-2" />
                                  </button>
                                  <button
                                    onClick={(e) => nextImage(e, bundle._id, allImages.length)}
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 p-1 rounded-full transition-all duration-200 border border-gray-200"
                                  >
                                    <FaChevronRight className="w-2 h-2" />
                                  </button>
                                  
                                  {/* Image Indicators */}
                                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
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
                                        className={`w-1 h-1 rounded-full transition-all duration-200 ${
                                          index === currentIndex ? 'bg-black' : 'bg-gray-400'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Bundle composition overlay for item-based bundles */}

                            </>
                          );
                        })()}
                        
                        {/* Discount Badge */}
                       
                      </div>

                      {/* Content */}
                      <div className="p-2.5 flex-1 flex flex-col">
                        <h3 className="text-xs font-medium text-gray-900 mb-0.5 leading-tight line-clamp-1">{bundle.title}</h3>
                        
                        {/* Enhanced Price Section - Simplified */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-medium text-black">
                              ₹{bundle.bundlePrice?.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-500 line-through">
                              ₹{bundle.originalPrice?.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[8px] font-medium px-1 py-0.5 rounded-sm bg-red-500 text-white">
                            {bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% OFF
                          </div>
                        </div>
                        
                        {/* Stock Status - Simplified */}
                        <div className="flex items-center text-[8px] mb-1">
                          {bundle.stock > 0 ? (
                            <span className={`flex items-center gap-0.5 ${bundle.stock < 10 ? 'text-green-600' : 'text-green-600'}`}>
                              <span className={`inline-block w-1 h-1 rounded-full ${bundle.stock < 10 ? 'bg-green-600' : 'bg-green-600'}`}></span>
                              {bundle.stock < 10 ? `Only ${bundle.stock} left` : 'In Stock'}
                            </span>
                          ) : (
                            <span className="text-gray-500 flex items-center gap-0.5">
                              <span className="inline-block w-1 h-1 bg-gray-500 rounded-full"></span>
                              Out of Stock
                            </span>
                          )}
                        </div>
                        
                        {/* Time-Limited Offer Countdown - Smaller */}
                        {bundle.isTimeLimited && (
                          <div className="mb-1">
                            <div className="scale-75 origin-left">
                              <CountdownTimer 
                                endDate={bundle.endDate}
                                startDate={bundle.startDate}
                                onExpire={() => fetchBundles()} // Refresh when expired
                              />
                            </div>
                          </div>
                        )}

                        {/* Condensed Items List - Simpler for grid layout */}
                        {bundle.items && bundle.items.length > 0 && (
                          <div className="flex items-center gap-1 mt-auto">
                            <FaGift className="w-2 h-2 text-gray-500" />
                            <span className="text-[8px] text-gray-600">
                              {bundle.items.length} items included
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                  
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {!loading && filteredBundles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 px-4 max-w-md mx-auto"
          >
            <div className="bg-white p-6 rounded border border-gray-100">
              <FaGift className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-black mb-2 font-['Playfair_Display']">No bundles found</h3>
              <p className="text-gray-600 mb-5 text-sm">
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
                  className="bg-black text-white px-5 py-2 rounded font-medium hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear All Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-white py-10 sm:py-12 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 font-['Playfair_Display']">
            Found the Perfect Bundle?
          </h2>
          <p className="text-sm mb-5 sm:mb-6 mx-auto text-gray-600 max-w-lg">
            Continue shopping for individual items or explore more collections
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-black text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded font-medium hover:bg-gray-800 transition-all duration-300"
          >
            <FaShoppingCart className="text-xs sm:text-sm" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
    </NoHeaderLayout>
  );
};

export default BundleOffers;
