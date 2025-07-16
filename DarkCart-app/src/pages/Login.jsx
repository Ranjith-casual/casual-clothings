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
  const dispatch = useDispatch()

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
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);

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
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);

        const userDetails = await FetchUserInfo();
        dispatch(setUserDetails(userDetails.data));

        navigate("/");
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <section className="w-full container mx-auto p-4 min-h-[80vh] bg-gray-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg mx-auto p-8 rounded-lg shadow-xl border border-gray-200">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
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
            <Link to={"/forget-password"} className="block ml-auto text-black hover:text-gray-800 font-medium underline">Forget Password?</Link>
          </div>
          

          <button disabled={!checkAllFields()} className={`w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors ${ checkAllFields() ? "bg-black hover:bg-gray-800 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed" }`}>
            Login
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
          Create an account? 
          <Link className="text-black hover:text-gray-800 font-medium ml-1 underline" to={"/register"}>
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
