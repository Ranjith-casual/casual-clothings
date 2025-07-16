import React from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { validURLConvert } from "../utils/validURLConvert";
import CategoryWiseProductDisplay from "../components/CategoryWiseProductDisplay";
import HomeBannerCarousel from "../components/EmblaCarousel";
import EmblaCarousel from "../components/EmblaCarousel";

function Home() {
  const loadingCategory = useSelector((state) => state.product.loadingCategory);
  const categoryData = useSelector((state) => state.product.allCategory);
  const navigate = useNavigate();

  const handleRedirectProductListPage = (id, category) => {
    const url = `category/${validURLConvert(category)}-${id}`;
    navigate(url);
  };

  return (
    <section className="bg-gray-50">
      {/* Animated Banner Carousel */}
      <EmblaCarousel />

      {/* Category Section */}
      <div className="container mx-auto px-4 lg:px-10 my-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {loadingCategory
          ? new Array(12).fill(null).map((c, index) => {
              return (
                <div
                  key={index + "loadingcategory"}
                  className="bg-white rounded-lg p-3 md:p-4 min-h-32 md:min-h-36 grid gap-2 shadow-sm animate-pulse border border-gray-200"
                >
                  <div className="bg-gray-100 min-h-20 md:min-h-24 rounded-md"></div>
                  <div className="bg-gray-100 h-6 md:h-8 rounded-md"></div>
                </div>
              );
            })
          : categoryData.map((category, index) => {
              return (
                <div
                  key={category._id + "displayCategory"}
                  className="w-full h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden cursor-pointer group"
                  onClick={() =>
                    handleRedirectProductListPage(category._id, category.name)
                  }
                >
                  <div className="p-3 md:p-4 h-28 md:h-32 flex items-center justify-center bg-gray-50">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-scale-down group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2 md:p-3 border-t border-gray-100">
                    <h3 className="text-xs md:text-sm font-medium text-gray-900 text-center truncate">
                      {category.name}
                    </h3>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Display category products */}
      {categoryData?.map((c, index) => {
        return (
          <CategoryWiseProductDisplay
            key={c._id + "CategorywiseProductDisplay"}
            id={c._id}
            name={c.name}
          />
        );
      })}
    </section>
  );
}

export default Home;