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
import { pricewithDiscount } from "../utils/PriceWithDiscount";

function PremiumCategoryWiseProductDisplay({ id, name }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const loadingCardNumber = new Array(6).fill(null);
  const containerRef = useRef();

  const fetchCategoryWiseProduct = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getProductByCategory,
        data: {
          id: [id],
        },
      });

      const { data: responseData } = response;
      if (responseData.success) {
        setData(responseData.data);
      }
    } catch (error) {
      AxiosTostError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryWiseProduct();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const updateScrollInfo = () => {
        const container = containerRef.current;
        setScrollPosition(container.scrollLeft);
        setMaxScroll(container.scrollWidth - container.clientWidth);
      };

      updateScrollInfo();
      window.addEventListener("resize", updateScrollInfo);
      containerRef.current.addEventListener("scroll", updateScrollInfo);

      return () => {
        window.removeEventListener("resize", updateScrollInfo);
        if (containerRef.current) {
          containerRef.current.removeEventListener("scroll", updateScrollInfo);
        }
      };
    }
  }, [data]);

  const handleScrollRight = () => {
    const scrollAmount = window.innerWidth < 640 ? 200 : window.innerWidth < 768 ? 300 : 500;
    containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleScrollLeft = () => {
    const scrollAmount = window.innerWidth < 640 ? 200 : window.innerWidth < 768 ? 300 : 500;
    containerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="py-4 md:py-6 lg:py-8 bg-white"
    >
      <div className="container mx-auto px-2 md:px-3 lg:px-4">
        {/* Simplified Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-row items-center justify-between mb-3 md:mb-4"
        >
          <div className="relative">
            <h2 
              className="text-lg sm:text-xl md:text-2xl font-medium uppercase text-black"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {name}
            </h2>
            <div className="w-10 h-0.5 bg-black rounded-full mt-1" />
          </div>
          
          <Link
            to={`/category/${id}`}
            className="border border-black/20 px-2 py-1 
                     text-xs tracking-wide uppercase
                     bg-transparent text-black"
          >
            View All
          </Link>
        </motion.div>

        {/* Products Container - Simplified */}
        <div className="relative px-1 sm:px-2 md:px-3 lg:px-4">
          {/* Scrollable Products Grid */}
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth premium-scroll pb-2 px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading &&
              loadingCardNumber.map((_, index) => (
                <motion.div
                  key={"premiumCategoryLoading" + index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 w-40 sm:w-48 md:w-52 lg:w-56 xl:w-64"
                >
                  <div className="bg-white rounded h-[260px] sm:h-[280px] md:h-[300px] lg:h-[320px] flex flex-col">
                    <div className="flex-grow">
                      <CardLoading />
                    </div>
                    <div className="h-16 bg-white animate-pulse"></div>
                  </div>
                </motion.div>
              ))}

            {data.map((product, index) =>
              product && product._id ? (
                <motion.div
                  key={product._id + "premiumCategoryProduct" + index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-40 sm:w-48 md:w-52 lg:w-56 xl:w-64"
                >
                  <div className="bg-white rounded overflow-hidden h-[260px] sm:h-[280px] md:h-[300px] lg:h-[320px] flex flex-col">
                    <div className="overflow-hidden bg-white flex-grow relative">
                      <CardProduct data={product} hideProductInfo={true} />
                    </div>
                    
                    {/* Desktop: Simplified product details */}
                    <div className="hidden md:block p-2 border-t border-gray-100 bg-white">
                      <div className="space-y-1">
                        {/* Product Name */}
                        <h3 className="text-xs font-medium text-black leading-tight line-clamp-1 min-h-[1.25rem] font-serif">
                          {product.name}
                        </h3>

                        {/* Product Description */}
                        <p className="text-[10px] italic text-gray-500 line-clamp-1 font-serif">
                          {product.description ? 
                            product.description.substring(0, 40) + (product.description.length > 40 ? '...' : '') 
                            : 'No description'}
                        </p>
                        
                        {/* Price and Discount */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-black">
                              {DisplayPriceInRupees(pricewithDiscount(product.price, product.discount))}
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

                    {/* Mobile: Simplified product details */}
                    <div className="block md:hidden p-2 border-t border-gray-100 bg-white">
                      <div className="space-y-1">
                        {/* Product Name */}
                        <h3 className="text-xs font-medium text-black leading-tight line-clamp-1 min-h-[1.25rem] font-serif">
                          {product.name}
                        </h3>
                        
                        {/* Brief Description */}
                        <p className="text-[10px] italic text-gray-500 line-clamp-1 font-serif">
                          {product.description ? 
                            product.description.substring(0, 30) + (product.description.length > 30 ? '...' : '') 
                            : 'No description'}
                        </p>
                        
                        {/* Simplified Price Section for Mobile */}
                        <div>
                          {/* Main Price */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-black">
                              {DisplayPriceInRupees(pricewithDiscount(product.price, product.discount))}
                            </span>
                            {product.discount > 0 && (
                              <span className="text-xs font-medium px-1 py-0.5 text-red-500">
                                {product.discount}% OFF
                              </span>
                            )}
                          </div>
                          
                          {/* Original Price - Separate Line */}
                          {product.discount > 0 && (
                            <div className="flex justify-start">
                              <span className="text-xs text-gray-400 line-through">
                                {DisplayPriceInRupees(product.price)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </div>

          {/* Simplified Navigation Arrows */}
          <div className="hidden md:block">
            <button
              onClick={handleScrollLeft}
              disabled={scrollPosition <= 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 ${
                scrollPosition <= 0
                  ? "opacity-20 cursor-not-allowed"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="p-2 border border-gray-300 bg-white rounded-full shadow-md">
                <ChevronLeft className="w-5 h-5 text-black" />
              </div>
            </button>

            <button
              onClick={handleScrollRight}
              disabled={scrollPosition >= maxScroll}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 ${
                scrollPosition >= maxScroll
                  ? "opacity-20 cursor-not-allowed"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="p-2 border border-gray-300 bg-white rounded-full shadow-md">
                <ChevronRight className="w-5 h-5 text-black" />
              </div>
            </button>
          </div>

          {/* Simplified Scroll Indicator */}
          <div className="flex justify-center mt-2">
            <div className="flex gap-1 items-center">
              <div className={`h-0.5 ${
                scrollPosition <= 0 ? 'w-6 bg-black' : 'w-3 bg-gray-300'
              } rounded-full`} />
              <div className={`h-0.5 ${
                scrollPosition > 0 && scrollPosition < maxScroll ? 'w-6 bg-black' : 'w-3 bg-gray-300'
              } rounded-full`} />
              <div className={`h-0.5 ${
                scrollPosition >= maxScroll ? 'w-6 bg-black' : 'w-3 bg-gray-300'
              } rounded-full`} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default PremiumCategoryWiseProductDisplay;
