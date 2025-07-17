import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AxiosTostError from "../utils/AxiosTostError";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import CardLoading from "./CardLoading";
import CardProduct from "./CardProduct";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

function CategoryWiseProductDisplay({ id, name }) {
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
      // Update scroll metrics when window resizes
      window.addEventListener("resize", updateScrollInfo);
      // Update scroll position when scrolling
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
    containerRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  const handleScrollLeft = () => {
    containerRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 opacity-50"></div>
      
      <div className="container mx-auto px-6 flex items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="font-bold text-2xl md:text-3xl text-gray-800 font-serif tracking-tight mb-2">
            {name}
          </h3>
          <div className="w-20 h-1.5 bg-gradient-to-r from-gray-800 via-gray-600 to-gray-400 rounded-full"></div>
        </div>
        <Link
          to={`/category/${id}`}
          className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-8 py-3 rounded-xl font-medium tracking-wide hover:from-gray-800 hover:to-gray-600 shadow-lg"
        >
          View All
        </Link>
      </div>

      {/* Scrollable Product Cards */}
      <div className="relative">
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8 container mx-auto px-6 overflow-x-auto scroll-smooth no-scrollbar py-6"
          ref={containerRef}
          style={{ scrollBehavior: "smooth" }}
        >
          {loading &&
            loadingCardNumber.map((_, index) => (
              <div
                key={"CategorywiseProductDisplay123" + index}
                className="flex-shrink-0"
              >
                <div className="w-full h-80 sm:h-84 md:h-88 lg:h-96 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                  <CardLoading />
                </div>
              </div>
            ))}

          {/* Make sure data is valid before rendering */}
          {data.map((product, index) =>
            product && product._id ? (
              <div key={product._id + "CategorywiseProductDisplay" + index} className="flex-shrink-0">
                <div className="bg-white rounded-2xl p-3 overflow-hidden">
                  <CardProduct data={product} />
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* Scroll Buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <button
            onClick={handleScrollLeft}
            disabled={scrollPosition <= 0}
            className={`z-10 bg-white shadow-xl text-gray-700 p-4 rounded-full pointer-events-auto hidden lg:block border-2 border-gray-200 ${
              scrollPosition <= 0
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-gray-50 hover:border-gray-300"
            }`}
            aria-label="Scroll left"
          >
            <FaAngleLeft size={20} />
          </button>
          <button
            onClick={handleScrollRight}
            disabled={scrollPosition >= maxScroll}
            className={`z-10 bg-white shadow-xl text-gray-700 p-4 rounded-full pointer-events-auto hidden lg:block border-2 border-gray-200 ${
              scrollPosition >= maxScroll
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-gray-50 hover:border-gray-300"
            }`}
            aria-label="Scroll right"
          >
            <FaAngleRight size={20} />
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styling */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        
        .no-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .no-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        .no-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .no-scrollbar {
          -ms-overflow-style: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        @media (max-width: 768px) {
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  );
}

export default CategoryWiseProductDisplay;
