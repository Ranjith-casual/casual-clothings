import React, { useState } from "react";
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

  return (
    <section className="w-full container mx-auto p-4 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg mx-auto p-8 rounded-lg shadow-xl border border-gray-200">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Forgot Password</h2>
          <p className="text-gray-600">Enter your email to receive a verification code</p>
        </div>

        <form method="POST" action="" className="grid gap-6 mt-6" onSubmit={handleSubmit}>
          
          <div className="grid gap-2">
            <label htmlFor="email" className="font-medium text-gray-700">Email:</label>
            <input
              id="email"
              className="w-full bg-gray-50 p-3 border border-gray-300 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              name="email"
              value={userInfo.email}
              onChange={handleChange}
              type="email"
              placeholder="Enter your email"
            />
          </div>
          

          <button disabled={!checkAllFields()} className={`w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors ${ checkAllFields() ? "bg-black hover:bg-gray-800 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed" }`}>
            Send OTP
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Have an account? 
          <Link className="text-black hover:text-gray-800 font-medium ml-1 underline" to={"/login"}>
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default ForgotPassword;
