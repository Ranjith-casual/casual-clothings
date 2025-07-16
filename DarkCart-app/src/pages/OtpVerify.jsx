import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import AxiosTostError from "../utils/AxiosTostError";
import { Link, useLocation, useNavigate } from "react-router-dom";

function OtpVerify() {
  const [userInfo, setUserInfo] = useState(["","","","","",""]);
  const navigate = useNavigate();
  const Inpref = useRef([])
  const location = useLocation();

  const checkAllFields = () => {
    if (userInfo.every((data) => data === "")) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await Axios({
        url: SummaryApi.forgetPasswordVerify.url,
        method: SummaryApi.forgetPasswordVerify.method,
        data: {
            email : location?.state?.email,
            otp: userInfo.join("")
        },
      });

      if (response.data.error) {
        toast.error(response.data.message);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setUserInfo(["", "", "", "", "", ""]);
        navigate("/reset-password", {
          state: {
            email: location?.state?.email,
          },
        });
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  useEffect(() => {
    if (!location?.state?.email) {
      navigate("/forgot-password");
    }
  })

  return (
    <section className="w-full container mx-auto p-4 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg mx-auto p-8 rounded-lg shadow-xl border border-gray-200">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Verify OTP</h2>
          <p className="text-gray-600">Enter the 6-digit code sent to your email</p>
        </div>

        <form
          method="POST"
          action=""
          className="grid gap-6 mt-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3">
            <label htmlFor="otp" className="font-medium text-gray-700 text-center">Enter your OTP:</label>
            <div className="flex items-center gap-3 justify-center mt-3">
                {
                    userInfo.map((data, index) => (
                        <input
                        id="otp"
                        key={index}
                        ref={(ref)=>{
                            Inpref.current[index] = ref
                            return ref
                        }}
                        value={userInfo[index]}
                        maxLength={1}
                        onChange={(e) => {
                            const value = e.target.value;
                            const data = [...userInfo];
                            data[index] = value;
                            setUserInfo(data);

                            if(value && index < 5){
                                Inpref.current[index+1]?.focus()
                            }
                        }}
                        className="w-12 h-12 bg-gray-50 border border-gray-300 rounded-md outline-none focus:border-black focus:bg-white text-center font-bold text-lg transition-colors"
                        type="text"
                      />
                    ))
                }
            </div>
          </div>

          <button
            disabled={!checkAllFields()}
            className={`w-full px-4 py-3 rounded-md font-semibold tracking-wide transition-colors ${
              checkAllFields()
                ? "bg-black hover:bg-gray-800 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Verify OTP
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Have an account?{" "}
          <Link className="text-black hover:text-gray-800 font-medium ml-1 underline" to={"/login"}>
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default OtpVerify;
