import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../provider/GlobalProvider.jsx";
import { useSelector } from "react-redux";
import Axios from "../utils/Axios.js";
import SummaryApi from "../common/SummaryApi.js";
import toast from "react-hot-toast";
import Loading from "./Loading.jsx";
import { FaShoppingBag,FaBolt, } from "react-icons/fa";

const BuyNowButton = ({ 
  data, 
  selectedSize, 
  setSelectedSize, 
  onBuyNowSuccess = null 
}) => {
  const navigate = useNavigate();
  const { fetchCartItems } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const cartItems = useSelector((state) => state.cartItem.cart) || [];
  
  // Function to handle Buy Now click
  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("BuyNow button clicked");

    // Validate product data
    if (!data || !data._id) {
      toast.error("Invalid product data");
      return;
    }

    // Find the first available size with stock if no size is selected
    let effectiveSize = selectedSize;
    if (!effectiveSize) {
      if (data.sizes) {
        // Find the first size with available stock
        const availableSizes = Object.entries(data.sizes)
          .filter(([size, stock]) => stock > 0)
          .map(([size]) => size);
        
        if (availableSizes.length > 0) {
          effectiveSize = availableSizes[0];
        } else {
          toast.error("All sizes are out of stock");
          return;
        }
      } else if (data.stock > 0) {
        // If there's no size-specific stock but general stock is available
        // Use a default size (this is a fallback but shouldn't happen in a proper size-based inventory)
        effectiveSize = 'L';
      } else {
        toast.error("Product is out of stock");
        return;
      }
    }
    
    // If no size was selected, update the size state with our determined size
    if (!selectedSize && setSelectedSize) {
      setSelectedSize(effectiveSize);
    }
    
    // Check size-specific stock
    if (data.sizes && data.sizes[effectiveSize] !== undefined) {
      if (data.sizes[effectiveSize] <= 0) {
        toast.error(`Size ${effectiveSize} is out of stock`);
        return;
      }
    } else if (data.stock !== undefined && data.stock <= 0) {
      // Fallback to legacy stock check
      toast.error("Product is out of stock");
      return;
    }
    
    // Calculate total stock
    const totalRemainingStock = data.sizes ? 
      Object.values(data.sizes).reduce((a, b) => a + b, 0) : 
      data.stock;
    
    if (totalRemainingStock <= 0) {
      toast.error("Product is completely out of stock");
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if this product with the same size is already in cart
      const existingCartItem = cartItems.find(item => 
        item?.productId && 
        (item.productId === data._id || item.productId?._id === data._id) &&
        item.size === effectiveSize
      );
      
      console.log(`BuyNow: Checking if product ${data._id} with size ${effectiveSize} is in cart:`, 
                 existingCartItem ? `Yes, found with quantity ${existingCartItem.quantity}` : "No");
      
      // Get the price directly from the data object's sizePricing if available
      const sizePrice = effectiveSize && data.sizePricing && data.sizePricing[effectiveSize] !== undefined
        ? data.sizePricing[effectiveSize]
        : data.price;
      
      // Ensure price is sent as a number
      const numericPrice = parseFloat(sizePrice);
      
      if (existingCartItem) {
        // If product already in cart, just redirect to the bag page without adding again
        console.log("Product already in cart, redirecting to bag page");
        
        // Call success callback if provided (to maintain any UI updates)
        if (onBuyNowSuccess) {
          onBuyNowSuccess(effectiveSize);
        }
        
        // Show a toast notification to inform the user
        toast.success("Item already in your bag, redirecting to checkout");
        
        // Navigate to the bag page
        navigate('/checkout/bag');
      } else {
        // If product not in cart, add it
        const response = await Axios({
          ...SummaryApi.addToCart,
          data: {
            productId: data._id,
            size: effectiveSize,
            price: numericPrice
          }
        });
        
        if (response.data.success) {
          // Update global cart state
          fetchCartItems();
          
          // Call success callback if provided
          if (onBuyNowSuccess) {
            onBuyNowSuccess(effectiveSize);
          }
          
          // Navigate to the bag page
          navigate('/checkout/bag');
        } else {
          toast.error("Failed to add item to your bag");
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login to buy items");
        navigate("/login");
      } else {
        toast.error(`Error: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // The button UI
  return (
    <button
      onClick={handleBuyNow}
      disabled={loading}
      className="w-full bg-white text-black border border-black hover:bg-black hover:text-white transition py-3.5 font-medium tracking-wide text-lg uppercase duration-300 rounded-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loading />
      ) : (
        <>
          <FaBolt size={18} />
          <span>Buy Now</span>
        </>
      )}
    </button>
  );
};

export default BuyNowButton;
