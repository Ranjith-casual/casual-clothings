import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';

export const useCart = () => {
  const [loading, setLoading] = useState(false);

  const addToCart = async (productId) => {
    try {
      setLoading(true);
      const response = await Axios.post(SummaryApi.addToCart.url, {
        productId
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Product added to cart');
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

  return {
    addToCart,
    addBundleToCart,
    getCart,
    loading
  };
};

export default useCart;
