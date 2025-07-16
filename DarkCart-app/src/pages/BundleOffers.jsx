import React, { useState, useEffect } from "react";
import { FaGift, FaShoppingCart, FaHeart, FaStar, FaFire, FaClock, FaPercent, FaArrowRight } from "react-icons/fa";
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Only show active bundles
        const activeBundles = bundleData.filter(bundle => bundle.isActive);
        // Show only first 6 bundles for featured section
        setBundles(activeBundles.slice(0, 6));
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

  const categories = [
    { id: "all", name: "All Bundles", icon: FaGift },
    { id: "summer", name: "Summer", icon: FaFire },
    { id: "winter", name: "Winter", icon: FaClock },
    { id: "formal", name: "Formal", icon: FaStar },
    { id: "casual", name: "Casual", icon: FaHeart },
    { id: "sports", name: "Sports", icon: FaPercent },
    { id: "ethnic", name: "Ethnic", icon: FaHeart }
  ];

  const filteredBundles = selectedCategory === "all" 
    ? bundles 
    : bundles.filter(bundle => bundle.category === selectedCategory);

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
              Featured Bundle Offers
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
              Get more for less! Discover our handpicked featured bundle deals with exclusive savings
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

      {/* Category Filter */}
      <div className="container mx-auto px-4 py-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 border-2 ${
                  selectedCategory === category.id
                    ? "bg-black text-white border-black shadow-lg transform scale-105"
                    : "bg-white text-black hover:bg-gray-50 border-gray-300 hover:border-black"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </motion.div>

        {/* Featured Bundles Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">Featured Bundles</h2>
              <p className="text-gray-600">Handpicked exclusive bundle deals just for you</p>
            </div>
            <Link
              to="/bundle-list"
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              View All Bundles
              <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {loading ? (
              // Loading skeletons
              [...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
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
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-400 transition-all duration-300 relative group"
                >
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
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white border border-gray-300 hover:border-black transition-colors group"
                  >
                    <FaHeart className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                  </button>

                  {/* Clickable Content */}
                  <Link 
                    to={`/bundle/${bundle._id}`}
                    className="block"
                  >
                    {/* Product Images */}
                    <div className="relative h-64 bg-gray-100">
                      {bundle.images && bundle.images.length > 0 ? (
                        <img
                          src={bundle.images[0]}
                          alt={bundle.title}
                          className="w-full h-full object-cover"
                        />
                      ) : bundle.items && bundle.items.length > 0 ? (
                        <div className="absolute inset-0 grid grid-cols-2 gap-1 p-4">
                          {bundle.items.slice(0, 4).map((item, index) => (
                            <div key={index} className="relative overflow-hidden rounded-lg">
                              <img
                                src={item.image || '/placeholder.jpg'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              {index === 3 && bundle.items.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white font-bold">+{bundle.items.length - 3}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <FaGift className="text-6xl text-gray-400" />
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      <div className="absolute bottom-4 right-4 bg-black text-white px-3 py-1 rounded-full font-bold text-sm">
                        {bundle.discount || 0}% OFF
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-black mb-2">{bundle.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{bundle.description || 'Complete bundle package with great savings!'}</p>
                      
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
                          {(bundle.rating || 0).toFixed(1)} ({bundle.reviews || 0} reviews)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-2xl font-bold text-black">
                            ₹{bundle.bundlePrice?.toLocaleString()}
                          </span>
                          <span className="text-lg text-gray-500 line-through ml-2">
                            ₹{bundle.originalPrice?.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-black font-bold">
                          Save ₹{((bundle.originalPrice || 0) - (bundle.bundlePrice || 0)).toLocaleString()}
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

                      {/* Items List - Always visible for better UX */}
                      {bundle.items && bundle.items.length > 0 && (
                        <motion.div
                          initial={{ opacity: 1, height: "auto" }}
                          className="mb-4"
                        >
                          <h4 className="font-semibold text-black mb-2">Bundle includes:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {bundle.items.slice(0, 3).map((item, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                                {item.name}
                              </li>
                            ))}
                            {bundle.items.length > 3 && (
                              <li className="text-xs text-gray-500 font-medium">
                                +{bundle.items.length - 3} more items...
                              </li>
                            )}
                          </ul>
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
            <p className="text-gray-500">Try selecting a different category or check back later for new offers!</p>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-black text-white py-16 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don't Miss Out on These Amazing Deals!
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
            Bundle up and save big on your favorite fashion items. Limited time offers!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors border-2 border-white"
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
