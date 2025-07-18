import React from 'react'
import { IoClose } from "react-icons/io5";

const AddFieldComponent = ({close,value,onChange,submit}) => {
  return (
   <section className='fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex justify-center items-center p-4 font-sans'>
        <div className='bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-fadeIn m-4 sm:m-0'>
            <div className='flex items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3'>
                <h1 className='font-bold text-xl md:text-2xl text-gray-900 font-sans tracking-tight'>Add Field</h1>
                <button 
                    onClick={close}
                    className='text-gray-400 hover:text-gray-800 transition-all p-1.5 rounded-full hover:bg-gray-100 hover:rotate-90 duration-300'
                    aria-label="Close"
                >
                    <IoClose size={24}/>
                </button>
            </div>
            <p className="text-gray-600 text-sm md:text-base mb-5">Enter a new field name to add to your collection</p>
            <input
                 className='bg-gray-50 border border-gray-300 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-md w-full transition-all shadow-sm font-sans'
                 placeholder='Enter field name'
                 value={value}
                 onChange={onChange}
            />
            <button
                onClick={submit}
                className='bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-md mx-auto w-fit block mt-7 font-semibold tracking-wider transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-base sm:text-lg font-sans'
            >Add Field</button>
        </div>
   </section>
  )
}

export default AddFieldComponent