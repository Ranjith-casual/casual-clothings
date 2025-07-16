import React, { useEffect, useState } from "react";
import { useGlobalContext } from "../provider/GlobalProvider";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi.js";
import toast from "react-hot-toast";
import AxiosTostError from "../utils/AxiosTostError.js";
import Loading from "./Loading";
import { useSelector } from "react-redux";
import { FaMinus, FaPlus, FaShoppingBag, FaBan } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AddToCartButton = ({ data, isBundle = false, cartItemId = null, currentQty = null, large = false }) => {
  const { fetchCartItems, updateCartItem, deleteCartItem } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const cartItem = useSelector((state) => state.cartItem.cart) || [];
  const [isAvailableCart, setIsAvailableCart] = useState(false);
  const [qty, setQty] = useState(0);
  const [cartItemDetails, setCartItemsDetails] = useState();
  const navigate = useNavigate();

  // Early return if data is not provided
  if (!data) {
    return (
      <div className="w-full max-w-[150px]">
        <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-md text-center">
          <span className="text-xs">No product data</span>
        </div>
      </div>
    );
  }

  const handleADDTocart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add null check for data
    if (!data || !data._id) {
      toast.error("Invalid product data");
      return;
    }

    // Check stock availability for products (bundles don't have stock field)
    if (!isBundle && data.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    try {
      setLoading(true);

      const apiEndpoint = isBundle ? SummaryApi.addBundleToCart : SummaryApi.addToCart;
      const requestData = isBundle 
        ? { bundleId: data._id }
        : { productId: data._id };

      const response = await Axios({
        ...apiEndpoint,
        data: requestData,
      });

      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        if (fetchCartItems) {
          fetchCartItems();
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login to add items to cart");
        navigate("/login");
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

    // Otherwise, find the cart item by matching product/bundle ID (when used in product display)
    const checkingitem = cartItem.some((item) => {
      if (isBundle) {
        return item?.bundleId && item?.bundleId?._id === data._id;
      } else {
        return item?.productId && item?.productId?._id === data._id;
      }
    });
    setIsAvailableCart(checkingitem);

    const cartItemData = cartItem.find((item) => {
      if (isBundle) {
        return item?.bundleId && item?.bundleId?._id === data._id;
      } else {
        return item?.productId && item?.productId?._id === data._id;
      }
    });
    setQty(cartItemData?.quantity || 0);
    setCartItemsDetails(cartItemData);
  }, [data, cartItem, isBundle, cartItemId, currentQty]);

  const increaseQty = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add null checks
    if (!data || !cartItemDetails) {
      toast.error("Invalid product or cart data");
      return;
    }

    // Check if increasing quantity would exceed stock (only for products with defined stock)
    if (!isBundle && data.stock !== undefined && qty + 1 > data.stock) {
      toast.error(`Only ${data.stock} items available in stock`);
      return;
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
        const response = await deleteCartItem(cartItemDetails._id);
        if (response.success) {
          setQty(0);
          setIsAvailableCart(false);
          setCartItemsDetails(null);
          toast.success("Item removed");
          // Fetch cart items to ensure global state is updated
          setTimeout(() => fetchCartItems(), 100);
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
      toast.error("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  // Check if product is out of stock - add null check (only for products)
  const isOutOfStock = !isBundle && data && data.stock !== undefined && data.stock <= 0;
  
  // In cart context, be more lenient with stock validation
  const shouldDisableIncrement = loading || (!cartItemId && !isBundle && data?.stock !== undefined && qty >= data.stock);
  
  return (
    <div className={`w-full ${large ? '' : 'max-w-[150px]'}`}>
      {isOutOfStock ? (
        // Out of Stock Display
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium">
            <FaBan size={12} />
            <span>Out of Stock</span>
          </div>
        </div>
      ) : (
        <>
          {isAvailableCart ? (
            // Quantity Controls (when item is in cart)
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
          ) : (
            // Add to Cart Button (when item is not in cart)
            <button
              onClick={handleADDTocart}
              disabled={loading || isOutOfStock}
              className={`bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium tracking-wide flex items-center justify-center gap-1 lg:gap-2 w-full ${
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
          )}

          {/* Stock Warning for Low Stock */}
          {/* {data.stock > 0 && data.stock <= 5 && (
            <div className="text-xs text-orange-600 text-center mt-1 font-medium">
              Only {data.stock} left!
            </div>
          )} */}

          {/* Stock Status for Normal Stock */}
          {/* {data.stock > 5 && data.stock <= 20 && (
            <div className="text-xs text-gray-500 text-center mt-1">
              {data.stock} in stock
            </div>
          )} */}
        </>
      )}
    </div>
  );
};

export default AddToCartButton;
