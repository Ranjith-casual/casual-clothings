import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Success = () => {

    const loaction = useLocation();
    const det = loaction.state?.text || "Payment";
    const navigate = useNavigate();
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md bg-white p-6 rounded-lg shadow-xl border border-gray-200 flex flex-col gap-6 items-center justify-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2'>
                <svg className='w-8 h-8 text-green-600' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <div className='text-center'>
                <h2 className='text-xl font-bold text-gray-900 font-serif mb-2'>{det} Successful</h2>
                <p className='text-gray-600'>Your request has been completed successfully</p>
            </div>
            <button 
                onClick={() => navigate("/")} 
                className='bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium tracking-wide w-full'
            >
                Continue Shopping
            </button>
        </div>
    </div>
  )
}

export default Success