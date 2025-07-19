import React, { useState, useEffect } from "react";
import { FaRegEye, FaRegEyeSlash, FaUserPlus } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
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

  // Remove AOS useEffect since we're using Framer Motion instead

  const checkAllFields = () => {
    return (
      userInfo.name !== "" &&
      userInfo.email !== "" &&
      userInfo.password !== "" &&
      userInfo.confirmPassword !== ""
    );
  };

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userInfo.password !== userInfo.confirmPassword) {
      toast.error("Password and Confirm Password should be same");
      return;
    }

    try {
      const response = await Axios({
        url: SummaryApi.register.url,
        method: SummaryApi.register.method,
        data: userInfo,
      });

      if (response.data.error) {
        toast.error(response.data.message);
        return;
      }

      if (response.data.success) {
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
  };

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
        return;
      }

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/login");
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      } 
    },
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };

  const inputVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      } 
    },
  };

  return (
    <section className="w-full container mx-auto py-10 px-4 min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div
        className="bg-white w-full max-w-lg mx-auto rounded-lg shadow-xl border border-gray-100 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-8 py-6">
          <motion.div variants={itemVariants} className="text-center">
            <div className="mx-auto mb-4 bg-black/5 rounded-full w-16 h-16 flex items-center justify-center">
              <FaUserPlus className="text-gray-800 text-xl" />
            </div>
            <h2 className="fashion-heading text-2xl text-gray-900 mb-2 tracking-wide">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: "0.03em" }}>
              Join us for exclusive fashion deals
            </p>
          </motion.div>
        </div>

        <div className="p-8">
          <motion.form 
            method="POST" 
            action="" 
            className="grid gap-5" 
            onSubmit={handleSubmit}
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="grid gap-2" variants={inputVariants}>
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
            </motion.div>

            <motion.div className="grid gap-2" variants={inputVariants}>
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
            </motion.div>

            <motion.div className="grid gap-2" variants={inputVariants}>
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
                <div onClick={handleShowPassword} className="text-xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
                  {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </div>
              </div>
            </motion.div>

            <motion.div className="grid gap-2" variants={inputVariants}>
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
                <div onClick={handleShowConfirmPassword} className="text-xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
                  {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </div>
              </div>
            </motion.div>

            <motion.button
              disabled={!checkAllFields()}
              className={`w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors ${
                checkAllFields()
                  ? "bg-black hover:bg-gray-800 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              variants={inputVariants}
              whileHover={{ scale: checkAllFields() ? 1.02 : 1 }}
              whileTap={{ scale: checkAllFields() ? 0.98 : 1 }}
            >
              Create Account
            </motion.button>

            <motion.div className="flex items-center my-4" variants={inputVariants}>
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </motion.div>

            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2"
              variants={inputVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FcGoogle className="text-xl" />
              Continue with Google
            </motion.button>
          </motion.form>

          <motion.p 
            className="text-center mt-6 text-gray-600"
            variants={inputVariants}
            initial="hidden"
            animate="visible"
          >
            Already have an account?
            <Link className="text-black hover:text-gray-800 font-medium ml-1 underline" to={"/login"}>
              Sign In
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}

export default Register;
