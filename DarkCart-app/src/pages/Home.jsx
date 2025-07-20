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

      {/* Collection Showcase - Ultra Compact Layout */}
      <div className="container mx-auto pt-8 pb-4 px-2 lg:px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-4"
        >
          <h2 className="font-light text-xs uppercase tracking-[0.15em] text-gray-500 mb-1">DISCOVER</h2>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">Curated Collections</h1>
          <p className="max-w-xl mx-auto text-gray-600 text-xs md:text-sm font-light leading-relaxed">
            Browse our selection of premium products for the modern lifestyle
          </p>
        </motion.div>

        {/* Category Section - Ultra Compact Grid Layout */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1">
          {loadingCategory
            ? new Array(12).fill(null).map((c, index) => {
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    key={index + "loadingcategory"}
                    className="bg-white rounded p-1 min-h-24 grid gap-1 animate-pulse"
                  >
                    <div className="bg-gray-100 min-h-16 rounded"></div>
                    <div className="bg-gray-100 h-4 rounded"></div>
                  </motion.div>
                );
              })
            : categoryData.map((category, index) => {
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    key={category._id + "displayCategory"}
                    className="w-full bg-white rounded overflow-hidden cursor-pointer"
                    onClick={() =>
                      handleRedirectProductListPage(category._id, category.name)
                    }
                  >
                    <div className="p-1 h-20 flex items-center justify-center bg-gray-50">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-scale-down"
                      />
                    </div>
                    <div className="p-1 border-t border-gray-50 bg-white">
                      <h3 className="text-xs font-medium text-gray-800 text-center truncate">
                        {category.name}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Display category products with ultra compact spacing */}
      <div className="py-4 md:py-6">
        {categoryData?.map((c, index) => {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              key={c._id + "CategorywiseProductDisplay"}
              className="mb-4 md:mb-6 last:mb-0"
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