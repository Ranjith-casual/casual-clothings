import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Divider from './Divider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { logout } from '../store/userSlice'
import toast from 'react-hot-toast'
import AxiosTostError from '../utils/AxiosTostError'
import isAdmin from '../utils/isAdmin'

function UserMenue({close}) {
    const user = useSelector((state)=> state?.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [showAdminOptions, setShowAdminOptions] = useState(false)

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
        <div className="bg-white rounded-lg">
            {/* User Info Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
                <div>
                    <h3 className="font-semibold text-gray-900">My Account</h3>
                    <p className="text-sm text-gray-600 truncate max-w-[180px]">
                        {user?.name || user?.email}
                    </p>
                    {user.role === "ADMIN" && (
                        <span className="text-xs bg-black text-white px-2 py-1 rounded-full font-medium mt-1 inline-block">
                            Admin
                        </span>
                    )}
                </div>
                <Link to={"/dashboard/profile"} onClick={handleClose} className='text-gray-400 hover:text-black transition-colors'>
                    View Profile
                </Link>
            </div>

            <Divider/>

            {/* Regular User Menu - Always show for all users */}
            <div className='text-sm grid gap-1'>
                <Link onClick={handleClose} to="/dashboard/myorders" className='flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors'>
                    <span>My Orders</span>
                </Link>
                <Link onClick={handleClose} to="/dashboard/address" className='flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors'>
                    <span>Saved Addresses</span>
                </Link>
            </div>

            {/* Admin Section - Additional option for admin users */}
            {isAdmin(user.role) && (
                <>
                    <Divider/>
                    <div className="px-3 py-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Admin Panel
                        </span>
                    </div>
                    <div className='text-sm grid gap-1'>
                        <div className="flex items-center justify-between">
                            <Link 
                                onClick={handleClose} 
                                to="/dashboard/admin" 
                                className='flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors flex-grow text-left'
                            >
                                <span className="font-medium">Admin Dashboard</span>
                            </Link>
                            <button 
                                onClick={() => setShowAdminOptions(!showAdminOptions)} 
                                className='p-3 hover:bg-gray-50 transition-colors'
                                aria-label="Toggle admin options"
                            >
                                <svg 
                                    className={`w-4 h-4 transition-transform duration-200 ${showAdminOptions ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                        </div>
                        
                        {showAdminOptions && (
                            <div className='ml-4 border-l-2 border-gray-200 pl-3 space-y-1'>
                                <Link onClick={handleClose} to="/dashboard/category" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    Categories
                                </Link>
                                <Link onClick={handleClose} to="/dashboard/product" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    Products
                                </Link>
                                <Link onClick={handleClose} to="/dashboard/upload-product" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    Upload Product
                                </Link>
                                <Link onClick={handleClose} to="/dashboard/orders-admin" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    Orders Management
                                </Link>
                                <Link onClick={handleClose} to="/dashboard/bundle-admin" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    Bundle Management
                                </Link>
                                <Link onClick={handleClose} to="/dashboard/user-management" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    User Management
                                </Link>
                                <Link onClick={handleClose} to="/dashboard/payment-management" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    Payments & Transactions
                                </Link>
                                <Link onClick={handleClose} to="/dashboard/cancellation-management" className='block p-2 hover:bg-gray-50 transition-colors rounded text-gray-600 hover:text-black'>
                                    Cancellation Management
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Divider/>

            {/* Logout Button */}
            <div className="p-2">
                <button onClick={handleLogOut} className='flex items-center gap-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-md transition-colors'>
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    )
}

export default UserMenue