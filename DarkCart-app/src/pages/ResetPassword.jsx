import React, { useEffect, useState } from "react";
import { FaRegEye, FaRegEyeSlash, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import AxiosTostError from "../utils/AxiosTostError";
import { Link, useLocation, useNavigate } from "react-router-dom";

function ResetPassword() {
  const [userInfo, setUserInfo] = useState({
    email: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAllFields = () => {
    if( userInfo.email === "" || userInfo.newPassword === "" || userInfo.confirmPassword === ""){
      return false;
    }
    return true;
    }


  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
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
    
    if(userInfo.newPassword !== userInfo.confirmPassword){
      toast.error("Password and Confirm Password should be same");
      return;
    }
    
    console.log(userInfo);
    try {
      const response = await Axios({
        url: SummaryApi.resetPassword.url,
        method: SummaryApi.resetPassword.method,
        data: userInfo,
      });


      if(response.data.error){
        toast.error(response.data.message);
      }

      if(response.data.success){
        toast.success(response.data.message);
        setUserInfo({
          email: "",
          newPassword: "",
          confirmPassword: ""
        });
        navigate("/login");
      }

    } catch (error) {
      AxiosTostError(error);
    }
  }

  useEffect(() => {
    console.log(location?.state?.email);

    if (!(location?.state?.email)) {
      navigate("/forgot-password");
    }

    if(location?.state?.email){
        setUserInfo((prev) => {
            return {
            ...prev,
            email: location?.state?.email
            }
        });
    }
  },[])


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <section className="w-full container mx-auto py-12 px-4 min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div 
        className="bg-white w-full max-w-lg mx-auto rounded-lg shadow-xl border border-gray-100 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with premium styling */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-8 py-6">
          <motion.div variants={itemVariants} className="text-center">
            <div className="mx-auto mb-4 bg-black/5 rounded-full w-16 h-16 flex items-center justify-center">
              <FaLock className="text-gray-800 text-xl" />
            </div>
            <h2 className="fashion-heading text-2xl text-gray-900 mb-2 tracking-wide">Reset Password</h2>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '0.03em' }}>
              Create a new password for your account
            </p>
          </motion.div>
        </div>

        <div className="p-8">
          <form method="POST" action="" className="grid gap-6" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants} className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' }}>
                New Password
              </label>
              <div className="relative w-full">
                <div className="w-full bg-gray-50 p-3 rounded-md border border-gray-200 flex items-center focus-within:border-black focus-within:ring-1 focus-within:ring-black/5 focus-within:bg-white transition-all duration-200">
                  <input
                    id="password"
                    className="w-full outline-none bg-transparent text-gray-800"
                    name="newPassword"
                    value={userInfo.newPassword}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' }}
                  />
                  <div
                    onClick={handleShowPassword}
                    className="text-lg cursor-pointer text-gray-500 hover:text-black transition-colors"
                  >
                    {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-black/2 to-transparent opacity-0 focus-within:opacity-100 pointer-events-none transition-opacity duration-500"></div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' }}>
                Confirm Password
              </label>
              <div className="relative w-full">
                <div className="w-full bg-gray-50 p-3 rounded-md border border-gray-200 flex items-center focus-within:border-black focus-within:ring-1 focus-within:ring-black/5 focus-within:bg-white transition-all duration-200">
                  <input
                    id="confirmPassword"
                    className="w-full outline-none bg-transparent text-gray-800"
                    name="confirmPassword"
                    value={userInfo.confirmPassword}
                    onChange={handleChange}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' }}
                  />
                  <div
                    onClick={handleConfirmPassword}
                    className="text-lg cursor-pointer text-gray-500 hover:text-black transition-colors"
                  >
                    {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-black/2 to-transparent opacity-0 focus-within:opacity-100 pointer-events-none transition-opacity duration-500"></div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-2">
              <button 
                disabled={!checkAllFields()} 
                className={`w-full px-4 py-3.5 font-medium tracking-wider transition-all duration-300 relative overflow-hidden group
                  ${ checkAllFields() ? "bg-black hover:bg-gray-900 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed" }`}
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}
              >
                {checkAllFields() && (
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-full"></span>
                )}
                Reset Password
              </button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-center text-gray-500 text-sm" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
              Remember your password?{" "}
              <Link className="text-black hover:text-gray-700 font-medium transition-colors duration-200" to={"/login"} style={{ letterSpacing: '0.02em' }}>
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default ResetPassword;
