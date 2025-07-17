import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { validURLConvert } from "../utils/validURLConvert";
import PremiumCategoryWiseProductDisplay from "../components/PremiumCategoryWiseProductDisplay";
import PremiumHeroCarousel from "../components/PremiumHeroCarousel";
import { motion } from "framer-motion";

function Home() {
  const loadingCategory = useSelector((state) => state.product.loadingCategory);
  const categoryData = useSelector((state) => state.product.allCategory);
  const navigate = useNavigate();

  // Enhance user experience with smooth scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRedirectProductListPage = (id, category) => {
    const url = `category/${validURLConvert(category)}-${id}`;
    navigate(url);
  };

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Premium Hero Section */}
      <PremiumHeroCarousel />

      {/* Collection Showcase - Premium Typography */}
      <div className="container mx-auto pt-16 pb-8 px-4 lg:px-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-light text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">DISCOVER</h2>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">Curated Collections</h1>
          <p className="max-w-2xl mx-auto text-gray-600 text-sm md:text-base font-light leading-relaxed">
            Browse through our handpicked categories featuring the finest selection of premium products designed for the modern lifestyle.
          </p>
        </motion.div>

        {/* Category Section - Enhanced Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
          {loadingCategory
            ? new Array(12).fill(null).map((c, index) => {
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    key={index + "loadingcategory"}
                    className="bg-white rounded-lg p-3 md:p-4 min-h-32 md:min-h-36 grid gap-2 shadow-sm animate-pulse border border-gray-100"
                  >
                    <div className="bg-gray-100 min-h-20 md:min-h-24 rounded-md"></div>
                    <div className="bg-gray-100 h-6 md:h-8 rounded-md"></div>
                  </motion.div>
                );
              })
            : categoryData.map((category, index) => {
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    key={category._id + "displayCategory"}
                    className="w-full h-full bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden cursor-pointer group"
                    onClick={() =>
                      handleRedirectProductListPage(category._id, category.name)
                    }
                  >
                    <div className="p-3 md:p-4 h-28 md:h-32 flex items-center justify-center bg-gray-50">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-scale-down group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-3 md:p-4 border-t border-gray-100 bg-white">
                      <h3 className="text-xs md:text-sm font-medium text-gray-800 text-center truncate group-hover:text-black">
                        {category.name}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Display category products with refined spacing */}
      <div className="py-8 md:py-12">
        {categoryData?.map((c, index) => {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              key={c._id + "CategorywiseProductDisplay"}
              className="mb-12 md:mb-16 last:mb-0"
            >
              <PremiumCategoryWiseProductDisplay
                id={c._id}
                name={c.name}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default Home;