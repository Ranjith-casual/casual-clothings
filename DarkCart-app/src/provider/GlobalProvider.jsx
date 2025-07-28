import { createContext, useContext, useEffect, useState } from "react";
import Axios from "../utils/Axios.js";
import SummaryApi from "../common/SummaryApi.js";
import { useDispatch, useSelector } from "react-redux";
import { handleAddItemCart } from "../store/cartProduct";
import AxiosTostError from "../utils/AxiosTostError.js";
import toast from "react-hot-toast";
import { pricewithDiscount } from "../utils/PriceWithDiscount.js";
import PricingService from "../utils/PricingService.js";
import { handleAddAddress } from "../store/addressSlice.js";
import { setOrders } from "../store/orderSlice.js";
import { setWishlistItems, removeWishlistItem, setWishlistLoading } from "../store/wishlistSlice.js";
import PropTypes from 'prop-types';
export const GlobalContext = createContext(null);

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const cartItem = useSelector((state) => state.cartItem.cart);
  const [notDiscountTotalPrice, setNotDiscountTotalPrice] = useState(0);
  const user = useSelector((state) => state.user);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [openCartSection, setOpenCartSection] = useState(false);
  

  const fetchOrders = async () => {
    try {
      setRefreshingOrders(true);
      const response = await Axios({
        url: SummaryApi.getOrderList.url,
        method: SummaryApi.getOrderList.method
      });
      
      if (response.data.success) {
        dispatch(setOrders(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    
    } finally {
      setRefreshingOrders(false);
    }
  };
  
  // Function to fetch all orders (for admin)
  const fetchAllOrders = async () => {
    try {
      setRefreshingOrders(true);
      const response = await Axios({
        url: SummaryApi.getAllOrders.url,
        method: SummaryApi.getAllOrders.method
      });
      
      if (response.data.success) {
        dispatch(setOrders(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching all orders:", error);
     
    } finally {
      setRefreshingOrders(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      console.log('=== GLOBAL PROVIDER: Fetching cart items ===');
      const response = await Axios({
        ...SummaryApi.getCart,
      });

      console.log('Cart API Response:', response);
      const { data: responseData } = response;
      console.log('Cart Response Data:', responseData);
      
      if (responseData.success) {
        console.log('Raw cart items from API:', responseData.data);
        responseData.data.forEach((item, index) => {
          console.log(`API Cart Item ${index}:`, {
            _id: item._id,
            itemType: item.itemType,
            quantity: item.quantity,
            hasProductId: !!item.productId,
            hasBundleId: !!item.bundleId,
            productData: item.productId,
            bundleData: item.bundleId,
            fullItem: item
          });
        });
        
     
        const validCartItems = responseData.data.filter(item => 
          (item.productId && item.productId._id) || (item.bundleId && item.bundleId._id)
        );
        
        console.log('Valid cart items after filtering:', validCartItems);
        
      
        if (validCartItems.length !== responseData.data.length) {
          console.warn(`Removed ${responseData.data.length - validCartItems.length} invalid cart items from frontend`);
        }
        
        dispatch(handleAddItemCart(validCartItems));
      } else {
        console.error('Cart API returned error:', responseData);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };
  const updateCartItem = async (id, qty) => {
    try {
      const response = await Axios({
        ...SummaryApi.updateCartItemQty,
        data: {
          _id: id,
          qty: qty,
        },
      });
      const { data: responseData } = response;

      if (responseData.success) {
   
        fetchCartItems();
        return responseData;
      }
    } catch (error) {
    
      return error;
    }
  };
  const deleteCartItem = async (cartId) => {
    try {
      const response = await Axios({
        ...SummaryApi.deleteCartItem,
        data: {
          _id: cartId,
        },
      });
      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        fetchCartItems();
      }
    } catch (error) {
   
      console.log(error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await Axios({
        url: SummaryApi.updateOrderStatus.url,
        method: SummaryApi.updateOrderStatus.method,
        data: { orderId, orderStatus: newStatus }
      });
      
      if (response.data.success) {
        if (handleOrder) {
          handleOrder();
        } else {
          user?.role?.toUpperCase() === "ADMIN" ? fetchAllOrders() : fetchOrders();
        }
        return { success: true };
      } else {
        console.error("API returned error:", response.data);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      
      // Handle specific cancellation request error
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        return { 
          success: false, 
          message: errorData.message || "Cannot modify order due to active cancellation request",
          cancellationStatus: errorData.cancellationStatus,
          isBlocked: true
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || "Error updating order status" 
      };
    }
  };

  // Check if order can be modified by admin
  const checkOrderModificationPermission = async (orderId) => {
    try {
      const response = await Axios({
        url: `${SummaryApi.checkOrderModificationPermission.url}/${orderId}`,
        method: SummaryApi.checkOrderModificationPermission.method
      });
      
      if (response.data.success) {
        return {
          success: true,
          canModify: response.data.data.canModify,
          reason: response.data.data.reason,
          cancellationRequest: response.data.data.cancellationRequest
        };
      } else {
        return { success: false, canModify: false, reason: "Error checking permission" };
      }
    } catch (error) {
      console.error("Error checking order modification permission:", error);
      return { success: false, canModify: false, reason: "Error checking permission" };
    }
  };

  // Update delivery date
  const updateDeliveryDate = async (orderId, estimatedDeliveryDate, deliveryNotes = '') => {
    try {
      const response = await Axios({
        url: SummaryApi.updateDeliveryDate.url,
        method: SummaryApi.updateDeliveryDate.method,
        data: { orderId, estimatedDeliveryDate, deliveryNotes }
      });
      
      if (response.data.success) {
        if (handleOrder) {
          handleOrder();
        } else {
          user?.role?.toUpperCase() === "ADMIN" ? fetchAllOrders() : fetchOrders();
        }
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error("Error updating delivery date:", error);
      
      // Handle specific cancellation request error
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        return { 
          success: false, 
          message: errorData.message || "Cannot update delivery date due to active cancellation request",
          cancellationStatus: errorData.cancellationStatus,
          isBlocked: true
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || "Error updating delivery date" 
      };
    }
  };

  const handleOrder = user?.role === "ADMIN" ? fetchAllOrders : fetchOrders;

  // // Clear tokens only if the user is actually logged-out
  // const handleLoggout = () => {
  //   if(!user?._id){
  //     localStorage.removeItem("accessToken");
  //     localStorage.removeItem("refreshToken");
  //     dispatch(handleAddItemCart([]));
  //   }
  // };

  // Fetch data when user info becomes available
  useEffect(() => {
    if(user?._id){
      fetchCartItems();
      fetchAddress();
      handleOrder();
    }
  }, [user]);

  useEffect(() => {
    const qty = cartItem.reduce((preve, curr) => {
      return preve + curr.quantity;
    }, 0);
    setTotalQty(qty);

    // Use PricingService for consistent calculations
    const totals = PricingService.calculateTotals(cartItem);
    setTotalPrice(totals.totalPrice);
    setNotDiscountTotalPrice(totals.totalOriginalPrice);
  }, [cartItem]);


  const fetchAddress = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getAddress,
      });

      const { data: responseData } = response;
      if (responseData.success) {
        dispatch(handleAddAddress(responseData.data));
      }    
    } catch (error) {
      console.log(error);
      // AxiosTostError(error);
    }
  }

  // Function to fetch user's wishlist
  const fetchWishlist = async () => {
    try {
      dispatch(setWishlistLoading(true));
      const response = await Axios({
        ...SummaryApi.getWishlist,
      });

      const { data: responseData } = response;
      if (responseData.success) {
        // Handle the new wishlist API structure that returns array directly
        const wishlistData = responseData.data || [];
        dispatch(setWishlistItems(wishlistData));
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      // Set empty array on error to prevent crashes
      dispatch(setWishlistItems([]));
    } finally {
      dispatch(setWishlistLoading(false));
    }
  };

  // Function to add item to wishlist
  const addToWishlist = async (productId) => {
    try {
      const response = await Axios({
        ...SummaryApi.addToWishlist,
        data: { productId }
      });

      const { data: responseData } = response;
      if (responseData.success) {
        toast.success("Item added to wishlist");
        fetchWishlist();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      AxiosTostError(error);
      return { success: false, error };
    }
  };

  // Function to remove item from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const response = await Axios({
        ...SummaryApi.removeFromWishlist,
        data: { productId }
      });

      const { data: responseData } = response;
      if (responseData.success) {
        toast.success("Item removed from wishlist");
        dispatch(removeWishlistItem(productId));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      AxiosTostError(error);
      return { success: false, error };
    }
  };

  // Function to check if item is in wishlist
  const checkWishlistItem = async (productId) => {
    try {
      const response = await Axios({
        url: `${SummaryApi.checkWishlistItem.url}/${productId}`,
        method: SummaryApi.checkWishlistItem.method
      });

      const { data: responseData } = response;
      return responseData.isInWishlist;
    } catch (error) {
      // If it's an authentication error (401), return false silently
      if (error.response?.status === 401) {
        return false;
      }
      console.error("Error checking wishlist item:", error);
      return false;
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        fetchCartItems,
        updateCartItem,
        deleteCartItem,
        fetchAddress,
        handleOrder,
        fetchOrders,
        fetchAllOrders,
        updateOrderStatus,
        checkOrderModificationPermission,
        updateDeliveryDate,
        refreshingOrders,
        totalPrice,
        totalQty,
        notDiscountTotalPrice,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        checkWishlistItem,
        openCartSection,
        setOpenCartSection
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

GlobalProvider.propTypes = {
  children: PropTypes.node.isRequired,   
};

export default GlobalProvider;
