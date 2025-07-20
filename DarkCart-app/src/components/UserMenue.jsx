import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Divider from './Divider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { logout } from '../store/userSlice'
import { clearCart } from '../store/cartProduct'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import isAdmin from '../utils/isAdmin'

function UserMenue({close}) {
    const user = useSelector((state)=> state?.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [showAdminOptions, setShowAdminOptions] = useState(false)
    
    // Add Poppins font
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    const handleLogOut = async()=>{
        try {
            const response = await Axios({...SummaryApi.userLogOut})
            console.log("Logout Response:",response)
            if(response.data.success){
                if(close){
                    close()
                }
                toast.success("Logged out successfully")
                dispatch(logout())
                dispatch(clearCart())
                localStorage.clear()
                navigate("/")
            }
        } catch (error) {
            AxiosTostError(error)       
        }
    }

    const handleClose = () =>{
        if(close){
            close()
        }
    }

    return (
        <div className="bg-transparent font-['Poppins',sans-serif] w-full transition-all duration-300">
            {/* User Info Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">My Account</h3>
                    <p className="text-sm text-gray-600 truncate">
                        {user?.name || user?.email}
                    </p>
                    {user.role === "ADMIN" && (
                        <span className="text-xs bg-black text-white px-2.5 py-1 rounded-full font-medium mt-1.5 inline-block shadow-sm">
                            Admin
                        </span>
                    )}
                </div>
                <Link to={"/dashboard/profile"} onClick={handleClose} className='flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-all font-medium'>
                    Profile
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </Link>
            </div>

            {/* User Menu Links */}
            <div className='space-y-1 mb-6'>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">User Options</h4>
                <Link onClick={handleClose} to="/dashboard/myorders" className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-all group w-full'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium group-hover:text-gray-900">My Orders</span>
                </Link>
                <Link onClick={handleClose} to="/dashboard/myrefunds" className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-all group w-full'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium group-hover:text-gray-900">Cancellations & Refunds</span>
                </Link>
             
                <Link onClick={handleClose} to="/dashboard/address" className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-all group w-full'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium group-hover:text-gray-900">Saved Addresses</span>
                </Link>
            </div>

            {/* Admin Section - Additional option for admin users */}
            {isAdmin(user.role) && (
                <div className="space-y-1 mb-6">
                    <div className="flex items-center justify-between px-3 py-2">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Admin Panel
                        </h4>
                        <button 
                            onClick={() => setShowAdminOptions(!showAdminOptions)} 
                            className='p-2 hover:bg-gray-100 rounded-full transition-all'
                            aria-label="Toggle admin options"
                        >
                            <svg 
                                className={`w-4 h-4 text-gray-700 transition-transform duration-300 ${showAdminOptions ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    </div>

                    <Link 
                        onClick={handleClose} 
                        to="/dashboard/admin" 
                        className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-all group w-full'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="font-medium">Admin Dashboard</span>
                    </Link>
                    
                    {showAdminOptions && (
                        <div className='ml-4 border-l-2 border-gray-200 pl-3 space-y-1 py-2'>
                            <Link onClick={handleClose} to="/dashboard/category" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Categories</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/product" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Products</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/upload-product" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Upload Product</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/orders-admin" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Orders Management</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/bundle-admin" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Bundle Management</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/user-management" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">User Management</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/payment-management" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Payments & Transactions</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/cancellation-management" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Cancellation Management</span>
                            </Link>
                            <Link onClick={handleClose} to="/dashboard/refund-management" className='flex items-center gap-2 p-2 hover:bg-gray-100 transition-all rounded-lg text-gray-700 hover:text-gray-900'>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span className="font-medium">Refund Management</span>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-200">
                <button onClick={handleLogOut} className='flex items-center justify-center gap-2 w-full p-3 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-300 font-medium bg-red-50 hover:shadow-md'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}

export default UserMenue