import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import AxiosTostError from "../utils/AxiosTostError";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [userInfo, setUserInfo] = useState({
    email: "",
  });
  const navigate = useNavigate();

  const checkAllFields = () => {
    if( userInfo.email === ""){
      return false;
    }
    return true;
    }


  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async(e) => { 
    e.preventDefault();

    try {
      const response = await Axios({
        url: SummaryApi.forgetPassword.url,
        method: SummaryApi.forgetPassword.method,
        data: userInfo,
      });


      if(response.data.error){
        toast.error(response.data.message);
      }

      if(response.data.success){
        toast.success(response.data.message);
        navigate("/otp-verification",{
          state :{
            email: userInfo.email
          }
        });
        setUserInfo({
          email: "",
        });
       
      }

    } catch (error) {
      AxiosTostError(error);
    }
  }

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add Poppins font for premium look
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Animation effect on load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => {
      document.head.removeChild(link);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="w-full container mx-auto px-4 py-8 md:py-16 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center font-['Poppins',sans-serif]">
      <div className={`bg-white w-full max-w-md sm:max-w-lg mx-auto p-6 sm:p-8 md:p-10 rounded-xl shadow-2xl border border-gray-100 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} hover:shadow-gray-200`}>
        
        <div className="text-center mb-8">
         
          <h2 className="text-3xl font-bold text-black font-['Playfair_Display'] mb-2">Forgot Password</h2>
          <p className="text-gray-600">Enter your email to receive a verification code</p>
        </div>

        <form method="POST" action="" className="grid gap-6 mt-6" onSubmit={handleSubmit}>
          
          <div className="grid gap-3">
            <label htmlFor="email" className="font-medium text-gray-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                className="w-full bg-gray-50 p-4 pr-10 border-2 border-gray-200 rounded-lg outline-none focus:border-black focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                name="email"
                value={userInfo.email}
                onChange={handleChange}
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {userInfo.email && (
                  userInfo.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                )}
              </span>
            </div>
            <p className="text-xs text-gray-700">We'll send a verification code to this email address</p>
          </div>
          
          <button 
            disabled={!checkAllFields()} 
            className={`w-full px-6 py-4 rounded-lg font-semibold tracking-wide transition-all duration-300 text-base flex items-center justify-center gap-2 mt-4 ${
              checkAllFields() 
                ? "bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-gray-300" 
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {checkAllFields() ? (
              <>
                Send Verification Code
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </>
            ) : (
              "Enter your email"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="text-gray-700 hover:text-black flex items-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <p className="text-gray-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Have an account?{" "}
              <Link className="text-black hover:text-gray-700 font-medium ml-1.5 transition-colors duration-200" to={"/login"}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      
     
    </section>
  );
}

export default ForgotPassword;
