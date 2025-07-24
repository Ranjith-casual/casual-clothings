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
          

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white font-serif"
            >
              Find Your
              <span className="block bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent">
                Perfect Look
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed font-sans"
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
                className="group bg-white text-black px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 hover:bg-gray-100 shadow-lg hover:shadow-xl font-sans"
              >
                <span className="flex items-center gap-2">
                  Shop Collection
                
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
                className="group border-2 border-white/40 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 hover:bg-white/10 hover:border-white/60 bg-white/10 backdrop-blur-sm font-sans"
              >
                <span className="flex items-center gap-2">
                  Browse Categories
                 
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
            className="flex flex-col items-center text-white/60 cursor-pointer"
            onClick={() => {
              const categoriesSection = document.querySelector('.grid.grid-cols-3');
              if (categoriesSection) {
                categoriesSection.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }}
          >
            <span className="text-xs uppercase tracking-wider mb-2 font-sans">Explore Products</span>
            
            {/* Desktop Scroll Indicator */}
            <div className="hidden md:block">
              <svg 
                width="24" 
                height="36" 
                viewBox="0 0 24 36" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-white/60"
              >
                {/* Mouse outline */}
                <rect 
                  x="6" 
                  y="2" 
                  width="12" 
                  height="20" 
                  rx="6" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  fill="none"
                />
                {/* Scroll wheel */}
                <motion.circle
                  cx="12"
                  cy="8"
                  r="1.5"
                  fill="currentColor"
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Arrow pointing down */}
                <motion.path
                  d="M12 26L8 22M12 26L16 22M12 26V30"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
            </div>

            {/* Mobile Scroll Indicator */}
            <div className="md:hidden">
              <svg 
                width="20" 
                height="32" 
                viewBox="0 0 20 32" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-white/60"
              >
                {/* Phone outline */}
                <rect 
                  x="4" 
                  y="2" 
                  width="12" 
                  height="18" 
                  rx="3" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  fill="none"
                />
                {/* Touch indicator */}
                <motion.circle
                  cx="10"
                  cy="8"
                  r="1"
                  fill="currentColor"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Swipe arrow */}
                <motion.path
                  d="M10 24L7 21M10 24L13 21M10 24V28"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section - Light Theme */}
    

      {/* Collection Showcase - Compact Layout */}
      <div className="container mx-auto pt-2 md:pt-3 lg:pt-4 pb-1 md:pb-2 lg:pb-2 px-4 md:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-2 md:mb-3"
        >
          <h2 className="font-light text-xs uppercase tracking-[0.15em] text-gray-500 mb-1 font-sans">DISCOVER</h2>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-900 mb-1 md:mb-2 font-serif">Curated Collections</h1>
          <p className="max-w-xl mx-auto text-gray-600 text-xs md:text-sm font-light leading-relaxed px-4 font-sans">
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
                      <h3 className="text-xs font-medium text-gray-800 text-center truncate font-sans">
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