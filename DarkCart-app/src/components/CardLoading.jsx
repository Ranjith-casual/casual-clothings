import React from 'react'

// Custom shimmer animation style
const shimmerStyle = {
  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  width: '100%',
  height: '100%',
};

// Keyframe animation for shimmer effect
const keyframes = `
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;

const CardLoading = () => {
  return (
    <>
      <style>{keyframes}</style>
      <div className='border border-gray-200 p-3 sm:p-4 grid gap-2 sm:gap-3 min-w-36 sm:min-w-48 lg:min-w-52 rounded-xl cursor-pointer bg-white shadow-sm hover:shadow-md transition-all duration-500 font-sans overflow-hidden'>
        {/* Product Image Skeleton - with premium border effect */}
        <div className='relative min-h-28 sm:min-h-32 lg:min-h-36 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-inner'>
          <div style={shimmerStyle} className='absolute inset-0'></div>
          
          {/* Premium badge - top left */}
          <div className='absolute top-2 left-2'>
            <div className='relative h-5 w-10 sm:w-12 bg-gradient-to-r from-amber-200 to-amber-100 rounded-md shadow-sm'>
              <div style={shimmerStyle} className='absolute inset-0'></div>
            </div>
          </div>
          
          {/* Discount badge - top right */}
          <div className='absolute top-2 right-2'>
            <div className='relative h-6 w-10 sm:w-12 bg-gradient-to-r from-red-200 to-red-100 rounded-full shadow-sm'>
              <div style={shimmerStyle} className='absolute inset-0'></div>
            </div>
          </div>
          
          {/* Premium shimmer overlay */}
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none'></div>
        </div>
      
        {/* Brand/Category Skeleton */}
        <div className='flex items-center'>
          <div className='relative h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md w-20 sm:w-24'>
            <div style={shimmerStyle} className='absolute inset-0'></div>
          </div>
        </div>
        
        {/* Product Name Skeleton - Two lines */}
        <div className='space-y-1.5'>
          <div className='relative h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md w-full'>
            <div style={shimmerStyle} className='absolute inset-0'></div>
          </div>
          <div className='relative h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md w-4/5'>
            <div style={shimmerStyle} className='absolute inset-0'></div>
          </div>
        </div>
        
        {/* Rating Skeleton */}
        <div className='flex items-center space-x-1 mt-0.5'>
          {[...Array(5)].map((_, index) => (
            <div key={index} className='relative h-3.5 w-3.5 bg-gradient-to-r from-amber-200 to-amber-100 rounded-sm'>
              <div style={shimmerStyle} className='absolute inset-0'></div>
            </div>
          ))}
          <div className='relative h-3.5 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md w-8 ml-1.5'>
            <div style={shimmerStyle} className='absolute inset-0'></div>
          </div>
        </div>

        {/* Price and Button Section */}
        <div className='flex items-center justify-between gap-3 mt-1'>
          <div className='relative h-5 bg-gradient-to-r from-blue-100 to-blue-50 rounded-md w-20 sm:w-24'>
            <div style={shimmerStyle} className='absolute inset-0'></div>
          </div>
          <div className='relative h-7 bg-gradient-to-r from-blue-200 to-blue-100 rounded-lg w-20 sm:w-24'>
            <div style={shimmerStyle} className='absolute inset-0'></div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CardLoading