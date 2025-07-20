import React, { useState, useEffect } from 'react';
import { FaTimes, FaHeart, FaShare, FaShoppingCart, FaTag, FaBox, FaStar, FaInfoCircle } from 'react-icons/fa';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import noCart from '../assets/empty-cuate.png';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';

const ProductDetailsModal = ({ isOpen, onClose, product, itemType = 'product', orderContext = null }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bundleDetails, setBundleDetails] = useState(null);
  const [loadingBundleDetails, setLoadingBundleDetails] = useState(false);

  // Determine if it's a bundle or regular product
  const isBundle = itemType === 'bundle';

  // Use bundleDetails if available, otherwise use original product
  const productData = bundleDetails || product;

  // Effect to fetch bundle details if they're missing
  useEffect(() => {
    const fetchBundleDetails = async () => {
      // Only fetch if it's a bundle and we don't have items data
      if (isBundle && product && (!product.items || product.items.length === 0) && product._id) {
        setLoadingBundleDetails(true);
        try {
          const response = await Axios({
            ...SummaryApi.getBundleById,
            url: `${SummaryApi.getBundleById.url}/${product._id}`
          });
          
          if (response.data.success && response.data.data) {
            setBundleDetails(response.data.data);
            if (process.env.NODE_ENV === 'development') {
              console.log('📦 Fetched bundle details:', response.data.data);
            }
          }
        } catch (error) {
          console.error('Error fetching bundle details:', error);
        } finally {
          setLoadingBundleDetails(false);
        }
      }
    };

    if (isOpen && isBundle) {
      fetchBundleDetails();
    }
  }, [isOpen, isBundle, product]);

  // Reset bundle details when modal closes
  useEffect(() => {
    if (!isOpen) {
      setBundleDetails(null);
      setLoadingBundleDetails(false);
    }
  }, [isOpen]);

  // Early return after all hooks have been called
  if (!isOpen || !product) return null;
  
  // Get product details based on type
  const getProductDetails = () => {
    if (isBundle) {
      return {
        title: productData.title || 'Bundle Product',
        description: productData.description || 'No description available',
        images: productData.images || [],
        originalPrice: productData.originalPrice || 0,
        bundlePrice: productData.bundlePrice || 0,
        category: productData.category || 'Bundle',
        stock: productData.stock || 0,
        discount: 0, // Bundles don't have discounts
        rating: productData.rating || 0,
        reviews: productData.reviews || 0
      };
    } else {
      return {
        title: productData.name || productData.title || 'Product',
        description: productData.description || 'No description available',
        images: productData.image || [],
        originalPrice: productData.price || 0,
        bundlePrice: null,
        category: productData.category?.name || productData.category || 'Product',
        stock: productData.stock || 0,
        discount: productData.discount || 0,
        rating: productData.rating || 0,
        reviews: productData.reviews || 0
      };
    }
  };

  const details = getProductDetails();
  
  // Calculate final price
  const finalPrice = isBundle 
    ? details.bundlePrice 
    : (details.discount > 0 
        ? details.originalPrice * (1 - details.discount / 100) 
        : details.originalPrice);

  // Get main image
  const mainImage = details.images?.length > 0 ? details.images[selectedImageIndex] : noCart;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={mainImage}
                  alt={details.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = noCart;
                  }}
                />
              </div>

              {/* Thumbnail Images */}
              {details.images?.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {details.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                        selectedImageIndex === index ? 'border-teal-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${details.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = noCart;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Product Type Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isBundle 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isBundle ? <FaBox className="w-3 h-3 mr-1" /> : <FaTag className="w-3 h-3 mr-1" />}
                  {isBundle ? 'Bundle' : 'Product'}
                </span>
                <span className="text-sm text-gray-600">{details.category}</span>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl font-bold text-gray-900">{details.title}</h1>

              {/* Rating */}
              {details.rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < details.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({details.reviews} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {DisplayPriceInRupees(finalPrice)}
                  </span>
                  {!isBundle && details.discount > 0 && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {DisplayPriceInRupees(details.originalPrice)}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        {details.discount}% OFF
                      </span>
                    </>
                  )}
                  {isBundle && details.originalPrice > details.bundlePrice && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {DisplayPriceInRupees(details.originalPrice)}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        Bundle Savings
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-green-600">Inclusive of all taxes</p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Availability:</span>
                <span className={`text-sm font-medium ${
                  details.stock > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {details.stock > 0 ? `In Stock (${details.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {details.description}
                </p>
              </div>

              {/* Bundle Items */}
              {isBundle && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FaBox className="w-4 h-4 text-blue-600" />
                    Bundle Items 
                    {productData.items && productData.items.length > 0 && `(${productData.items.length})`}
                    {loadingBundleDetails && (
                      <span className="text-xs text-blue-500 ml-2 animate-pulse">Loading...</span>
                    )}
                  </h3>
                  
                  {/* Debug information - can be removed in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <strong>Debug Info:</strong> Bundle has items: {productData.items ? 'Yes' : 'No'}, 
                      Items count: {productData.items ? productData.items.length : 0}, 
                      Loading: {loadingBundleDetails ? 'Yes' : 'No'}
                    </div>
                  )}
                  
                  {/* Loading state */}
                  {loadingBundleDetails && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50 text-center">
                      <div className="text-blue-600 text-sm">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading bundle items...
                      </div>
                    </div>
                  )}
                  
                  {/* Check if bundle has items array */}
                  {!loadingBundleDetails && productData.items && productData.items.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {productData.items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                          <div className="flex items-start gap-3">
                            {/* Item Image */}
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                              <img
                                src={item.image || noCart}
                                alt={item.name || `Bundle Item ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = noCart;
                                }}
                              />
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                {item.name || `Bundle Item ${index + 1}`}
                              </h4>
                              {item.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-medium text-teal-600">
                                  {DisplayPriceInRupees(item.price || 0)}
                                </span>
                                <div className="flex items-center gap-2">
                                  {item.productId && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      🔗 Linked Product
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    Item {index + 1}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Scroll indicator */}
                      {productData.items.length > 3 && (
                        <div className="text-center text-xs text-gray-500 pt-2 border-t">
                          ↕️ Scroll to see all items
                        </div>
                      )}
                    </div>
                  ) : !loadingBundleDetails && (
                    /* Show message when no bundle items are available */
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
                      <div className="text-gray-500 text-sm">
                        <FaInfoCircle className="w-4 h-4 mx-auto mb-2 text-gray-400" />
                        {bundleDetails ? (
                          <>Bundle items could not be loaded.</>
                        ) : (
                          <>Bundle items details are being loaded...</>
                        )}
                        <br />
                        <span className="text-xs mt-1 block text-gray-400">
                          This bundle contains multiple items. Please try refreshing if items don't appear.
                        </span>
                        <button 
                          onClick={() => window.location.reload()} 
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          🔄 Refresh Page
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Bundle Savings Summary - only show if we have items data */}
                  {productData.items && productData.items.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-800 font-medium">Total Individual Price:</span>
                        <span className="line-through text-gray-600">
                          {DisplayPriceInRupees(productData.items.reduce((sum, item) => sum + (item.price || 0), 0))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-green-800 font-medium">Bundle Price:</span>
                        <span className="font-bold text-green-600">
                          {DisplayPriceInRupees(details.bundlePrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-green-800 font-medium">You Save:</span>
                        <span className="font-bold text-green-600">
                          {DisplayPriceInRupees(Math.max(0, details.originalPrice - details.bundlePrice))}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Alternative savings display when we don't have item details */}
                  {(!productData.items || productData.items.length === 0) && details.originalPrice > details.bundlePrice && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-800 font-medium">Original Price:</span>
                        <span className="line-through text-gray-600">
                          {DisplayPriceInRupees(details.originalPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-blue-800 font-medium">Bundle Price:</span>
                        <span className="font-bold text-blue-600">
                          {DisplayPriceInRupees(details.bundlePrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-blue-800 font-medium">You Save:</span>
                        <span className="font-bold text-blue-600">
                          {DisplayPriceInRupees(details.originalPrice - details.bundlePrice)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {!orderContext && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button className="flex-1 bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
                    <FaShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <FaHeart className="w-4 h-4" />
                    Add to Wishlist
                  </button>
                  <button className="sm:w-auto bg-gray-100 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <FaShare className="w-4 h-4" />
                    Share
                  </button>
                </div>
              )}

              {/* Order Context Information */}
              {orderContext && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Order Information</h4>
                        <div className="space-y-1 text-sm text-blue-800">
                          {orderContext.quantity && (
                            <p>• Quantity Ordered: {orderContext.quantity}</p>
                          )}
                          {orderContext.orderStatus && (
                            <p>• Order Status: {orderContext.orderStatus}</p>
                          )}
                          {orderContext.orderDate && (
                            <p>• Order Date: {new Date(orderContext.orderDate).toLocaleDateString()}</p>
                          )}
                          {orderContext.size && (
                            <p>• Size: {orderContext.size}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                <p>• Free delivery on orders above ₹500</p>
                <p>• Easy 30-day returns and exchanges</p>
                <p>• 100% authentic products</p>
                <p>• Pay on delivery available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
