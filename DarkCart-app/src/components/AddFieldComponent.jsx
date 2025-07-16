import React from 'react'
import { IoClose } from "react-icons/io5";

const AddFieldComponent = ({close,value,onChange,submit}) => {
  return (
   <section className='fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex justify-center items-center p-4'>
        <div className='bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-100'>
            <div className='flex items-center justify-between gap-3 mb-4'>
                <h1 className='font-bold text-xl text-gray-900 font-serif'>Add Field</h1>
                <button 
                    onClick={close}
                    className='text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100'
                >
                    <IoClose size={24}/>
                </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">Enter a new field name to add to your collection</p>
            <input
                 className='bg-gray-50 border border-gray-300 p-3 outline-none focus:border-black focus:bg-white rounded-md w-full transition-colors'
                 placeholder='Enter field name'
                 value={value}
                 onChange={onChange}
            />
            <button
                onClick={submit}
                className='bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-md mx-auto w-fit block mt-6 font-semibold tracking-wide transition-colors'
            >Add Field</button>
        </div>
   </section>
  )
}

export default AddFieldComponent