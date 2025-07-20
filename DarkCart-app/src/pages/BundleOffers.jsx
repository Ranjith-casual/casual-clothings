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
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
      

      {/* Filters and Search Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto shadow-sm hover:shadow-md transition-shadow duration-300">
              <input
                type="text"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black font-light"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {/* Sort By */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <FaFilter className="text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-transparent appearance-none focus:outline-none font-medium text-gray-700"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <span className="text-gray-700 font-medium">Price:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-2 bg-transparent appearance-none focus:outline-none font-medium text-gray-700"
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
      <div className="container mx-auto px-4 py-10 bg-white">
        {/* Results Count */}
        <div className="mb-8">
          <p className="text-gray-600 font-light tracking-wide flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-black rounded-full"></span>
            Showing <span className="font-semibold text-black">{filteredBundles.length}</span> of <span className="font-semibold text-black">{bundles.length}</span> bundles
            {searchTerm && <span className="font-medium"> for "<span className="text-black italic">{searchTerm}</span>"</span>}
          </p>
        </div>

        {/* Bundle Collection Section */}
        <div className="mb-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 tracking-tight">Bundle Collection</h2>
            <p className="text-gray-600 font-light tracking-wider">Discover amazing bundle deals with great savings</p>
          </div>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {loading ? (
              // Loading skeletons for grid layout
              [...Array(9)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse h-full">
                  {/* Vertical Layout */}
                  <div className="block h-full flex flex-col">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4 flex-1">
                      <div className="h-5 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded mb-3"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
                      <div className="h-12 bg-gray-300 rounded mt-auto"></div>
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
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-gray-400 transition-all duration-500 relative group transform hover:-translate-y-1 hover:scale-[1.02] h-full flex flex-col"
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

                    {/* No Quick View Overlay - Image directly links to bundle page */}

                    {/* Clickable Content */}
                    <Link 
                      to={`/bundle/${bundle._id}`}
                      className="flex flex-col flex-1"
                    >
                      {/* Enhanced Product Images Carousel */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-2xl">
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
                              
                              {/* Navigation Arrows - Only show if multiple images and only on image hover */}
                              {allImages.length > 1 && (
                                <div className="image-controls opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={(e) => prevImage(e, bundle._id, allImages.length)}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                                  >
                                    <FaChevronLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => nextImage(e, bundle._id, allImages.length)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
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
                                </div>
                              )}
                              
                              {/* Bundle composition overlay for item-based bundles */}

                            </>
                          );
                        })()}
                        
                        {/* Discount Badge */}
                       
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-base font-bold text-black mb-1 tracking-tight leading-tight line-clamp-1">{bundle.title}</h3>
                        
                        {/* Enhanced Description */}
                        <div className="mb-2">
                          <p className="text-gray-600 text-xs leading-relaxed line-clamp-1">
                            {getEnhancedDescription(bundle)}
                          </p>
                        </div>

                        {/* Enhanced Price Section */}
                        <div className="p-2 rounded-lg mb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-base font-bold text-black tracking-tight">
                                ₹{bundle.bundlePrice?.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500 line-through ml-1 font-light">
                                ₹{bundle.originalPrice?.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              {bundle.discount || Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)}% OFF
                            </div>
                          </div>
                        </div>
                        
                        {/* Stock Status */}
                        <div className="flex items-center gap-1 mb-2 text-xs">
                          {bundle.stock > 0 ? (
                            <span className={`font-medium flex items-center gap-1 ${bundle.stock < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${bundle.stock < 10 ? 'bg-amber-600' : 'bg-green-600'}`}></span>
                              {bundle.stock < 10 ? `Only ${bundle.stock} left!` : 'In Stock'}
                            </span>
                          ) : (
                            <span className="text-red-500 font-medium flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              Out of Stock
                            </span>
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

                        {/* Condensed Items List - Simpler for grid layout */}
                        {bundle.items && bundle.items.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-2 mt-auto">
                            <FaGift className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600 font-medium">
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
            className="text-center py-20 px-4 max-w-lg mx-auto"
          >
            <div className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-200">
              <FaGift className="text-6xl text-gray-400 mx-auto mb-6 opacity-60" />
              <h3 className="text-2xl font-bold text-black mb-3 tracking-tight">No bundles found</h3>
              <p className="text-gray-600 mb-6 font-light tracking-wide">
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
                  className="bg-black text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 mx-auto"
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
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-white py-16 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 tracking-tight">
            Found the Perfect Bundle?
          </h2>
          <p className="text-lg mb-8 mx-auto text-gray-700 font-light tracking-wide">
            Continue shopping for individual items or explore more collections
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-3 bg-black text-white px-8 py-3.5 rounded-full font-bold hover:bg-gray-800 border-2 border-black shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <FaShoppingCart className="text-lg" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
    </NoHeaderLayout>
  );
};

export default BundleOffers;
