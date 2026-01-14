import React, { useEffect, useState } from "react";
import { useGlobalContext } from "../provider/GlobalProvider.jsx";
import Axios from "../utils/Axios.js";
import SummaryApi from "../common/SummaryApi.js";
import toast from "react-hot-toast";
import AxiosTostError from "../utils/AxiosTostError.js";
import Loading from "./Loading.jsx";
import { useSelector } from "react-redux";
import { FaMinus, FaPlus, FaShoppingBag, FaBan } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AddToCartButton = ({ data, isBundle = false, cartItemId = null, currentQty = null, large = false, selectedSize = null, onAddToCartSuccess = null }) => {
  const { fetchCartItems, updateCartItem, deleteCartItem } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const cartItem = useSelector((state) => state.cartItem.cart) || [];
  const [isAvailableCart, setIsAvailableCart] = useState(false);
  const [qty, setQty] = useState(0);
  const [cartItemDetails, setCartItemsDetails] = useState();
  const navigate = useNavigate();

  const handleADDTocart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add null check for data
    if (!data || !data._id) {
      toast.error("Invalid product data");
      return;
    }

    // For products (not bundles), we need to check size selection and stock
    if (!isBundle) {
      // Size is now required from the parent component - it should always auto-select a valid size
      if (!selectedSize) {
        console.warn("No size selected for product - this should not happen with auto-selection");
        toast.error("Please select a size");
        return;
      }
      
      // Check size-specific stock first
      if (data.sizes && data.sizes[selectedSize] !== undefined) {
        if (data.sizes[selectedSize] <= 0) {
          toast.error(`Size ${selectedSize} is out of stock`);
          return;
        }
      }
      // Fallback to legacy stock check
      else if (data.stock !== undefined && data.stock <= 0) {
        toast.error("Product is out of stock");
        return;
      }
      
      // Calculate total remaining stock across all sizes
      const totalRemainingStock = data.sizes ? 
        Object.values(data.sizes).reduce((a, b) => a + b, 0) : 
        data.stock;
      
      if (totalRemainingStock <= 0) {
        toast.error("Product is completely out of stock");
        return;
      }
      
      // Check if this size is already in cart
      if (isAvailableCart && cartItemDetails) {
        // If this size is already in cart, just increment quantity instead of adding new
        console.log("Size already in cart, incrementing quantity instead");
        increaseQty(e);
        return;
      }
      
      // Check if adding to cart would exceed total available stock
      // Get all items of this product in cart (any size)
      const productItemsInCart = cartItem.filter(item => 
        item.productId === data._id || 
        (item.productId && item.productId._id === data._id)
      );
      
      const totalInCart = productItemsInCart.reduce((total, item) => total + item.quantity, 0);
      
      if (totalInCart + 1 > totalRemainingStock) {
        toast.error(`Cannot add more of this product to cart. Maximum available is ${totalRemainingStock}`);
        return;
      }
    }

    try {
      setLoading(true);

      const apiEndpoint = isBundle ? SummaryApi.addBundleToCart : SummaryApi.addToCart;
      
      // Get the price directly from the data object's sizePricing if available
      const sizePrice = selectedSize && data.sizePricing && data.sizePricing[selectedSize] !== undefined
        ? data.sizePricing[selectedSize]
        : data.price;
      
      // Ensure price is sent as a number
      const numericPrice = parseFloat(sizePrice);
      console.log("Adding to cart:", { 
        productId: data._id, 
        size: selectedSize, 
        price: numericPrice,
        originalPrice: data.price,
        hasSizePricing: !!data.sizePricing,
        sizePricingValue: data.sizePricing && selectedSize ? data.sizePricing[selectedSize] : 'N/A'
      });
      
      const requestData = isBundle 
        ? { bundleId: data._id }
        : { 
            productId: data._id,
            size: selectedSize,  // Add size to the request
            price: numericPrice  // Add the adjusted price as a number
          };

      const response = await Axios({
        ...apiEndpoint,
        data: requestData,
      });

      const { data: responseData } = response;

      if (responseData.success) {
        console.log(`AddToCartButton: Successfully added size ${selectedSize} to cart`);
        toast.success(responseData.message || `Added size ${selectedSize} to cart`);
        
        // Update the component's state immediately for better UX
        setIsAvailableCart(true);
        setQty(1); // Initial quantity is 1
        
        // Set cart item details for immediate UI update
        const newCartItem = responseData.cartItem || {
          productId: data._id,
          size: selectedSize,
          quantity: 1,
          _id: responseData.id || Date.now().toString() // Temporary ID if not provided
        };
        setCartItemsDetails(newCartItem);
        
        // Update global cart state
        if (fetchCartItems) {
          fetchCartItems();
        }
        
        // Call the success callback if provided
        if (onAddToCartSuccess) {
          onAddToCartSuccess();
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login to add items to cart");
        navigate("/login");
      } else {
        console.error("Error adding to cart:", error);
        console.error("Response data:", error.response?.data);
        toast.error(`Failed to add to cart: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  //checking this item in cart or not
  useEffect(() => {
    // Add null checks to prevent errors
    if (!data || !data._id || !Array.isArray(cartItem)) {
      setIsAvailableCart(false);
      setQty(0);
      setCartItemsDetails(null);
      return;
    }

    // If we have cartItemId and currentQty from props (when used in cart display), use those
    if (cartItemId && currentQty !== null) {
      setIsAvailableCart(true);
      setQty(currentQty);
      const cartItemData = cartItem.find(item => item._id === cartItemId);
      setCartItemsDetails(cartItemData);
      return;
    }

    // Otherwise, find the cart item by matching product/bundle ID AND size (when used in product display)
    // For products, we need to match both product ID and size (if size is selected)
    const findItemInCart = () => {
      // For bundles, just match by bundle ID
      if (isBundle) {
        const bundleItem = cartItem.find(item => item?.bundleId && (
          item.bundleId === data._id || item.bundleId?._id === data._id
        ));
        return bundleItem || null;
      }
      
      // For products with selected size, match by product ID AND size
      if (selectedSize) {
        const matchingItem = cartItem.find(item => 
          item?.productId && 
          (item.productId === data._id || item.productId?._id === data._id) &&
          item.size === selectedSize
        );
        
        console.log(`AddToCartButton: Checking for product ${data._id} with size ${selectedSize} in cart:`, 
          matchingItem ? `Found with quantity ${matchingItem.quantity}` : "Not found");
        
        return matchingItem || null;
      }
      
      // If no size selected, don't match any item (we need size selection first)
      return null;
    };
    
    // Find the matching cart item based on product/bundle ID and size
    const matchingCartItem = findItemInCart();
    
    // Update state based on whether we found a matching item
    setIsAvailableCart(!!matchingCartItem);
    setQty(matchingCartItem?.quantity || 0);
    setCartItemsDetails(matchingCartItem || null);
    
    // Debug logging to help troubleshoot
    if (selectedSize) {
      console.log(`AddToCartButton: Selected size: ${selectedSize}, In cart: ${!!matchingCartItem}, Quantity: ${matchingCartItem?.quantity || 0}`);
    }
  }, [data, cartItem, isBundle, cartItemId, currentQty, selectedSize]);

  const increaseQty = async (e) => {
    // Only prevent default if it's an actual event
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Add null checks
    if (!data || !cartItemDetails) {
      toast.error("Invalid product or cart data");
      return;
    }

    // Check if increasing quantity would exceed stock
    if (!isBundle) {
      // For products, check both size-specific and total stock
      const sizeStock = cartItemDetails?.size && data.sizes && data.sizes[cartItemDetails.size] !== undefined 
        ? data.sizes[cartItemDetails.size] 
        : Infinity;
        
      // Get the total stock across all sizes
      const totalRemainingStock = data.sizes ? 
        Object.values(data.sizes).reduce((a, b) => a + b, 0) : 
        (data.stock !== undefined ? data.stock : Infinity);
      
      // Get all items of this product in cart (any size)
      const productItemsInCart = cartItem.filter(item => 
        item.productId === data._id || 
        (item.productId && item.productId._id === data._id)
      );
      
      // Get sum of all quantities except the current item
      const otherItemsQuantity = productItemsInCart
        .filter(item => item._id !== cartItemDetails._id)
        .reduce((total, item) => total + item.quantity, 0);
      
      // Calculate how much more can be added without exceeding total stock
      const remainingAllowance = totalRemainingStock - otherItemsQuantity;
      
      // Size-specific limit and total product limit
      const sizeLimitReached = qty + 1 > sizeStock;
      const totalLimitReached = qty + 1 > remainingAllowance;
      
      console.log(`Stock check for ${data.name || 'product'} size ${cartItemDetails?.size || 'unknown'}:`, {
        sizeStock,
        totalRemainingStock,
        otherItemsQuantity,
        remainingAllowance,
        currentQty: qty,
        attemptingQty: qty + 1,
        sizeLimitReached,
        totalLimitReached
      });
      
      if (sizeLimitReached || totalLimitReached) {
        if (sizeLimitReached) {
          toast.error(`Only ${sizeStock} items available in size ${cartItemDetails.size}`);
        } else if (totalLimitReached) {
          toast.error(`Cannot add more items of this product. Maximum available across all sizes is ${totalRemainingStock}`);
        }
        return;
      }
    }

    try {
      setLoading(true);
      const response = await updateCartItem(cartItemDetails._id, qty + 1);

      if (response.success) {
        setQty(qty + 1); // Update local state immediately for better UX
        toast.success("Item added");
        // Fetch cart items to ensure global state is updated
        setTimeout(() => fetchCartItems(), 100);
      }
    } catch (error) {
      console.error("Error increasing quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const decreaseQty = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add null checks
    if (!cartItemDetails) {
      toast.error("Invalid cart data");
      return;
    }

    try {
      setLoading(true);
      
      if (qty <= 1) {
        // When quantity is 1 and we're decreasing to 0, we should remove the item
        const response = await deleteCartItem(cartItemDetails._id);
        if (response.success) {
          setQty(0);
          setIsAvailableCart(false);
          setCartItemsDetails(null);
          toast.success("Item removed");
          
          // If this was the last item of this product in the cart with this size,
          // we don't need to clear localStorage because the size selection is still valid
          
          // Fetch cart items to ensure global state is updated
          setTimeout(() => fetchCartItems(), 100);
        } else {
          // If API call failed but we don't have specific error info
          console.error("Error removing item:", response);
        }
      } else {
        const response = await updateCartItem(cartItemDetails._id, qty - 1);
        if (response.success) {
          setQty(qty - 1); // Update local state immediately for better UX
          toast.success("Quantity decreased");
          // Fetch cart items to ensure global state is updated
          setTimeout(() => fetchCartItems(), 100);
        }
      }
    } catch (error) {
      console.error("Error in decreaseQty:", error);
      // Only show error toast if it's not related to removing item when qty is 1
      if (qty > 1) {
        toast.error("Failed to update quantity");
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if product or selected size is out of stock - add null check (only for products)
  const isOutOfStock = !isBundle && data && (
    // Check both size-specific stock and overall stock
    (data.stock !== undefined && data.stock <= 0) || 
    // Also check size-specific stock if a size is selected
    (selectedSize && data.sizes && data.sizes[selectedSize] !== undefined && data.sizes[selectedSize] <= 0)
  );
  
  // Check if increment should be disabled based on stock limits
  const shouldDisableIncrement = (() => {
    if (loading) return true;
    
    // For bundles, simply check bundle stock
    if (isBundle) {
      return data?.stock !== undefined && qty >= data.stock;
    }
    
    // For products, check both size-specific and total stock
    
    // For new items (not in cart yet)
    if (!cartItemId) {
      // Get size-specific stock (if available)
      const sizeStock = data?.sizes && selectedSize 
        ? (data.sizes[selectedSize] || 0) 
        : Infinity;
      
      // Get total stock (if available)
      const totalStock = data?.stock !== undefined 
        ? data.stock 
        : Infinity;
      
      // Use the more restrictive of the two stock limits
      const effectiveStock = Math.min(sizeStock, totalStock);
      
      return qty >= effectiveStock;
    }
    
    // For existing cart items
    // Get size-specific stock (if available)
    const sizeStock = data?.sizes && cartItemDetails?.size 
      ? (data.sizes[cartItemDetails.size] || 0) 
      : Infinity;
    
    // Get total stock (if available)
    const totalStock = data?.stock !== undefined 
      ? data.stock 
      : Infinity;
    
    // Use the more restrictive of the two stock limits
    const effectiveStock = Math.min(sizeStock, totalStock);
    
    return qty >= effectiveStock;
  })();
  
  // Early return if data is not provided (after all hooks)
  if (!data) {
    return (
      <div className="w-full max-w-[150px]">
        <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-md text-center">
          <span className="text-xs">No product data</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${large ? '' : 'max-w-[150px]'}`}>
      {isOutOfStock ? (
        // Out of Stock Display
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium">
            <FaBan size={12} />
            {selectedSize ? (
              <span>Size {selectedSize} Out of Stock</span>
            ) : (
              <span>Out of Stock</span>
            )}
          </div>
        </div>
      ) : (
        <>
          {isAvailableCart ? (
            // Quantity Controls (when item is in cart)
            <div>
              {selectedSize && (
                <div className="text-xs text-green-600 text-center font-medium mb-1">
                  Adjusting quantity for size {selectedSize}
                </div>
              )}
              <div className="flex w-full h-8 sm:h-9 border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
                <button
                  onClick={decreaseQty}
                  disabled={loading}
                  className={`bg-red-50 hover:bg-red-100 text-red-600 flex-1 w-full p-1 sm:p-2 flex items-center justify-center transition-colors border-r border-gray-200 min-w-[28px] sm:min-w-[32px] ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="w-2 h-2 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaMinus size={10} className="sm:size-3" />
                  )}
                </button>

                <div className="flex-1 w-full font-semibold px-1 sm:px-2 flex items-center justify-center text-gray-900 bg-gray-50 min-w-[32px] sm:min-w-[40px] text-sm">
                  {qty}
                </div>

                <button
                  onClick={increaseQty}
                  disabled={shouldDisableIncrement}
                  className={`flex-1 w-full p-1 sm:p-2 flex items-center justify-center transition-colors border-l border-gray-200 min-w-[28px] sm:min-w-[32px] ${
                    shouldDisableIncrement 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-50 hover:bg-green-100 text-green-600'
                  }`}
                >
                  {loading ? (
                    <div className="w-2 h-2 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaPlus size={10} className="sm:size-3" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Add to Cart Button (when item is not in cart)
            <>
              {selectedSize && (
                <div className="text-xs text-green-600 text-center font-medium mb-1">
                  Adding size {selectedSize} to cart
                </div>
              )}
              <button
                onClick={handleADDTocart}
                disabled={loading || isOutOfStock}
                className={`bg-black text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium tracking-wide flex items-center justify-center gap-1 lg:gap-2 w-full ${
                  large ? 'py-3 text-lg font-semibold' : 'p-2 lg:px-4 lg:py-2'
                }`}
              >
                {loading ? (
                  <Loading />
                ) : (
                  <>
                    <FaShoppingBag size={14} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Maximum stock reached message - check both size-specific and total stock */}
          {isAvailableCart && (
            <>
              {(() => {
                // Calculate effective stock (min of size-specific and total)
                const sizeStock = data.sizes && cartItemDetails?.size && data.sizes[cartItemDetails.size] !== undefined
                  ? data.sizes[cartItemDetails.size]
                  : Infinity;
                
                const totalStock = data?.stock !== undefined 
                  ? data.stock 
                  : Infinity;
                
                const effectiveStock = Math.min(sizeStock, totalStock);
                
                if (qty >= effectiveStock) {
                  if (sizeStock <= totalStock) {
                    return (
                      <div className="text-xs text-amber-600 text-center mt-1 font-medium">
                        Maximum stock reached for size {cartItemDetails.size}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-xs text-amber-600 text-center mt-1 font-medium">
                        Maximum total stock reached
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </>
          )}

          {/* Size-specific Stock Warning for Low Stock */}
          {!isAvailableCart && !isOutOfStock && selectedSize && data.sizes && data.sizes[selectedSize] <= 5 && data.sizes[selectedSize] > 0 && (
            <div className="text-xs text-orange-600 text-center mt-1 font-medium">
              Only {data.sizes[selectedSize]} left in size {selectedSize}!
            </div>
          )}

          {/* Size-specific Stock Status for Normal Stock */}
          {!isAvailableCart && !isOutOfStock && selectedSize && data.sizes && data.sizes[selectedSize] > 5 && data.sizes[selectedSize] <= 20 && (
            <div className="text-xs text-gray-500 text-center mt-1">
              {data.sizes[selectedSize]} available in size {selectedSize}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddToCartButton;
