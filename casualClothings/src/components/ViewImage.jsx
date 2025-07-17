import React from "react";
import { IoClose } from "react-icons/io5";

const ViewImage = ({ url, close }) => {
  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">Image Preview</h3>
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Image container */}
        <div className="flex items-center justify-center p-6 bg-gray-50 min-h-[400px]">
          <img
            src={url}
            alt="Product preview"
            className="max-w-full max-h-[70vh] object-contain rounded-md shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default ViewImage;
