import React from 'react'

const CardLoading = () => {
  return (
    <div className='border border-gray-200 p-4 lg:p-4 grid gap-1 lg:gap-3 min-w-36 lg:min-w-52 rounded-lg cursor-pointer bg-white animate-pulse shadow-sm hover:shadow-md transition-shadow'>
      {/* Product Image Skeleton */}
      <div className='min-h-24 bg-gray-100 rounded-md'>
      </div>
      
      {/* Brand/Category Skeleton */}
      <div className='p-2 lg:p-3 bg-gray-100 rounded-md w-20'>
      </div>
      
      {/* Product Name Skeleton */}
      <div className='p-2 lg:p-3 bg-gray-100 rounded-md'>
      </div>
      
      {/* Rating Skeleton */}
      <div className='p-2 lg:p-3 bg-gray-100 rounded-md w-14'>
      </div>

      {/* Price and Button Section */}
      <div className='flex items-center justify-between gap-3'>
        <div className='p-2 lg:p-3 bg-gray-100 rounded-md w-20'>
        </div>
        <div className='p-2 lg:p-3 bg-gray-100 rounded-md w-20'>
        </div>
      </div>

    </div>
  )
}

export default CardLoading