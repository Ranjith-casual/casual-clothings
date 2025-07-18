import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { useGlobalContext } from '../provider/GlobalProvider';

export const useCart = () => {
  const [loading, setLoading] = useState(false);
  const [cartData, setCartData] = useState([]);
  const { fetchCartItems } = useGlobalContext();

  const addToCart = async (productId) => {
    try {
      setLoading(true);
      const response = await Axios.post(SummaryApi.addToCart.url, {
        productId
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Product added to cart');
        // Update both local and global cart state
        await fetchCartData();
        if (fetchCartItems) {
          fetchCartItems();
        }
        return { success: true, data: response.data };
      } else {
        toast.error(response.data.message || 'Failed to add product to cart');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add product to cart';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const addBundleToCart = async (bundleId) => {
    try {
      setLoading(true);
      const response = await Axios.post(SummaryApi.addBundleToCart.url, {
        bundleId
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Bundle added to cart');
        // Update both local and global cart state
        await fetchCartData();
        if (fetchCartItems) {
          fetchCartItems();
        }
        return { success: true, data: response.data };
      } else {
        toast.error(response.data.message || 'Failed to add bundle to cart');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add bundle to cart';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getCart = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(SummaryApi.getCart.url);

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch cart';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchCartData = async (syncGlobal = false) => {
    try {
      const response = await Axios.get(SummaryApi.getCart.url);
      if (response.data.success) {
        setCartData(response.data.data);
        
        // Optionally sync with global cart state
        if (syncGlobal && fetchCartItems) {
          fetchCartItems();
        }
        
        return response.data.data;
      }
    } catch (error) {
      console.error("Error fetching cart data:", error);
      // Set empty cart data on error to prevent crashes
      setCartData([]);
    }
    return [];
  };

  const updateBundleInCart = async (bundleId, quantity) => {
    try {
      setLoading(true);
      
      // First, find the cart item with this bundleId to get its _id
      const cartItems = await fetchCartData(false); // Don't sync here, we'll sync after the operation
      const cartItem = cartItems.find(item => item.bundleId?._id === bundleId);
      
      if (!cartItem) {
        toast.error('Bundle not found in cart');
        return { success: false, error: 'Bundle not found in cart' };
      }
      
      if (quantity === 0) {
        // Remove bundle from cart if quantity is 0
        const response = await Axios.delete(SummaryApi.deleteCartItem.url, {
          data: { _id: cartItem._id }
        });
        
        if (response.data.success) {
          toast.success('Bundle removed from cart');
          // Update both local and global cart state
          await fetchCartData();
          if (fetchCartItems) {
            fetchCartItems();
          }
          return { success: true };
        }
      } else {
        // Update bundle quantity using the cart item's _id and qty parameter
        const response = await Axios.put(SummaryApi.updateCartItemQty.url, {
          _id: cartItem._id,
          qty: quantity
        });
        
        if (response.data.success) {
          toast.success('Cart updated');
          // Update both local and global cart state
          await fetchCartData();
          if (fetchCartItems) {
            fetchCartItems();
          }
          return { success: true };
        }
      }
      
      return { success: false };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update cart';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Load cart data on hook initialization
  useEffect(() => {
    const initializeCart = async () => {
      await fetchCartData(false); // Don't sync on initialization to avoid loops
    };
    initializeCart();
  }, []);

  return {
    addToCart,
    addBundleToCart,
    getCart,
    fetchCartData,
    updateBundleInCart,
    cartData,
    loading
  };
};

export default useCart;
