import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { validURLConvert } from "../utils/validURLConvert";
import PremiumCategoryWiseProductDisplay from "../components/PremiumCategoryWiseProductDisplay";
import { motion } from "framer-motion";
import { FaTshirt, FaArrowRight } from "react-icons/fa";

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
    <section className="min-h-screen bg-[#f1f3f6]">
      {/* Features Section - Light Theme */}
    

      {/* Collection Showcase - Flipkart-Style Layout */}
      <div className="container mx-auto pt-8 pb-6 px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 md:mb-8 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-sm uppercase tracking-[0.15em] text-gray-600 mb-2 font-sans">COLLECTIONS</h2>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-900 mb-2 md:mb-3 font-serif">Shop By Category</h1>
          <div className="w-16 h-0.5 bg-gray-300 mx-auto mb-4"></div>
          <p className="max-w-xl mx-auto text-gray-600 text-sm font-light px-4 font-sans">
            Browse our carefully selected categories for your wardrobe essentials
          </p>
        </div>

        {/* Category Section - Flipkart-Style Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 px-3 md:px-6">
          {loadingCategory
            ? new Array(12).fill(null).map((c, index) => {
                return (
                  <div
                    key={index + "loadingcategory"}
                    className="bg-white border border-[#e0e0e0] rounded-sm p-3 h-32 md:h-40 grid gap-2 shadow-[0_2px_5px_rgba(0,0,0,0.05)] transition-all duration-200"
                  >
                    <div className="bg-gray-100 h-4/5 rounded-sm"></div>
                    <div className="bg-gray-100 h-4 rounded-sm"></div>
                  </div>
                );
              })
            : categoryData.map((category) => {
                return (
                  <div
                    key={category._id + "displayCategory"}
                    className="w-full bg-white border border-[#e0e0e0] rounded-sm overflow-hidden cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.1)] transition-all duration-200 hover:transform hover:scale-[1.02]"
                    onClick={() =>
                      handleRedirectProductListPage(category._id, category.name)
                    }
                  >
                    <div className="p-3 h-24 md:h-28 lg:h-32 flex items-center justify-center bg-white">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-2 md:p-3 border-t border-[#e0e0e0] bg-white">
                      <h3 className="text-xs md:text-sm font-medium text-gray-800 text-center truncate font-sans">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Custom T-Shirt Request CTA Section */}
     

      {/* Display category products with Flipkart-style spacing */}
      <div className="py-3 md:py-4">
        {categoryData?.map((c, index) => {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              key={c._id + "CategorywiseProductDisplay"}
              className={`mb-4 md:mb-6 last:mb-0 ${index > 0 ? 'pt-2 md:pt-3' : ''} bg-white shadow-sm rounded-sm mx-3 md:mx-6`}
            >
              <PremiumCategoryWiseProductDisplay
                id={c._id}
                name={c.name}
              />
              
            </motion.div>
            
          );
        })}
      </div>
       <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className=" rounded-sm p-6 md:p-8 text-center relative overflow-hidden "
        >
          {/* Background pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjMuNSAzLjIgMS4zLjkuOSAxLjMgMS45IDEuMyAzLjJzLS41IDIuMy0xLjMgMy4yYy0uOS45LTIgMS4zLTMuMiAxLjNzLTIuMy0uNS0zLjItMS4zYy0uOS0uOS0xLjMtMS45LTEuMy0zLjJzLjUtMi4zIDEuMy0zLjJjLjktLjkgMi0xLjMgMy4yLTEuM3ptLTEyIDBjMS4yIDAgMi4zLjUgMy4yIDEuMy45LjkgMS4zIDEuOSAxLjMgMy4ycy0uNSAyLjMtMS4zIDMuMmMtLjkuOS0yIDEuMy0zLjIgMS4zcy0yLjMtLjUtMy4yLTEuM2MtLjktLjktMS4zLTEuOS0xLjMtMy4ycy41LTIuMyAxLjMtMy4yYy45LS45IDItMS4zIDMuMi0xLjN6bTEyIDEyYzEuMiAwIDIuMy41IDMuMiAxLjMuOS45IDEuMyAxLjkgMS4zIDMuMnMtLjUgMi4zLTEuMyAzLjJjLS45LjktMiAxLjMtMy4yIDEuM3MtMi4zLS41LTMuMi0xLjNjLS45LS45LTEuMy0xLjktMS4zLTMuMnMuNS0yLjMgMS4zLTMuMmMuOS0uOSAyLTEuMyAzLjItMS4zem0tMTIgMGMxLjIgMCAyLjMuNSAzLjIgMS4zLjkuOSAxLjMgMS45IDEuMyAzLjJzLS41IDIuMy0xLjMgMy4yYy0uOS45LTIgMS4zLTMuMiAxLjNzLTIuMy0uNS0zLjItMS4zYy0uOS0uOS0xLjMtMS45LTEuMy0zLjJzLjUtMi4zIDEuMy0zLjJjLjktLjkgMi0xLjMgMy4yLTEuM3oiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-gray relative z-10">
            Want Something Unique?
          </h2>
          
          <p className="text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto relative z-10">
            Create your own custom t-shirt design with our design studio
          </p>
          
          <Link
            to="/custom-tshirt"
            className="inline-flex items-center justify-center gap-2 bg-white py-3 px-6 font-medium text-black rounded-sm hover:bg-gray-100 transition-colors duration-300 relative z-10"
          >
            <FaTshirt className="text-lg" />
            Design Your Own T-Shirt
            <FaArrowRight className="ml-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default Home;