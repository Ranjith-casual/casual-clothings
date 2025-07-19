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
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (location?.state?.email) {
      // Mask email for privacy
      const emailParts = location.state.email.split('@');
      if (emailParts.length === 2) {
        const name = emailParts[0];
        const maskedName = name.substring(0, Math.min(3, name.length)) + 
                          '*'.repeat(Math.max(name.length - 3, 0));
        setEmail(`${maskedName}@${emailParts[1]}`);
      } else {
        setEmail(location.state.email);
      }
    }
  }, [location?.state?.email]);

  const checkAllFields = () => {
    if (userInfo.every((data) => data === "")) {
      return false;
    }
    return true;
  };
  
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !userInfo[index] && index > 0) {
      Inpref.current[index-1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      Inpref.current[index-1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      Inpref.current[index+1]?.focus();
    }
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

  useEffect(() => {
    // Add Poppins font for premium look
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <section className="w-full container mx-auto p-4 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center font-['Poppins',sans-serif]">
      <div className="bg-white w-full max-w-lg mx-auto p-8 md:p-10 rounded-xl shadow-2xl border border-gray-100 transform transition-all duration-300">
        
        <div className="text-center mb-8">
          <div className="inline-block mb-4 bg-indigo-50 p-3 rounded-full">

          </div>
          <h2 className="text-3xl font-bold text-gray-900 font-['Playfair_Display'] mb-2">Verify OTP</h2>
          <p className="text-gray-600">Enter the 6-digit code sent to your email</p>
          {email && <p className="mt-2 text-sm font-medium text-black-600">{email}</p>}
        </div>

        <form
          method="POST"
          action=""
          className="grid gap-8 mt-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5">
            <label htmlFor="otp" className="font-medium text-gray-700 text-center text-lg">Enter your verification code:</label>
            <div className="flex items-center gap-2 md:gap-4 justify-center mt-3">
                {
                    userInfo.map((data, index) => (
                        <input
                        id={`otp-${index}`}
                        key={index}
                        ref={(ref)=>{
                            Inpref.current[index] = ref
                            return ref
                        }}
                        value={userInfo[index]}
                        maxLength={1}
                        onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            const data = [...userInfo];
                            data[index] = value;
                            setUserInfo(data);

                            if(value && index < 5){
                                Inpref.current[index+1]?.focus()
                            }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                        className="w-12 h-14 md:w-14 md:h-16 bg-gray-50 border-2 border-gray-100 rounded-lg outline-none focus:border-gray-500 focus:bg-white text-center font-bold text-xl transition-all duration-200 shadow-sm hover:shadow-md"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    ))
                }
            </div>
            <div className="text-center mt-4">
              <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Code expires in <span className="font-semibold text-black-600">05:00</span>
              </p>
             
            </div>
          </div>

          <button
            disabled={!checkAllFields()}
            className={`w-full px-6 py-4 rounded-lg font-semibold tracking-wide transition-all duration-300 text-base flex items-center justify-center gap-2 ${
              checkAllFields()
                ? "bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-indigo-200"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {checkAllFields() ? (
              <>
                Verify & Continue
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              "Enter verification code"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-gray-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Have an account?{" "}
            <Link className="text-gray-600 hover:text-gray-800 font-medium ml-1.5 transition-colors duration-200" to={"/login"}>
              Login
            </Link>
          </p>
        </div>
      </div>
      
   
    </section>
  );
}

export default OtpVerify;
