import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import isAdmin from '../utils/isAdmin'
import { Link } from 'react-router-dom'
import fetchUserDetails from '../utils/FetchUserInfo'

const AdminPermission = ({children}) => {
    const user = useSelector(state => state.user)
    const [isLoading, setIsLoading] = useState(true)
    const [authChecked, setAuthChecked] = useState(false)
    const [hasAccess, setHasAccess] = useState(false)
    
    // Check if we have user data already
    useEffect(() => {
        const checkAuth = async () => {
            console.log("Checking auth with user:", user);
            
            // If we have a user ID but no role or empty role, try refreshing user data
            if (user._id && !user.role) {
                try {
                    console.log("User ID exists but no role, refreshing user data");
                    const accessToken = localStorage.getItem("accessToken");
                    if (accessToken) {
                        const userData = await fetchUserDetails();
                        if (userData?.data) {
                            console.log("Refreshed user data:", userData.data);
                            // The refreshed data will update Redux via App.jsx
                            // We'll check again in the next effect run
                        }
                    }
                } catch (error) {
                    console.error("Error refreshing user data:", error);
                }
            } else {
                // We either have complete user data or no user at all
                const adminAccess = isAdmin(user.role);
                console.log("Auth check complete - User role:", user.role, "Has admin access:", adminAccess);
                setHasAccess(adminAccess);
                setAuthChecked(true);
                setIsLoading(false);
            }
        };
        
        checkAuth();
    }, [user._id, user.role]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // Ensure we return the children if user is admin
    if (hasAccess) {
        return children;
    }
    
    // Otherwise show access denied
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="text-red-500 text-5xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
                <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200">
                    Return Home
                </Link>
            </div>
        </div>
    );
}

export default AdminPermission