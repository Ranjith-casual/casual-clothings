import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import useCart from '../hooks/useCart';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const BundleCartButton = ({ 
  bundleId, 
  stock, 
  className = '', 
  disabled = false,
  children,
  variant = 'primary'
}) => {
  const { addBundleToCart, loading } = useCart();
  const user = useSelector(state => state?.user);

  const handleAddToCart = async () => {
    if (!user?._id) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (stock && stock <= 0) {
      toast.error('Bundle is out of stock');
      return;
    }

    const result = await addBundleToCart(bundleId);
    if (result.success) {
      // Additional success handling can be added here
    }
  };

  const isOutOfStock = stock && stock <= 0;
  const isDisabled = disabled || loading || isOutOfStock;

  const getButtonText = () => {
    if (loading) return 'Adding...';
    if (isOutOfStock) return 'Out of Stock';
    if (children) return children;
    return 'Add Bundle to Cart';
  };

  const baseClasses = `
    py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-300 group
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2 text-sm sm:text-base
  `;

  const variantClasses = {
    primary: 'bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-800 shadow-md',
    secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 shadow-sm',
    outline: 'border border-gray-400 text-gray-800 hover:bg-gray-50'
  };

  return (
    <motion.button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
    >
      <FaShoppingCart 
        className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:animate-bounce'}`} 
      />
      {getButtonText()}
    </motion.button>
  );
};

export default BundleCartButton;
