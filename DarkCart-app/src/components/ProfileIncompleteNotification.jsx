import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaUser, FaEnvelope, FaPhone, FaImage } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileIncompleteNotification = ({ user, onClose, autoClose = true }) => {
  const [missingFields, setMissingFields] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds = 1 minute
  const [isVisible, setIsVisible] = useState(true);

  // Check if notification should be shown based on session and dismissal status
  useEffect(() => {
    const currentSession = localStorage.getItem('userSession');
    const dismissedSession = localStorage.getItem('profileNotificationDismissed');
    
    // If no session exists, create one (fallback for existing users)
    if (!currentSession) {
      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userSession', sessionId);
    }
    
    // If dismissed in current session, don't show
    if (dismissedSession === currentSession) {
      setIsVisible(false);
      onClose && onClose();
      return;
    }
  }, [onClose]);

  useEffect(() => {
    // Check which required fields are missing or incomplete
    const missing = [];
    
    if (!user.name || typeof user.name !== 'string' || user.name.trim() === '') {
      missing.push({ field: 'name', label: 'Full Name', icon: <FaUser /> });
    }
    
    if (!user.email || typeof user.email !== 'string' || user.email.trim() === '') {
      missing.push({ field: 'email', label: 'Email Address', icon: <FaEnvelope /> });
    }
    
    // Special handling for mobile field which can be string or number
    if (!user.mobile || (typeof user.mobile === 'string' && user.mobile.trim() === '') || (typeof user.mobile === 'number' && user.mobile <= 0)) {
      missing.push({ field: 'mobile', label: 'Phone Number', icon: <FaPhone /> });
    }
    
    if (!user.avatar || typeof user.avatar !== 'string' || user.avatar.trim() === '') {
      missing.push({ field: 'avatar', label: 'Profile Picture', icon: <FaImage /> });
    }

    setMissingFields(missing);
  }, [user]);

  // Auto-close timer (1 minute)
  useEffect(() => {
    if (!autoClose || !isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsVisible(false);
          onClose && onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose, autoClose, isVisible]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle manual close - marks as dismissed permanently for current session
  const handleClose = () => {
    const currentSession = localStorage.getItem('userSession');
    // Mark as dismissed for current session
    localStorage.setItem('profileNotificationDismissed', currentSession);
    setIsVisible(false);
    onClose && onClose();
  };

  // Handle complete profile button click
  const handleCompleteProfile = () => {
    const currentSession = localStorage.getItem('userSession');
    // Mark as dismissed for current session
    localStorage.setItem('profileNotificationDismissed', currentSession);
    setIsVisible(false);
    onClose && onClose();
  };

  // Don't show notification if profile is complete or marked as not visible
  if (missingFields.length === 0 || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          duration: 0.3 
        }}
        className="absolute top-full right-0 mt-2 w-80 bg-white border border-red-200 rounded-lg shadow-xl z-50 overflow-hidden profile-notification"
        style={{ 
          fontFamily: "'Inter', sans-serif",
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 border-b border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Incomplete Profile</h3>
                <p className="text-xs text-gray-600">Complete your profile for better experience</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autoClose && (
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                  {formatTime(timeLeft)}
                </div>
              )}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-red-100 rounded-full transition-colors"
                aria-label="Close notification"
              >
                <FaTimes className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Missing Fields */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3">
            {missingFields.length} field{missingFields.length > 1 ? 's' : ''} need{missingFields.length === 1 ? 's' : ''} your attention:
          </p>
          
          <div className="space-y-2 mb-4">
            {missingFields.map((field, index) => (
              <motion.div
                key={field.field}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-2 bg-red-50 rounded-md border border-red-100"
              >
                <div className="text-red-500 text-sm">
                  {field.icon}
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {field.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Action Button */}
          <Link
            to="/dashboard/profile"
            onClick={handleCompleteProfile}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
          >
            <FaUser className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Complete Profile Now
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Profile Progress</span>
            <span>{Math.round(((4 - missingFields.length) / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((4 - missingFields.length) / 4) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-red-500 to-orange-500 h-1.5 rounded-full"
            />
          </div>
        </div>

        {/* Subtle Animation */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-lg">
          <motion.div
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-transparent to-orange-100/20"
            style={{
              backgroundSize: '200% 200%'
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileIncompleteNotification;
