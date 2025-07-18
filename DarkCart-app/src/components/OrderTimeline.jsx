import React from 'react'
import { FaBox, FaCheckCircle, FaTruck, FaCog, FaBan } from 'react-icons/fa'

const OrderTimeline = ({ status }) => {
  // Add animation styles to component
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(-5px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
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
    <div className="w-full py-4 font-sans" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {status === 'CANCELLED' ? (
        <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm" style={{ animation: 'slideIn 0.5s ease-out' }}>
          <FaBan className="text-2xl sm:text-3xl text-red-500 mb-2" />
          <h3 className="font-bold text-red-700 tracking-wide">Order Cancelled</h3>
          <p className="text-xs sm:text-sm text-red-600 text-center mt-1 tracking-wide">This order has been cancelled and will not be processed further.</p>
        </div>
      ) : (
        <>
          {/* Desktop timeline (hidden on small screens) */}
          <div className="hidden sm:block relative mb-6" style={{ animation: 'slideIn 0.6s ease-out' }}>
            {/* Container for the timeline */}
            <div className="flex items-center justify-between px-4">
              {/* Line connecting all steps */}
              <div className="absolute left-2 right-2 top-1/3 transform -translate-y-1/2 h-1 bg-gray-200 z-0">
                <div 
                  className="h-full bg-green-500 transition-all duration-500" 
                  style={{ 
                    width: currentStatusIndex >= 0 
                      ? `${Math.min(100, (currentStatusIndex / (statuses.length - 1)) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              
              {statuses.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={step.name} className="relative z-10 flex flex-col items-center" style={{ animation: `fadeIn 0.5s ease-out ${0.2 + index * 0.1}s both` }}>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-sm mb-3 ${
                      isCurrent 
                        ? `${step.color} bg-white border-2 border-current animate-pulse` 
                        : isCompleted 
                          ? `text-white bg-green-500` 
                          : `text-gray-400 bg-gray-50 border border-gray-300`
                    }`}>
                      {step.icon}
                    </div>
                    <p className={`text-[10px] sm:text-xs font-medium text-center tracking-wide max-w-[120px] leading-tight ${
                      isCurrent 
                        ? step.color 
                        : isCompleted 
                          ? 'text-green-500' 
                          : 'text-gray-500'
                    }`}>
                      {step.name.replace(/_/g, ' ')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Mobile timeline (vertical, shown only on small screens) */}
          <div className="sm:hidden" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="relative pl-2">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-1 bg-gray-200 z-0">
                <div 
                  className="w-full bg-green-500 transition-all duration-500" 
                  style={{ 
                    height: currentStatusIndex >= 0 
                      ? `${Math.min(100, (currentStatusIndex / (statuses.length - 1)) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              
              {statuses.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div 
                    key={step.name} 
                    className="flex items-start pb-8 relative z-10" 
                    style={{ animation: `slideIn 0.5s ease-out ${0.2 + index * 0.1}s both` }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      isCurrent 
                        ? `${step.color} bg-white border-2 border-current animate-pulse` 
                        : isCompleted 
                          ? `text-white bg-green-500` 
                          : `text-gray-400 bg-gray-50 border border-gray-300`
                    }`}>
                      {step.icon}
                    </div>
                    <div className="ml-4 pt-1">
                      <p className={`font-medium text-sm tracking-wide ${
                        isCurrent 
                          ? step.color 
                          : isCompleted 
                            ? 'text-green-500' 
                            : 'text-gray-500'
                      }`}>
                        {step.name.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 tracking-wide">
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
        @keyframes pulse-custom {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  )
}

export default OrderTimeline
