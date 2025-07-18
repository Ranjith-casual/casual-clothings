import React, { useState, useEffect } from "react";
import { FaGift, FaShoppingCart, FaHeart, FaStar, FaArrowLeft, FaCheck, FaShoppingBag } from "react-icons/fa";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import useCart from "../hooks/useCart";
import { useSelector } from "react-redux";
import CountdownTimer from "../components/CountdownTimer";

const BundleDetail = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Cart hook and user state
  const { addBundleToCart, loading: cartLoading } = useCart();
  const user = useSelector(state => state?.user);

  // Fetch bundle details from API
  const fetchBundleDetails = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`${SummaryApi.getBundles.url}/${bundleId}`);
      
      if (response.data.success) {
        setBundle(response.data.data);
      } else {
        toast.error("Bundle not found");
        navigate('/bundle-offers');
      }
    } catch (error) {
      console.error("Error fetching bundle details:", error);
      toast.error("Failed to load bundle details");
      navigate('/bundle-offers');
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

  // Handle adding bundle to cart
  const handleAddToCart = async () => {
    if (!user?._id) {
      toast.error('Please login to add items to cart');
      return;
    }

    const result = await addBundleToCart(bundleId, quantity);
    if (result.success) {
      // Optional: You can add any additional success handling here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FaGift className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Bundle Not Found</h2>
          <p className="text-gray-600 mb-4">The bundle you're looking for doesn't exist.</p>
          <Link
            to="/bundle-offers"
            className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Back to Bundle Offers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-black">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/bundle-offers" className="text-gray-600 hover:text-black">Bundle Offers</Link>
            <span className="text-gray-400">/</span>
            <span className="text-black font-medium">{bundle.title}</span>
          </nav>
        </div>
      </div>

      {/* Back Button */}
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
                {bundle.images && bundle.images.length > 0 ? (
                  <img
                    src={bundle.images[selectedImageIndex] || bundle.images[0]}
                    alt={bundle.title}
                    className="w-full h-full object-cover"
                  />
                ) : bundle.items && bundle.items.length > 0 ? (
                  <div className="w-full h-full grid grid-cols-2 gap-2 p-4">
                    {bundle.items.slice(0, 4).map((item, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg">
                        <img
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {index === 3 && bundle.items.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">+{bundle.items.length - 3}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaGift className="text-8xl text-gray-400" />
                  </div>
                )}

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
                  {bundle.discount || 0}% OFF
                </div>
              </div>
            </div>

            {/* Thumbnail Images */}
            {bundle.images && bundle.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {bundle.images.map((image, index) => (
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
            )}
          </div>

          {/* Bundle Information */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">{bundle.title}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(bundle.rating || 0)
                        ? "text-black"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {(bundle.rating || 0).toFixed(1)} ({bundle.reviews || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-black">
                  ₹{bundle.bundlePrice?.toLocaleString()}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ₹{bundle.originalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="text-green-600 font-bold text-lg">
                You Save ₹{((bundle.originalPrice || 0) - (bundle.bundlePrice || 0)).toLocaleString()} ({bundle.discount || 0}% off)
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
            
            {/* Stock Status */}
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

            {/* Description */}
            {bundle.description && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">About This Bundle</h3>
                <p className="text-gray-600 leading-relaxed">{bundle.description}</p>
              </div>
            )}

            {/* Bundle Items */}
            {bundle.items && bundle.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-3">What's Included ({bundle.items.length} items)</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {bundle.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaShoppingBag className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-black">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                      <FaCheck className="text-green-600 w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
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

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading || (bundle.stock && bundle.stock <= 0)}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaShoppingCart className={`w-5 h-5 ${cartLoading ? 'animate-spin' : ''}`} />
                {cartLoading ? 'Adding to Cart...' : bundle.stock && bundle.stock <= 0 ? 'Out of Stock' : `Add ${quantity} Bundle${quantity > 1 ? 's' : ''} to Cart`}
              </button>

              <button className="w-full border-2 border-black text-black py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <FaHeart className="w-5 h-5" />
                Add to Wishlist
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
