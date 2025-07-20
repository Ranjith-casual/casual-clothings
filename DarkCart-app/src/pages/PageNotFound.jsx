import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaSearch, FaExclamationTriangle } from 'react-icons/fa';

const PageNotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <FaExclamationTriangle className="mx-auto text-6xl text-yellow-500 mb-4" />
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <FaHome />
            Go Back Home
          </Link>
          
          <Link
            to="/search"
            className="w-full bg-white text-gray-700 py-3 px-6 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <FaSearch />
            Search Products
          </Link>
        </div>

        {/* Help Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Need help? Try these links:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/about" className="text-gray-600 hover:text-gray-900">
              About Us
            </Link>
            <Link to="/faq" className="text-gray-600 hover:text-gray-900">
              FAQ
            </Link>
            <Link to="/dashboard/profile" className="text-gray-600 hover:text-gray-900">
              My Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;