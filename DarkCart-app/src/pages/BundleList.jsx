import React, { useState, useEffect } from "react";
import { FaGift, FaShoppingCart, FaHeart, FaStar, FaFire, FaClock, FaPercent, FaFilter, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import useCart from "../hooks/useCart";
import { useSelector } from "react-redux";

const BundleList = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");

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

  // Filter and sort bundles
  const getFilteredAndSortedBundles = () => {
    let filtered = bundles;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(bundle => bundle.category === selectedCategory);
    }

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
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <FaGift className="text-4xl md:text-5xl text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Complete Bundle Collection
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
              Explore our entire collection of curated bundle offers with amazing savings
            </p>
          </div>
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

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 border-2 text-sm ${
                    selectedCategory === category.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-black hover:bg-gray-50 border-gray-300 hover:border-black"
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  {category.name}
                </button>
              );
            })}
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

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredBundles.length} of {bundles.length} bundles
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Bundle Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {loading ? (
              // Loading skeletons
              [...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
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
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 relative group"
                >
                  {/* Tag */}
                  {bundle.tag && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-1 rounded-full text-xs font-bold text-white bg-black">
                        {bundle.tag}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white border border-gray-300 transition-colors group"
                  >
                    <FaHeart className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                  </button>

                  {/* Clickable Content */}
                  <Link 
                    to={`/bundle/${bundle._id}`}
                    className="block"
                  >
                    {/* Product Images */}
                    <div className="relative h-48 bg-gray-100">
                      {bundle.images && bundle.images.length > 0 ? (
                        <img
                          src={bundle.images[0]}
                          alt={bundle.title}
                          className="w-full h-full object-cover"
                        />
                      ) : bundle.items && bundle.items.length > 0 ? (
                        <div className="absolute inset-0 grid grid-cols-2 gap-1 p-2">
                          {bundle.items.slice(0, 4).map((item, index) => (
                            <div key={index} className="relative overflow-hidden rounded-md">
                              <img
                                src={item.image || '/placeholder.jpg'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              {index === 3 && bundle.items.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">+{bundle.items.length - 3}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <FaGift className="text-4xl text-gray-400" />
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      <div className="absolute bottom-3 right-3 bg-black text-white px-2 py-1 rounded-full font-bold text-xs">
                        {bundle.discount || 0}% OFF
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-black mb-2 line-clamp-2">{bundle.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bundle.description || 'Complete bundle package with great savings!'}</p>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(bundle.rating || 0)
                                  ? "text-black"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({bundle.reviews || 0})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-black">
                            ₹{bundle.bundlePrice?.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ₹{bundle.originalPrice?.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-black font-bold text-sm">
                          Save ₹{((bundle.originalPrice || 0) - (bundle.bundlePrice || 0)).toLocaleString()}
                        </div>
                      </div>

                      {/* Items Count */}
                      {bundle.items && bundle.items.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {bundle.items.length} items included
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Action Button - Outside Link */}
                  <div className="px-4 pb-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(bundle._id);
                      }}
                      disabled={cartLoading || (bundle.stock && bundle.stock <= 0)}
                      className="w-full bg-black text-white py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black text-sm"
                    >
                      <FaShoppingCart className={`w-4 h-4 ${cartLoading ? 'animate-spin' : ''}`} />
                      {cartLoading ? 'Adding...' : bundle.stock && bundle.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
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
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No bundles match your search "${searchTerm}"`
                : "Try adjusting your filters or check back later for new offers!"
              }
            </p>
            {(searchTerm || selectedCategory !== "all" || priceRange !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
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
  );
};

export default BundleList;
