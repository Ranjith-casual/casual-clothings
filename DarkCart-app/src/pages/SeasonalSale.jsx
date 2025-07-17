import React, { useState, useEffect } from "react";
import { FaLeaf, FaShoppingCart, FaHeart, FaStar, FaSnowflake, FaSun, FaUmbrella, FaFire, FaClock, FaPercent, FaTag } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import useCart from "../hooks/useCart";
import { useSelector } from "react-redux";

const SeasonalSale = () => {
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [sortBy, setSortBy] = useState("discount");
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 45,
    seconds: 30
  });

  // Cart hook and user state
  const { addBundleToCart, loading: cartLoading } = useCart();
  const user = useSelector(state => state?.user);

  // Fetch bundles from API
  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(SummaryApi.getBundles.url);
      
      if (response.data.success) {
        const bundleData = Array.isArray(response.data.data) ? response.data.data : [];
        setBundles(bundleData.filter(bundle => bundle.isActive)); // Only show active bundles
      }
    } catch (error) {
      console.error("Error fetching bundles:", error);
      toast.error("Failed to load seasonal items");
    } finally {
      setLoading(false);
    }
  };

  // Load bundles on component mount
  useEffect(() => {
    fetchBundles();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seasons = [
    { id: "all", name: "All Seasons", icon: FaLeaf, color: "from-green-500 to-blue-500" },
    { id: "summer", name: "Summer", icon: FaSun, color: "from-yellow-500 to-orange-500" },
    { id: "winter", name: "Winter", icon: FaSnowflake, color: "from-blue-500 to-purple-500" },
    { id: "formal", name: "Formal", icon: FaStar, color: "from-purple-500 to-pink-500" },
    { id: "casual", name: "Casual", icon: FaLeaf, color: "from-green-400 to-emerald-500" },
    { id: "sports", name: "Sports", icon: FaFire, color: "from-orange-500 to-red-500" },
    { id: "ethnic", name: "Ethnic", icon: FaHeart, color: "from-pink-500 to-rose-500" }
  ];

  const sortOptions = [
    { value: "discount", label: "Highest Discount" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "newest", label: "Newest First" }
  ];

  const filteredProducts = selectedSeason === "all" 
    ? bundles 
    : bundles.filter(bundle => bundle.category === selectedSeason);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "discount":
        return (b.discount || 0) - (a.discount || 0);
      case "price-low":
        return (a.bundlePrice || 0) - (b.bundlePrice || 0);
      case "price-high":
        return (b.bundlePrice || 0) - (a.bundlePrice || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "newest":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      default:
        return 0;
    }
  });

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

    const result = await addBundleToCart(bundleId);
    if (result.success) {
      // Optional: You can add any additional success handling here
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <FaTag className="text-6xl md:text-8xl animate-bounce" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              Seasonal Sale
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              Discover amazing deals on seasonal collections. Limited time offers with up to 70% off!
            </p>
            
            {/* Countdown Timer */}
            <div className="flex justify-center items-center space-x-4 md:space-x-8 mb-8">
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 md:p-6">
                  <div className="text-2xl md:text-4xl font-bold">{timeLeft.days}</div>
                  <div className="text-sm md:text-base opacity-80">Days</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 md:p-6">
                  <div className="text-2xl md:text-4xl font-bold">{timeLeft.hours}</div>
                  <div className="text-sm md:text-base opacity-80">Hours</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 md:p-6">
                  <div className="text-2xl md:text-4xl font-bold">{timeLeft.minutes}</div>
                  <div className="text-sm md:text-base opacity-80">Min</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 md:p-6">
                  <div className="text-2xl md:text-4xl font-bold">{timeLeft.seconds}</div>
                  <div className="text-sm md:text-base opacity-80">Sec</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filter and Sort Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Season Filter */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Season</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {seasons.map((season) => {
                const Icon = season.icon;
                return (
                  <motion.button
                    key={season.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSeason(season.id)}
                    className={`p-4 rounded-xl text-center transition-all duration-300 ${
                      selectedSeason === season.id
                        ? `bg-gradient-to-r ${season.color} text-white shadow-lg`
                        : "bg-white hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg border border-gray-200"
                    }`}
                  >
                    <Icon className="text-2xl mb-2 mx-auto" />
                    <span className="text-sm font-medium">{season.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Sort Options */}
          <div className="lg:w-64">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sort by</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {loading ? (
            // Loading skeletons
            [...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-80 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            <AnimatePresence>
              {sortedProducts.map((product) => (
                <motion.div
                  key={product._id}
                  variants={itemVariants}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ y: -10 }}
                  onHoverStart={() => setHoveredProduct(product._id)}
                  onHoverEnd={() => setHoveredProduct(null)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 relative group"
                >
                  {/* Product Image */}
                  <div className="relative h-80 bg-gray-100 overflow-hidden">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                      {product.discount || 0}% OFF
                    </div>
                    
                    {/* Tag */}
                    {product.tag && (
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                          product.tag === "Hot Deal" ? "bg-red-500" :
                          product.tag === "Bestseller" ? "bg-green-500" :
                          product.tag === "Limited Edition" ? "bg-orange-500" :
                          product.tag === "New Arrival" ? "bg-blue-500" :
                          product.tag === "Premium" ? "bg-purple-500" :
                          product.tag === "Flash Sale" ? "bg-pink-500" :
                          product.tag === "Clearance" ? "bg-yellow-500" :
                          "bg-gray-500"
                        }`}>
                          {product.tag}
                        </span>
                      </div>
                    )}
                    
                    {/* Wishlist Button */}
                    <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                      <FaHeart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                    </button>
                    
                    {/* Quick View on Hover */}
                    {hoveredProduct === product._id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center"
                      >
                        <button className="bg-white text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                          Quick View
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description || 'Amazing seasonal bundle with great savings!'}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {(product.rating || 0).toFixed(1)} ({product.reviews || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-800">
                          ₹{product.bundlePrice?.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ₹{product.originalPrice?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-green-600 font-bold text-sm">
                        Save ₹{((product.originalPrice || 0) - (product.bundlePrice || 0)).toLocaleString()}
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-semibold ${
                          (product.stock || 0) > 10 ? 'text-green-600' : 
                          (product.stock || 0) > 0 ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>
                          {(product.stock || 0) > 10 ? 'In Stock' : 
                           (product.stock || 0) > 0 ? `Only ${product.stock} left` : 
                           'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAddToCart(product._id)}
                        disabled={cartLoading || (product.stock && product.stock <= 0)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaShoppingCart className={`w-4 h-4 ${cartLoading ? 'animate-spin' : 'group-hover:animate-bounce'}`} />
                        {cartLoading ? 'Adding...' : product.stock && product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <FaHeart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Empty State */}
        {!loading && sortedProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FaTag className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">No seasonal items found</h3>
            <p className="text-gray-500">Try selecting a different season or check back later for new deals!</p>
          </motion.div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated with Seasonal Sales</h2>
          <p className="text-xl mb-8 opacity-90">Get notified about exclusive deals and new arrivals</p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalSale;
