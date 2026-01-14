import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AxiosTostError from "../utils/AxiosTostError";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import CardLoading from "./CardLoading";
import CardProduct from "./CardProduct";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { PricingService } from "../utils/PricingService";

/**
 * RandomCategoryProducts component for displaying random category products
 * @param {Object} props - Component props
 * @param {string} [props.categoryId] - Optional specific category ID to display products from
 * @param {string} [props.title] - Optional custom title for the section
 * @param {string} [props.excludeProductId] - Optional product ID to exclude from the list
 * @param {number} [props.limit=6] - Number of products to display
 */
function RandomCategoryProducts({ categoryId, title = "You May Also Like", excludeProductId, limit = 6 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [randomCategory, setRandomCategory] = useState(null);
  const loadingCardNumber = new Array(limit).fill(null);
  const containerRef = useRef();

  // First fetch random category if no specific categoryId provided
  useEffect(() => {
    const fetchRandomCategory = async () => {
      if (categoryId) {
        // If we already have a categoryId, just use it
        setRandomCategory({ _id: categoryId });
        return;
      }
      
      try {
        const response = await Axios({
          ...SummaryApi.getCategory,
        });

        if (response.data.success && response.data.data.length > 0) {
          const categories = response.data.data;
          // Get a random category
          const randomIndex = Math.floor(Math.random() * categories.length);
          setRandomCategory(categories[randomIndex]);
        }
      } catch (error) {
        console.error("Error fetching random category:", error);
      }
    };

    fetchRandomCategory();
  }, [categoryId]);

  // Then fetch products for that category
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (!randomCategory) return;
      
      try {
        setLoading(true);
        const response = await Axios({
          ...SummaryApi.getProductByCategory,
          data: {
            id: [randomCategory._id],
            limit: limit + 5, // Fetch a few more in case we need to exclude products
          },
        });

        const { data: responseData } = response;
        if (responseData.success) {
          let filteredData = responseData.data;
          
          // Exclude specific product if requested
          if (excludeProductId) {
            filteredData = filteredData.filter(product => product._id !== excludeProductId);
          }
          
          // Limit to requested number
          filteredData = filteredData.slice(0, limit);
          
          setData(filteredData);
        }
      } catch (error) {
        AxiosTostError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [randomCategory, excludeProductId, limit]);

  // Set up scroll position tracking
  useEffect(() => {
    if (containerRef.current) {
      const updateScrollPosition = () => {
        if (containerRef.current) {
          setScrollPosition(containerRef.current.scrollLeft);
        }
      };
      
      // Calculate maximum scroll position
      const calculateMaxScroll = () => {
        if (containerRef.current) {
          const container = containerRef.current;
          setMaxScroll(container.scrollWidth - container.clientWidth);
        }
      };
      
      calculateMaxScroll();
      containerRef.current.addEventListener("scroll", updateScrollPosition);
      window.addEventListener("resize", calculateMaxScroll);
      
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener("scroll", updateScrollPosition);
        }
        window.removeEventListener("resize", calculateMaxScroll);
      };
    }
  }, [data]);

  // Handle scroll buttons
  const handleScrollLeft = () => {
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="py-6 mt-6 border-t border-gray-100"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-row items-center justify-between mb-4"
        >
          <div className="relative">
            <h2 
              className="text-base sm:text-lg md:text-xl font-medium text-gray-900"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {title}
              {randomCategory && randomCategory.name && title === "You May Also Like" && (
                <> - {randomCategory.name}</>
              )}
            </h2>
            <div className="w-12 h-0.5 bg-gray-900 rounded-full mt-1" />
          </div>
          
          {randomCategory && (
            <Link
              to={`/category/${randomCategory._id}`}
              className="border border-gray-300 px-3 py-1.5 
                      text-xs tracking-wide 
                      bg-white text-gray-700 hover:bg-gray-50
                      transition-all duration-200 rounded"
            >
              View All
            </Link>
          )}
        </motion.div>

        {/* Products Container */}
        <div className="relative px-1 md:px-2">
          {/* Scrollable Products Grid */}
          <div
            ref={containerRef}
            className="flex gap-2 md:gap-3 overflow-x-auto scroll-smooth premium-scroll pb-2 px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading &&
              loadingCardNumber.map((_, index) => (
                <motion.div
                  key={`randomCategoryLoading${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-52"
                >
                  <div className="bg-white rounded shadow-sm p-1 md:p-2 h-[220px] sm:h-[240px] md:h-[260px] flex flex-col">
                    <div className="flex-grow">
                      <CardLoading />
                    </div>
                    <div className="h-12 md:h-14 bg-white animate-pulse rounded"></div>
                  </div>
                </motion.div>
              ))}

            {data.map((product, index) =>
              product && product._id ? (
                <motion.div
                  key={`${product._id}RandomProduct${index}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-36 sm:w-44 md:w-48 lg:w-52"
                >
                  <div className="bg-white rounded shadow-sm overflow-hidden h-[220px] sm:h-[240px] md:h-[260px] flex flex-col">
                    <div className="overflow-hidden bg-white flex-grow relative p-1">
                      <CardProduct data={product} hideProductInfo={true} />
                    </div>
                    
                    {/* Product details */}
                    <div className="p-2 bg-white border-t border-gray-50">
                      <div className="space-y-1">
                        {/* Product Name */}
                        <h3 className="text-xs md:text-sm font-medium text-black leading-tight line-clamp-1 min-h-[1.25rem]">
                          {product.name}
                        </h3>
                        
                        {/* Price and Discount */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-black">
                              {DisplayPriceInRupees(PricingService.applyDiscount(product.price, product.discount))}
                            </span>
                            {product.discount > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                {DisplayPriceInRupees(product.price)}
                              </span>
                            )}
                          </div>
                          {product.discount > 0 && (
                            <span className="text-xs font-medium px-1 py-0.5 text-red-500">
                              {product.discount}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </div>

          {/* Navigation Arrows */}
          {data.length > 2 && (
            <>
              <button
                onClick={handleScrollLeft}
                disabled={scrollPosition <= 0}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 ${
                  scrollPosition <= 0
                    ? "opacity-20 cursor-not-allowed"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                <div className="p-2 border border-gray-300 bg-white rounded-full shadow-lg hover:shadow-xl transition-all">
                  <ChevronLeft className="w-4 h-4 text-black" />
                </div>
              </button>

              <button
                onClick={handleScrollRight}
                disabled={scrollPosition >= maxScroll}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 ${
                  scrollPosition >= maxScroll
                    ? "opacity-20 cursor-not-allowed"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                <div className="p-2 border border-gray-300 bg-white rounded-full shadow-lg hover:shadow-xl transition-all">
                  <ChevronRight className="w-4 h-4 text-black" />
                </div>
              </button>
            </>
          )}
        </div>

        {/* Custom Scrollbar Styling */}
        <style jsx="true">{`
          .premium-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .premium-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </motion.section>
  );
}

export default RandomCategoryProducts;
