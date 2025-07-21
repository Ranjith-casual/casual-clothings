import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { useGlobalContext } from "../provider/GlobalProvider";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import AxiosTostError from "../utils/AxiosTostError";
import Logo from "../assets/logo.png";
import noCart from "../assets/Empty-cuate.png"; // Import fallback image
import ErrorBoundary from "../components/ErrorBoundary";

// Import payment icons
import {
  FaCreditCard,
  FaWallet,
  FaMoneyBillWave,
  FaPaypal,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
} from "react-icons/fa";

// Helper function to safely access product and bundle properties
const getProductProperty = (item, propertyPath, fallback = "") => {
  try {
    if (!item) return fallback;
    
    // Handle different potential structures for both products and bundles
    const paths = [
      // If product is directly on the item
      `product.${propertyPath}`,
      // If product is in productId field
      `productId.${propertyPath}`,
      // If bundle is in bundleId field
      `bundleId.${propertyPath}`,
      // Direct property on the item
      propertyPath
    ];
    
    for (const path of paths) {
      const value = path.split('.').reduce((obj, key) => {
        // Handle array index notation like "image[0]"
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
      
      if (value !== undefined) return value;
    }
    
    return fallback;
  } catch (error) {
    console.log(`Error accessing ${propertyPath}:`, error);
    return fallback;
  }
};

const PaymentPage = () => {
  const { fetchCartItems, handleOrder } = useGlobalContext();
  const cartItemsList = useSelector((state) => state.cartItem.cart);
  const addressList = useSelector((state) => state.addresses.addressList);
  const navigate = useNavigate();
  const location = useLocation();

  // Get selected items from sessionStorage (set in BagPage)
  const [selectedCartItemIds, setSelectedCartItemIds] = useState([]);
  const [checkoutItems, setCheckoutItems] = useState([]);

  // Get selected address and delivery charge from location state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('online'); // Default to online payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryDates, setDeliveryDates] = useState([]);

  // Helper function to map payment method codes to backend-expected names
  const getPaymentMethodName = (methodCode) => {
    const methodMapping = {
      'online': 'Online Payment',
    };
    return methodMapping[methodCode] || 'Online Payment';
  };

  // Get selected items from sessionStorage and filter cart items
  useEffect(() => {
    const selectedIds = JSON.parse(sessionStorage.getItem('selectedCartItems') || '[]');
    setSelectedCartItemIds(selectedIds);
    
    // Filter cart items to only include selected ones
    const itemsToCheckout = cartItemsList.filter(item => selectedIds.includes(item._id));
    setCheckoutItems(itemsToCheckout);
  }, [cartItemsList]);

  // Function to calculate item pricing consistently
  const calculateItemPricing = (item) => {
    let productTitle = 'Item';
    let originalPrice = 0;
    let finalPrice = 0;
    let discount = 0;
    let isBundle = false;
    let quantity = item.quantity || 1;
    
    if (item.productId && item.productId._id) {
      productTitle = item.productId.name || 'Product';
      
      // Check if there's a size-adjusted price first
      if (item.sizeAdjustedPrice) {
        originalPrice = Number(item.sizeAdjustedPrice) || 0;
        console.log(`Using size-adjusted price for ${item.productId.name}: ₹${originalPrice} (Size: ${item.size})`);
      } else {
        originalPrice = Number(item.productId.price) || 0;
      }
      
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

  // Extract values for easier use in JSX
  const totalQty = selectedTotals.totalQty;
  const totalPrice = selectedTotals.totalPrice;
  const notDiscountTotalPrice = selectedTotals.totalOriginalPrice;

  // Get data from location state or redirect to address page
  useEffect(() => {
    if (location.state?.selectedAddressId && location.state?.deliveryCharge !== undefined) {
      setSelectedAddressId(location.state.selectedAddressId);
      setDeliveryCharge(location.state.deliveryCharge);
      setDeliveryDistance(location.state.deliveryDistance || 0);
      setEstimatedDeliveryDate(location.state.estimatedDeliveryDate || '');
      setDeliveryDays(location.state.deliveryDays || 0);
    } else {
      // If no address is selected, redirect to address page
      navigate('/checkout/address');
    }
  }, [location, navigate]);

  // Find selected address from addressList
  useEffect(() => {
    if (selectedAddressId && addressList.length) {
      const address = addressList.find(addr => addr._id === selectedAddressId);
      if (address) {
        setSelectedAddress(address);
      }
    }
  }, [selectedAddressId, addressList]);

  // Set delivery dates for products using the estimated delivery date from AddressPage
  useEffect(() => {
    try {
      if (checkoutItems && checkoutItems.length > 0) {
        if (estimatedDeliveryDate) {
          // Use the estimated delivery date from AddressPage for all items
          const deliveryEstimates = checkoutItems.map((item, idx) => {
            // Get a unique ID for each item
            const itemId = item?._id || 
                          item?.productId?._id || 
                          `temp-${idx}-${Math.random().toString(36).substr(2, 9)}`;
            
            return {
              productId: itemId,
              deliveryDate: estimatedDeliveryDate, // Use the date from AddressPage
              formattedDate: estimatedDeliveryDate // Already formatted in AddressPage
            };
          });
          
          setDeliveryDates(deliveryEstimates);
        } else {
          // Fallback: Calculate delivery dates if estimatedDeliveryDate is not available
          const today = new Date();
          const deliveryEstimates = checkoutItems.map((item, idx) => {
            // Default delivery estimate: 3-5 days
            const deliveryDays = Math.floor(Math.random() * 3) + 3;
            const deliveryDate = new Date(today);
            deliveryDate.setDate(today.getDate() + deliveryDays);
            
            // Get a unique ID for each item
            const itemId = item?._id || 
                          item?.productId?._id || 
                          `temp-${idx}-${Math.random().toString(36).substr(2, 9)}`;
            
            return {
              productId: itemId,
              deliveryDate: deliveryDate,
              formattedDate: `${deliveryDate.getDate()} ${deliveryDate.toLocaleString('default', { month: 'short' })} ${deliveryDate.getFullYear()}`
            };
          });
          
          setDeliveryDates(deliveryEstimates);
        }
      } else {
        // Reset delivery dates if no items
        setDeliveryDates([]);
      }
    } catch (error) {
      console.error("Error setting delivery dates:", error);
      
      // Set fallback dates in case of error
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 5); // Default 5-day delivery
      
      const fallbackEstimates = Array(checkoutItems?.length || 0).fill().map((_, i) => ({
        productId: `fallback-${i}`,
        deliveryDate: fallbackDate,
        formattedDate: `${fallbackDate.getDate()} ${fallbackDate.toLocaleString('default', { month: 'short' })} ${fallbackDate.getFullYear()}`
      }));
      
      setDeliveryDates(fallbackEstimates);
    }
  }, [checkoutItems, estimatedDeliveryDate]);

  const handlePlaceOrder = async () => {
    // Validate selection
    if (!selectedAddressId) {
      toast.error("Please select an address");
      navigate('/checkout/address');
      return;
    }

    // Check if there are selected items to checkout
    if (checkoutItems.length === 0) {
      toast.error("No items selected for checkout");
      navigate('/checkout/bag');
      return;
    }

    setIsProcessing(true);

    try {
      // Show a loading toast
      toast.loading("Processing your order...", {
        id: "order-processing",
      });

      // Make sure items are properly formatted for the API
      const preparedItems = checkoutItems.map(item => {
        // Include complete product details for orders
        if (item.itemType === 'bundle') {
          return {
            _id: item._id,
            bundleId: typeof item.bundleId === 'object' ? item.bundleId._id : item.bundleId,
            bundleDetails: typeof item.bundleId === 'object' ? {
              title: item.bundleId.title,
              // Handle both single image and images array
              image: item.bundleId.image || (item.bundleId.images && item.bundleId.images.length > 0 ? item.bundleId.images[0] : ''),
              images: item.bundleId.images || [],
              bundlePrice: item.bundleId.bundlePrice
            } : undefined,
            itemType: 'bundle',
            quantity: item.quantity || 1
          };
        } else {
          return {
            _id: item._id,
            productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
            productDetails: typeof item.productId === 'object' ? {
              name: item.productId.name,
              image: item.productId.image,
              price: item.productId.price
            } : undefined,
            size: item.size, // Include size information for product items
            itemType: 'product',
            quantity: item.quantity || 1
          };
        }
      });

      const response = await Axios({
        ...SummaryApi.onlinePaymentOrder,
        data: {
          list_items: preparedItems, // Send properly formatted items
          totalAmount: totalPrice + deliveryCharge,
          addressId: selectedAddressId,
          subTotalAmt: totalPrice,
          deliveryCharge: deliveryCharge,
          deliveryDistance: deliveryDistance,
          estimatedDeliveryDate: estimatedDeliveryDate,
          deliveryDays: deliveryDays,
          quantity: totalQty,
          paymentMethod: getPaymentMethodName(selectedPaymentMethod), // Add payment method
        },
        timeout: 30000 // Add timeout to prevent hanging requests
      });

      const { data: responseData } = response;

      // Dismiss the loading toast
      toast.dismiss("order-processing");

      if (responseData.success) {
        toast.success("Order placed successfully");
        
        // Remove selected items from sessionStorage
        sessionStorage.removeItem('selectedCartItems');
        
        // Refresh cart to reflect changes after a brief delay to ensure backend processing is complete
        setTimeout(() => {
          fetchCartItems();
        }, 1000);
        
        handleOrder();
        navigate("/order-success", {
          state: {
            text: "Order",
            orderDetails: {
              estimatedDeliveryDate: estimatedDeliveryDate,
              deliveryDays: deliveryDays,
              deliveryDistance: deliveryDistance,
              totalAmount: totalPrice + deliveryCharge,
              itemCount: totalQty
            }
          },
        });
      } else {
        toast.error(responseData.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast.dismiss("order-processing");
      
      if (error.code === 'ECONNABORTED') {
        toast.error("The request timed out. Please try again.");
      } else if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        AxiosTostError(error);
      }
      
      // Add fallback error message if AxiosTostError doesn't show anything
      setTimeout(() => {
        const toastElements = document.querySelectorAll('[data-id^="toast-"]');
        if (toastElements.length === 0) {
          toast.error("Failed to place order. Please try again.");
        }
      }, 300);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with stepper */}
      <div className="bg-black shadow-md border-b text-white">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="w-20 sm:w-24">
              <Link to="/">
                <img src={Logo} alt="casualclothings Logo" className="h-8 sm:h-10" />
              </Link>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <div className="text-3xs sm:text-xs uppercase tracking-wider md:tracking-widest font-medium text-gray-300">
                <Link to="/checkout/bag" className="hover:text-white transition-colors">BAG</Link>
              </div>
              <div className="w-3 sm:w-8 h-px bg-gray-600"></div>
              <div className="text-3xs sm:text-xs uppercase tracking-wider md:tracking-widest font-medium text-gray-300">
                <Link to="/checkout/address" className="hover:text-white transition-colors">ADDRESS</Link>
              </div>
              <div className="w-3 sm:w-8 h-px bg-gray-600"></div>
              <div className="text-3xs sm:text-xs uppercase tracking-wider md:tracking-widest font-medium text-white">PAYMENT</div>
            </div>
            <div className="w-20 sm:w-24">
              {/* Placeholder for balance */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Payment Options */}
          <div className="lg:col-span-2">
            {/* Payment Methods Section */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="p-4 sm:p-5 border-b">
                <h2 className="text-base sm:text-lg font-medium tracking-tight uppercase">Select Payment Method</h2>
              </div>
              
              <div className="p-4 sm:p-5">
                {/* Payment Methods List */}
                <div className="space-y-4">
                  {/* Online Payment - Default Selected */}
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div 
                      className={`p-4 flex items-center cursor-pointer ${
                        selectedPaymentMethod === 'online' ? 'bg-gray-50' : ''
                      }`}
                      onClick={() => setSelectedPaymentMethod('online')}
                    >
                      <input
                        type="radio"
                        id="payment-online"
                        name="payment-method"
                        checked={selectedPaymentMethod === 'online'}
                        onChange={() => setSelectedPaymentMethod('online')}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <label htmlFor="payment-online" className="ml-3 flex items-center cursor-pointer">
                        <FaCreditCard className="text-gray-700 mr-2" />
                        <span className="font-medium text-gray-900">Online Payment</span>
                      </label>
                    </div>
                    
                    {selectedPaymentMethod === 'online' && (
                      <div className="p-4 border-t bg-gray-50">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Pay securely using your credit/debit card, net banking, or UPI.
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                          Your payment information is encrypted and secure.
                        </p>
                      </div>
                    )}
                  </div>

                

                  {/* UPI */}
                

                  {/* Net Banking */}
                

                  <div className="text-xs sm:text-sm text-gray-600 mt-4">
                    <p>
                      All payments are processed securely. Your card details are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Address Display */}
            {selectedAddress && (
              <div className="bg-white rounded-lg shadow-md mb-6">
                <div className="p-4 sm:p-5 border-b">
                  <h2 className="text-base sm:text-lg font-medium tracking-tight uppercase">Delivery Address</h2>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-medium tracking-tight text-sm sm:text-base text-gray-900">{selectedAddress.address_line}</span>
                        {selectedAddress.addressType === 'HOME' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs sm:text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            HOME
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">
                        {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                      </div>
                      
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        Mobile: {selectedAddress.mobile}
                      </div>
                    </div>

                    <Link 
                      to="/checkout/address" 
                      className="text-xs sm:text-sm text-gray-700 font-medium hover:text-black"
                    >
                      Change
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column */}
          <div className="lg:col-span-1">
            {/* Product Images with Details */}
            <div className="bg-white rounded-lg shadow-md mb-4">
              <div className="p-4 sm:p-5 border-b">
                <h2 className="text-base sm:text-lg font-medium tracking-tight uppercase">Your Items ({totalQty})</h2>
              </div>
              <div className="p-4 sm:p-5">
                <div className="space-y-4">
                  {checkoutItems.map((item, index) => {
                    // Use our safe access helper to get all needed properties
                    const itemId = getProductProperty(item, '_id', `item-${index}`);
                    const deliveryInfo = deliveryDates.find(d => d.productId === itemId);
                    const pricing = calculateItemPricing(item); // Use consistent pricing function
                    
                    // Get image source safely - handle both products and bundles
                    let imageSrc = noCart;
                    if (item.productId && item.productId._id) {
                      imageSrc = item.productId.image?.[0] || item.productId.primaryImage || noCart;
                    } else if (item.bundleId && item.bundleId._id) {
                      imageSrc = item.bundleId.images?.[0] || item.bundleId.image || noCart;
                    } else {
                      imageSrc = item.image?.[0] || item.images?.[0] || item.primaryImage || item.image || noCart;
                    }
                    
                    const size = getProductProperty(item, 'size', 'Standard');
                    
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
                        
                        {/* Item Details */}
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
                            {/* Show size adjustment indicator if available */}
                            {item.sizeAdjustedPrice && item.size && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-medium bg-gray-100 text-gray-700">
                                Price adjusted for size
                              </span>
                            )}
                          </div>
                          
                          {/* <div className="mt-1">
                            <span className="text-xs text-red-700 font-medium">
                              Delivery by {deliveryInfo?.formattedDate || 'Next Week'}
                            </span>
                          </div> */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Price Details */}
            <div className="bg-white rounded-lg shadow-md sticky top-4">
              <div className="p-4 sm:p-5 border-b">
                <h2 className="text-base sm:text-lg font-medium tracking-tight uppercase">PRICE DETAILS ({totalQty} {totalQty === 1 ? 'Item' : 'Items'})</h2>
              </div>
              
              <div className="p-4 sm:p-5">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 text-sm sm:text-base">Total MRP</span>
                    <span className="text-gray-900 text-sm sm:text-base">₹{notDiscountTotalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 text-sm sm:text-base">Discount on MRP</span>
                    <span className="text-gray-900 text-sm sm:text-base">-₹{(notDiscountTotalPrice - totalPrice).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 text-sm sm:text-base">Platform Fee</span>
                    <div className="flex items-center">
                      <span className="line-through text-gray-500 mr-1 text-sm">₹99</span>
                      <span className="text-gray-900 text-sm sm:text-base">FREE</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 text-sm sm:text-base">Delivery Charge</span>
                    <span className="text-gray-900 text-sm sm:text-base">{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span>
                  </div>
                  
                  {estimatedDeliveryDate && (
                    <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded-md mt-2 border border-gray-200">
                      <span className="text-gray-800 font-medium text-sm">Estimated Delivery</span>
                      <div className="text-right">
                        <div className="text-gray-900 font-semibold text-sm">{estimatedDeliveryDate}</div>
                        {deliveryDays && (
                          <div className="text-xs text-gray-600">
                            ({deliveryDays} {deliveryDays === 1 ? 'day' : 'days'})
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900 text-base sm:text-lg tracking-tight">Total Amount</span>
                      <span className="text-gray-900 text-base sm:text-lg">₹{(totalPrice + deliveryCharge).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !selectedPaymentMethod}
                  className="w-full bg-black hover:bg-gray-900 text-white py-3.5 mt-6 font-medium text-sm sm:text-base disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 tracking-wide uppercase"
                >
                  {isProcessing ? "PROCESSING PAYMENT..." : "PAY NOW"}
                </button>
                
                <div className="mt-6 text-xs sm:text-sm text-center text-gray-600 space-y-1">
                  <p className="font-medium tracking-tight">Safe and Secure Payments. Easy returns.</p>
                  <p className="tracking-tight">100% Authentic products.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with ErrorBoundary for better error handling
const PaymentPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <PaymentPage />
  </ErrorBoundary>
);

export default PaymentPageWithErrorBoundary;
