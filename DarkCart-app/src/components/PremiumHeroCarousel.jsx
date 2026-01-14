// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { TypeAnimation } from 'react-type-animation';
// import useEmblaCarousel from 'embla-carousel-react';
// import Autoplay from 'embla-carousel-autoplay';
// import { ChevronLeft, ChevronRight } from 'lucide-react';
// import { useLayoutEffect } from 'react';

// const PremiumHeroCarousel = () => {
//   const [selectedIndex, setSelectedIndex] = useState(0);
//   const [imagesLoaded, setImagesLoaded] = useState(false);
//   const [emblaRef, emblaApi] = useEmblaCarousel({ 
//     loop: true,
//     duration: 20, // Faster transitions for smoothness
//     dragFree: true, // Smoother dragging
//     skipSnaps: false,
//     inViewThreshold: 0.8,
//     align: 'center',
//   }, [Autoplay({ 
//     delay: 5000, 
//     stopOnInteraction: false,
//     stopOnMouseEnter: true,
//     playOnInit: true
//   })]);

//   // Premium monochrome fashion content
//   // Memoize slides to prevent re-renders
//   const heroSlides = useMemo(() => [
//     {
//       id: 1,
//       type: 'image',
//       src: '/HomeBanner/banner1.jpg',
//       title: 'Crafted for the Bold',
//       subtitle: 'Premium streetwear that defines your presence'
//     },
//     {
//       id: 2,
//       type: 'image', 
//       src: '/HomeBanner/banner2.jpg',
//       title: 'Timeless Streetwear',
//       subtitle: 'Where heritage meets contemporary design'
//     },
//     {
//       id: 3,
//       type: 'image',
//       src: '/HomeBanner/banner3.jpg', 
//       title: 'Refined Minimalism',
//       subtitle: 'Essential pieces for the modern wardrobe'
//     },
//     {
//       id: 4,
//       type: 'image',
//       src: '/HomeBanner/banner4.jpg',
//       title: 'Monochrome Mastery',
//       subtitle: 'Elegance distilled to its purest form'
//     }
//   ], []);

//   // Optimized selection handling
//   const onSelect = useCallback(() => {
//     if (!emblaApi) return;
//     setSelectedIndex(emblaApi.selectedScrollSnap());
//   }, [emblaApi]);

//   // Preload all images for smooth transitions
//   useLayoutEffect(() => {
//     const preloadImages = async () => {
//       try {
//         const imagePromises = heroSlides.map((slide) => {
//           return new Promise((resolve, reject) => {
//             const img = new Image();
//             img.src = slide.src;
//             img.onload = () => resolve();
//             img.onerror = () => reject();
//           });
//         });
        
//         await Promise.all(imagePromises);
//         setImagesLoaded(true);
//       } catch (error) {
//         // Fallback in case of error
//         setImagesLoaded(true);
//       }
//     };
    
//     preloadImages();
//   }, [heroSlides]);

//   useEffect(() => {
//     if (!emblaApi) return;
    
//     // Add event listeners
//     onSelect();
//     emblaApi.on('select', onSelect);
//     emblaApi.on('reInit', onSelect);
    
//     // Performance optimizations
//     emblaApi.reInit({
//       watchDrag: navigator.maxTouchPoints > 0
//     });
    
//     return () => {
//       // Cleanup
//       emblaApi.off('select', onSelect);
//       emblaApi.off('reInit', onSelect);
//     };
//   }, [emblaApi, onSelect]);

//   const scrollPrev = useCallback(() => {
//     if (emblaApi) emblaApi.scrollPrev();
//   }, [emblaApi]);

//   const scrollNext = useCallback(() => {
//     if (emblaApi) emblaApi.scrollNext();
//   }, [emblaApi]);

//   const goToSlide = useCallback((index) => {
//     if (emblaApi) emblaApi.scrollTo(index);
//   }, [emblaApi]);

//   return (
//     <>
//       {/* Desktop Carousel - Optimized Design */}
//       <section className="relative h-[90vh] max-h-screen bg-black overflow-hidden select-none hidden md:block">
//         {/* Loading state */}
//         {!imagesLoaded && (
//           <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
//             <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin" />
//           </div>
//         )}
        
//         {/* Embla Carousel - Optimized */}
//         <div className="h-full touch-pan-x will-change-transform" ref={emblaRef}>
//           <div className="flex h-full">
//             {heroSlides.map((slide, index) => (
//               <div 
//                 key={slide.id} 
//                 className="flex-none w-full h-full relative"
//                 style={{
//                   transform: `translateZ(0)`, // Force GPU acceleration
//                   backfaceVisibility: 'hidden', // Reduce rendering artifacts
//                   willChange: 'transform', // Signal browser for optimization
//                   contain: 'paint', // Optimize rendering
//                 }}
//               >
//                 {/* Background Media - Optimized */}
//                 <div className="absolute inset-0">
//                   <img
//                     src={slide.src}
//                     alt={slide.title}
//                     className="w-full h-full object-cover"
//                     style={{
//                       filter: 'grayscale(100%) contrast(1.2) brightness(0.6)',
//                       transform: selectedIndex === index ? 'scale(1.02)' : 'scale(1)',
//                       transition: 'transform 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
//                       willChange: 'transform',
//                     }}
//                     loading="eager"
//                     decoding="async"
//                     draggable={false}
//                   />
//                   {/* Enhanced glassmorphism overlay - Simplified */}
//                   <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
//                   {/* Removed subtle texture overlay for performance */}
//                 </div>

//                 {/* Hero Content - Performance Optimized */}
//                 <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
//                   <div className="text-center text-white max-w-5xl">
//                     <AnimatePresence mode="wait" initial={false}>
//                       {selectedIndex === index && (
//                         <motion.div
//                           key={slide.id}
//                           initial={{ opacity: 0, y: 20 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0 }}
//                           transition={{ 
//                             duration: 0.6, 
//                             ease: [0.23, 1, 0.32, 1] 
//                           }}
//                           style={{
//                             willChange: 'transform, opacity'
//                           }}
//                         >
//                           {/* Premium Title - Optimized */}
//                           <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight tracking-wider mb-8">
//                             {index === selectedIndex ? (
//                               <TypeAnimation
//                                 sequence={[
//                                   slide.title,
//                                   4000,
//                                 ]}
//                                 wrapper="span"
//                                 speed={50}
//                                 style={{ 
//                                   fontFamily: "'Inter', sans-serif",
//                                   fontWeight: '200',
//                                   letterSpacing: '0.08em',
//                                 }}
//                                 repeat={1}
//                                 cursor={false}
//                               />
//                             ) : (
//                               <span style={{ 
//                                 fontFamily: "'Inter', sans-serif",
//                                 fontWeight: '200',
//                                 letterSpacing: '0.08em',
//                               }}>
//                                 {slide.title}
//                               </span>
//                             )}
//                           </h1>

//                           {/* Enhanced Subtitle - Optimized */}
//                           <motion.div
//                             initial={{ opacity: 0 }}
//                             animate={{ opacity: 1 }}
//                             transition={{ delay: 0.6, duration: 0.8 }}
//                             className="mb-12"
//                           >
//                             <div className="w-32 h-px bg-white/60 mx-auto mb-8" />
//                             <p className="text-lg md:text-xl lg:text-2xl text-gray-200 font-extralight tracking-widest max-w-2xl mx-auto leading-relaxed">
//                               {slide.subtitle}
//                             </p>
//                           </motion.div>

//                           {/* Premium CTA Button - Optimized */}
//                           <motion.button
//                             initial={{ opacity: 0 }}
//                             animate={{ opacity: 1 }}
//                             transition={{ delay: 0.8, duration: 0.6 }}
//                             whileHover={{ scale: 1.03 }}
//                             whileTap={{ scale: 0.98 }}
//                             className="group relative border border-white/20 px-12 py-4 text-sm tracking-widest uppercase 
//                                      hover:bg-white hover:text-black transition-colors duration-300 
//                                      overflow-hidden"
//                           >
//                             <span className="relative z-10 group-hover:tracking-wider transition-all duration-300">
//                               Discover Excellence
//                             </span>
//                             {/* Hover background effect - Simplified */}
//                             <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
//                           </motion.button>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Navigation Arrows - Desktop */}
//         <div className="hidden md:block">
//           <button
//             onClick={scrollPrev}
//             className="absolute left-8 top-1/2 -translate-y-1/2 z-20 group"
//           >
//             <div className="p-3 border border-white/20 bg-black/20 backdrop-blur-sm 
//                            hover:bg-white hover:border-white transition-all duration-300
//                            hover:scale-110">
//               <ChevronLeft className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
//             </div>
//           </button>

//           <button
//             onClick={scrollNext}
//             className="absolute right-8 top-1/2 -translate-y-1/2 z-20 group"
//           >
//             <div className="p-3 border border-white/20 bg-black/20 backdrop-blur-sm 
//                            hover:bg-white hover:border-white transition-all duration-300
//                            hover:scale-110">
//               <ChevronRight className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
//             </div>
//           </button>
//         </div>

//         {/* Minimal Dots Navigation */}
//         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
//           {heroSlides.map((_, index) => (
//             <button
//               key={index}
//               onClick={() => goToSlide(index)}
//               className="group"
//             >
//               <div className={`h-px transition-all duration-500 ${
//                 selectedIndex === index 
//                   ? 'w-12 bg-white' 
//                   : 'w-6 bg-white/40 hover:bg-white/60'
//               }`} />
//             </button>
//           ))}
//         </div>

//         {/* Scroll Indicator */}
//         <div className="absolute bottom-8 right-8 z-20">
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 2 }}
//             className="text-white/60 text-xs tracking-widest uppercase flex items-center gap-2"
//           >
//             <span>Scroll</span>
//             <div className="w-px h-8 bg-white/30" />
//           </motion.div>
//         </div>

//         {/* Magazine-style Typography Credit */}
       
//       </section>

//       {/* Mobile Premium Design - Performance Optimized */}
//       <section className="md:hidden bg-white">
//         {/* Loading state - Mobile */}
//         {!imagesLoaded && (
//           <div className="absolute inset-0 flex items-center justify-center z-50 bg-black h-[45vh]">
//             <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin" />
//           </div>
//         )}
      
//         {/* Mobile Hero Header - Optimized */}
//         <div className="relative h-[45vh] max-h-[60vh] bg-black overflow-hidden">
//           <motion.div
//             initial={{ opacity: 1 }} // Changed to avoid unnecessary animation on initial load
//             animate={{ opacity: 1 }}
//             className="absolute inset-0"
//             style={{
//               willChange: 'transform', // Signal browser for optimization
//               backfaceVisibility: 'hidden', // Reduce rendering artifacts
//             }}
//           >
//             <img
//               src={heroSlides[selectedIndex]?.src}
//               alt={heroSlides[selectedIndex]?.title}
//               className="w-full h-full object-cover"
//               style={{
//                 filter: 'grayscale(100%) contrast(1.1) brightness(0.7)',
//                 transition: 'opacity 0.6s ease-out',
//                 willChange: 'opacity',
//               }}
//               loading="eager"
//               decoding="async"
//             />
//             <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
//           </motion.div>

//           {/* Mobile Hero Content - Performance Optimized */}
//           <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
//             {/* Top Brand - Simplified */}
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ duration: 0.5 }}
//               className="text-white/60 text-xs tracking-widest uppercase text-center"
//             >
//               Premium Collection
//             </motion.div>

//             {/* Center Title - Optimized */}
//             <div className="text-center text-white">
//               <AnimatePresence mode="wait" initial={false}>
//                 <motion.h1
//                   key={`title-${selectedIndex}`}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ duration: 0.4 }}
//                   className="text-3xl font-light tracking-wider mb-4"
//                   style={{ 
//                     fontFamily: "'Inter', sans-serif",
//                     willChange: 'opacity'
//                   }}
//                 >
//                   {heroSlides[selectedIndex]?.title}
//                 </motion.h1>
//               </AnimatePresence>
//               <div className="h-px bg-white/60 w-12 mx-auto mb-4" />
//               <AnimatePresence mode="wait" initial={false}>
//                 <motion.p
//                   key={`subtitle-${selectedIndex}`}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ duration: 0.4 }}
//                   className="text-sm text-gray-200 tracking-wide leading-relaxed px-4"
//                 >
//                   {heroSlides[selectedIndex]?.subtitle}
//                 </motion.p>
//               </AnimatePresence>
//             </div>

//             {/* Bottom Navigation - Optimized */}
//             <div className="flex justify-center gap-2">
//               {heroSlides.map((_, index) => (
//                 <button
//                   key={index}
//                   onClick={() => goToSlide(index)}
//                   className="touch-manipulation" // Improved touch response
//                   style={{ 
//                     WebkitTapHighlightColor: 'transparent' // Remove tap highlight on mobile
//                   }}
//                 >
//                   <div className={`h-1 rounded-full ${
//                     selectedIndex === index 
//                       ? 'w-8 bg-white transition-all duration-200 ease-out' 
//                       : 'w-2 bg-white/40 transition-all duration-150 ease-out'
//                   }`} />
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Mobile Content Cards - Optimized */}
//         <div className="bg-white py-8">

//           {/* Mobile CTA - Optimized */}
//           <div className="px-4 mt-8">
//             <motion.button
//               initial={{ opacity: 0 }}
//               whileInView={{ opacity: 1 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.4 }}
//               whileTap={{ scale: 0.98 }}
//               className="w-full border border-black/20 py-4 text-sm tracking-widest uppercase 
//                        hover:bg-black hover:text-white transition-colors duration-300
//                        bg-transparent text-black relative overflow-hidden group"
//               style={{ touchAction: 'manipulation' }}
//             >
//               <span className="relative z-10 group-hover:tracking-wider transition-all duration-300">
//                 Explore Collection
//               </span>
//               <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
//             </motion.button>
//           </div>
//         </div>
//       </section>
//     </>
//   );
// };

// export default PremiumHeroCarousel;
"use client" // This component uses client-side hooks like useState, useEffect, useMemo, useCallback

import { useState, useEffect, useCallback, useMemo, useLayoutEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TypeAnimation } from "react-type-animation" // Assuming this library is installed
import useEmblaCarousel from "embla-carousel-react" // Assuming this library is installed
import Autoplay from "embla-carousel-autoplay" // Assuming this library is installed
import { ChevronLeft, ChevronRight } from "lucide-react"

const PremiumHeroCarousel = () => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 20, // Faster transitions for smoothness
      dragFree: true, // Smoother dragging
      skipSnaps: false,
      inViewThreshold: 0.8,
      align: "center",
    },
    [
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    ],
  )

  // Premium monochrome fashion content
  // Memoize slides to prevent re-renders
  const heroSlides = useMemo(
    () => [
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
    ],
    [],
  )

  // Optimized selection handling
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  // Preload all images for smooth transitions using useLayoutEffect for immediate effect
  useLayoutEffect(() => {
    const preloadImages = async () => {
      try {
        const imagePromises = heroSlides.map((slide) => {
          return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = slide.src
            img.onload = () => resolve()
            img.onerror = () => reject()
          })
        })
        await Promise.all(imagePromises)
        setImagesLoaded(true)
      } catch (error) {
        // Fallback in case of error, still set imagesLoaded to true to render content
        console.error("Failed to preload images:", error)
        setImagesLoaded(true)
      }
    }
    preloadImages()
  }, [heroSlides])

  useEffect(() => {
    if (!emblaApi) return

    // Add event listeners
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    // Performance optimizations for Embla
    emblaApi.reInit({
      watchDrag: navigator.maxTouchPoints > 0, // Only watch drag if touch is available
    })

    return () => {
      // Cleanup
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const goToSlide = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  return (
    <>
      {/* Desktop Carousel - Optimized Design */}
      <section className="relative h-[90vh] max-h-screen bg-black overflow-hidden select-none hidden md:block">
        {/* Loading state */}
        {!imagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
            <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin" />
          </div>
        )}

        {/* Embla Carousel - Optimized */}
        <div className="h-full touch-pan-x will-change-transform" ref={emblaRef}>
          <div className="flex h-full">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="flex-none w-full h-full relative"
                style={{
                  transform: `translateZ(0)`, // Force GPU acceleration
                  backfaceVisibility: "hidden", // Reduce rendering artifacts
                  willChange: "transform", // Signal browser for optimization
                  contain: "paint", // Optimize rendering
                }}
              >
                {/* Background Media - Optimized */}
                <div className="absolute inset-0">
                  {/* Using native <img> tag as per original code. For Next.js, consider <Image from "next/image"> for further optimization. */}
                  <img
                    src={slide.src || "/placeholder.svg"}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    style={{
                      filter: "grayscale(100%) contrast(1.2) brightness(0.6)",
                      transform: selectedIndex === index ? "scale(1.02)" : "scale(1)",
                      transition: "transform 1.2s cubic-bezier(0.23, 1, 0.32, 1)",
                      willChange: "transform",
                    }}
                    loading="eager" // Eager load for the hero section
                    decoding="async"
                    draggable={false}
                  />
                  {/* Enhanced glassmorphism overlay - Simplified */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
                </div>
                {/* Hero Content - Performance Optimized */}
                <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
                  <div className="text-center text-white max-w-5xl">
                    <AnimatePresence mode="wait" initial={false}>
                      {selectedIndex === index && (
                        <motion.div
                          key={slide.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.6,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                          style={{
                            willChange: "transform, opacity",
                          }}
                        >
                          {/* Premium Title - Optimized */}
                          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight tracking-wider mb-8">
                            {index === selectedIndex ? (
                              <TypeAnimation
                                sequence={[slide.title, 4000]}
                                wrapper="span"
                                speed={50}
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontWeight: "200",
                                  letterSpacing: "0.08em",
                                }}
                                repeat={1}
                                cursor={false}
                              />
                            ) : (
                              <span
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontWeight: "200",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                {slide.title}
                              </span>
                            )}
                          </h1>
                          {/* Enhanced Subtitle - Optimized */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="mb-12"
                          >
                            <div className="w-32 h-px bg-white/60 mx-auto mb-8" />
                            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 font-extralight tracking-widest max-w-2xl mx-auto leading-relaxed">
                              {slide.subtitle}
                            </p>
                          </motion.div>
                          {/* Premium CTA Button - Optimized */}
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative border border-white/20 px-12 py-4 text-sm tracking-widest uppercase
                                      hover:bg-white hover:text-black transition-colors duration-300
                                      overflow-hidden"
                          >
                            <span className="relative z-10 group-hover:tracking-wider transition-all duration-300">
                              Discover Excellence
                            </span>
                            {/* Hover background effect - Simplified */}
                            <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
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
          <button onClick={scrollPrev} className="absolute left-8 top-1/2 -translate-y-1/2 z-20 group">
            <div
              className="p-3 border border-white/20 bg-black/20 backdrop-blur-sm
                              hover:bg-white hover:border-white transition-all duration-300
                              hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
            </div>
          </button>
          <button onClick={scrollNext} className="absolute right-8 top-1/2 -translate-y-1/2 z-20 group">
            <div
              className="p-3 border border-white/20 bg-black/20 backdrop-blur-sm
                              hover:bg-white hover:border-white transition-all duration-300
                              hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300" />
            </div>
          </button>
        </div>
        {/* Minimal Dots Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button key={index} onClick={() => goToSlide(index)} className="group">
              <div
                className={`h-px transition-all duration-500 ${
                  selectedIndex === index ? "w-12 bg-white" : "w-6 bg-white/40 hover:bg-white/60"
                }`}
              />
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
      </section>

      {/* Mobile Premium Design - Performance Optimized */}
      <section className="md:hidden bg-white">
        {/* Loading state - Mobile */}
        {!imagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black h-[45vh]">
            <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin" />
          </div>
        )}
        {/* Mobile Hero Header - Optimized */}
        <div className="relative h-[45vh] max-h-[60vh] bg-black overflow-hidden">
          <motion.div
            initial={{ opacity: 1 }} // Changed to avoid unnecessary animation on initial load
            animate={{ opacity: 1 }}
            className="absolute inset-0"
            style={{
              willChange: "transform", // Signal browser for optimization
              backfaceVisibility: "hidden", // Reduce rendering artifacts
            }}
          >
            {/* Using native <img> tag as per original code. For Next.js, consider <Image from "next/image"> for further optimization. */}
            <img
              src={heroSlides[selectedIndex]?.src || "/placeholder.svg"}
              alt={heroSlides[selectedIndex]?.title}
              className="w-full h-full object-cover"
              style={{
                filter: "grayscale(100%) contrast(1.1) brightness(0.7)",
                transition: "opacity 0.6s ease-out",
                willChange: "opacity",
              }}
              loading="eager" // Eager load for the hero section
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          </motion.div>
          {/* Mobile Hero Content - Performance Optimized */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
            {/* Top Brand - Simplified */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-white/60 text-xs tracking-widest uppercase text-center"
            >
              Premium Collection
            </motion.div>
            {/* Center Title - Optimized */}
            <div className="text-center text-white">
              <AnimatePresence mode="wait" initial={false}>
                <motion.h1
                  key={`title-${selectedIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-3xl font-light tracking-wider mb-4"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    willChange: "opacity",
                  }}
                >
                  {heroSlides[selectedIndex]?.title}
                </motion.h1>
              </AnimatePresence>
              <div className="h-px bg-white/60 w-12 mx-auto mb-4" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`subtitle-${selectedIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm text-gray-200 tracking-wide leading-relaxed px-4"
                >
                  {heroSlides[selectedIndex]?.subtitle}
                </motion.p>
              </AnimatePresence>
            </div>
            {/* Bottom Navigation - Optimized */}
            <div className="flex justify-center gap-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="touch-manipulation" // Improved touch response
                  style={{
                    WebkitTapHighlightColor: "transparent", // Remove tap highlight on mobile
                  }}
                >
                  <div
                    className={`h-1 rounded-full ${
                      selectedIndex === index
                        ? "w-8 bg-white transition-all duration-200 ease-out"
                        : "w-2 bg-white/40 transition-all duration-150 ease-out"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Mobile Content Cards - Optimized */}
        <div className="py-8">
          {/* Mobile CTA - Optimized */}
          <div className="px-4 mt-8">
            <motion.button
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border border-black/20 py-4 text-sm tracking-widest uppercase
                              hover:bg-black hover:text-white transition-colors duration-300
                              bg-transparent text-black relative overflow-hidden group"
              style={{ touchAction: "manipulation" }}
            >
              <span className="relative z-10 group-hover:tracking-wider transition-all duration-300">
                Explore Collection
              </span>
              <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </motion.button>
          </div>
        </div>
      </section>
    </>
  )
}

export default PremiumHeroCarousel

