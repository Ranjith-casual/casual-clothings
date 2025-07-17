import React, { useState } from "react";
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

function Register() {
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const checkAllFields = () => {
    if(userInfo.name === "" || userInfo.email === "" || userInfo.password === "" || userInfo.confirmPassword === ""){
      return false;
    }
    return true;
    }


  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  const handleShowConfirmPassword = () => {
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
    
    if(userInfo.password !== userInfo.confirmPassword){
      toast.error("Password and Confirm Password should be same");
      return;
    }

    try {
      const response = await Axios({
        url: SummaryApi.register.url,
        method: SummaryApi.register.method,
        data: userInfo,
      });

      console.log(response.data);

      if(response.data.error){
        toast.error(response.data.message);
      }

      if(response.data.success){
        toast.success(response.data.message);
        setUserInfo({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        navigate("/login");
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
        navigate("/login");
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <section className="w-full container mx-auto p-4 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg mx-auto p-8 rounded-lg shadow-xl border border-gray-200">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Create Account</h2>
          <p className="text-gray-600">Join us for exclusive fashion deals</p>
        </div>

        <form method="POST" action="" className="grid gap-6 mt-6" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label htmlFor="name" className="font-medium text-gray-700">Full Name:</label>
            <input
              autoFocus
              id="name"
              className="w-full bg-gray-50 p-3 border border-gray-300 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              name="name"
              value={userInfo.name}
              onChange={handleChange}
              type="text"
              placeholder="Enter your full name"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="email" className="font-medium text-gray-700">Email Address:</label>
            <input
              id="email"
              className="w-full bg-gray-50 p-3 border border-gray-300 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
              name="email"
              value={userInfo.email}
              onChange={handleChange}
              type="email"
              placeholder="Enter your email address"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="password" className="font-medium text-gray-700">Password:</label>
            <div className="w-full bg-gray-50 p-3 rounded-md border-gray-300 flex items-center focus-within:border-black focus-within:bg-white border transition-colors">
              <input
                id="password"
                className="w-full outline-none bg-transparent"
                name="password"
                value={userInfo.password}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
                placeholder="Confirm your password"
              />
              <div>
                <div
                  onClick={handleShowConfirmPassword}
                  className="text-xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </div>
              </div>
            </div>
          </div>

          <button disabled={!checkAllFields()} className={`w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors ${ checkAllFields() ? "bg-black hover:bg-gray-800 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed" }`}>
            Create Account
          </button>
          
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2"
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account? 
          <Link className="text-black hover:text-gray-800 font-medium ml-1 underline" to={"/login"}>
            Sign In
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
