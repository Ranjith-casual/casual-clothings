import React, { useEffect, useState } from 'react';

const CountdownTimer = ({ endDate, startDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isActive, setIsActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  useEffect(() => {
    if (!endDate) return;
    
    const endDateTime = new Date(endDate).getTime();
    const startDateTime = startDate ? new Date(startDate).getTime() : 0;
    const now = new Date().getTime();
    
    // Check if offer period has started
    if (startDateTime && now < startDateTime) {
      setHasStarted(false);
      setIsActive(false);
    } else {
      setHasStarted(true);
      
      // Check if offer is still active
      if (now < endDateTime) {
        setIsActive(true);
      } else {
        setIsActive(false);
        // Call the onExpire callback if provided
        if (onExpire) onExpire();
      }
    }
    
    // Update the countdown
    const updateCountdown = () => {
      const now = new Date().getTime();
      
      // If not started yet, countdown to start
      if (startDateTime && now < startDateTime) {
        const timeUntilStart = startDateTime - now;
        calculateTimeLeft(timeUntilStart);
        return;
      }
      
      // Countdown to end
      const timeRemaining = endDateTime - now;
      
      if (timeRemaining <= 0) {
        setIsActive(false);
        if (onExpire) onExpire();
        return;
      }
      
      calculateTimeLeft(timeRemaining);
    };
    
    const calculateTimeLeft = (timeInMs) => {
      const days = Math.floor(timeInMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeInMs % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };
    
    // Initial update
    updateCountdown();
    
    // Set up interval for countdown
    const interval = setInterval(updateCountdown, 1000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, [endDate, startDate, onExpire]);
  
  const renderTimeBlock = (value, label) => (
    <div className="flex flex-col items-center bg-gray-800 rounded-md p-2 min-w-[4rem]">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-300">{label}</div>
    </div>
  );
  
  if (!hasStarted) {
    return (
      <div className="bg-gray-100 rounded-lg p-3 my-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Offer starts in:</h3>
        <div className="flex space-x-2 justify-center">
          {renderTimeBlock(timeLeft.days, "Days")}
          {renderTimeBlock(timeLeft.hours, "Hours")}
          {renderTimeBlock(timeLeft.minutes, "Mins")}
          {renderTimeBlock(timeLeft.seconds, "Secs")}
        </div>
      </div>
    );
  }
  
  if (!isActive) {
    return (
      <div className="bg-red-100 rounded-lg p-3 my-4">
        <p className="text-red-600 font-medium text-center">This offer has expired</p>
      </div>
    );
  }
  
  return (
    <div className="bg-red-50 rounded-lg p-3 my-4">
      <h3 className="text-sm font-medium text-red-800 mb-2">Offer ends in:</h3>
      <div className="flex space-x-2 justify-center">
        {renderTimeBlock(timeLeft.days, "Days")}
        {renderTimeBlock(timeLeft.hours, "Hours")}
        {renderTimeBlock(timeLeft.minutes, "Mins")}
        {renderTimeBlock(timeLeft.seconds, "Secs")}
      </div>
    </div>
  );
};

export default CountdownTimer;
