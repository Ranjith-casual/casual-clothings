import React, { useState, useEffect } from 'react';
import StockManagement from '../components/admin/StockManagement';
import { useSelector } from 'react-redux';
import isAdmin from '../utils/isAdmin';
import { Link } from 'react-router-dom';

const StockManagementPage = () => {
  // Check if user has admin privileges
  const user = useSelector(state => state.user);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  
  useEffect(() => {
    // Wait for user data to be fully loaded
    if (user) {
      console.log("StockManagementPage - User role:", user.role);
      const adminCheck = isAdmin(user.role);
      console.log("StockManagementPage - Has admin access:", adminCheck);
      setHasAdminAccess(adminCheck);
      setLoading(false);
    }
  }, [user, user.role]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory management...</p>
        </div>
      </div>
    );
  }

  // If not admin, show access denied
  if (!hasAdminAccess) {
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

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Inventory Management System</h1>
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
        <h2 className="text-lg font-medium text-blue-800">Size-Specific Stock Management</h2>
        <p className="text-blue-600">Manage your inventory levels by product size. Track and update stock for each size separately.</p>
      </div>
      
      <StockManagement />
    </div>
  );
};

export default StockManagementPage;
