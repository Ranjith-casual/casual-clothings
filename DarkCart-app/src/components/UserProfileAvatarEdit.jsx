import React, { useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import Axios from "../utils/Axios.js";
import SummaryApi from "../common/SummaryApi";
import AxiosTostError from "../utils/AxiosTostError.js";
import { updateAvatar } from "../store/userSlice.js";
import { IoClose } from "react-icons/io5";

function UserProfileAvatarEdit({ close }) {
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.uploadAvatar,
        data: formData,
      });
      const { data: responseData } = response;
      dispatch(updateAvatar(responseData.data.avatar));
    } catch (error) {
      AxiosTostError(error);
    } finally {
      setLoading(false);
      console.log(response);
    }
  };

  return (
    <section className="fixed top-0 left-0 right-0 bottom-0 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center z-50">
      <div className="bg-white max-w-sm w-full rounded-lg p-6 flex flex-col justify-center items-center gap-4 shadow-xl border border-gray-100">
        {/* Close Button */}
        <button
          className="ml-auto text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
          onClick={close}
        >
          <IoClose size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-2">
          <h3 className="font-bold text-lg text-gray-900 font-serif">
            Profile Photo
          </h3>
          <p className="text-gray-600 text-sm">Upload your profile picture</p>
        </div>

        {/* Profile Avatar */}
        <div className="w-24 h-24 bg-gray-200 rounded-full flex justify-center items-center overflow-hidden border-4 border-gray-100 shadow-sm">
          {user.avatar ? (
            <img
              alt={user.name}
              src={user.avatar}
              className="h-full w-full object-cover"
            />
          ) : (
            <FaRegUserCircle size={65} className="text-gray-400" />
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <label htmlFor="uploadAvatar" className="block">
            <div className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-md cursor-pointer font-medium tracking-wide transition-colors text-center">
              {loading ? "Uploading..." : "Upload Photo"}
            </div>
          </label>
          <input
            type="file"
            id="uploadAvatar"
            className="hidden"
            onChange={handleUploadAvatar}
            accept="image/*"
          />
        </form>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Recommended: Square image, at least 200x200px
        </p>
      </div>
    </section>
  );
}

export default UserProfileAvatarEdit;
