import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const PasswordStrengthIndicator = ({ password, validation, className = "" }) => {
  if (!password || !validation) return null;

  const { criteria, strength, score, maxScore } = validation;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {/* Strength Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-600">Password Strength</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            strength.level === 'strong' ? 'bg-green-100 text-green-700' :
            strength.level === 'good' ? 'bg-blue-100 text-blue-700' :
            strength.level === 'fair' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {strength.label}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full transition-all duration-500 ${
              strength.level === 'strong' ? 'bg-green-500' :
              strength.level === 'good' ? 'bg-blue-500' :
              strength.level === 'fair' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(score / maxScore) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        {criteria.map((criterion, index) => (
          <motion.div
            key={criterion.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center text-xs"
          >
            <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
              criterion.met ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {criterion.met ? (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2.5 h-2.5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </motion.svg>
              ) : (
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
              )}
            </div>
            <span className={criterion.met ? 'text-green-700' : 'text-gray-600'}>
              {criterion.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PasswordStrengthIndicator;
