import React, { useState, useEffect } from "react";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase";
import toast from "react-hot-toast";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import AxiosTostError from "../utils/AxiosTostError";
import { Link, useNavigate } from "react-router-dom";
import FetchUserInfo from '../utils/FetchUserInfo'
import { useDispatch } from "react-redux"
import { setUserDetails } from '../store/userSlice'

function Login() {
  const [userInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  const checkAllFields = () => {
    if( userInfo.email === "" || userInfo.password === ""){
      return false;
    }
    return true;
    }


  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

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
        url: SummaryApi.login.url,
        method: SummaryApi.login.method,
        data: userInfo,
      });


      if(response.data.error){
        toast.error(response.data.message);
      }

      if(response.data.success){
        toast.success(response.data.message);
        // Set tokens in localStorage using your app's standard format
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);
        
        // For backward compatibility with components that use "token" instead of "accessToken"
        localStorage.setItem("token", response.data.data.accessToken);
        
        // Generate new session ID for notification tracking
        const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("userSession", sessionId);
        
        // Fetch user details and store user ID in localStorage
        const userData = await FetchUserInfo();
        if (userData && userData.data && userData.data._id) {
          localStorage.setItem("userId", userData.data._id);
        }

        const userDetails = await FetchUserInfo()
        dispatch(setUserDetails(userDetails.data))

        setUserInfo({
          email: "",
          password: ""
        });
        navigate("/");
      }

    } catch (error) {
      AxiosTostError(error);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const googleUserData = {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
      };

      const response = await Axios({
        url: SummaryApi.googleSignIn.url,
        method: SummaryApi.googleSignIn.method,
        data: googleUserData,
      });

      if (response.data.error) {
        toast.error(response.data.message);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        // Set tokens in localStorage using your app's standard format
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);
        
        // For backward compatibility with components that use "token" instead of "accessToken"
        localStorage.setItem("token", response.data.data.accessToken);
        
        // Generate new session ID for notification tracking
        const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("userSession", sessionId);
        
        // Fetch user details and store user ID in localStorage
        const userData = await FetchUserInfo();
        if (userData && userData.data && userData.data._id) {
          localStorage.setItem("userId", userData.data._id);
        }

        const userDetails = await FetchUserInfo();
        dispatch(setUserDetails(userDetails.data));

        navigate("/");
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <section className="w-full container mx-auto px-4 py-8 md:py-16 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center font-['Poppins',sans-serif]">
      <div className={`bg-white w-full max-w-md sm:max-w-lg mx-auto p-6 sm:p-8 md:p-10 rounded-xl shadow-2xl border border-gray-100 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} hover:shadow-gray-200`}>
        
        <div className="text-center mb-8">
        
          <h2 className="text-3xl font-bold text-black font-['Playfair_Display'] mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
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
              {userInfo.email && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {userInfo.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  }
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <label htmlFor="password" className="font-medium text-gray-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full bg-gray-50 p-4 pr-12 border-2 border-gray-200 rounded-lg outline-none focus:border-black focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                name="password"
                value={userInfo.password}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={handleShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaRegEyeSlash className="text-xl" /> : <FaRegEye className="text-xl" />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link to="/forget-password" className="text-black hover:text-gray-700 font-medium text-sm transition-colors duration-200">
                Forgot Password?
              </Link>
            </div>
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
                Sign In
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              "Fill required fields"
            )}
          </button>
          
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full px-6 py-4 rounded-lg font-medium transition-all duration-300 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:shadow-md text-gray-700 flex items-center justify-center gap-3"
          >
            <FcGoogle className="text-2xl" />
            Continue with Google
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-gray-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Don't have an account?{" "}
            <Link className="text-black hover:text-gray-700 font-medium ml-1.5 transition-colors duration-200" to={"/register"}>
              Register
            </Link>
          </p>
        </div>
      </div>
      
     
    </section>
  );
}

export default Login;
