import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { useGlobalContext } from "../provider/GlobalProvider";
import AddAddress from "../components/AddAddress";
import AxiosTostError from "../utils/AxiosTostError";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import noCart from "../assets/noCart.jpg";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import EditAddressData from "../components/EditAddressData";
import Logo from "../assets/logo.png";
import ErrorBoundary from "../components/ErrorBoundary";

const CheckoutPage = () => {
  const { fetchCartItems, handleOrder, fetchAddress } = useGlobalContext();
  const [OpenAddress, setOpenAddress] = useState(false);
  const addressList = useSelector((state) => state.addresses.addressList);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const cartItemsList = useSelector((state) => state.cartItem.cart);
  const navigate = useNavigate();

  // Get selected items from sessionStorage (set in BagPage)
  const [selectedCartItemIds, setSelectedCartItemIds] = useState([]);
  const [checkoutItems, setCheckoutItems] = useState([]);

  useEffect(() => {
    const selectedIds = JSON.parse(sessionStorage.getItem('selectedCartItems') || '[]');
    setSelectedCartItemIds(selectedIds);
    
    // Filter cart items to only include selected ones
    const itemsToCheckout = cartItemsList.filter(item => selectedIds.includes(item._id));
    setCheckoutItems(itemsToCheckout);
  }, [cartItemsList]);

  // Function to calculate item pricing consistently across both sides
  const calculateItemPricing = (item) => {
    let productTitle = 'Item';
    let originalPrice = 0;
    let finalPrice = 0;
    let discount = 0;
    let isBundle = false;
    let quantity = item.quantity || 1;
    
    if (item.productId && item.productId._id) {
      productTitle = item.productId.name || 'Product';
      originalPrice = item.productId.price || 0;
      discount = item.productId.discount || 0;
      finalPrice = discount > 0 ? originalPrice * (1 - discount/100) : originalPrice;
      isBundle = false;
    } else if (item.bundleId && item.bundleId._id) {
      productTitle = item.bundleId.title || 'Bundle';
      originalPrice = item.bundleId.originalPrice || 0;
      finalPrice = item.bundleId.bundlePrice || 0;
      discount = 0;
      isBundle = true;
    } else {
      productTitle = item.title || item.name || 'Item';
      
      if (item.bundlePrice || item.title) {
        isBundle = true;
        originalPrice = item.originalPrice || 0;
        finalPrice = item.bundlePrice || item.price || 0;
        discount = 0;
      } else {
        isBundle = false;
        originalPrice = item.price || 0;
        discount = item.discount || 0;
        finalPrice = discount > 0 ? originalPrice * (1 - discount/100) : originalPrice;
      }
    }
    
    return {
      productTitle,
      originalPrice,
      finalPrice,
      discount,
      isBundle,
      quantity,
      totalPrice: finalPrice * quantity,
      totalOriginalPrice: originalPrice * quantity
    };
  };

  // Calculate totals for selected items only
  const selectedTotals = checkoutItems.reduce((totals, item) => {
    const pricing = calculateItemPricing(item);
    return {
      totalQty: totals.totalQty + pricing.quantity,
      totalPrice: totals.totalPrice + pricing.totalPrice,
      totalOriginalPrice: totals.totalOriginalPrice + pricing.totalOriginalPrice
    };
  }, { totalQty: 0, totalPrice: 0, totalOriginalPrice: 0 });

  // State for edit address functionality
  const [editAddressData, setEditAddressData] = useState(null);
  const [openEditAddress, setOpenEditAddress] = useState(false);

  // Delivery charge calculation states
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState(null);

  const GEOCODING_API_KEY = "038cafabde4449718e8dc2303a78956f";
  const SHOP_LOCATION = "Tirupur";

  // Function to extract and normalize city/district names for consistent comparison
  const extractAndNormalizeCity = (address) => {
    if (!address || !address.city) return null;
    
    let cityName = address.city.toString().trim();
    let normalized = cityName.toLowerCase();
    
    normalized = normalized
      .replace(/\s+district$/i, '')
      .replace(/\s+taluk$/i, '')
      .replace(/\s+taluka$/i, '')
      .replace(/\s+city$/i, '')
      .replace(/\s+municipality$/i, '')
      .replace(/\s+corporation$/i, '')
      .replace(/\s+rural$/i, '')
      .replace(/\s+urban$/i, '')
      .trim();
    
    const cityMappings = {
      'tirupur': 'tirupur',
      'thirupur': 'tirupur',
      'tirpur': 'tirupur',
      'tiruppur': 'tirupur',
      'coimbatore': 'coimbatore',
      'kovai': 'coimbatore',
      'chennai': 'chennai',
      'madras': 'chennai',
      'bangalore': 'bangalore',
      'bengaluru': 'bangalore'
    };
    
    if (cityMappings[normalized]) {
      normalized = cityMappings[normalized];
    }
    
    const result = normalized.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return result;
  };

  // Delivery charge calculation functions
  const getCoordinates = async (address) => {
    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address + ', India')}&key=${GEOCODING_API_KEY}&limit=1&countrycode=in&language=en`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.lat,
          lon: result.geometry.lng,
          display_name: result.formatted,
          confidence: result.confidence
        };
      } else {
        throw new Error(`Location not found: ${address}`);
      }
    } catch (err) {
      console.warn("OpenCage geocoding failed, using Nominatim fallback:", err.message);
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, India&limit=1&countrycodes=in&addressdetails=1`;
      const response = await fetch(fallbackUrl);
      const data = await response.json();
      
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name,
          confidence: 5
        };
      } else {
        throw new Error(`Location not found: ${address}`);
      }
    }
  };

  const getStraightLineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getRoadDistance = async (fromLocation, toLocation) => {
    try {
      const fromCoords = await getCoordinates(fromLocation);
      const toCoords = await getCoordinates(toLocation);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false&alternatives=false&steps=false`;
      
      try {
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const distanceInMeters = data.routes[0].distance;
          return distanceInMeters / 1000;
        }
      } catch (err) {
        console.log("OSRM failed, trying GraphHopper...");
      }

      const straightDistance = getStraightLineDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon);
      return straightDistance * 1.4;
      
    } catch (err) {
      throw new Error(`Unable to calculate distance: ${err.message}`);
    }
  };

  const getDeliveryChargeFromDistance = (distance) => {
    const chargePerSegment = 50;
    const kmPerSegment = 80;
    const segments = Math.ceil(distance / kmPerSegment);
    return segments * chargePerSegment;
  };

  const calculateDeliveryCharge = async (customerAddress) => {
    if (!customerAddress) {
      setDeliveryCharge(0);
      setDeliveryDistance(null);
      return;
    }

    setIsCalculatingDelivery(true);
    
    try {
      const normalizedCustomerCity = extractAndNormalizeCity(customerAddress);
      
      if (!normalizedCustomerCity) {
        throw new Error("Unable to extract city from address");
      }
      
      const shopCity = 'tirupur';
      const customerCity = normalizedCustomerCity.toLowerCase();
      
      if (customerCity === shopCity) {
        setDeliveryDistance('0');
        setDeliveryCharge(50);
        return;
      }
      
      const roadDistance = await getRoadDistance(SHOP_LOCATION, normalizedCustomerCity);
      const deliveryCharge = getDeliveryChargeFromDistance(roadDistance);
      
      setDeliveryDistance(roadDistance.toFixed(2));
      setDeliveryCharge(deliveryCharge);
      
    } catch (error) {
      console.error("Error calculating delivery charge:", error);
      setDeliveryCharge(0);
      setDeliveryDistance(null);
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  // Calculate delivery charge when address is selected
  useEffect(() => {
    if (selectedAddressIndex !== null && addressList[selectedAddressIndex]) {
      calculateDeliveryCharge(addressList[selectedAddressIndex]);
    } else {
      setDeliveryCharge(0);
      setDeliveryDistance(null);
    }
  }, [selectedAddressIndex, addressList]);

  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await Axios({
        ...SummaryApi.deleteAddress,
        data: { _id: addressId },
      });
      const { data: responseData } = response;
      if (responseData.success) {
        toast.success("Address deleted successfully");
        fetchAddress();
        if (selectedAddressIndex !== null && addressList[selectedAddressIndex]?._id === addressId) {
          setSelectedAddressIndex(null);
        }
      } else {
        toast.error("Failed to delete address");
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleOnlinePayment = async () => {
    if (selectedAddressIndex === null || selectedAddressIndex === undefined || !addressList[selectedAddressIndex]) {
      toast.error("Please select an address");
      return;
    }

    const selectedAddress = addressList[selectedAddressIndex];

    if (!selectedAddress || !selectedAddress._id) {
      toast.error("Invalid address selected");
      return;
    }

    if (checkoutItems.length === 0) {
      toast.error("No items selected for checkout");
      return;
    }

    setIsProcessing(true);
    let toastId = "order-processing";

    try {
      toast.loading("Processing your order...", {
        id: toastId,
      });

      // Make sure items are properly formatted for the API
      const preparedItems = checkoutItems.map(item => {
        // Create a simplified version of each item with only the necessary properties
        return {
          _id: item._id,
          productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
          bundleId: item.bundleId ? (typeof item.bundleId === 'object' ? item.bundleId._id : item.bundleId) : undefined,
          quantity: item.quantity || 1
        };
      });

      const response = await Axios({
        ...SummaryApi.onlinePaymentOrder,
        data: {
          list_items: preparedItems,
          totalAmount: selectedTotals.totalPrice + deliveryCharge,
          addressId: selectedAddress._id,
          subTotalAmt: selectedTotals.totalPrice,
          deliveryCharge: deliveryCharge,
          quantity: selectedTotals.totalQty,
          paymentMethod: "ONLINE" // Explicitly set payment method
        },
        // Add timeout to prevent hanging requests
        timeout: 30000
      });

      toast.dismiss(toastId);

      const { data: responseData } = response;

      if (responseData && responseData.success) {
        toast.success("Order placed successfully");
        
        // Clear sessionStorage
        sessionStorage.removeItem('selectedCartItems');
        
        // Refresh cart after a brief delay to ensure backend processing is complete
        setTimeout(() => {
          fetchCartItems();
        }, 1000);
        
        handleOrder();
        navigate("/order-success", {
          state: {
            text: "Order",
          },
        });
      } else {
        toast.error(responseData?.message || "Failed to place order. Please try again.");
      }
    } catch (error) {
      toast.dismiss(toastId);
      
      if (error.code === 'ECONNABORTED') {
        toast.error("The request timed out. Please try again.");
      } else {
        AxiosTostError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to remove only selected items from cart
  const removeSelectedItemsFromCart = async () => {
    try {
      const removePromises = checkoutItems.map(item =>
        Axios({
          ...SummaryApi.deleteCartItem,
          data: { _id: item._id },
        })
      );
      
      await Promise.all(removePromises);
    } catch (error) {
      console.error("Error removing selected items from cart:", error);
    }
  };

  // Function to handle editing an address
  const handleEditAddress = (address) => {
    setEditAddressData(address);
    setOpenEditAddress(true);
  };

  // Safe access helper function for accessing product properties
  const getProductProperty = (item, propertyPath, fallback = "") => {
    try {
      if (!item) return fallback;
      
      const paths = [
        `productId.${propertyPath}`,
        `bundleId.${propertyPath}`,
        `product.${propertyPath}`,
        propertyPath
      ];
      
      for (const path of paths) {
        const value = path.split('.').reduce((obj, key) => {
          if (key.includes('[') && key.includes(']')) {
            const arrayKey = key.substring(0, key.indexOf('['));
            const indexMatch = key.match(/\[(\d+)\]/);
            if (indexMatch && obj && obj[arrayKey] && Array.isArray(obj[arrayKey])) {
              const index = parseInt(indexMatch[1]);
              return obj[arrayKey][index];
            }
            return undefined;
          }
          return obj && obj[key] !== undefined ? obj[key] : undefined;
        }, item);
        
        if (value !== undefined && value !== null) return value;
      }
      
      return fallback;
    } catch (error) {
      console.log(`Error accessing ${propertyPath}:`, error);
      return fallback;
    }
  };

  // Redirect if no items selected
  useEffect(() => {
    if (selectedCartItemIds.length === 0) {
      toast.error("No items selected for checkout");
      navigate('/bag');
    }
  }, [selectedCartItemIds, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with stepper */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="w-24">
              <img src={Logo} alt="casualclothings Logo" className="h-10" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs uppercase tracking-wide text-gray-500">BAG</div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="text-xs uppercase tracking-wide text-teal-500 font-medium">ADDRESS</div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="text-xs uppercase tracking-wide text-gray-500">PAYMENT</div>
            </div>
            <div className="w-24">
              {/* Placeholder for balance */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Address Section */}
          <div className="lg:col-span-2">
            {/* Address Selection Section */}
            <div className="bg-white rounded shadow mb-6">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Select Delivery Address</h2>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-700 font-medium">DEFAULT ADDRESS</p>
                </div>
                
                <div className="space-y-4">
                  {addressList.filter(address => address.status).map((address, index) => (
                    <div 
                      key={address._id}
                      className={`relative border rounded p-4 ${
                        selectedAddressIndex === index ? 'border-teal-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="mr-4 mt-1">
                          <input
                            id={`address-${index}`}
                            type="radio"
                            name="address"
                            value={index}
                            checked={selectedAddressIndex === index}
                            onChange={() => setSelectedAddressIndex(index)}
                            className="w-4 h-4 text-teal-500 border-gray-300 focus:ring-teal-500"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{address.address_line}</span>
                            {selectedAddressIndex === index && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                                HOME
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mt-1">
                            {address.city}, {address.state} - {address.pincode}
                          </div>
                          
                          <div className="text-sm text-gray-600 mt-1">
                            Mobile: {address.mobile}
                          </div>
                          
                          <div className="mt-3 space-x-4">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="text-sm text-gray-700 font-medium"
                            >
                              EDIT
                            </button>
                            
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="text-sm text-gray-700 font-medium"
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {selectedAddressIndex === index && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            • Online Payment Only
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Add New Address Button */}
                  <div 
                    onClick={() => setOpenAddress(true)}
                    className="flex items-center justify-center p-4 border border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-400"
                  >
                    <div className="text-center">
                      <div className="text-red-500 mb-1">+</div>
                      <div className="text-sm font-medium">Add New Address</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="lg:col-span-1">
            {/* Product Images with Details */}
            <div className="bg-white rounded shadow mb-4">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Your Items ({selectedTotals.totalQty})</h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {checkoutItems.map((item, index) => {
                    const itemId = getProductProperty(item, '_id', `item-${index}`);
                    const pricing = calculateItemPricing(item);
                    
                    // Get image source safely - handle both products and bundles
                    let imageSrc = noCart;
                    if (item.productId && item.productId._id) {
                      imageSrc = item.productId.image?.[0] || item.productId.primaryImage || noCart;
                    } else if (item.bundleId && item.bundleId._id) {
                      imageSrc = item.bundleId.images?.[0] || item.bundleId.image || noCart;
                    } else {
                      imageSrc = item.image?.[0] || item.images?.[0] || item.primaryImage || item.image || noCart;
                    }
                    
                    const size = item.size || getProductProperty(item, 'size', 'Standard');
                    
                    return (
                      <div 
                        key={`preview-item-${index}`} 
                        className="flex items-start border-b pb-3 last:border-b-0 last:pb-0"
                      >
                        {/* Product Image */}
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-50 border border-gray-200 rounded overflow-hidden">
                          <img 
                            src={imageSrc}
                            alt={pricing.productTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = noCart;
                            }}
                          />
                        </div>
                        
                        {/* Product Details */}
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium line-clamp-1" title={pricing.productTitle}>
                            {pricing.productTitle}
                            {pricing.isBundle && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Bundle
                              </span>
                            )}
                          </h3>
                          
                          <div className="flex flex-wrap text-xs text-gray-500 mt-1">
                            <span className="mr-2">Size: {size}</span>
                            <span>Qty: {pricing.quantity}</span>
                          </div>
                          
                          <div className="mt-1 flex items-center">
                            <span className="font-medium text-sm">
                              {DisplayPriceInRupees(pricing.totalPrice)}
                            </span>
                            {/* Only show discount for products, not bundles */}
                            {!pricing.isBundle && pricing.discount > 0 && (
                              <>
                                <span className="mx-1 text-xs line-through text-gray-400">
                                  {DisplayPriceInRupees(pricing.totalOriginalPrice)}
                                </span>
                                <span className="text-xs text-green-600">
                                  {pricing.discount}% OFF
                                </span>
                              </>
                            )}
                            {/* For bundles, show savings differently */}
                            {pricing.isBundle && pricing.originalPrice > pricing.finalPrice && (
                              <>
                                <span className="mx-1 text-xs line-through text-gray-400">
                                  {DisplayPriceInRupees(pricing.totalOriginalPrice)}
                                </span>
                                <span className="text-xs text-green-600">
                                  Bundle Savings
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Price Details */}
            <div className="bg-white rounded shadow sticky top-4">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">PRICE DETAILS ({selectedTotals.totalQty} {selectedTotals.totalQty === 1 ? 'Item' : 'Items'})</h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total MRP</span>
                    <span>₹{selectedTotals.totalOriginalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Discount on MRP</span>
                    <span className="text-green-600">-₹{(selectedTotals.totalOriginalPrice - selectedTotals.totalPrice).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Platform Fee</span>
                    <div className="flex items-center">
                      <span className="line-through text-gray-500 mr-1">₹99</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery Charge</span>
                    {isCalculatingDelivery ? (
                      <span className="text-gray-500">Calculating...</span>
                    ) : (
                      <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span>
                    )}
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount</span>
                      <span>₹{(selectedTotals.totalPrice + deliveryCharge).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleOnlinePayment}
                  disabled={isProcessing || selectedAddressIndex === null}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 mt-6 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "PROCESSING PAYMENT..." : "PAY NOW"}
                </button>

                <div className="mt-6 text-xs text-center text-gray-600">
                  <p>Safe and Secure Payments. Easy returns.</p>
                  <p>100% Authentic products.</p>
                  
                  {/* Show remaining items info */}
                  {cartItemsList.length > checkoutItems.length && (
                    <p className="mt-2 text-sm font-medium text-blue-600">
                      {cartItemsList.length - checkoutItems.length} items will remain in your bag
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {OpenAddress && <AddAddress close={() => setOpenAddress(false)} />}
      {openEditAddress && editAddressData && (
        <EditAddressData
          close={() => {
            setOpenEditAddress(false);
            setEditAddressData(null);
          }}
          data={editAddressData}
        />
      )}
    </div>
  );
};

// Wrap with ErrorBoundary for better error handling
const CheckoutPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <CheckoutPage />
  </ErrorBoundary>
);

export default CheckoutPageWithErrorBoundary;
