import React, { useState, useEffect } from 'react';

const ConfettiGifAnimation = ({ src, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleImageLoaded = () => {
    setLoaded(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div 
        className={`w-full h-full flex items-center justify-center transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <img 
          src={src} 
          alt="Order Success Animation" 
          className="max-w-full max-h-full object-contain"
          style={{ 
            animation: `fadeIn 1s ease-out, pulse 2s infinite ease-in-out`
          }}
          onLoad={handleImageLoaded}
        />
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfettiGifAnimation;
