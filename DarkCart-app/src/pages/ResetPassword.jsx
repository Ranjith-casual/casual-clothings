import React, { useEffect, useState } from "react";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
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


  return (
    <section className="w-full container mx-auto p-4 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg mx-auto p-8 rounded-lg shadow-xl border border-gray-200">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Reset Password</h2>
          <p className="text-gray-600">Create a new password for your account</p>
        </div>

        <form method="POST" action="" className="grid gap-6 mt-6" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label htmlFor="password" className="font-medium text-gray-700">New Password:</label>
            <div className="w-full bg-gray-50 p-3 rounded-md border-gray-300 flex items-center focus-within:border-black focus-within:bg-white border transition-colors">
              <input
                id="password"
                className="w-full outline-none bg-transparent"
                name="newPassword"
                value={userInfo.newPassword}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
              />

              <div
                onClick={handleShowPassword}
                className="text-xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="confirmPassword" className="font-medium text-gray-700">Confirm Password:</label>
            <div className="w-full bg-gray-50 p-3 rounded-md border-gray-300 flex items-center focus-within:border-black focus-within:bg-white border transition-colors">
              <input
                id="confirmPassword"
                className="w-full outline-none bg-transparent"
                name="confirmPassword"
                value={userInfo.confirmPassword}
                onChange={handleChange}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
              />

              <div
                onClick={handleConfirmPassword}
                className="text-xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </div>
            </div>
          </div>
          

          <button disabled={!checkAllFields()} className={`w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors ${ checkAllFields() ? "bg-black hover:bg-gray-800 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed" }`}>
            Reset Password
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Remember your password? 
          <Link className="text-black hover:text-gray-800 font-medium ml-1 underline" to={"/login"}>
            Sign In
          </Link>
        </p>
      </div>
    </section>
  );
}

export default ResetPassword;
