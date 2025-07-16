import React, { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const OrderSuccessConfetti = ({ duration = 5000 }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          colors={['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722']}
          initialVelocityX={10}
          initialVelocityY={10}
          tweenDuration={duration}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
    </>
  );
};

export default OrderSuccessConfetti;
