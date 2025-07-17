import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi.js'
import Axios from '../utils/Axios'
import AxiosTostError from '../utils/AxiosTostError'
import { FaAngleRight, FaAngleLeft, FaRegHeart, FaHeart, FaShare, FaStar, FaArrowRight } from "react-icons/fa6";
import { FaShoppingCart } from "react-icons/fa";
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import Divider from '../components/Divider'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton.jsx'
import { useSelector } from 'react-redux'
import { useGlobalContext } from '../provider/GlobalProvider'
import toast from 'react-hot-toast'

// Simple Product Card component for Similar Styles and Recently Viewed sections
  const SimpleProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Extract product information
  const price = product.price || 0;
  const discount = product.discount || 0;
  const discountedPrice = pricewithDiscount(price, discount);
  const productImage = product.image?.[0] || '';
  const productName = product.name || 'Product';
  const categoryName = product.category?.[0]?.name || product.category?.name || 'Fashion';
  const productId = product._id;  return (
    <div className="relative">
      <Link 
        to={`/product/${productName?.toLowerCase().replace(/ /g, '-')}-${productId}`} 
        className="block group"
      >
        {/* Product Image */}
        <div className="aspect-square border border-gray-200 overflow-hidden bg-gray-50 rounded-md relative mb-4 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
          )}
          {productImage ? (
            <img 
              src={productImage} 
              alt={productName} 
              className={`w-full h-full object-contain p-3 transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FaShoppingCart className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="text-center px-2">
          <div className="uppercase text-xs tracking-wider font-medium text-gray-500 mb-2 font-['Poppins']">{categoryName}</div>
          <div className="font-medium text-sm mb-2 line-clamp-2 h-10 group-hover:text-black transition-colors font-['Poppins']">{productName}</div>
          <div className="flex justify-center items-center gap-2">
            <span className="font-bold text-gray-900 font-['Poppins']">
              {DisplayPriceInRupees(discountedPrice)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xs text-gray-400 line-through font-['Poppins']">
                  {DisplayPriceInRupees(price)}
                </span>
                <span className="text-xs font-medium text-green-600 font-['Poppins']">
                  ({discount}% OFF)
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

const ProductDisplayPage = () => {
  const params = useParams()
  const navigate = useNavigate()
  let productId = params?.product?.split("-")?.slice(-1)[0]
  const [data, setData] = useState({
    name: "",
    image: []
  })
  const [image, setImage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [similarStyles, setSimilarStyles] = useState([])
  const [imageLoaded, setImageLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const imageContainer = useRef(null)
  const user = useSelector((state) => state.user)
  const { addToWishlist, removeFromWishlist, checkWishlistItem } = useGlobalContext()

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      setImageLoaded(false)
      const response = await Axios({
        ...SummaryApi.getProductDetails,
        data: {
          productId: productId
        }
      })

      const { data: responseData } = response

      if (responseData.success) {
        setData(responseData.data);
        fetchRelatedProducts(responseData.data.category?._id);
        // fetchSimilarStyles will be called by the useEffect when data.category changes
        checkIfWishlisted(responseData.data._id);
      }
    } catch (error) {
      AxiosTostError(error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchRelatedProducts = async (categoryId) => {
    if (!categoryId) return;
    
    try {
      const response = await Axios({
        ...SummaryApi.getProductByCategory,
        data: {
          id: [categoryId]
        },
      })

      const { data: responseData } = response;
      if (responseData.success) {
        // Filter out current product and limit to 4 related products
        const filtered = responseData.data.filter(p => p._id !== productId).slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  }

  const fetchSimilarStyles = async () => {
    try {
      console.log("Fetching similar styles for product category:", data.category);
      
      // If we have a category ID, use getProductByCategory API to fetch products from same category
      if (data.category?._id) {
        console.log("Fetching products by category ID:", data.category._id);
        const response = await Axios({
          ...SummaryApi.getProductByCategory,
          data: {
            id: [data.category._id]
          },
        });

        const { data: responseData } = response;
        if (responseData.success && responseData.data.length > 0) {
          const filtered = responseData.data
            .filter(p => p._id !== productId)
            .slice(0, 4);
          
          console.log(`Found ${filtered.length} similar products by category ID`);
          if (filtered.length > 0) {
            setSimilarStyles(filtered);
            return;
          }
        }
      } 
      
      // If category is an array, try using first item's ID or name
      if (Array.isArray(data.category) && data.category.length > 0) {
        console.log("Category is an array, using first item:", data.category[0]);
        
        if (data.category[0]._id) {
          const response = await Axios({
            ...SummaryApi.getProductByCategory,
            data: {
              id: [data.category[0]._id]
            },
          });
  
          const { data: responseData } = response;
          if (responseData.success) {
            const filtered = responseData.data
              .filter(p => p._id !== productId)
              .slice(0, 4);
            
            console.log(`Found ${filtered.length} similar products by category array item ID`);
            if (filtered.length > 0) {
              setSimilarStyles(filtered);
              return;
            }
          }
        }
        
        // If using ID failed, try with name
        if (data.category[0].name) {
          console.log("Trying to fetch by category name:", data.category[0].name);
          const categoryName = data.category[0].name;
          
          const response = await Axios({
            ...SummaryApi.getProduct,
            data: {
              limit: 10,
              category: data.category[0]._id // Try with ID first
            }
          });
          
          const { data: responseData } = response;
          if (responseData.success) {
            const filtered = responseData.data
              .filter(p => p._id !== productId)
              .slice(0, 4);
            
            console.log(`Found ${filtered.length} similar products by category name`);
            if (filtered.length > 0) {
              setSimilarStyles(filtered);
              return;
            }
          }
        }
      }
      
      // Try using category name if it's a simple object with a name property
      if (typeof data.category === 'object' && data.category?.name) {
        console.log("Trying to fetch by category name property:", data.category.name);
        
        const response = await Axios({
          ...SummaryApi.getProduct,
          data: {
            search: data.category.name, // Use search to find products with similar category
            limit: 10
          }
        });

        const { data: responseData } = response;
        if (responseData.success) {
          const filtered = responseData.data
            .filter(p => p._id !== productId)
            .slice(0, 4);
          
          console.log(`Found ${filtered.length} similar products by category name search`);
          if (filtered.length > 0) {
            setSimilarStyles(filtered);
            return;
          }
        }
      }
      
      // If we have a product with a specific gender, try to find products with the same gender
      if (data.gender) {
        console.log("Trying to fetch products with same gender:", data.gender);
        const response = await Axios({
          ...SummaryApi.getProduct,
          data: {
            gender: data.gender,
            limit: 8
          }
        });
        
        const { data: responseData } = response;
        if (responseData.success) {
          const filtered = responseData.data
            .filter(p => p._id !== productId)
            .slice(0, 4);
          
          console.log(`Found ${filtered.length} products with same gender`);
          if (filtered.length > 0) {
            setSimilarStyles(filtered);
            return;
          }
        }
      }
      
      // Final fallback - get any products
      console.log("Using fallback to fetch any products");
      const response = await Axios({
        ...SummaryApi.getProduct,
        data: {
          page: 1,
          limit: 8,
        }
      });

      const { data: responseData } = response;
      if (responseData.success) {
        const filtered = responseData.data
          .filter(p => p._id !== productId)
          .slice(0, 4);
        console.log(`Found ${filtered.length} products as fallback`);
        setSimilarStyles(filtered);
      }
    } catch (error) {
      console.error("Error fetching similar styles:", error);
    }
  }

  const checkIfWishlisted = async (productId) => {
    if (!productId) {
      console.log("No product ID provided for wishlist check");
      return;
    }
    
    if (!user?._id) {
      console.log("User not logged in, can't check wishlist status");
      return;
    }
    
    try {
      console.log("Checking wishlist status for product:", productId);
      const isInWishlist = await checkWishlistItem(productId);
      console.log("Wishlist status:", isInWishlist);
      setIsWishlisted(isInWishlist);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  }

  const handleWishlist = async () => {
    if (!user?._id) {
      toast.error("Please login to add items to wishlist");
      navigate("/login");
      return;
    }
    
    try {
      console.log("Main component: Updating wishlist for", data._id, "Current status:", isWishlisted);
      if (isWishlisted) {
        const result = await removeFromWishlist(data._id);
        console.log("Main component: Remove from wishlist result:", result);
        if (result && result.success) {
          setIsWishlisted(false);
          toast.success("Removed from wishlist");
        } else {
          toast.error("Failed to remove from wishlist");
        }
      } else {
        const result = await addToWishlist(data._id);
        console.log("Main component: Add to wishlist result:", result);
        if (result && result.success) {
          setIsWishlisted(true);
          toast.success("Added to wishlist");
        } else {
          toast.error("Failed to add to wishlist");
        }
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Something went wrong");
    }
  }
  
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const handleImageLoad = () => {
    setImageLoaded(true);
  }

  const scrollLeft = () => {
    if (imageContainer.current) {
      imageContainer.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }

  const scrollRight = () => {
    if (imageContainer.current) {
      imageContainer.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }

  const openImageModal = (index) => {
    setImage(index);
    setShowImageModal(true);
  }

  useEffect(() => {
    fetchProductDetails();
  }, [params]);
  
  // Separate effect to check wishlist status when user changes
  useEffect(() => {
    if (data._id && user?._id) {
      checkIfWishlisted(data._id);
    }
  }, [data._id, user?._id]);
  
  // When category data changes, update similar products
  useEffect(() => {
    if (data.category) {
      console.log("Category data changed, fetching similar styles");
      fetchSimilarStyles();
    }
  }, [data.category]);

  // Check if scrolling is possible
  useEffect(() => {
    if (imageContainer.current) {
      const checkScrollability = () => {
        const { scrollLeft, scrollWidth, clientWidth } = imageContainer.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
      }
      
      // Initial check
      checkScrollability()
      
      // Add event listener for scroll
      imageContainer.current.addEventListener('scroll', checkScrollability)
      
      // Cleanup
      return () => {
        if (imageContainer.current) {
          imageContainer.current.removeEventListener('scroll', checkScrollability)
        }
      }
    }
  }, [data.image]) // Re-run when images change

  // Create a component for product details to avoid duplication
  const ProductDetails = ({ className = "" }) => {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-light text-sm uppercase tracking-[0.15em] text-gray-600 font-['Poppins']">Product Specifications</h3>
        </div>
        
        <div className="animate-fadeIn">
          <div className="border-t border-gray-200">
            {/* Remove Primary Color row:
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">Primary Color</div>
              <div className="py-3 px-4 text-gray-800">{data.color || 'Black'}</div>
            </div>
            */}
            

            
            <div className="grid grid-cols-2 border-b border-gray-100">
              <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Wash Care</div>
              <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">{data.washCare || 'Machine wash'}</div>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-100">
              <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Package Contains</div>
              <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">Package contains: 1 {data.name}</div>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-100">
              <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Size worn by Model</div>
              <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">{data.sizeModel || '32'}</div>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-100">
              <div className="py-3.5 px-4 font-medium text-gray-600 bg-gray-50 border-r border-gray-100 font-['Poppins']">Fabric</div>
              <div className="py-3.5 px-4 text-gray-800 font-light font-['Poppins']">{data.fabric || '80% cotton, 19% polyester, 1% elastane'}</div>
            </div>
          </div>
          
          {/* Product description */}
          {data.description && (
            <div className="mt-8">
              <h3 className="font-light text-sm uppercase tracking-[0.15em] text-gray-600 mb-4 font-['Poppins']">Description</h3>
              <p className='text-base text-gray-700 leading-relaxed font-light font-["Poppins"]'>{data.description}</p>
            </div>
          )}
          
          {/* Additional pricing and contact information */}
          <div className="mt-6">
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="flex">
        
              </div>
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32 font-['Poppins']">Marketed By</div>
                <div className="text-gray-800 font-['Poppins']">
                  : {data.marketedBy || "Casual Clothings (India) Pvt. Ltd."}
                </div>
              </div>
              
             
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32 font-['Poppins']">Imported By</div>
                <div className="text-gray-800 font-['Poppins']">
                  : {data.importedBy || "DarkCart Trading (India) Pvt. Ltd."}
                </div>
              </div>
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32 font-['Poppins']">Country of Origin</div>
                <div className="text-gray-800 font-['Poppins']">: {data.countryOfOrigin || "India"}</div>
              </div>
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32 font-['Poppins']">Customer Care Address</div>
                <div className="text-gray-800 font-['Poppins']">
                  : Tower-B, 7th Floor, DarkCart Office, Knowledge Park, Main Road, Bengaluru, Karnataka - 560029
                </div>
              </div>
            </div>
          </div>
          
          {/* Display more details if available */}
          {data?.more_details && Object.keys(data?.more_details).length > 0 && (
            <div className="mt-4 grid gap-2">
              <h3 className="font-medium text-gray-900 mb-2">Additional Details</h3>
              {Object.keys(data?.more_details).map((element, index) => (
                <div key={`details-${element}-${index}`} className="flex py-2 border-b border-gray-100">
                  <p className='font-medium text-gray-900 w-1/3 font-["Poppins"]'>{element}</p>
                  <p className='text-base text-gray-600 w-2/3 font-["Poppins"]'>{data?.more_details[element]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className='bg-gradient-to-b from-gray-50 to-white min-h-screen py-8'>
      <div className='container mx-auto px-4 lg:px-10'>
        {loading ? (
          <div className='flex justify-center items-center min-h-[60vh]'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black'></div>
          </div>
        ) : (
          <>
            {/* Breadcrumb navigation - Styled like HomePage */}
              <div className="flex items-center text-sm text-gray-500 mb-6 font-['Poppins']">
              <Link to="/" className="hover:text-black transition-colors font-medium tracking-wide">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/products" className="hover:text-black transition-colors font-medium tracking-wide">Shop</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-800 truncate max-w-[200px] font-medium">
                {data.name}
              </span>
            </div>            {/* Page introduction - Matches HomePage styling */}
            <div className="mb-8">
              <h2 className="font-light text-sm uppercase tracking-[0.2em] text-gray-500 mb-2 font-['Poppins']">PRODUCT DETAILS</h2>
            </div>
        
            <div className='grid lg:grid-cols-2 gap-6 lg:gap-10 mb-10'>
              {/* Left Side - Product Image Gallery */}
              <div className='space-y-4'>
                {/* Main Product Image */}
                <div className='relative'>
                  {/* Thumbnail gallery on the left side */}
                  <div className='hidden lg:flex flex-col gap-3 absolute left-0 top-0 h-full pr-3 overflow-auto max-h-[450px] hide-scrollbar'>
                    {data.image && data.image.map((img, idx) => (
                      <div 
                        key={`thumb-${idx}`}
                        onClick={() => setImage(idx)}
                        className={`w-16 h-16 border-2 cursor-pointer ${idx === image ? 'border-black' : 'border-gray-200'} overflow-hidden mb-2`}
                      >
                        <img 
                          src={img} 
                          alt={`${data.name} - thumbnail ${idx + 1}`} 
                          className='w-full h-full object-contain'
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Main image */}
                  <div 
                    className='bg-white overflow-hidden relative ml-0 lg:ml-20 group cursor-pointer'
                    onClick={() => openImageModal(image)}
                  >
                    {!imageLoaded && loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black'></div>
                      </div>
                    )}
                    
                    {data.image && data.image.length > 0 && (
                      <img
                        src={data.image[image]}
                        alt={data.name}
                        className={`w-full h-auto max-h-[450px] object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={handleImageLoad}
                      />
                    )}

                
                    
                    {/* Full screen image view button */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="bg-white rounded-full p-2 shadow-sm hover:shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Share button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                    className="absolute top-4 left-4 lg:left-24 bg-white rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 z-20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </button>
                  
                  {copied && (
                    <div className="absolute top-4 left-16 lg:left-36 px-3 py-1 bg-black text-white text-xs rounded shadow-lg z-20">
                      Link copied!
                    </div>
                  )}
                </div>

                {/* Mobile thumbnail gallery */}
                <div className='lg:hidden flex overflow-x-auto gap-3 pb-2 hide-scrollbar'>
                  {data.image && data.image.map((img, idx) => (
                    <div 
                      key={`mobile-thumb-${idx}`}
                      onClick={() => setImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 border-2 ${idx === image ? 'border-black' : 'border-gray-200'}`}
                    >
                      <img 
                        src={img} 
                        alt={`${data.name} - thumbnail ${idx + 1}`} 
                        className='w-full h-full object-contain' 
                      />
                    </div>
                  ))}
                </div>

                {/* Desktop product details */}
                <ProductDetails className="hidden lg:grid" />
              </div>

              {/* Right Side - Product Information */}
              <div>
                {/* Brand/Category name */}
                <h1 className="text-sm font-light uppercase tracking-[0.15em] text-gray-500 mb-2 font-['Poppins']">
                  {data.category?.name || "DARK CART"}
                </h1>
                
                {/* Product name */}
                <h2 className='text-3xl md:text-4xl font-medium text-gray-900 mb-5 leading-tight font-["Playfair_Display"]'>{data.name}</h2>
                

                
                {/* Price section - Styled like HomePage */}
                <div className="mb-8 border-t border-b border-gray-100 py-6">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-2xl md:text-3xl font-medium font-['Poppins']">
                      {DisplayPriceInRupees(pricewithDiscount(data.price, data.discount))}
                    </span>
                    {data.discount > 0 && (
                      <>
                        <span className="text-gray-500 line-through text-lg font-['Poppins']">
                          {DisplayPriceInRupees(data.price)}
                        </span>
                        <span className="bg-black text-white px-2 py-0.5 text-xs font-medium tracking-wide font-['Poppins']">
                          {data.discount}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-light font-['Poppins']">Price inclusive of all taxes</p>
                  
                  {/* Stock Availability - Refined styling */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 font-['Poppins']">Availability:</span>
                    <span className={`text-sm ${data.stock > 10 ? 'text-green-600 font-medium' : data.stock > 0 ? 'text-orange-500 font-medium' : 'text-red-500 font-medium'} font-['Poppins']`}>
                      {data.stock > 10 ? 'In Stock' : data.stock > 0 ? `Only ${data.stock} left` : 'Out of Stock'}
                    </span>
                  </div>
                  
                </div>

                {/* Offer section - Premium styling */}
                <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200 rounded-md p-5 mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-black rounded-full p-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 font-['Poppins']">Premium Collection</p>
                        <p className="text-xs text-gray-600 font-['Poppins']">Exclusive high-quality products</p>
                      </div>
                    </div>
                    <Link to="/search" className="text-sm text-black font-medium border-b border-black hover:border-transparent transition-colors font-['Poppins']">
                      View All
                    </Link>
                  </div>
                </div>

                {/* Add to Bag button - Premium styling */}
                <div className="mb-8">
                  {data.stock === 0 ? (
                    <button disabled className="w-full bg-gray-200 text-gray-500 py-3.5 font-medium tracking-wide text-lg uppercase cursor-not-allowed transition-all duration-300 border border-gray-300 rounded-md">
                      Out of Stock
                    </button>
                  ) : (
                    <div className="relative overflow-hidden group">
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-full"></div>
                      <AddToCartButton data={data} large={true} />
                    </div>
                  )}
                </div>

                {/* Wishlist button - Premium styling */}
                { isWishlisted ? (
                  <div className="mb-8">
                    <button 
                      onClick={handleWishlist}
                      className="w-full bg-black text-white py-3.5 font-medium tracking-wide text-lg uppercase transition-all duration-300 border border-gray-300 rounded-md"
                    >
                      Remove from Wishlist
                    </button>
                  </div>
                ) : (
                  <div className="mb-8">
                    <button 
                      onClick={handleWishlist}
                      className="w-full bg-black text-white py-3.5 font-medium tracking-wide text-lg uppercase transition-all duration-300 border border-gray-300 rounded-md"
                    >
                      Add to Wishlist
                    </button>
                  </div>
                )}

                {/* Product details section - Mobile view */}
                <ProductDetails className="lg:hidden" />
              </div>
            </div>

            {/* Similar Styles Section - Premium styling like HomePage */}
            <div className="my-16 py-12">
                <div className="text-center mb-10">
                <h2 className="font-light text-sm uppercase tracking-[0.2em] text-gray-500 mb-2 font-['Poppins']">EXPLORE MORE</h2>
                <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4 font-['Playfair_Display']">
                  {data.category?.name ? `More ${data.category.name} Products` : 
                   (Array.isArray(data.category) && data.category[0]?.name) ? 
                   `More ${data.category[0].name} Products` : "Similar Styles"}
                </h1>
              </div>              <div className="flex justify-center mb-8">
                <Link 
                  to={`/category/${data.category?._id || (Array.isArray(data.category) && data.category[0]?._id) || ''}`}
                  className="inline-block px-6 py-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-300 text-sm font-medium tracking-wider uppercase font-['Poppins']"
                >
                  View All Products
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {similarStyles.length > 0 ? 
                  similarStyles.map(product => (
                    <SimpleProductCard key={product._id} product={product} />
                  )) : 
                  <div className="col-span-4 py-10 text-center text-gray-500">
                    <p>No similar products found</p>
                    <Link to="/search" className="inline-block mt-4 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
                      Browse All Products
                    </Link>
                  </div>
                }
              </div>
            </div>

            {/* Recently Viewed section removed */}

            {/* Product details and regulatory information sections removed for mobile since they're already shown in ProductDetails component */}
          </>
        )}
      </div>
      
      {/* Image modal with black background overlay */}
      {showImageModal && data.image && data.image.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setShowImageModal(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center">
            <img
              src={data.image[image]}
              alt={data.name}
              className="max-h-[80vh] max-w-full object-contain"
            />
            
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 flex justify-between w-full px-4 pointer-events-none">
              <button 
                className="bg-white rounded-full p-2 hover:bg-gray-100 transition-colors pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setImage((prev) => (prev === 0 ? data.image.length - 1 : prev - 1));
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"></path>
                </svg>
              </button>
              
              <button 
                className="bg-white rounded-full p-2 hover:bg-gray-100 transition-colors pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setImage((prev) => (prev === data.image.length - 1 ? 0 : prev + 1));
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </button>
            </div>
            
            <div className="mt-4 flex justify-center gap-2">
              {data.image.map((img, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full ${idx === image ? 'bg-white' : 'bg-gray-500'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImage(idx);
                  }}
                ></button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* CSS for animations and utilities */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}

export default ProductDisplayPage;