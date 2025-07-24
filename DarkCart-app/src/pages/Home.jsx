import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { validURLConvert } from "../utils/validURLConvert";
import PremiumCategoryWiseProductDisplay from "../components/PremiumCategoryWiseProductDisplay";
import { motion } from "framer-motion";

function Home() {
  const loadingCategory = useSelector((state) => state.product.loadingCategory);
  const categoryData = useSelector((state) => state.product.allCategory);
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hero images from carousel
  const heroImages = [
    '/HomeBanner/banner1.jpg',
    '/HomeBanner/banner2.jpg',
    '/HomeBanner/banner3.jpg',
    '/HomeBanner/banner4.jpg'
  ];

  // Auto-change background image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % heroImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Enhance user experience with smooth scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRedirectProductListPage = (id, category) => {
    const url = `category/${validURLConvert(category)}-${id}`;
    navigate(url);
  };

  return (
    <section className="min-h-screen bg-white">
      {/* Enhanced Welcome Section with Carousel Images */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 md:py-20 lg:py-24 overflow-hidden">
        {/* Dynamic Background Images */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: currentImageIndex === index ? 0.4 : 0,
                scale: currentImageIndex === index ? 1.05 : 1
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <img
                src={image}
                alt={`Fashion Banner ${index + 1}`}
                className="w-full h-full object-cover"
                style={{
                  filter: 'grayscale(20%) contrast(1.1) brightness(0.7)',
                }}
              />
            </motion.div>
          ))}
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>
        </div>

        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Animated Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Welcome Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-2 mb-8 shadow-lg"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-white tracking-wide uppercase">Welcome to Our Store</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white"
            >
              Find Your
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Perfect Look
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Discover premium fashion pieces curated for your lifestyle. From casual wear to formal attire, 
              find quality clothing that defines your unique style.
            </motion.p>

            {/* Interactive CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // If categories are loaded, scroll to collection showcase
                  // Otherwise navigate to a products page or show all products
                  if (categoryData && categoryData.length > 0) {
                    const collectionSection = document.querySelector('.grid.grid-cols-3');
                    if (collectionSection) {
                      collectionSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                      // Add a slight highlight effect to the first few categories
                      setTimeout(() => {
                        const categoryCards = document.querySelectorAll('.grid.grid-cols-3 > div');
                        categoryCards.forEach((card, index) => {
                          if (index < 6) {
                            card.style.transform = 'scale(1.02)';
                            card.style.transition = 'transform 0.3s ease';
                            setTimeout(() => {
                              card.style.transform = 'scale(1)';
                            }, 300);
                          }
                        });
                      }, 500);
                    }
                  } else {
                    // Fallback: navigate to all products or refresh
                    window.location.reload();
                  }
                }}
                className="group bg-white text-black px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 hover:bg-gray-100 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  Shop Collection
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M16 19a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Scroll to the categories grid section with enhanced interaction
                  const categoriesSection = document.querySelector('.grid.grid-cols-3');
                  if (categoriesSection) {
                    categoriesSection.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'center'
                    });
                    // Add a gentle pulse effect to all category cards
                    setTimeout(() => {
                      const categoryCards = document.querySelectorAll('.grid.grid-cols-3 > div');
                      categoryCards.forEach((card, index) => {
                        setTimeout(() => {
                          card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                          card.style.transition = 'box-shadow 0.3s ease';
                          setTimeout(() => {
                            card.style.boxShadow = '';
                          }, 400);
                        }, index * 50);
                      });
                    }, 800);
                  }
                }}
                className="group border-2 border-white/40 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 hover:bg-white/10 hover:border-white/60 bg-white/10 backdrop-blur-sm"
              >
                <span className="flex items-center gap-2">
                  Browse Categories
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </span>
              </motion.button>
            </motion.div>

            {/* Image Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="flex justify-center gap-2 mb-8"
            >
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    currentImageIndex === index 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center text-white/60"
          >
            <span className="text-xs uppercase tracking-wider mb-2">Explore Products</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section - Light Theme */}
      <div className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Fast Delivery</div>
              <div className="text-sm text-gray-500">2-3 Days Shipping</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Quality Assured</div>
              <div className="text-sm text-gray-500">Premium Materials</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Easy Returns</div>
              <div className="text-sm text-gray-500">30 Day Policy</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">24/7 Support</div>
              <div className="text-sm text-gray-500">Always Here</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Collection Showcase - Compact Layout */}
      <div className="container mx-auto pt-2 md:pt-3 lg:pt-4 pb-1 md:pb-2 lg:pb-2 px-4 md:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-2 md:mb-3"
        >
          <h2 className="font-light text-xs uppercase tracking-[0.15em] text-gray-500 mb-1">DISCOVER</h2>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-900 mb-1 md:mb-2">Curated Collections</h1>
          <p className="max-w-xl mx-auto text-gray-600 text-xs md:text-sm font-light leading-relaxed px-4">
            Browse our selection of premium products for the modern lifestyle
          </p>
        </motion.div>

        {/* Category Section - Compact Grid Layout */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1 md:gap-2 lg:gap-3 px-2 md:px-0">
          {loadingCategory
            ? new Array(12).fill(null).map((c, index) => {
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    key={index + "loadingcategory"}
                    className="bg-white rounded p-1 md:p-2 min-h-20 md:min-h-24 lg:min-h-28 grid gap-1 animate-pulse shadow-sm"
                  >
                    <div className="bg-gray-100 min-h-12 md:min-h-16 lg:min-h-20 rounded"></div>
                    <div className="bg-gray-100 h-3 md:h-4 rounded"></div>
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
                    className="w-full bg-white rounded overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                    onClick={() =>
                      handleRedirectProductListPage(category._id, category.name)
                    }
                  >
                    <div className="p-1 md:p-2 h-16 md:h-20 lg:h-24 flex items-center justify-center bg-gray-50">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-scale-down hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-1 md:p-2 bg-white">
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
      <div className="py-1 md:py-2">
        {categoryData?.map((c, index) => {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              key={c._id + "CategorywiseProductDisplay"}
              className={`mb-2 md:mb-3 last:mb-0 ${index > 0 ? 'pt-1 md:pt-2' : ''}`}
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