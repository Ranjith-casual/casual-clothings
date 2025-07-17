import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi.js'
import Axios from '../utils/Axios'
import AxiosTostError from '../utils/AxiosTostError'
import { FaAngleRight, FaAngleLeft, FaRegHeart, FaHeart, FaShare, FaStar, FaArrowRight } from "react-icons/fa6";
import { FaShoppingCart } from "react-icons/fa";
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import Divider from '../components/Divider'
import image1 from '../assets/productDescriptionImages/In no time-rafiki.png'
import image2 from '../assets/productDescriptionImages/Online world-amico.png'
import image3 from '../assets/productDescriptionImages/World Press Freedom Day-cuate.png'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton.jsx'
import { useSelector } from 'react-redux'
import { useGlobalContext } from '../provider/GlobalProvider'
import toast from 'react-hot-toast'

// Simple Product Card component for Similar Styles and Recently Viewed sections
const SimpleProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, checkWishlistItem } = useGlobalContext();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const user = useSelector((state) => state.user);
  
  useEffect(() => {
    const checkWishlist = async () => {
      if (product._id && user?._id) {
        try {
          console.log("SimpleProductCard: Checking wishlist for", product._id);
          const isInWishlist = await checkWishlistItem(product._id);
          console.log("SimpleProductCard: Is in wishlist:", isInWishlist);
          setIsWishlisted(isInWishlist);
        } catch (error) {
          console.error("Error checking wishlist in SimpleProductCard:", error);
        }
      }
    };
    
    checkWishlist();
  }, [product._id, user?._id, checkWishlistItem]);
  
  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?._id) {
      toast.error("Please login to add items to wishlist");
      navigate("/login");
      return;
    }
    
    try {
      console.log("SimpleProductCard: Updating wishlist for", product._id, "Current status:", isWishlisted);
      if (isWishlisted) {
        const result = await removeFromWishlist(product._id);
        console.log("SimpleProductCard: Remove from wishlist result:", result);
        if (result && result.success) {
          setIsWishlisted(false);
          toast.success("Removed from wishlist");
        } else {
          toast.error("Failed to remove from wishlist");
        }
      } else {
        const result = await addToWishlist(product._id);
        console.log("SimpleProductCard: Add to wishlist result:", result);
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
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const price = product.price || 0;
  const discount = product.discount || 0;
  const discountedPrice = pricewithDiscount(price, discount);
  const productImage = product.image?.[0] || '';
  const productName = product.name || 'Product';
  const categoryName = product.category?.[0]?.name || product.category?.name || 'Fashion';
  const productId = product._id;
  
  return (
    <div className="relative">
      <Link 
        to={`/product/${productName?.toLowerCase().replace(/ /g, '-')}-${productId}`} 
        className="block group"
      >
        {/* Product Image */}
        <div className="aspect-square border border-gray-200 p-2 overflow-hidden bg-white relative mb-3">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
          )}
          {productImage ? (
            <img 
              src={productImage} 
              alt={productName} 
              className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-105 ${
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
        <div className="text-center">
          <div className="uppercase text-xs font-medium text-gray-600 mb-1">{categoryName}</div>
          <div className="font-medium text-sm mb-1 line-clamp-2 h-10">{productName}</div>
          <div className="flex justify-center items-center gap-2">
            <span className="font-bold">
              {DisplayPriceInRupees(discountedPrice)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xs text-gray-500 line-through">
                  {DisplayPriceInRupees(price)}
                </span>
                <span className="text-xs text-green-600">
                  ({discount}% OFF)
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      
      {/* Wishlist Button */}
      <button 
        onClick={handleWishlist}
        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm z-10"
      >
        {isWishlisted ? (
          <FaHeart className="text-red-500 w-3.5 h-3.5" />
        ) : (
          <FaRegHeart className="text-gray-600 w-3.5 h-3.5 group-hover:text-red-500" />
        )}
      </button>
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
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          {/* ... existing code ... */}
        </div>
        
        <div className="animate-fadeIn">
          <div className="border-t border-gray-200">
            {/* Remove Primary Color row:
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">Primary Color</div>
              <div className="py-3 px-4 text-gray-800">{data.color || 'Black'}</div>
            </div>
            */}
            
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">Wash Care</div>
              <div className="py-3 px-4 text-gray-800">{data.washCare || 'Machine wash'}</div>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">Package Contains</div>
              <div className="py-3 px-4 text-gray-800">Package contains: 1 {data.name}</div>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">Size worn by Model</div>
              <div className="py-3 px-4 text-gray-800">{data.sizeModel || '32'}</div>
            </div>
            
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="py-3 px-4 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">Fabric</div>
              <div className="py-3 px-4 text-gray-800">{data.fabric || '80% cotton, 19% polyester, 1% elastane'}</div>
            </div>
          </div>
          
          {/* Product description */}
          {data.description && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Description</h3>
              <p className='text-base text-gray-600 leading-relaxed'>{data.description}</p>
            </div>
          )}
          
          {/* Additional pricing and contact information */}
          <div className="mt-6">
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="flex">
        
              </div>
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32">Marketed By</div>
                <div className="text-gray-800">
                  : {data.marketedBy || "Casual Clothings (India) Pvt. Ltd."}
                </div>
              </div>
              
             
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32">Imported By</div>
                <div className="text-gray-800">
                  : {data.importedBy || "DarkCart Trading (India) Pvt. Ltd."}
                </div>
              </div>
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32">Country of Origin</div>
                <div className="text-gray-800">: {data.countryOfOrigin || "India"}</div>
              </div>
              
              <div className="flex">
                <div className="font-medium text-gray-600 w-32">Customer Care Address</div>
                <div className="text-gray-800">
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
                  <p className='font-medium text-gray-900 w-1/3'>{element}</p>
                  <p className='text-base text-gray-600 w-2/3'>{data?.more_details[element]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className='bg-white min-h-screen py-6'>
      <div className='container mx-auto p-4'>
        {loading ? (
          <div className='flex justify-center items-center min-h-[60vh]'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black'></div>
          </div>
        ) : (
          <>
            {/* Breadcrumb navigation */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Link to="/" className="hover:text-black transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/men" className="hover:text-black transition-colors">Men</Link>
              <span className="mx-2">/</span>
           
              <span className="text-gray-800 truncate max-w-[200px]">
                {data.name}
              </span>
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
                <h1 className="text-2xl font-bold text-gray-800 uppercase mb-1">
                  {data.category?.name || "DARK CART"}
                </h1>
                
                {/* Product name */}
                <h2 className='text-2xl font-bold text-gray-900 mb-4'>{data.name}</h2>
                
                {/* Ratings */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-green-600 text-white px-2 py-1 rounded-sm text-sm font-bold flex items-center gap-1">
                 
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">{Math.floor(Math.random() * 500) + 100} Ratings</span>
                </div>
                
                {/* Price section */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-bold">
                      {DisplayPriceInRupees(pricewithDiscount(data.price, data.discount))}
                    </span>
                    {data.discount > 0 && (
                      <>
                        <span className="text-gray-500 line-through">
                          {DisplayPriceInRupees(data.price)}
                        </span>
                        <span className="text-green-600 font-semibold">
                          ({data.discount}% OFF)
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Price inclusive of all taxes</p>
                </div>

                {/* Offer section */}
                <div className="border border-gray-200 rounded-sm p-4 mb-6 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm">
                    <Link to="/search" className="text-blue-600 underline">View All Products</Link>
                  </div>
                </div>

                {/* Add to Bag button */}
                <div className="mb-6">
                  {data.stock === 0 ? (
                    <button disabled className="w-full bg-gray-300 text-gray-600 py-3 font-bold text-lg uppercase cursor-not-allowed">
                      Out of Stock
                    </button>
                  ) : (
                    <AddToCartButton data={data} large={true} />
                  )}
                </div>

                {/* Save to wishlist button */}
                <div className="mb-6">
                  <button 
                    onClick={handleWishlist}
                    className="w-full border border-gray-300 hover:border-gray-500 flex items-center justify-center gap-2 py-3 text-gray-700 hover:text-black transition-colors font-semibold text-lg"
                  >
                    {isWishlisted ? (
                      <>
                        <FaHeart className="text-red-500" />
                        Remove from Wishlist
                      </>
                    ) : (
                      <>
                        <FaRegHeart />
                        Save to Wishlist
                      </>
                    )}
                  </button>
                </div>
                
                {/* Product details section - Mobile view */}
                <ProductDetails className="lg:hidden" />
              </div>
            </div>

            {/* Similar Styles Section - Matching the screenshot */}
            <div className="my-12 border-t border-b border-gray-200 py-8">
              <h2 className="text-xl font-bold text-center mb-8">
                {data.category?.name ? `More ${data.category.name} Products` : 
                 (Array.isArray(data.category) && data.category[0]?.name) ? 
                 `More ${data.category[0].name} Products` : "Similar Styles"}
              </h2>
              
              <div className="flex justify-center mb-4">
                <Link 
                
                  to={`/category/${data.category?._id || (Array.isArray(data.category) && data.category[0]?._id) || ''}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View all in this category
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            {/* Recently Viewed Section */}
            <div className="my-12">
              <h2 className="text-xl font-bold text-center mb-8">Recently Viewed</h2>
              <div className="flex justify-center">
                <Link to={`/product/${data.name?.toLowerCase().replace(/ /g, '-')}-${data._id}`} className="max-w-xs">
                  <div className="aspect-square overflow-hidden mb-3 border border-gray-200">
                    <img 
                      src={data.image?.[0]} 
                      alt={data.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <div className="uppercase text-xs font-medium text-gray-600 mb-1">
                      {data.category?.name || "DARK CART"}
                    </div>
                    <div className="font-medium text-sm mb-1 line-clamp-2">{data.name}</div>
                    <div className="flex justify-center items-center gap-2">
                      <span className="font-bold">
                        {DisplayPriceInRupees(pricewithDiscount(data.price, data.discount))}
                      </span>
                      {data.discount > 0 && (
                        <>
                          <span className="text-xs text-gray-500 line-through">
                            {DisplayPriceInRupees(data.price)}
                          </span>
                          <span className="text-xs text-green-600">
                            ({data.discount}% OFF)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Product details section - styled like in Levi's */}
            <div className="mt-10 border-t border-gray-200 pt-6 lg:hidden">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="font-bold mb-2">Wash Care</h3>
                  <p>{data.washCare || 'Machine wash'}</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Fabric</h3>
                  <p>{data.fabric || '80% cotton, 19% polyester, 1% elastane'}</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Package Contains</h3>
                  <p>1 {data.name}</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Size worn by Model</h3>
                  <p>{data.sizeModel || '32'}</p>
                </div>
              </div>
            </div>

            {/* Regulatory information section */}
            <div className="mt-10 border-t border-gray-200 pt-6 lg:hidden">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Regulatory Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex">
                  <div className="font-bold text-gray-700 w-36">MRP</div>
                  <div className="text-gray-800">
                    : {DisplayPriceInRupees(data.price)} (inclusive of all taxes)
                  </div>
                </div>
                
                <div className="flex">
                  <div className="font-bold text-gray-700 w-36">Marketed By</div>
                  <div className="text-gray-800">
                    : {data.marketedBy || "DarkCart Trading (India) Pvt. Ltd."}
                  </div>
                </div>
                
                <div className="flex">
                  <div className="font-bold text-gray-700 w-36">Imported By</div>
                  <div className="text-gray-800">
                    : {data.importedBy || "DarkCart Trading (India) Pvt. Ltd."}
                  </div>
                </div>
                
                <div className="flex">
                  <div className="font-bold text-gray-700 w-36">Country of Origin</div>
                  <div className="text-gray-800">: {data.countryOfOrigin || "Bangladesh"}</div>
                </div>
              </div>
            </div>
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