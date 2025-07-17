import React from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaTruck,
  FaUndoAlt,
  FaHeadset,
  FaHeart,
} from "react-icons/fa";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
      {/* Newsletter Section */}
   

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex flex-col">
              <h3 className="font-serif italic text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2 relative">
                <span className="inline-block pr-4 relative z-10 bg-gradient-to-b from-white to-gray-50 font-['Playfair_Display']">About Us</span>
                <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-black"></span>
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed font-['Poppins']">
                Elevating your everyday style with premium casual collections. Where comfort meets sophisticated design.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-serif italic text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2 relative">
              <span className="inline-block pr-4 relative z-10 bg-gradient-to-b from-white to-gray-50 font-['Playfair_Display']">Shop & Explore</span>
              <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-black"></span>
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/search", label: "Shop Now" },
                { to: "/size-guide", label: "Size Guide" },
                { to: "/new-arrivals", label: "New Arrivals" },
              ].map(({ to, label }, idx) => (
                <li key={idx}>
                  <Link to={to} className="text-gray-600 hover:text-black flex items-center transition-all duration-300 group font-['Poppins']">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 group-hover:bg-black group-hover:w-2 transition-all duration-300"></span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-6">
            <h3 className="font-serif italic text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2 relative">
              <span className="inline-block pr-4 relative z-10 bg-gradient-to-b from-white to-gray-50 font-['Playfair_Display']">Customer Care</span>
              <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-black"></span>
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/faq", label: "FAQ" },
                { to: "/shipping-returns", label: "Shipping & Returns" },
                { to: "/dashboard/myorders", label: "My Orders" },
                { to: "/dashboard/profile", label: "My Account" },
              ].map(({ to, label }, idx) => (
                <li key={idx}>
                  <Link to={to} className="text-gray-600 hover:text-black flex items-center transition-all duration-300 group font-['Poppins']">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 group-hover:bg-black group-hover:w-2 transition-all duration-300"></span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="font-serif italic text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2 relative">
              <span className="inline-block pr-4 relative z-10 bg-gradient-to-b from-white to-gray-50 font-['Playfair_Display']">Get in Touch</span>
              <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-black"></span>
            </h3>
            <div className="space-y-4">
              {[
                { icon: FaMapMarkerAlt, text: "Sivsakthi Nagar, 5th Street, Tirupur, Tamil Nadu - 641604" },
                { icon: FaPhone, text: "+91 9442955929" },
                { icon: FaEnvelope, text: "casualclothings2024@gmail.com" },
              ].map(({ icon: Icon, text }, idx) => (
                <div key={idx} className="group flex items-start space-x-3 text-gray-600 hover:text-gray-900 transition-colors duration-300">
                  <div className="p-2 bg-white rounded-md shadow-sm border border-gray-100 flex-shrink-0">
                    <Icon className="text-gray-500 group-hover:text-black transition-colors duration-300" />
                  </div>
                  <span className="text-sm font-['Poppins']">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

   

      {/* Bottom Bar */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500 flex items-center font-['Poppins']">
              <span>© {currentYear} Casual Clothings.</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="flex items-center">
                <span className="mr-1">Made with</span>
                <FaHeart className="text-xs text-gray-400 mx-1" />
                <span>in Tirupur</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
              {["/about", "/privacy-policy", "/terms-conditions", "/sustainability", "/sitemap"].map((link, i) => (
                <Link key={i} to={link} className="hover:text-black transition-colors font-['Poppins']">
                  {link.split("/")[1].replace("-", " ").replace(/^\w/, (c) => c.toUpperCase())}
                </Link>
              ))}
            </div>
          </div>
        
        </div>
      </div>
    </footer>
  );
}

export default Footer;