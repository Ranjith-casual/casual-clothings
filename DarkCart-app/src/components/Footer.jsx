import React from "react";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaYoutube,
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

// ✅ Import the logo image
import Logo from "../assets/Logo/Black_White_Minimalist_Initials_Monogram_Jewelry_Logo-removebg-preview.png";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-200 font-sans">
      {/* Newsletter Section */}
   

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={Logo}
                  alt="Casual Clothings Logo"
                  className="h-14 object-contain hover:opacity-90 transition"
                />
                <p className="text-[8px] uppercase tracking-[0.25em] text-gray-600">
                  F A S H I O N
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed font-light">
              Elevating your everyday style with premium casual collections. Where comfort meets sophisticated design.
            </p>
            <div className="flex flex-wrap gap-3">
              {[FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube].map((Icon, index) => (
                <a key={index} href="#" className="w-9 h-9 bg-white hover:bg-black hover:text-white text-gray-700 rounded-md flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-sm border border-gray-100">
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-serif italic text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2 relative">
              <span className="inline-block pr-4 relative z-10 bg-gradient-to-b from-white to-gray-50">Shop & Explore</span>
              <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-black"></span>
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/search", label: "Shop Now" },
                { to: "/lookbook", label: "Lookbook" },
                { to: "/blog", label: "Blog" },
                { to: "/size-guide", label: "Size Guide" },
                { to: "/new-arrivals", label: "New Arrivals" },
              ].map(({ to, label }, idx) => (
                <li key={idx}>
                  <Link to={to} className="text-gray-600 hover:text-black flex items-center transition-all duration-300 group">
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
              <span className="inline-block pr-4 relative z-10 bg-gradient-to-b from-white to-gray-50">Customer Care</span>
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
                  <Link to={to} className="text-gray-600 hover:text-black flex items-center transition-all duration-300 group">
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
              <span className="inline-block pr-4 relative z-10 bg-gradient-to-b from-white to-gray-50">Get in Touch</span>
              <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-black"></span>
            </h3>
            <div className="space-y-4">
              {[
                { icon: FaMapMarkerAlt, text: "123 Fashion Street, Style City, SC 12345" },
                { icon: FaPhone, text: "+1 (555) 123-4567" },
                { icon: FaEnvelope, text: "support@casualclothings.com" },
              ].map(({ icon: Icon, text }, idx) => (
                <div key={idx} className="group flex items-start space-x-3 text-gray-600 hover:text-gray-900 transition-colors duration-300">
                  <div className="p-2 bg-white rounded-md shadow-sm border border-gray-100 flex-shrink-0">
                    <Icon className="text-gray-500 group-hover:text-black transition-colors duration-300" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: FaTruck, title: "Free Shipping", subtitle: "On orders over $50" },
              { icon: FaUndoAlt, title: "Easy Returns", subtitle: "30-day return policy" },
              { icon: FaShieldAlt, title: "Secure Shopping", subtitle: "100% secure payment" },
              { icon: FaHeadset, title: "Dedicated Support", subtitle: "24/7 customer service" },
            ].map(({ icon: Icon, title, subtitle }, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                  <Icon className="text-xl text-gray-700" />
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500 flex items-center">
              <span>© {currentYear} Casual Clothings.</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="flex items-center">
                <span className="mr-1">Made with</span>
                <FaHeart className="text-xs text-gray-400 mx-1" />
                <span>in Style City</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
              {["/about", "/privacy-policy", "/terms-conditions", "/sustainability", "/careers", "/sitemap"].map((link, i) => (
                <Link key={i} to={link} className="hover:text-black transition-colors">
                  {link.split("/")[1].replace("-", " ").replace(/^\w/, (c) => c.toUpperCase())}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <div className="flex justify-center space-x-3">
              {[
                { src: "https://cdn-icons-png.flaticon.com/512/196/196566.png", alt: "Visa" },
                { src: "https://cdn-icons-png.flaticon.com/512/196/196561.png", alt: "Mastercard" },
                { src: "https://cdn-icons-png.flaticon.com/512/196/196565.png", alt: "PayPal" },
                { src: "https://cdn-icons-png.flaticon.com/512/196/196539.png", alt: "Apple Pay" },
              ].map(({ src, alt }, idx) => (
                <img key={idx} src={src} alt={alt} className="h-6 w-auto opacity-50 hover:opacity-100 transition-opacity" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;