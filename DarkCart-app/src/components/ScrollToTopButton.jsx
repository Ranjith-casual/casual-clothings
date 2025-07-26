import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set up scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-30 bg-black hover:bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-700 transition-all duration-300 hover:scale-110 animate-fadeIn"
          aria-label="Scroll to top"
        >
          <FaArrowUp size={16} />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;
