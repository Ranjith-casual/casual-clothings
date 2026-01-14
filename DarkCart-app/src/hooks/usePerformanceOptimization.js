import { useEffect, useRef } from 'react';

/**
 * Custom hook for performance optimization
 * Monitors frame rate and adjusts animation quality accordingly
 */
export const usePerformanceOptimization = () => {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);
  const isLowPerformanceRef = useRef(false);

  useEffect(() => {
    let animationId;

    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      if (delta >= 1000) { // Measure every second
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        fpsRef.current = fps;
        
        // Detect low performance (less than 30 fps)
        isLowPerformanceRef.current = fps < 30;
        
        // Reset counters
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        
        // Apply performance optimizations if needed
        if (isLowPerformanceRef.current) {
          // Reduce animation quality for low-end devices
          document.documentElement.style.setProperty('--animation-duration', '0.1s');
          document.documentElement.style.setProperty('--transition-duration', '0.1s');
        } else {
          // Restore normal animation quality
          document.documentElement.style.setProperty('--animation-duration', '0.3s');
          document.documentElement.style.setProperty('--transition-duration', '0.3s');
        }
      }
      
      frameCountRef.current++;
      animationId = requestAnimationFrame(measureFPS);
    };

    // Start measuring after a delay to allow initial render
    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(measureFPS);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return {
    fps: fpsRef.current,
    isLowPerformance: isLowPerformanceRef.current
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};