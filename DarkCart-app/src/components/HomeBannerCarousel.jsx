import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Tag, Sparkles, Clock } from 'lucide-react';

const banner1 = "/HomeBanner/banner1.jpg";
const banner2 = "/HomeBanner/banner2.jpg"; 
const banner3 = "/HomeBanner/banner3.jpg";
const banner4 = "/HomeBanner/banner4.jpg";

const HomeBannerCarousel = React.memo(() => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const bannerImages = [
    {
      id: 1,
      image: banner1,
      title: "Summer Collection",
      subtitle: "Light & Comfortable Styles",
      highlight: "New Arrival",
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 2,
      image: banner2,
      title: "Casual Essentials",
      subtitle: "Everyday Comfort Wear",
      highlight: "20% Off",
      icon: <Tag className="w-4 h-4" />
    },
    {
      id: 3,
      image: banner3,
      title: "Urban Style",
      subtitle: "Modern Street Fashion",
      highlight: "Limited Edition",
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 4,
      image: banner4,
      title: "Premium Fabrics",
      subtitle: "Quality That Lasts",
      highlight: "Best Seller",
      icon: <Sparkles className="w-4 h-4" />
    }
  ];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      {/* Embla Carousel Container */}
      <div className="embla h-screen overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {bannerImages.map((banner, index) => (
            <div
              key={banner.id}
              className="embla__slide flex-shrink-0 w-full h-full relative"
            >
              {/* Banner Image */}
              <div className="absolute inset-0">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
              </div>

              {/* Banner Content */}
              <div className="banner-content absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4 z-10">
                {/* Badge */}
                <div className="bg-white/90 backdrop-blur-sm text-black px-4 py-2 rounded-full flex items-center gap-2 mb-6 shadow-lg transition-transform duration-200 hover:scale-105">
                  {banner.icon}
                  <span className="font-semibold text-sm md:text-base">{banner.highlight}</span>
                </div>
                
                {/* Title */}
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                  {banner.title}
                </h2>
                
                {/* Divider */}
                <div className="w-16 h-1 bg-white rounded-full mb-4" />
                
                {/* Subtitle */}
                <p className="text-lg md:text-xl text-gray-100 max-w-2xl leading-relaxed">
                  {banner.subtitle}
                </p>
                
                {/* Feature dots */}
                <div className="flex gap-2 mt-8">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/70"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              className="relative h-2 w-8 rounded-full bg-white/30 overflow-hidden transition-transform duration-200 hover:scale-110"
              style={{ 
                transform: selectedIndex === index ? 'scale(1.2)' : 'scale(1)'
              }}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
            >
              <div 
                className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: selectedIndex === index ? '100%' : '30%',
                  opacity: selectedIndex === index ? 1 : 0.5
                }}
              />
            </button>
          ))}
        </div>

        {/* Auto-scroll Indicator */}
        <div className="absolute bottom-8 right-8 text-white text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 z-20">
          <span>Auto-scrolling</span>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
});

HomeBannerCarousel.displayName = 'HomeBannerCarousel';

export default HomeBannerCarousel;