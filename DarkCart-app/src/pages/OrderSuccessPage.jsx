import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import OrderSuccessConfetti from '../components/OrderSuccessConfetti';
import ConfettiGifAnimation from '../components/ConfettiGifAnimation';
import { useSelector } from 'react-redux';

const OrderSuccessPage = () => {
  const location = useLocation();
  const [showAnimation, setShowAnimation] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const orderType = location.state?.text || "Order";
  const orderDetails = location.state?.orderDetails || null;
  const user = useSelector((state) => state.user.user);
  
  // Path to the confetti GIF file in the public directory
  const confettiGifPath = '/animations/confetti-success.gif';

  useEffect(() => {
    // Add animation end timer if needed
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 5000);

    // Trigger fade in animation after component mounts
    setTimeout(() => {
      setFadeIn(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16 relative overflow-hidden">
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(0, 128, 0, 0.1); }
          70% { box-shadow: 0 0 0 20px rgba(0, 128, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 128, 0, 0); }
        }
      `}</style>
      
      {/* Background decorative elements with animation */}
      <div className={`absolute top-10 left-10 w-20 h-20 bg-gray-100 rounded-full transition-all duration-1000 ${fadeIn ? 'opacity-30' : 'opacity-0 translate-y-4'}`}></div>
      <div className={`absolute bottom-10 right-10 w-32 h-32 bg-gray-100 rounded-full transition-all duration-1000 delay-300 ${fadeIn ? 'opacity-30' : 'opacity-0 translate-y-4'}`}></div>
      <div className={`absolute top-1/4 right-1/4 w-16 h-16 bg-gray-100 rounded-full transition-all duration-1000 delay-500 ${fadeIn ? 'opacity-20' : 'opacity-0 translate-y-4'}`}></div>
      
      {/* Additional decorative elements */}
      <div className={`absolute bottom-1/4 left-1/4 w-12 h-12 bg-gray-100 rounded-full transition-all duration-1000 delay-700 ${fadeIn ? 'opacity-15' : 'opacity-0 translate-y-4'}`}></div>
      
      {showAnimation && (
        <>
          <OrderSuccessConfetti />
          <ConfettiGifAnimation src={confettiGifPath} />
        </>
      )}
      
      <div className="container mx-auto max-w-md">
        <div className="flex flex-col items-center justify-center">
          {/* Success Message Card */}
          <div 
            className={`bg-white rounded-xl shadow-lg p-8 w-full text-center border border-gray-200 relative overflow-hidden transition-all duration-700 transform ${fadeIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-white opacity-50"></div>
            
            <div className="relative z-10">
              {/* Success Icon Image */}
              <div className={`w-52 h-52 sm:w-64 sm:h-64 mx-auto mb-8 transition-all duration-700 transform ${fadeIn ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`} style={{ animation: 'pulse-glow 2s infinite' }}>
                <img 
                  src="/images/Successful purchase-cuate.png" 
                  alt="Order Success Icon" 
                  className="w-full h-full object-contain animate-float"
                  onLoad={() => setImageLoaded(true)} 
                />
              </div>
              
              <h2 className="text-3xl font-bold mb-4 bg-clip-text bg-gradient-to-r from-green-600 to-gray-600 text-transparent">Thank You{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</h2>
              <p className="text-xl text-gray-600 mb-2">Your {orderType} has been placed successfully</p>
              <p className="text-sm text-gray-500 mb-6">We'll send you a confirmation email with order details shortly.</p>
              
              {/* Order info animation */}
              <div className={`bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100 transition-all duration-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
                <p className="text-sm text-gray-600 mb-1">Order Status</p>
                <div className="font-medium text-gray-800 flex items-center justify-center gap-2">
                  <div className="flex items-center justify-center">
                    <div className="h-5 w-5 relative">
                      <div className="animate-ping absolute h-full w-full rounded-full theme-bg-success-light opacity-75"></div>
                      <div className="relative rounded-full h-4 w-4 theme-bg-success flex items-center justify-center">
                        <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <span>Confirmed</span>
                </div>
              </div>
              
              {/* Estimated Delivery Date Section */}
              {orderDetails?.estimatedDeliveryDate && (
                <div className={`theme-bg-info-light rounded-lg p-4 mb-6 border border-gray-200 transition-all duration-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '700ms' }}>
                  <p className="text-sm theme-text-info mb-1">Estimated Delivery</p>
                  <div className="font-medium theme-info flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 theme-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{orderDetails.estimatedDeliveryDate}</span>
                  </div>
                  {orderDetails?.deliveryDays && (
                    <p className="text-xs theme-text-primary mt-1 text-center">
                      ({orderDetails.deliveryDays} {orderDetails.deliveryDays === 1 ? 'day' : 'days'} delivery)
                      {orderDetails?.deliveryDistance && orderDetails.deliveryDistance !== '0' && (
                        <span className="ml-1">• {orderDetails.deliveryDistance} km</span>
                      )}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-3 mt-6">
                <Link 
                  to="/dashboard/myorders" 
                  className={`bg-black px-6 py-3 text-white font-semibold rounded-md hover:bg-gray-800 transition-all duration-500 tracking-wide transform hover:-translate-y-1 hover:shadow-lg ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: '800ms' }}
                >
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Track Your Order
                  </span>
                </Link>
                <Link 
                  to="/" 
                  className={`px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 hover:text-gray-900 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-md relative overflow-hidden group ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: '1000ms' }}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Continue Shopping
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className={`absolute -bottom-4 -left-4 w-12 h-12 bg-gray-100 rounded-full transition-all duration-1000 delay-800 ${fadeIn ? 'opacity-40 scale-100' : 'opacity-0 scale-50'}`}></div>
      <div className={`absolute -top-4 -right-4 w-8 h-8 bg-gray-100 rounded-full transition-all duration-1000 delay-700 ${fadeIn ? 'opacity-40 scale-100' : 'opacity-0 scale-50'}`}></div>
    </div>
  );
};

export default OrderSuccessPage;
