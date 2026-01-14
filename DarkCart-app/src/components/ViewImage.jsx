import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

// CSS for animation
const modalStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes zoomIn {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes zoomOut {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.92);
    opacity: 0;
  }
}

.animate-fadeIn {
  animation: fadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-fadeOut {
  animation: fadeOut 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-zoomIn {
  animation: zoomIn 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-zoomOut {
  animation: zoomOut 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion) {
  .animate-fadeIn,
  .animate-fadeOut,
  .animate-zoomIn,
  .animate-zoomOut {
    animation: none;
  }
}
`;

const modalAnimation = {
  overlay: {
    animation: 'fadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  content: {
    animation: 'zoomIn 250ms cubic-bezier(0.16, 1, 0.3, 1)'
  }
};

const ViewImage = ({ url, close }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = React.useRef(null);
  
  // Toggle zoom state
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };
  
  // Handle smooth closing with animation
  const handleClose = () => {
    if (isZoomed) {
      // If zoomed, first unzoom then close
      setIsZoomed(false);
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => close(), 200); // Match animation duration
      }, 300);
    } else {
      setIsClosing(true);
      setTimeout(() => close(), 200); // Match animation duration
    }
  };
  
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isZoomed]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose();
    // Add more keyboard controls here if needed
  };
  
  // Handle click outside to close
  const handleBackgroundClick = (e) => {
    if (e.target === modalRef.current) {
      handleClose();
    }
  };
  
  // Add the styles to the document
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = modalStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  return (
    <div 
      className={`fixed top-0 bottom-0 right-0 left-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-2 xs:p-3 sm:p-4 md:p-5 font-sans
        ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleBackgroundClick}
      onKeyDown={handleKeyDown}
      tabIndex="0"
      ref={modalRef}
    >
      <div 
        className={`w-full max-w-[90vw] xs:max-w-[85vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[95vh] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden
          ${isClosing ? 'animate-zoomOut' : 'animate-zoomIn'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-2 xs:p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-xs xs:text-sm sm:text-base text-gray-900 tracking-wider">Image Preview</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-800 transition-colors p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50"
            aria-label="Close preview"
          >
            <IoClose size={16} className="xs:hidden" />
            <IoClose size={20} className="hidden xs:block sm:hidden" />
            <IoClose size={24} className="hidden sm:block" />
          </button>
        </div>

        {/* Image container */}
        <div className="flex items-center justify-center p-2 xs:p-3 sm:p-4 md:p-6 bg-gray-50 min-h-[200px] xs:min-h-[250px] sm:min-h-[300px] md:min-h-[400px] relative overflow-hidden">
          <img
            src={url}
            alt="Product preview"
            onClick={toggleZoom}
            className={`
              ${isZoomed 
                ? "max-w-none max-h-none scale-[1.25] xs:scale-[1.35] sm:scale-150 cursor-zoom-out" 
                : "max-w-full max-h-[50vh] xs:max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] cursor-zoom-in"}
              object-contain rounded-md shadow-sm hover:shadow-md transition-all duration-300
            `}
            loading="lazy"
          />
          
          {/* Zoom indicator */}
          <div className={`absolute bottom-1 xs:bottom-2 right-1 xs:right-2 bg-black/70 text-white text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full 
            transition-opacity duration-300 ${isZoomed ? 'opacity-100' : 'opacity-0'}`}>
            <span className="tracking-wide hidden xs:inline">
              {window.innerWidth < 640 ? '135% Zoom' : '150% Zoom'}
            </span>
            <span className="tracking-wide xs:hidden">Zoom</span>
          </div>
          
          {/* Touch swipe indicators for mobile - only visible briefly */}
          <div className="absolute inset-0 sm:hidden pointer-events-none flex items-center justify-between px-2 opacity-0 animate-fadeIn animation-delay-500 animate-fadeOut">
            <div className="bg-black/40 rounded-full p-1 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
            <div className="bg-black/40 rounded-full p-1 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Footer with zoom instructions */}
        <div className="p-2 xs:p-2.5 sm:p-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] xs:text-xs text-gray-500 tracking-wide">
            <span className="hidden sm:inline">Click image to zoom in/out • ESC to close</span>
            <span className="sm:hidden">Tap image to zoom • Tap X to close</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewImage;
