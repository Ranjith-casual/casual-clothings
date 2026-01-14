import React from 'react'
import { Link } from 'react-router-dom'
import { FaTshirt, FaArrowRight } from 'react-icons/fa'
import { motion } from 'framer-motion'

function CustomTshirtButton({ 
  variant = 'primary', // 'primary', 'secondary', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  className = '',
  showIcon = true,
  text = 'Design Custom T-Shirt'
}) {
  
  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl focus:ring-gray-500",
    secondary: "bg-white border-2 border-black text-black hover:bg-gray-50 hover:border-gray-800 shadow-md hover:shadow-lg focus:ring-gray-500",
    outline: "bg-transparent border-2 border-black text-black hover:bg-black hover:text-white shadow-md hover:shadow-lg focus:ring-gray-500"
  }
  
  const sizes = {
    small: "px-4 py-2 text-sm",
    medium: "px-6 py-3 text-base", 
    large: "px-8 py-4 text-lg"
  }
  
  const iconSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg"
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link
        to="/custom-tshirt"
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {showIcon && (
          <FaTshirt className={`${iconSizes[size]} animate-pulse`} />
        )}
        <span>{text}</span>
        <FaArrowRight className={`${iconSizes[size]} transition-transform duration-300 group-hover:translate-x-1`} />
      </Link>
    </motion.div>
  )
}

export default CustomTshirtButton