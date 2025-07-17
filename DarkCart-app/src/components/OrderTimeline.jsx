import React from 'react'
import { FaBox, FaCheckCircle, FaTruck, FaCog, FaBan } from 'react-icons/fa'

const OrderTimeline = ({ status }) => {
  // Define the order statuses and their corresponding icons and colors
  const statuses = [
    { name: 'ORDER PLACED', icon: <FaBox />, color: 'text-blue-500' },
    { name: 'PROCESSING', icon: <FaCog className="animate-spin-slow" />, color: 'text-yellow-500' },
    { name: 'OUT FOR DELIVERY', icon: <FaTruck />, color: 'text-orange-500' },
    { name: 'DELIVERED', icon: <FaCheckCircle />, color: 'text-green-500' },
  ]

  // Find the current status index
  const currentStatusIndex = status === 'CANCELLED' 
    ? -1 
    : statuses.findIndex(s => s.name === status);

  return (
    <div className="w-full py-4">
      {status === 'CANCELLED' ? (
        <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
          <FaBan className="text-3xl text-red-500 mb-2" />
          <h3 className="font-bold text-red-700">Order Cancelled</h3>
          <p className="text-sm text-red-600 text-center mt-1">This order has been cancelled and will not be processed further.</p>
        </div>
      ) : (
        <>
          {/* Desktop timeline (hidden on small screens) */}
          <div className="hidden sm:flex items-center justify-between relative mb-6">
            {/* Line connecting all steps */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
            
            {statuses.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              return (
                <div key={step.name} className="z-10 mt-4 flex flex-col items-center relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCurrent 
                      ? `${step.color} bg-white border-2 border-current animate-pulse` 
                      : isCompleted 
                        ? `text-white bg-green-500` 
                        : `text-gray-400 bg-gray-100 border border-gray-300`
                  }`}>
                    {step.icon}
                  </div>
                  <p className={`text-xs font-medium mt-2 text-center max-w-[120px] ${
                    isCurrent 
                      ? step.color 
                      : isCompleted 
                        ? 'text-green-500' 
                        : 'text-gray-400'
                  }`}>
                    {step.name.replace(/_/g, ' ')}
                  </p>
                </div>
              )
            })}
          </div>
          
          {/* Mobile timeline (vertical, shown only on small screens) */}
          <div className="sm:hidden">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200 z-0"></div>
              
              {statuses.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={step.name} className="flex items-start mb-6 relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      isCurrent 
                        ? `${step.color} bg-white border-2 border-current animate-pulse` 
                        : isCompleted 
                          ? `text-white bg-green-500` 
                          : `text-gray-400 bg-gray-100 border border-gray-300`
                    }`}>
                      {step.icon}
                    </div>
                    <div className="ml-4">
                      <p className={`font-medium ${
                        isCurrent 
                          ? step.color 
                          : isCompleted 
                            ? 'text-green-500' 
                            : 'text-gray-400'
                      }`}>
                        {step.name.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {isCurrent && 'Current status'}
                        {!isCurrent && isCompleted && 'Completed'}
                        {!isCurrent && !isCompleted && 'Pending'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
      
      {/* Add animation styles */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default OrderTimeline
