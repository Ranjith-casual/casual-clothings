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
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ 
          type: "spring", 
          stiffness: 350, 
          damping: 30,
          duration: 0.2 
        }}
        className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-sm z-50 overflow-hidden profile-notification"
        style={{ 
          fontFamily: "'Inter', sans-serif",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}
      >
        {/* Elegant Header */}
        <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="w-2.5 h-2.5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 text-xs">Profile Updates Needed</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autoClose && (
                <div className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px]">
                  {formatTime(timeLeft)}
                </div>
              )}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors touch-manipulation"
                aria-label="Close notification"
              >
                <FaTimes className="w-2.5 h-2.5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Content */}
        <div className="p-3 bg-gradient-to-b from-white to-gray-50/20">
          <p className="text-[11px] text-gray-600 mb-2 font-medium">
            Complete your profile ({4 - missingFields.length}/4)
          </p>
          
          {/* Missing Fields Icons - Clean Design */}
          <div className="flex items-center gap-1.5 mb-3 justify-center">
            {missingFields.slice(0, 4).map((field, index) => (
              <motion.div
                key={field.field}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm"
                title={field.label}
              >
                <div className="text-gray-700 text-xs">
                  {field.icon}
                </div>
              </motion.div>
            ))}
            {missingFields.length > 4 && (
              <div className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-[10px] text-gray-700 font-medium">+{missingFields.length - 4}</span>
              </div>
            )}
          </div>

          {/* Modern Action Button */}
          <Link
            to="/dashboard/profile"
            onClick={handleCompleteProfile}
            className="w-full bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-md font-medium text-xs transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation active:scale-98 shadow-sm"
          >
            <FaUser className="w-2.5 h-2.5" />
            Complete Your Profile
          </Link>
        </div>

        {/* Elegant Progress Bar */}
        <div className="px-3 pb-2.5 bg-gray-50/20">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((4 - missingFields.length) / 4) * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="bg-black h-1.5 rounded-full"
              style={{ boxShadow: "0 0 4px rgba(0, 0, 0, 0.2)" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileIncompleteNotification;
