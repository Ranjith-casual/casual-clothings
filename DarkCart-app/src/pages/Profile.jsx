import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaRegUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import SummaryApi from "../common/SummaryApi";
import UserProfileAvatarEdit from "../components/UserProfileAvatarEdit";
import Axios from "../utils/Axios";
import AxiosTostError from "../utils/AxiosTostError";
import toast from "react-hot-toast";
import FetchUserInfo from "../utils/FetchUserInfo";
import { setUserDetails } from "../store/userSlice";

function Profile() {
  const user = useSelector((state) => state.user);
  const [openProfileAvatarEdit, setProfileAvatarEdit] = useState(false);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: user.name,
    email: user.email,
    mobile: user.mobile,
  });

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setUserData((pre) => {
      return {
        ...pre,
        [name]: value,
      };
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.UpdateUser,
        data: userData,
      });

      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        const response = await FetchUserInfo();
        dispatch(setUserDetails(response.data));
      }
    } catch (error) {
      AxiosTostError(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setUserData({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    });
  }, [user]);
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 font-serif mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex justify-center items-center overflow-hidden border-4 border-gray-100 shadow-sm mb-4">
              {user.avatar ? (
                <img
                  alt={user.name}
                  src={user.avatar}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaRegUserCircle size={80} className="text-gray-400" />
              )}
            </div>
            <button
              onClick={() => {
                setProfileAvatarEdit(true);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Change Photo
            </button>
          </div>

          {openProfileAvatarEdit && (
            <UserProfileAvatarEdit close={() => setProfileAvatarEdit(false)} />
          )}

          {/* User info form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className="w-full bg-gray-50 p-3 border border-gray-300 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
                name="name"
                value={userData.name}
                onChange={handleOnChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="w-full bg-gray-50 p-3 border border-gray-300 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
                name="email"
                value={userData.email}
                onChange={handleOnChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="mobile"
                className="font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                id="mobile"
                type="text"
                placeholder="Enter your phone number"
                className="w-full bg-gray-50 p-3 border border-gray-300 rounded-md outline-none focus:border-black focus:bg-white transition-colors"
                name="mobile"
                value={userData.mobile}
                onChange={handleOnChange}
                required
              />
            </div>

            <button className="w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-semibold tracking-wide mt-8">
              {loading ? "Updating Profile..." : "Update Profile"}
            </button>
          </form>

          {/* Profile Navigation Links */}
          
        </div>
      </div>
    </div>
  );
}

export default Profile;
