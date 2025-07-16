import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import { useSelector } from 'react-redux'; // Import useSelector from react-redux
import { baseURL } from '../common/SummaryApi.js';

const MySwal = withReactContent(Swal);

function Contact() {
  const navigate = useNavigate();
  
  // Get user state from Redux store
  const user = useSelector(state => state.user);
  const isLoggedIn = !!user._id; // User is logged in if they have an _id
  
  // Default store location
  const [storeLocation] = useState({
    name: "Casual Clothing Fashion Headquarters",
    address: "123 Fashion Avenue, New York, NY 10001"
  });

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  // Set initial form data from user info if logged in
  useEffect(() => {
    if (isLoggedIn) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || ''
      }));
    }
  }, [isLoggedIn, user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission with authentication check
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!isLoggedIn) {
      // Show login prompt
      const result = await MySwal.fire({
        title: "Authentication Required",
        text: "Please log in to send us a message",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Log in",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#111827",
        cancelButtonColor: "#6B7280",
      });

      // Redirect to login if they click "Log in"
      if (result.isConfirmed) {
        navigate("/login", { 
          state: { from: "/about", returnToForm: true } 
        });
      }
      return; // Stop execution if not logged in
    }

    // Proceed with form submission if logged in
    setIsSubmitting(true);
    setSubmitProgress(0);
    
    // Create a visual progress indicator
    const progressInterval = setInterval(() => {
      setSubmitProgress(prev => Math.min(prev + 5, 90));
    }, 300);

    try {
      console.log("Attempting to send form data:", formData);
      
      // Get token from localStorage or wherever you store it
      const token = localStorage.getItem('token'); // Adjust based on your token storage method
      
      const response = await axios({
        method: 'post',
        url: `${baseURL}/api/contact/send`,
        data: formData,
        timeout: 30000,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Origin": window.location.origin 
        }
      });
      
      clearInterval(progressInterval);
      console.log("Server response:", response);
      
      if (!response.data || response.status !== 200) {
        throw new Error(`Server returned ${response.status}: ${response.statusText || 'Failed to send message'}`);
      }

      // Set to 100% when we're sure the request succeeded
      setSubmitProgress(100);
      
      // Show success message after a small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await MySwal.fire({
        icon: "success",
        title: "Message sent successfully!",
        text: "Thank you for reaching out. We'll get back to you soon.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: "#ffffff",
        color: "#000000"
      });

      // Reset form fields except user info
      setFormData(prev => ({
        ...prev,
        subject: "",
        message: ""
      }));
      
    } catch (error) {
      clearInterval(progressInterval);
      setSubmitProgress(0);
      
      // Handle auth errors
      if (error.response && error.response.status === 401) {
        await MySwal.fire({
          icon: "error",
          title: "Authentication Error",
          text: "Your session has expired. Please log in again.",
          confirmButtonText: "Log In",
          background: "#ffffff",
          color: "#000000"
        });
        navigate("/login");
        return;
      }
      
      const errorMessage = error.code === 'ECONNABORTED' 
        ? "Request timed out. The server might be busy. Please try again later."
        : error.message || "Something went wrong";
      
      console.error("Form submission error:", error);
      
      await MySwal.fire({
        icon: "error",
        title: "Submission failed",
        text: errorMessage,
        confirmButtonText: "Try Again",
        background: "#ffffff",
        color: "#000000"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render contact form with login check
  const renderContactForm = () => (
    <div className="md:w-1/2">
      <h3 className="text-xl font-semibold mb-4">Send Us a Message</h3>
      
      {!isLoggedIn ? (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h4>
          <p className="text-gray-600 mb-6">
            Please log in to send us a message. We value your feedback and will respond promptly.
          </p>
          <Link 
            to="/login"
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800"
          >
            Log In to Continue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-gray-900 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              name="fullName" 
              value={formData.fullName}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              value={formData.email}
              onChange={handleChange} 
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
            <input 
              type="text" 
              id="subject" 
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea 
              id="message" 
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4" 
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
            ></textarea>
          </div>
          
          <div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="relative inline-flex justify-center w-full py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              {/* Progress bar for submission */}
              {isSubmitting && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-gray-400 to-gray-600" 
                  style={{ width: `${submitProgress}%`, transition: 'width 0.3s ease-in-out' }}
                ></div>
              )}
              
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending ({submitProgress}%)...
                </>
              ) : (
                <>
                  Send Message
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-2 -mr-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
          
          {/* User info indicator */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Logged in as {user.name}</span>
          </div>
        </form>
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
     

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="bg-gray-900 text-white rounded-lg overflow-hidden mb-12">
          {/* Hero content (unchanged) */}
        </div>

        {/* Our Story */}
        <div className="mb-16">
          {/* Story content (unchanged) */}
        </div>

        {/* Our Values */}
        <div className="mb-16">
          {/* Values content (unchanged) */}
        </div>

        {/* Our Location */}
        <div className="mb-16">
          {/* Location content (unchanged) */}
        </div>

        {/* Fashion Innovation Section */}
        <div className="mb-16">
          {/* Innovation content (unchanged) */}
        </div>
        
        {/* Contact Form - with Redux-based authentication check */}
        <div className="mb-16">
        
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-[0.03] bg-[length:50px_50px] pointer-events-none"></div>
            
            {/* Animated particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, index) => (
                <div
                  key={index}
                  className="absolute rounded-full"
                  style={{
                    width: Math.random() * 5 + 1,
                    height: Math.random() * 5 + 1,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    background: index % 3 === 0 ? '#333' : index % 3 === 1 ? '#555' : '#777',
                    opacity: Math.random() * 0.3 + 0.1,
                    animation: `float ${Math.random() * 8 + 12}s infinite ease-in-out ${Math.random() * 5}s`,
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-8 relative z-10">
              {/* Contact form with Redux auth check */}
              {renderContactForm()}

              <div className="md:w-1/2">
                <h3 className="text-xl font-semibold mb-4">Connect With Us</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 group">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <FaEnvelope className="h-6 w-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Email</h4>
                      <a 
                        href="mailto:contact@casualclothingfashion.com" 
                        className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
                      >
                        contact@casualclothingfashion.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <FaMapMarkerAlt className="h-6 w-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Location</h4>
                      <p className="text-gray-600">
                        123 Fashion Avenue, New York, NY 10001
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <FaPhone className="h-6 w-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Phone</h4>
                      <p className="text-gray-600">(555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-base mb-3">Follow Us</h4>
                    <div className="flex space-x-4">
                      <a href="#" className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                        <FaFacebookF />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                        <FaTwitter />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
                        <FaInstagram />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Contact;