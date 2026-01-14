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

    if (startDateTime && now < startDateTime) {
      setHasStarted(false);
      setIsActive(false);
    } else {
      setHasStarted(true);

      if (now < endDateTime) {
        setIsActive(true);
      } else {
        setIsActive(false);
        if (onExpire) onExpire();
      }
    }

    const updateCountdown = () => {
      const now = new Date().getTime();

      if (startDateTime && now < startDateTime) {
        const timeUntilStart = startDateTime - now;
        calculateTimeLeft(timeUntilStart);
        return;
      }

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

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endDate, startDate, onExpire]);

  const renderTimeBlock = (value, label) => (
    <div className="flex flex-col items-center border rounded px-2 py-1 min-w-[2.5rem] md:min-w-[3rem]">
      <div className="text-sm md:text-base font-semibold text-gray-800">{value}</div>
      <div className="text-[10px] md:text-xs text-gray-500">{label}</div>
    </div>
  );

  const wrapperClass = "bg-white border rounded p-3 my-2 shadow-sm";

  if (!hasStarted) {
    return (
      <div className={wrapperClass}>
        <h3 className="text-xs font-medium text-gray-700 mb-1">Starts in:</h3>
        <div className="flex space-x-2 justify-center">
          {renderTimeBlock(timeLeft.days, "D")}
          {renderTimeBlock(timeLeft.hours, "H")}
          {renderTimeBlock(timeLeft.minutes, "M")}
          {renderTimeBlock(timeLeft.seconds, "S")}
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className={wrapperClass}>
        <p className="text-gray-500 text-xs font-medium text-center">Offer expired</p>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <h3 className="text-xs font-medium text-gray-700 mb-1">Ends in:</h3>
      <div className="flex space-x-2 justify-center">
        {renderTimeBlock(timeLeft.days, "D")}
        {renderTimeBlock(timeLeft.hours, "H")}
        {renderTimeBlock(timeLeft.minutes, "M")}
        {renderTimeBlock(timeLeft.seconds, "S")}
      </div>
    </div>
  );
};

export default CountdownTimer;
