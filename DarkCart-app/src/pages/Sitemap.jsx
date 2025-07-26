import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaShoppingBag, FaUser, FaEnvelope, FaInfoCircle, FaShieldAlt, FaFileContract, FaTshirt, FaLeaf, FaQuestionCircle, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';

function Sitemap() {
  const sitemapSections = [
    {
      title: 'Main Pages',
      icon: FaHome,
      links: [
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About Us' },
        { to: '/contact', label: 'Contact Us' },
        { to: '/search', label: 'All Products' },
      ]
    },
    {
      title: 'Shopping & Products',
      icon: FaShoppingBag,
      links: [
        { to: '/search', label: 'Shop Now' },
        { to: '/category', label: 'Categories' },
        { to: '/custom-tshirt', label: 'Custom T-Shirt Requests' },
        { to: '/size-guide', label: 'Size Guide' },
      ]
    },
    {
      title: 'User Account',
      icon: FaUser,
      links: [
        { to: '/login', label: 'Sign In' },
        { to: '/register', label: 'Create Account' },
        { to: '/forgot-password', label: 'Forgot Password' },
        { to: '/dashboard', label: 'My Account Dashboard' },
        { to: '/dashboard/profile', label: 'Profile Settings' },
        { to: '/dashboard/orders', label: 'Order History' },
        { to: '/dashboard/address', label: 'Manage Addresses' },
        { to: '/dashboard/wishlist', label: 'Wishlist' },
      ]
    },
    {
      title: 'Policies & Legal',
      icon: FaShieldAlt,
      links: [
        { to: '/privacy-policy', label: 'Privacy Policy' },
        { to: '/terms-conditions', label: 'Terms & Conditions' },
        { to: '/shipping-returns', label: 'Shipping & Returns' },
        { to: '/cookie-policy', label: 'Cookie Policy' },
      ]
    },
    {
      title: 'Support & Information',
      icon: FaQuestionCircle,
      links: [
        { to: '/faq', label: 'Frequently Asked Questions' },
        { to: '/sustainability', label: 'Sustainability' },
        { to: '/size-guide', label: 'Size Guide' },
        { to: '/care-instructions', label: 'Care Instructions' },
      ]
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-3 sm:p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-lg sm:text-xl font-bold text-gray-900 font-["Playfair_Display"]'>Sitemap</h1>
        <nav className="text-sm text-gray-500 font-['Poppins']">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <span>Sitemap</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-2xl text-gray-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 font-['Playfair_Display']">
                Website Sitemap
              </h2>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-['Poppins']">
                Navigate through all pages and sections of our website. Find exactly what you're looking for 
                with our comprehensive site directory.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900 font-['Playfair_Display']">25+</div>
                <div className="text-xs sm:text-sm text-gray-500 font-['Poppins']">Total Pages</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900 font-['Playfair_Display']">5</div>
                <div className="text-xs sm:text-sm text-gray-500 font-['Poppins']">Main Categories</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900 font-['Playfair_Display']">100%</div>
                <div className="text-xs sm:text-sm text-gray-500 font-['Poppins']">Mobile Friendly</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-gray-900 font-['Playfair_Display']">24/7</div>
                <div className="text-xs sm:text-sm text-gray-500 font-['Poppins']">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sitemap Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sitemapSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <section.icon className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-['Playfair_Display']">
                    {section.title}
                  </h3>
                </div>
              </div>
              
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-2">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      to={link.to}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:bg-black transition-colors duration-200"></div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-black font-['Poppins']">
                          {link.label}
                        </span>
                      </div>
                      <svg 
                        className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors duration-200" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-['Playfair_Display']">
              Need Help Finding Something?
            </h3>
            <p className="text-gray-600 text-sm mb-4 font-['Poppins']">
              Can't find what you're looking for? Our customer service team is here to help you navigate our website.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-['Poppins'] text-sm"
              >
                <FaEnvelope className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
              <Link 
                to="/faq" 
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-['Poppins'] text-sm"
              >
                <FaQuestionCircle className="w-4 h-4 mr-2" />
                View FAQ
              </Link>
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white rounded-lg shadow-sm p-5 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-['Playfair_Display']">
              Quick Access
            </h3>
            <p className="text-gray-600 text-sm mb-4 font-['Poppins']">
              Jump to the most popular sections of our website.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/search', label: 'Shop Now', icon: FaShoppingBag },
                { to: '/custom-tshirt', label: 'Custom Design', icon: FaTshirt },
                { to: '/dashboard', label: 'My Account', icon: FaUser },
                { to: '/contact', label: 'Contact Us', icon: FaEnvelope }
              ].map((quickLink, index) => (
                <Link
                  key={index}
                  to={quickLink.to}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <quickLink.icon className="w-4 h-4 text-gray-400 group-hover:text-black" />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-black font-['Poppins']">
                    {quickLink.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-xs sm:text-sm text-gray-500 mt-8 font-['Poppins']">
          <p>Sitemap last updated: July 26, 2025</p>
        </div>
      </div>
    </div>
  );
}

export default Sitemap;
