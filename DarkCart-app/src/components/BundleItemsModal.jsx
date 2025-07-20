import React, { useState, useEffect } from 'react';
import { FaTimes, FaBox, FaStar, FaTag, FaInfoCircle, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import noCart from '../assets/noCart.jpg';

const BundleItemsModal = ({ bundle, bundleData, isOpen, onClose, orderContext = null }) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fetchedBundleDetails, setFetchedBundleDetails] = useState(null);
  const [loadingBundleItems, setLoadingBundleItems] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Use bundleData if provided, otherwise use bundle (for backward compatibility)
  const bundleSource = bundleData || bundle;
  const modalIsOpen = isOpen !== undefined ? isOpen : !!bundleSource;

  if (!modalIsOpen || !bundleSource) return null;

  // Effect to fetch bundle details if they're missing
  useEffect(() => {
    const fetchBundleDetails = async () => {
      // Only fetch if we have a bundle ID but no items in the original bundle
      const bundleId = bundleSource._id || bundleSource.bundleId;
      
      // Check if the original bundle has items (not using getBundleItems which includes fetched data)
      const hasItemsInOriginalBundle = (
        (bundleSource.items && Array.isArray(bundleSource.items) && bundleSource.items.length > 0) ||
        (bundleSource.bundleDetails && bundleSource.bundleDetails.items && Array.isArray(bundleSource.bundleDetails.items) && bundleSource.bundleDetails.items.length > 0) ||
        (bundleSource.bundleId && typeof bundleSource.bundleId === 'object' && bundleSource.bundleId.items && Array.isArray(bundleSource.bundleId.items) && bundleSource.bundleId.items.length > 0) ||
        (bundleSource.productDetails && Array.isArray(bundleSource.productDetails) && bundleSource.productDetails.length > 0)
      );
      
      if (bundleId && !hasItemsInOriginalBundle && !loadingBundleItems && !fetchedBundleDetails) {
        console.log('Bundle has ID but no items in original data, attempting to fetch from API:', bundleId);
        setLoadingBundleItems(true);
        setFetchError(null);
        
        try {
          const response = await Axios({
            ...SummaryApi.getBundleById,
            url: SummaryApi.getBundleById.url.replace(':id', bundleId)
          });
          
          if (response.data.success && response.data.data) {
            console.log('Successfully fetched bundle details:', response.data.data);
            setFetchedBundleDetails(response.data.data);
          } else {
            console.log('API response unsuccessful:', response.data);
            setFetchError('Bundle details could not be loaded from server');
          }
        } catch (error) {
          console.error('Error fetching bundle details:', error);
          setFetchError(`Failed to load bundle details: ${error.message}`);
        } finally {
          setLoadingBundleItems(false);
        }
      }
    };

    if (modalIsOpen) {
      fetchBundleDetails();
    }
  }, [modalIsOpen, bundleSource, fetchedBundleDetails, loadingBundleItems]);

  // Reset states when modal closes
  useEffect(() => {
    if (!modalIsOpen) {
      setFetchedBundleDetails(null);
      setLoadingBundleItems(false);
      setFetchError(null);
      setSelectedItemIndex(0);
      setSelectedImageIndex(0);
    }
  }, [modalIsOpen]);

  // Get bundle items from various possible sources - ONLY BUNDLE ITEMS, NOT REGULAR PRODUCTS
  const getBundleItems = () => {
    // Use fetched data if available
    const bundleData = fetchedBundleDetails || bundleSource;
    console.log('Debug: Bundle data received:', bundleData);
    
    // Check if this is synthetic mode (order without bundle structure)
    if (bundleData.syntheticMode && bundleData.originalPayment) {
      console.log('Synthetic mode detected, creating items from payment data');
      const payment = bundleData.originalPayment;
      
      return [{
        _id: payment._id + '_order_item',
        name: `Order #${payment.orderId}`,
        price: payment.totalAmt || 0,
        quantity: payment.totalQuantity || 1,
        description: `Payment order containing ${payment.totalQuantity} items for ${payment.customerName}`,
        category: 'Order',
        orderDate: payment.orderDate,
        paymentMethod: payment.paymentMethod,
        isSyntheticItem: true,
        orderContext: payment
      }];
    }
    
    // 1. Check for direct bundle items array
    if (bundleData.items && Array.isArray(bundleData.items) && bundleData.items.length > 0) {
      console.log('Found items in bundleData.items:', bundleData.items);
      return bundleData.items;
    }
    
    // 2. Check bundleDetails.items (most common for populated bundles)
    if (bundleData.bundleDetails && bundleData.bundleDetails.items && Array.isArray(bundleData.bundleDetails.items)) {
      console.log('Found items in bundleData.bundleDetails.items:', bundleData.bundleDetails.items);
      return bundleData.bundleDetails.items;
    }
    
    // 2.1. Enhanced bundleDetails check - look deeper into the object
    if (bundleData.bundleDetails && typeof bundleData.bundleDetails === 'object') {
      console.log('Detailed bundleDetails analysis:', bundleData.bundleDetails);
      console.log('bundleDetails keys:', Object.keys(bundleData.bundleDetails));
      
      // Check all properties in bundleDetails for arrays
      for (const [key, value] of Object.entries(bundleData.bundleDetails)) {
        if (Array.isArray(value) && value.length > 0) {
          console.log(`Found array in bundleDetails.${key}:`, value);
          // Check if this array contains items that look like products/bundle items
          if (value[0] && (value[0].name || value[0].title || value[0].productId || value[0]._id)) {
            console.log(`Using bundleDetails.${key} as bundle items`);
            return value;
          }
        }
      }
    }
    
    // 3. Check bundleId.items (if bundleId is populated object)
    if (bundleData.bundleId && typeof bundleData.bundleId === 'object' && bundleData.bundleId.items && Array.isArray(bundleData.bundleId.items)) {
      console.log('Found items in bundleData.bundleId.items:', bundleData.bundleId.items);
      return bundleData.bundleId.items;
    }
    
    // 3.1. Enhanced bundleId check - look deeper into the object
    if (bundleData.bundleId && typeof bundleData.bundleId === 'object') {
      console.log('Detailed bundleId analysis:', bundleData.bundleId);
      console.log('bundleId keys:', Object.keys(bundleData.bundleId));
      
      // Check all properties in bundleId for arrays
      for (const [key, value] of Object.entries(bundleData.bundleId)) {
        if (Array.isArray(value) && value.length > 0) {
          console.log(`Found array in bundleId.${key}:`, value);
          // Check if this array contains items that look like products/bundle items
          if (value[0] && (value[0].name || value[0].title || value[0].productId || value[0]._id)) {
            console.log(`Using bundleId.${key} as bundle items`);
            return value;
          }
        }
      }
    }
    
    // 4. If bundle itself looks like bundleId object with items
    if (bundleData._id && bundleData.title && bundleData.bundlePrice && bundleData.items && Array.isArray(bundleData.items)) {
      console.log('Bundle looks like a populated bundleId object:', bundleData.items);
      return bundleData.items;
    }
    
    // 5. If bundleId is a populated object without items, create synthetic bundle item
    if (bundleData.bundleId && typeof bundleData.bundleId === 'object') {
      console.log('Bundle has populated bundleId object:', bundleData.bundleId);
      
      // Only create synthetic if it's clearly a bundle (has bundle-specific properties)
      if (bundleData.bundleId.title || bundleData.bundleId.bundlePrice) {
        console.log('Creating synthetic bundle item from bundleId object');
        
        // Get the best available image from bundleId
        let itemImage = null;
        let itemImages = [];
        
        if (bundleData.bundleId.images && Array.isArray(bundleData.bundleId.images)) {
          itemImages = bundleData.bundleId.images;
          itemImage = bundleData.bundleId.images[0];
        } else if (bundleData.bundleId.image) {
          if (Array.isArray(bundleData.bundleId.image)) {
            itemImages = bundleData.bundleId.image;
            itemImage = bundleData.bundleId.image[0];
          } else {
            itemImage = bundleData.bundleId.image;
            itemImages = [bundleData.bundleId.image];
          }
        }
        
        console.log('Synthetic bundle item image data:', { itemImage, itemImages });
        
        return [{
          _id: bundleData.bundleId._id,
          name: bundleData.bundleId.title || bundleData.bundleId.name,
          price: bundleData.bundleId.bundlePrice || bundleData.bundleId.price || 0,
          image: itemImage,
          images: itemImages,
          description: bundleData.bundleId.description || `Bundle: ${bundleData.bundleId.title || bundleData.bundleId.name}`,
          category: 'Bundle',
          isSyntheticItem: true,
          bundleData: bundleData.bundleId
        }];
      }
    }
    
    // 7. Check productDetails array (alternative structure for bundles)
    if (bundleData.productDetails && Array.isArray(bundleData.productDetails) && bundleData.productDetails.length > 0) {
      console.log('Found items in bundleData.productDetails:', bundleData.productDetails);
      return bundleData.productDetails;
    }
    
    // 8. If bundle has basic bundle info but no items, create synthetic bundle item
    if (bundleData._id && bundleData.title && bundleData.bundlePrice) {
      console.log('Creating synthetic bundle item from main bundle data');
      
      // Get the best available image from bundle data
      let itemImage = null;
      let itemImages = [];
      
      if (bundleData.images && Array.isArray(bundleData.images)) {
        itemImages = bundleData.images;
        itemImage = bundleData.images[0];
      } else if (bundleData.image) {
        if (Array.isArray(bundleData.image)) {
          itemImages = bundleData.image;
          itemImage = bundleData.image[0];
        } else {
          itemImage = bundleData.image;
          itemImages = [bundleData.image];
        }
      }
      
      console.log('Fallback synthetic bundle item image data:', { itemImage, itemImages });
      
      return [{
        _id: bundleData._id,
        name: bundleData.title,
        price: bundleData.bundlePrice,
        image: itemImage,
        images: itemImages,
        description: bundleData.description || `Bundle: ${bundleData.title}`,
        category: 'Bundle',
        isSyntheticItem: true
      }];
    }
    
    console.log('No bundle items found in any expected location');
    console.log('Bundle structure:', JSON.stringify(bundleData, null, 2));
    return [];
  };

  const bundleItems = getBundleItems();
  const currentItem = bundleItems[selectedItemIndex];

  // Show loading state if we're fetching bundle details
  if (loadingBundleItems) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaBox className="mr-2 text-blue-600" />
              Loading Bundle Items...
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mr-3" />
            <p className="text-gray-600">Fetching bundle details from server...</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if fetching failed
  if (fetchError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaBox className="mr-2 text-red-600" />
              Bundle Loading Error
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <FaInfoCircle className="w-6 h-6 text-red-600 mb-2" />
              <p className="text-gray-800 font-medium mb-2">Failed to load bundle items</p>
              <p className="text-sm text-red-600">{fetchError}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get bundle title
  const getBundleTitle = () => {
    return bundleSource.title || bundleSource.name || 
           (bundleSource.bundleDetails && bundleSource.bundleDetails.title) ||
           (bundleSource.bundleId && typeof bundleSource.bundleId === 'object' && bundleSource.bundleId.title) ||
           'Bundle Items';
  };

  // Get item images - handle both string and array formats
  const getItemImages = (item) => {
    console.log('Getting images for item:', item);
    const images = [];
    
    // First check for direct image property (string or array)
    if (item.image) {
      if (typeof item.image === 'string') {
        console.log('Found direct image (string):', item.image);
        images.push(item.image);
      } else if (Array.isArray(item.image)) {
        console.log('Found direct image (array):', item.image);
        images.push(...item.image);
      }
    }
    
    // Check for images array
    if (item.images && Array.isArray(item.images)) {
      console.log('Found images array:', item.images);
      images.push(...item.images);
    }
    
    // For bundle items, check bundleId if it's a populated object
    if (item.bundleId && typeof item.bundleId === 'object') {
      console.log('Item has populated bundleId:', item.bundleId);
      if (item.bundleId.images && Array.isArray(item.bundleId.images)) {
        console.log('Found bundleId.images:', item.bundleId.images);
        images.push(...item.bundleId.images);
      } else if (item.bundleId.image) {
        if (typeof item.bundleId.image === 'string') {
          console.log('Found bundleId.image (string):', item.bundleId.image);
          images.push(item.bundleId.image);
        } else if (Array.isArray(item.bundleId.image)) {
          console.log('Found bundleId.image (array):', item.bundleId.image);
          images.push(...item.bundleId.image);
        }
      }
    }
    
    // Check bundleDetails
    if (item.bundleDetails) {
      console.log('Item has bundleDetails:', item.bundleDetails);
      if (item.bundleDetails.images && Array.isArray(item.bundleDetails.images)) {
        console.log('Found bundleDetails.images:', item.bundleDetails.images);
        images.push(...item.bundleDetails.images);
      } else if (item.bundleDetails.image) {
        if (typeof item.bundleDetails.image === 'string') {
          console.log('Found bundleDetails.image (string):', item.bundleDetails.image);
          images.push(item.bundleDetails.image);
        } else if (Array.isArray(item.bundleDetails.image)) {
          console.log('Found bundleDetails.image (array):', item.bundleDetails.image);
          images.push(...item.bundleDetails.image);
        }
      }
    }
    
    // For product items, check productId if it's a populated object
    if (item.productId && typeof item.productId === 'object') {
      console.log('Item has populated productId:', item.productId);
      if (item.productId.image && Array.isArray(item.productId.image)) {
        console.log('Found productId.image:', item.productId.image);
        images.push(...item.productId.image);
      } else if (item.productId.images && Array.isArray(item.productId.images)) {
        console.log('Found productId.images:', item.productId.images);
        images.push(...item.productId.images);
      }
    }
    
    // Check productDetails
    if (item.productDetails) {
      console.log('Item has productDetails:', item.productDetails);
      if (item.productDetails.image && Array.isArray(item.productDetails.image)) {
        console.log('Found productDetails.image:', item.productDetails.image);
        images.push(...item.productDetails.image);
      } else if (item.productDetails.images && Array.isArray(item.productDetails.images)) {
        console.log('Found productDetails.images:', item.productDetails.images);
        images.push(...item.productDetails.images);
      }
    }
    
    // NEW: Check if this is a synthetic item with bundleData
    if (item.isSyntheticItem && item.bundleData) {
      console.log('Item is synthetic with bundleData:', item.bundleData);
      if (item.bundleData.images && Array.isArray(item.bundleData.images)) {
        console.log('Found synthetic bundleData.images:', item.bundleData.images);
        images.push(...item.bundleData.images);
      } else if (item.bundleData.image) {
        if (typeof item.bundleData.image === 'string') {
          console.log('Found synthetic bundleData.image (string):', item.bundleData.image);
          images.push(item.bundleData.image);
        } else if (Array.isArray(item.bundleData.image)) {
          console.log('Found synthetic bundleData.image (array):', item.bundleData.image);
          images.push(...item.bundleData.image);
        }
      }
    }
    
    // Remove duplicates and ensure we have valid URLs
    const uniqueImages = [...new Set(images)].filter(img => img && typeof img === 'string' && img.trim() !== '');
    
    console.log('Final unique images found:', uniqueImages);
    return uniqueImages.length > 0 ? uniqueImages : [noCart];
  };

  const currentItemImages = currentItem ? getItemImages(currentItem) : [noCart];

  const nextItem = () => {
    if (selectedItemIndex < bundleItems.length - 1) {
      setSelectedItemIndex(selectedItemIndex + 1);
      setSelectedImageIndex(0);
    }
  };

  const prevItem = () => {
    if (selectedItemIndex > 0) {
      setSelectedItemIndex(selectedItemIndex - 1);
      setSelectedImageIndex(0);
    }
  };

  const nextImage = () => {
    if (selectedImageIndex < currentItemImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  if (bundleItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaBox className="mr-2 text-blue-600" />
              Bundle Items Debug
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <FaInfoCircle className="w-6 h-6 text-yellow-600 mb-2" />
              <p className="text-gray-800 font-medium mb-2">No bundle items available to display.</p>
              <p className="text-sm text-gray-600 mb-3">Debug Information:</p>
              <div className="bg-white p-3 rounded border text-xs font-mono overflow-auto max-h-40">
                <p><strong>Bundle Object Keys:</strong> {bundleSource ? Object.keys(bundleSource).join(', ') : 'null'}</p>
                <p><strong>Bundle Title:</strong> {getBundleTitle()}</p>
                <p><strong>Bundle Type:</strong> {typeof bundleSource}</p>
                <p><strong>API Fetch Attempted:</strong> {fetchedBundleDetails ? 'Yes' : 'No'}</p>
                <p><strong>Fetch Error:</strong> {fetchError || 'None'}</p>
                {bundleSource && (
                  <>
                    <p><strong>Has items:</strong> {bundleSource.items ? 'Yes' : 'No'}</p>
                    <p><strong>Has bundleDetails:</strong> {bundleSource.bundleDetails ? 'Yes' : 'No'}</p>
                    <p><strong>Has bundleId:</strong> {bundleSource.bundleId ? 'Yes' : 'No'}</p>
                    <p><strong>Bundle ID:</strong> {bundleSource._id || bundleSource.bundleId || 'N/A'}</p>
                  </>
                )}
                {fetchedBundleDetails && (
                  <>
                    <p><strong>Fetched Bundle Keys:</strong> {Object.keys(fetchedBundleDetails).join(', ')}</p>
                    <p><strong>Fetched Has Items:</strong> {fetchedBundleDetails.items ? 'Yes' : 'No'}</p>
                  </>
                )}
              </div>
              <details className="mt-3">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  View Full Bundle Data
                </summary>
                <div className="mt-2 bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                  <pre>{JSON.stringify(bundleSource, null, 2)}</pre>
                </div>
              </details>
            </div>
            <p className="text-gray-600 text-sm">
              This debugging modal will help identify why bundle items are not showing. 
              Please check the bundle data structure above.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaBox className="mr-2 text-blue-600" />
            {getBundleTitle()}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({bundleItems.length} items)
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-8rem)]">
          {/* Left Sidebar - Items List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Bundle Items</h3>
              <div className="space-y-2">
                {bundleItems.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedItemIndex(index);
                      setSelectedImageIndex(0);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedItemIndex === index
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                        <img
                          src={getItemImages(item)[0]}
                          alt={item.name || `Item ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = noCart;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {item.name || `Bundle Item ${index + 1}`}
                        </h4>
                        <p className="text-xs text-blue-600 font-medium">
                          {DisplayPriceInRupees(item.price || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Item Details */}
          <div className="flex-1 overflow-y-auto">
            {currentItem && (
              <div className="p-6">
                {/* Item Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={prevItem}
                    disabled={selectedItemIndex === 0}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedItemIndex === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaChevronLeft className="mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Item {selectedItemIndex + 1} of {bundleItems.length}
                  </span>
                  <button
                    onClick={nextItem}
                    disabled={selectedItemIndex === bundleItems.length - 1}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedItemIndex === bundleItems.length - 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Next
                    <FaChevronRight className="ml-1" />
                  </button>
                </div>

                {/* Item Images */}
                <div className="mb-6">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={currentItemImages[selectedImageIndex]}
                      alt={currentItem.name || `Item ${selectedItemIndex + 1}`}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.src = noCart;
                      }}
                    />
                    
                    {/* Image Navigation */}
                    {currentItemImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          disabled={selectedImageIndex === 0}
                          className={`absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md transition-all ${
                            selectedImageIndex === 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-opacity-100'
                          }`}
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          onClick={nextImage}
                          disabled={selectedImageIndex === currentItemImages.length - 1}
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md transition-all ${
                            selectedImageIndex === currentItemImages.length - 1
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-opacity-100'
                          }`}
                        >
                          <FaChevronRight />
                        </button>
                        
                        {/* Image indicators */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                          {currentItemImages.map((_, imgIndex) => (
                            <button
                              key={imgIndex}
                              onClick={() => setSelectedImageIndex(imgIndex)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                selectedImageIndex === imgIndex
                                  ? 'bg-white'
                                  : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail images */}
                  {currentItemImages.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {currentItemImages.map((image, imgIndex) => (
                        <button
                          key={imgIndex}
                          onClick={() => setSelectedImageIndex(imgIndex)}
                          className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                            selectedImageIndex === imgIndex
                              ? 'border-blue-500'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${currentItem.name || 'Item'} view ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = noCart;
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentItem.name || `Bundle Item ${selectedItemIndex + 1}`}
                    </h1>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {DisplayPriceInRupees(currentItem.price || 0)}
                      </span>
                      {currentItem.originalPrice && currentItem.originalPrice > currentItem.price && (
                        <span className="text-lg text-gray-500 line-through">
                          {DisplayPriceInRupees(currentItem.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Properties */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentItem.category && (
                      <div className="flex items-center gap-2">
                        <FaTag className="text-gray-400" />
                        <span className="text-sm text-gray-600">Category:</span>
                        <span className="text-sm font-medium">{currentItem.category}</span>
                      </div>
                    )}
                    
                    {currentItem.brand && (
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="text-gray-400" />
                        <span className="text-sm text-gray-600">Brand:</span>
                        <span className="text-sm font-medium">{currentItem.brand}</span>
                      </div>
                    )}
                    
                    {currentItem.size && (
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="text-gray-400" />
                        <span className="text-sm text-gray-600">Size:</span>
                        <span className="text-sm font-medium">{currentItem.size}</span>
                      </div>
                    )}
                    
                    {currentItem.color && (
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="text-gray-400" />
                        <span className="text-sm text-gray-600">Color:</span>
                        <span className="text-sm font-medium">{currentItem.color}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {currentItem.description && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentItem.description}
                      </p>
                    </div>
                  )}

                  {/* Additional Details */}
                  {currentItem.specifications && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {Object.entries(currentItem.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-300 p-3 sm:p-4 bg-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-700">
              {orderContext && (
                <span>From Order: #{orderContext.orderId || orderContext._id}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleItemsModal;
