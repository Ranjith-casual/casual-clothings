import React from 'react';
import { IoClose } from "react-icons/io5";

const ConfirmBox = ({ cancel, confirm, close }) => {
  return (
    <div className='fixed top-0 bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50'>
      <div className='bg-white w-full max-w-md p-6 rounded-lg shadow-xl border border-gray-100'>
        <div className='flex justify-between items-center gap-3 mb-4'>
          <h1 className='font-bold text-xl text-gray-900 font-serif'>Confirm Deletion</h1>
          <button 
            onClick={close}
            className='text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100'
          >
            <IoClose size={24} />
          </button>
        </div>
        <p className='text-gray-600 leading-relaxed mb-6'>Are you sure you want to permanently delete this item? This action cannot be undone.</p>
        <div className='flex items-center justify-end gap-3'>
          <button
            onClick={cancel}
            className='px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors font-medium'
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className='px-6 py-2 bg-black text-white hover:bg-gray-800 rounded-md transition-colors font-medium tracking-wide'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBox;
