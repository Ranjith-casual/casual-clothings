import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PremiumHeroCarousel = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    duration: 40,
    dragFree: false 
  }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);

  // Premium monochrome fashion content
  const heroSlides = [
    {
      id: 1,
      type: 'image',
      src: '/HomeBanner/banner1.jpg',
      title: 'Crafted for the Bold',
      subtitle: 'Premium streetwear that defines your presence'
    },
    {
      id: 2,
      type: 'image', 
      src: '/HomeBanner/banner2.jpg',
      title: 'Timeless Streetwear',
      subtitle: 'Where heritage meets contemporary design'
    },
    {
      id: 3,
      type: 'image',
      src: '/HomeBanner/banner3.jpg', 
      title: 'Refined Minimalism',
      subtitle: 'Essential pieces for the modern wardrobe'
    },
    {
      id: 4,
      type: 'image',
      src: '/HomeBanner/banner4.jpg',
      title: 'Monochrome Mastery',
      subtitle: 'Elegance distilled to its purest form'
    }
  ];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const goToSlide = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  return (
    <>
      {/* Desktop Carousel - Original Design */}
      <section className="relative h-[90vh] max-h-screen bg-black overflow-hidden select-none hidden md:block">
        {/* Embla Carousel */}
        <div className="h-full touch-pan-x" ref={emblaRef}>
          <div className="flex h-full">
            {heroSlides.map((slide, index) => (
              <div key={slide.id} className="flex-none w-full h-full relative">
                {/* Background Media */}
                <div className="absolute inset-0">
                  <img
                    src={slide.src}
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                    style={{
                      filter: 'grayscale(100%) contrast(1.2) brightness(0.6)',
                    }}
                    draggable={false}
                  />
                  {/* Enhanced glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 transition-all duration-700 hover:from-black/40 hover:to-black/60" />
                  {/* Subtle texture overlay */}
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
                </div>

                {/* Hero Content */}
                <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
                  <div className="text-center text-white max-w-5xl">
                    <AnimatePresence mode="wait">
                      {selectedIndex === index && (
                        <motion.div
                          key={slide.id}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -40 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        >
                          {/* Premium Title with Enhanced Typography */}
                          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight tracking-wider mb-8">
                            <TypeAnimation
                              sequence={[
                                slide.title,
                                4000,
                                '',
                                800,
                              ]}
                              wrapper="span"
                              speed={40}
                              style={{ 
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: '200',
                                letterSpacing: '0.08em',
                                textShadow: '0 0 40px rgba(0,0,0,0.5)'
                              }}
                              repeat={Infinity}
                              cursor={false}
                            />
                          </h1>

                          {/* Enhanced Subtitle */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1.2 }}
                            className="mb-12"
                          >
                            <div className="w-32 h-px bg-white/60 mx-auto mb-8" />
                            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 font-extralight tracking-widest max-w-2xl mx-auto leading-relaxed">
                              {slide.subtitle}
                            </p>
                          </motion.div>

                          {/* Premium CTA Button */}
                          <motion.button
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2, duration: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative border border-white/20 px-12 py-4 text-sm tracking-widest uppercase 
                                     hover:bg-white hover:text-black transition-all duration-500 
                                     glassmorphism-dark overflow-hidden"
                          >
                            <span className="relative z-10 group-hover:tracking-wider transition-all duration-500">
                              Discover Excellence
                            </span>
                            {/* Hover background effect */}
                            <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows - Desktop */}
        <div className="hidden md:block">
          <button
            onClick={scrollPrev}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-20 group"
          >
            <div className="p-3 border border-white/20 bg-black/20 backdrop-blur-sm 
                           hover:bg-white hover:border-white transition-all duration-300
                           hover:scale-110">
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
            </div>
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 group"
          >
            <div className="p-3 border border-white/20 bg-black/20 backdrop-blur-sm 
                           hover:bg-white hover:border-white transition-all duration-300
                           hover:scale-110">
              <ChevronRight className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
            </div>
          </button>
        </div>

        {/* Minimal Dots Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="group"
            >
              <div className={`h-px transition-all duration-500 ${
                selectedIndex === index 
                  ? 'w-12 bg-white' 
                  : 'w-6 bg-white/40 hover:bg-white/60'
              }`} />
            </button>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 z-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-white/60 text-xs tracking-widest uppercase flex items-center gap-2"
          >
            <span>Scroll</span>
            <div className="w-px h-8 bg-white/30" />
          </motion.div>
        </div>

        {/* Magazine-style Typography Credit */}
       
      </section>

      {/* Mobile Premium Design - Innovative Vertical Stack */}
      <section className="md:hidden bg-white">
        {/* Mobile Hero Header */}
     <div className="relative h-[60vh] max-h-[75vh] bg-black overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img
              src={heroSlides[selectedIndex]?.src}
              alt={heroSlides[selectedIndex]?.title}
              className="w-full h-full object-cover transition-all duration-1000"
              style={{
                filter: 'grayscale(100%) contrast(1.1) brightness(0.7)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          </motion.div>

          {/* Mobile Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
            {/* Top Brand */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 text-xs tracking-widest uppercase text-center"
            >
              Premium Collection
            </motion.div>

            {/* Center Title */}
            <div className="text-center text-white">
              <motion.h1
                key={selectedIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-3xl font-light tracking-wider mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {heroSlides[selectedIndex]?.title}
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '3rem' }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="h-px bg-white/60 mx-auto mb-4"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-gray-200 tracking-wide leading-relaxed px-4"
              >
                {heroSlides[selectedIndex]?.subtitle}
              </motion.p>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-center gap-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="group"
                >
                  <div className={`h-1 rounded-full transition-all duration-300 ${
                    selectedIndex === index 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-white/40'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Content Cards - Scrollable */}
        <div className="bg-white py-8">
          {/* Featured Home Images Grid */}
          <div className="px-4 mb-6">
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-4 text-center">Featured Collections</h3>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="aspect-square overflow-hidden bg-gray-100 relative group"
              >
                <img 
                  src="/HomeBanner/banner1.jpg" 
                  alt="Collection 1" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  style={{ filter: 'grayscale(60%) contrast(1.1)' }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-medium bg-gradient-to-t from-black/70 to-transparent">
                  Premium Collection
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="aspect-square overflow-hidden bg-gray-100 relative group"
              >
                <img 
                  src="/HomeBanner/banner2.jpg" 
                  alt="Collection 2" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  style={{ filter: 'grayscale(60%) contrast(1.1)' }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-medium bg-gradient-to-t from-black/70 to-transparent">
                  Street Style
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="aspect-square overflow-hidden bg-gray-100 relative group"
              >
                <img 
                  src="/HomeBanner/banner3.jpg" 
                  alt="Collection 3" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  style={{ filter: 'grayscale(60%) contrast(1.1)' }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-medium bg-gradient-to-t from-black/70 to-transparent">
                  Minimalist
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="aspect-square overflow-hidden bg-gray-100 relative group"
              >
                <img 
                  src="/HomeBanner/banner4.jpg" 
                  alt="Collection 4" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  style={{ filter: 'grayscale(60%) contrast(1.1)' }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-medium bg-gradient-to-t from-black/70 to-transparent">
                  Urban Style
                </div>
              </motion.div>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="px-4 mt-6">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border border-black/20 py-4 text-sm tracking-widest uppercase 
                       hover:bg-black hover:text-white transition-all duration-500 
                       bg-transparent text-black relative overflow-hidden group"
            >
              <span className="relative z-10 group-hover:tracking-wider transition-all duration-500">
                Explore Collection
              </span>
              <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.button>
          </div>
        </div>
      </section>
    </>
  );
};

export default PremiumHeroCarousel;
