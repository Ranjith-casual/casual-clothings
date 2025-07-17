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
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="py-8 md:py-12 lg:py-20 bg-white"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-10">
        {/* Premium Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-12 lg:mb-16 gap-4 sm:gap-0"
        >
          <div className="relative">
            <h2 
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-wider uppercase text-black mb-2 md:mb-3 premium-typography transition-all duration-300 hover:tracking-widest"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {name}
            </h2>
            <div className="w-12 sm:w-14 md:w-16 h-0.5 bg-black rounded-full transition-all duration-500 hover:w-20 sm:hover:w-24 md:hover:w-28" />
          </div>
          
          <Link
            to={`/category/${id}`}
            className="group border border-black/20 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 
                     text-xs sm:text-sm tracking-widest uppercase self-start sm:self-auto
                     hover:bg-black hover:text-white transition-all duration-500 
                     bg-transparent text-black hover:border-black hover:shadow-lg relative overflow-hidden"
          >
            <span className="relative z-10 group-hover:tracking-wider transition-all duration-500">
              View All
            </span>
            <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </Link>
        </motion.div>

        {/* Products Container */}
        <div className="relative px-2 sm:px-4 md:px-8 lg:px-12">
          {/* Scrollable Products Grid */}
          <div
            ref={containerRef}
            className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 overflow-x-auto scroll-smooth premium-scroll pb-4 px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading &&
              loadingCardNumber.map((_, index) => (
                <motion.div
                  key={"premiumCategoryLoading" + index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex-shrink-0 w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80"
                >
                  <div className="bg-gray-50 rounded-sm h-[300px] sm:h-[340px] md:h-80 lg:h-96 xl:h-[28rem] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex-grow">
                      <CardLoading />
                    </div>
                    <div className="h-20 md:h-20 bg-gray-100 animate-pulse"></div>
                  </div>
                </motion.div>
              ))}

            {data.map((product, index) =>
              product && product._id ? (
                <motion.div
                  key={product._id + "premiumCategoryProduct" + index}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="flex-shrink-0 w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 group"
                >
                  <div className="bg-white rounded-sm shadow-sm hover:shadow-xl transition-all duration-700 border border-gray-100 hover:border-gray-200 overflow-hidden h-[300px] sm:h-[340px] md:h-[380px] lg:h-[420px] xl:h-[460px] flex flex-col group-hover:scale-[1.02] transform-gpu">
                    <div className="overflow-hidden bg-gray-50 group-hover:bg-gray-100 transition-all duration-500 flex-grow relative">
                      <CardProduct data={product} hideProductInfo={true} />
                    </div>
                    
                    {/* Desktop: Additional space for product details */}
                    <div className="hidden md:block p-3 lg:p-4 border-t border-gray-50 bg-white">
                      <div className="space-y-2">
                        {/* Product Name */}
                        <h3 className="text-sm lg:text-base font-medium text-black leading-tight tracking-wide line-clamp-2 min-h-[2.5rem] hover:text-gray-700 transition-colors duration-300">
                          {product.name}
                        </h3>
                        
                        {/* Price and Discount */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg lg:text-xl font-bold text-black">
                              {DisplayPriceInRupees(pricewithDiscount(product.price, product.discount))}
                            </span>
                            {product.discount > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                {DisplayPriceInRupees(product.price)}
                              </span>
                            )}
                          </div>
                          {product.discount > 0 && (
                            <span className="text-xs font-medium px-2 py-1 bg-black text-white rounded shadow-sm">
                              {product.discount}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile: Compact product details with more space */}
                    <div className="block md:hidden p-3 border-t border-gray-50 bg-white">
                      <div className="space-y-3">
                        {/* Product Name */}
                        <h3 className="text-xs font-medium text-black leading-tight line-clamp-2 min-h-[2rem]">
                          {product.name}
                        </h3>
                        
                        {/* Price Section - Stacked Layout for Mobile */}
                        <div className="space-y-1">
                          {/* Main Price */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-black">
                              {DisplayPriceInRupees(pricewithDiscount(product.price, product.discount))}
                            </span>
                            {product.discount > 0 && (
                              <span className="text-xs font-medium px-2 py-1 bg-black text-white rounded shadow-sm">
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

          {/* Navigation Arrows - Hidden on Mobile */}
          <div className="hidden md:block lg:block">
            <button
              onClick={handleScrollLeft}
              disabled={scrollPosition <= 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 group transition-all duration-500 ${
                scrollPosition <= 0
                  ? "opacity-20 cursor-not-allowed"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <div className="p-3 md:p-4 border border-black/10 bg-white/95 backdrop-blur-sm 
                             hover:bg-white hover:border-black/30 transition-all duration-500
                             hover:scale-110 shadow-lg hover:shadow-xl rounded-full group-hover:shadow-2xl">
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-black transition-transform duration-300 group-hover:-translate-x-0.5" />
              </div>
            </button>

            <button
              onClick={handleScrollRight}
              disabled={scrollPosition >= maxScroll}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 group transition-all duration-500 ${
                scrollPosition >= maxScroll
                  ? "opacity-20 cursor-not-allowed"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <div className="p-3 md:p-4 border border-black/10 bg-white/95 backdrop-blur-sm 
                             hover:bg-white hover:border-black/30 transition-all duration-500
                             hover:scale-110 shadow-lg hover:shadow-xl rounded-full group-hover:shadow-2xl">
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-black transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>

          {/* Scroll Indicator - More Mobile Friendly & Aesthetic */}
          <div className="flex justify-center mt-6 md:mt-8 lg:mt-10">
            <div className="flex gap-2 md:gap-3 items-center">
              <div className={`h-0.5 transition-all duration-500 ease-out ${
                scrollPosition <= 0 ? 'w-8 md:w-10 bg-black shadow-sm' : 'w-4 md:w-5 bg-black/30'
              } rounded-full`} />
              <div className={`h-0.5 transition-all duration-500 ease-out ${
                scrollPosition > 0 && scrollPosition < maxScroll ? 'w-8 md:w-10 bg-black shadow-sm' : 'w-4 md:w-5 bg-black/30'
              } rounded-full`} />
              <div className={`h-0.5 transition-all duration-500 ease-out ${
                scrollPosition >= maxScroll ? 'w-8 md:w-10 bg-black shadow-sm' : 'w-4 md:w-5 bg-black/30'
              } rounded-full`} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default PremiumCategoryWiseProductDisplay;
