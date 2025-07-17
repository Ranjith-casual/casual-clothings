import React, { useState, useEffect } from 'react';
import CardSwap, { Card } from '../components/CardSwap';
import Particles from './Particles';

// Import banner images
const banner1 = "/HomeBanner/banner1.jpg";

const banner3 = "/HomeBanner/banner3.jpg";
const banner4 = "/HomeBanner/banner4.jpg";

const HomeBannerCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const bannerData = [
    {
      image: banner1,
      title: "Summer Collection",
      description: "Discover our latest summer styles with breathable fabrics and vibrant designs perfect for the season.",
      headline: "Effortless Elegance",
      subheadline: "For Summer Days"
    },
    // {
    //   image: banner2,
    //   title: "Casual Essentials", 
    //   description: "Everyday comfort wear that combines style and functionality for your daily adventures.",
    //   headline: "Timeless Style",
    //   subheadline: "Everyday Comfort"
    // },
    {
      image: banner3,
      title: "Urban Style",
      description: "Modern street fashion that makes a statement with contemporary cuts and bold designs.",
      headline: "Urban Aesthetic",
      subheadline: "Bold Expression"
    },
    {
      image: banner4,
      title: "Premium Fabrics",
      description: "Experience luxury with our premium fabric collection designed for lasting quality and comfort.",
      headline: "Luxurious Touch",
      subheadline: "Refined Quality"
    }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black card-carousel-container">
      {/* Particles Background - Lowest Layer */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#ffffff', '#e5e7eb']}
          particleCount={150}
          particleSpread={8}
          speed={0.05}
          particleBaseSize={50}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>

      {/* CardSwap component - Middle Layer */}
      <div className="absolute inset-0 z-10">
        <CardSwap
          width={window?.innerWidth || 1820}
          height={window?.innerHeight || 1080}
          cardDistance={30}
          verticalDistance={100}
          delay={4000}
          pauseOnHover={false}
          responsive={true}
          easing="elastic"
          onCardClick={(index) => console.log(`Card ${index + 1} clicked`)}
          onCardChange={(index) => setActiveIndex(index)}
        >
          {bannerData.map((banner, index) => (
            <Card 
              key={index}
              title={banner.title}
              description={banner.description}
              role="img"
              aria-label={`${banner.title}: ${banner.description}`}
              tabIndex={0}
            >
              <img 
                src={banner.image} 
                alt={banner.title}
                className="w-full h-full object-cover rounded-xl"
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDQwMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTYwQzIwNyAxNjAgMjEzIDEwNCAyMjAgMTA0VjIxNkMxOTMgMjE2IDE4MCAyMDMgMTgwIDE2MEMxODAgMTM3IDE5MyAxMjQgMjAwIDEyNFYxNjBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo=';
                }}
              />
            </Card>
          ))}
        </CardSwap>
      </div>

      {/* Description overlay - Highest Layer */}
      <div className="absolute inset-0 z-50 flex items-center justify-start">
        <div className="w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl p-6">
            <div className="overflow-hidden relative mb-2">
              {bannerData.map((banner, index) => (
                <div 
                  key={index}
                  className={`transition-all duration-700 ease-in-out ${index === activeIndex ? 'opacity-100 transform translate-y-0' : 'opacity-0 absolute top-0 transform -translate-y-8'}`}
                >
                  <h1 className="font-serif italic text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-200 mb-1 leading-tight drop-shadow-2xl tracking-wide">
                    {banner.headline}
                    <span className="block font-light tracking-wider">{banner.subheadline}</span>
                  </h1>
                  <p className="text-gray-200 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 leading-relaxed font-light tracking-wide">
                    {banner.description}
                  </p>
                </div>
              ))}
            </div>
            <button className="bg-gradient-to-r from-white to-gray-100 text-black px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 xl:px-10 xl:py-5 rounded-lg hover:from-gray-100 hover:to-white transition-all duration-300 font-light tracking-widest text-xs sm:text-sm md:text-base lg:text-lg transform hover:scale-105 shadow-2xl border border-white/50">
              SHOP COLLECTION
            </button>
          </div>
        </div>
      </div>

      {/* Center Text for Mobile - Only visible on mobile */}
      {/* <div className="absolute mt-2 z-999 flex items-center justify-center md:hidden">
        <div className="text-center px-4 max-w-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-black mb-2 drop-shadow-lg">
              Premium Quality
            </h3>
            <p className="text-black text-sm leading-relaxed">
              Curated fashion pieces that blend comfort, style, and affordability for every occasion.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
};
export default HomeBannerCarousel;