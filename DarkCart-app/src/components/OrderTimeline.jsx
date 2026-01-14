import React from 'react'
import { 
  FaBox, 
  FaCheckCircle, 
  FaTruck, 
  FaCog, 
  FaBan, 
  FaShoppingBag, 
  FaRegClock, 
  FaClipboardCheck 
} from 'react-icons/fa'

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
      @keyframes pulseRing {
        0% { transform: scale(.95); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
        100% { transform: scale(.95); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Define the order statuses and their corresponding icons and colors
  const statuses = [
    { name: 'ORDER PLACED', icon: <FaShoppingBag />, color: 'text-black', bgColor: 'bg-white', description: 'Your order has been confirmed' },
    { name: 'PROCESSING', icon: <FaCog className="animate-spin-slow" />, color: 'text-black', bgColor: 'bg-white', description: 'Your order is being prepared' },
    { name: 'OUT FOR DELIVERY', icon: <FaTruck />, color: 'text-black', bgColor: 'bg-white', description: 'Your order is on the way' },
    { name: 'DELIVERED', icon: <FaClipboardCheck />, color: 'text-black', bgColor: 'bg-white', description: 'Your order has been delivered' },
  ]

  // Find the current status index
  const currentStatusIndex = status === 'CANCELLED' 
    ? -1 
    : statuses.findIndex(s => s.name === status);

  return (
    <div className="w-full py-6 font-sans" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {status === 'CANCELLED' ? (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200 shadow-md mx-auto max-w-md" style={{ animation: 'slideIn 0.5s ease-out' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border-2 border-black mb-4 shadow-lg">
            <FaBan className="text-2xl text-black" />
          </div>
          <h3 className="font-bold text-lg text-black tracking-wide">Order Cancelled</h3>
          <p className="text-sm text-gray-600 text-center mt-2 max-w-xs tracking-wide">This order has been cancelled and will not be processed further.</p>
        </div>
      ) : (
        <>
          {/* Desktop timeline (hidden on small screens) */}
          <div className="hidden sm:block relative mb-8" style={{ animation: 'slideIn 0.6s ease-out' }}>
            {/* Container for the timeline */}
            <div className="flex items-center justify-between px-2 sm:px-4 md:px-8 max-w-4xl mx-auto">
              
              {statuses.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={step.name} className="relative z-10 flex flex-col items-center flex-1 mx-2" style={{ animation: `fadeIn 0.5s ease-out ${0.2 + index * 0.1}s both` }}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4 ${
                      isCurrent 
                        ? 'bg-white border-2 border-black text-black animate-pulse' 
                        : isCompleted 
                          ? 'text-white bg-black' 
                          : 'text-gray-400 bg-white border border-gray-300'
                    }`} style={isCurrent ? { animation: 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite' } : {}}>
                      <div className={`text-xl ${isCurrent ? 'scale-110' : ''}`}>
                        {step.icon}
                      </div>
                    </div>
                    <p className={`text-xs font-semibold text-center tracking-wide max-w-[120px] leading-tight ${
                      isCurrent 
                        ? 'text-black' 
                        : isCompleted 
                          ? 'text-black' 
                          : 'text-gray-500'
                    }`}>
                      {step.name.replace(/_/g, ' ')}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] text-gray-600 text-center mt-1 max-w-[120px]">
                        {step.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Mobile timeline (vertical, shown only on small screens) */}
          <div className="sm:hidden px-2" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="relative pl-6 mx-auto max-w-md">
              
              {statuses.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div 
                    key={step.name} 
                    className="flex items-start pb-8 mb-2 relative z-10" 
                    style={{ animation: `slideIn 0.5s ease-out ${0.2 + index * 0.1}s both` }}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                      isCurrent 
                        ? 'bg-white border-2 border-black text-black' 
                        : isCompleted 
                          ? 'text-white bg-black' 
                          : 'text-gray-400 bg-white border border-gray-300'
                    }`} style={isCurrent ? { animation: 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite' } : {}}>
                      <div className={`text-lg ${isCurrent ? 'scale-110' : ''}`}>
                        {step.icon}
                      </div>
                    </div>
                    <div className="ml-5 pt-3">
                      <p className={`font-semibold text-sm tracking-wide ${
                        isCurrent 
                          ? 'text-black' 
                          : isCompleted 
                            ? 'text-black' 
                            : 'text-gray-500'
                      }`}>
                        {step.name.replace(/_/g, ' ')}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {step.description}
                        </p>
                      )}
                      <p className={`text-xs mt-1 tracking-wide ${
                        isCurrent 
                          ? 'font-medium text-black' 
                          : isCompleted 
                            ? 'text-gray-700' 
                            : 'text-gray-500'
                      }`}>
                        {isCurrent && '• Current status'}
                        {!isCurrent && isCompleted && '• Completed'}
                        {!isCurrent && !isCompleted && '• Pending'}
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
          0% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.15); }
          70% { box-shadow: 0 0 0 8px rgba(0, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  )
}

export default OrderTimeline
