import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Contact from '../components/Contact'; // Import your Contact component

function About() {
  // Default store location

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-2xl font-medium text-gray-900 mb-6 font-['Playfair_Display']">Our Story</h2>
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4 font-['Poppins']">
                Founded in 2024, Casual Clothings began as a vision of our founder and CEO, Ranjith P, who has over a year of experience in the fashion industry. What started as a small t-shirt shop in Tirupur has evolved into a beloved brand known for its exceptional quality and contemporary designs.
              </p>
              <p className="mb-4 font-['Poppins']">
                We specialize exclusively in high-quality t-shirts for men, women, and kids, focusing on comfort without compromising style. Our signature collections feature premium cotton fabrics that are soft on the skin and durable for everyday wear.
              </p>
              <p className="font-['Poppins']">
                At Casual Clothings, we believe that the perfect t-shirt is an essential part of any wardrobe. We take pride in our craftsmanship, attention to detail, and commitment to creating t-shirts that our customers love to wear day after day.
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-medium text-gray-900 mb-6 font-['Playfair_Display']">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-3 font-['Poppins']">Premium Quality</h3>
              <p className="text-gray-600 font-['Poppins']">We use only the finest cotton and materials in our t-shirts, ensuring comfort, durability, and style with every piece we create.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-3 font-['Poppins']">Tirupur Craftsmanship</h3>
              <p className="text-gray-600 font-['Poppins']">Based in Tirupur, the knitwear capital of India, we leverage local expertise and skilled artisans to create exceptional t-shirts for our customers.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-3 font-['Poppins']">Family Fashion</h3>
              <p className="text-gray-600 font-['Poppins']">We design t-shirts for everyone in the family - men, women, and kids - ensuring that comfort and style are accessible to all ages and sizes.</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-medium text-gray-900 mb-6 font-['Playfair_Display']">Get In Touch</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Import your Contact component here */}
            <Contact />
          </div>
        </div>

        {/* Our Location */}
        <div className="mb-16">
          <h2 className="text-2xl font-medium text-gray-900 mb-6 font-['Playfair_Display']">Visit Our Store</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-96 w-full">
              {/* Google Maps Embed - Updated to Tirupur location */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31476.201357758112!2d77.31685599999999!3d11.10629975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba907e71d5e0e4d%3A0x9d736c23442c8005!2sTiruppur%2C%20Tamil%20Nadu%2C%20India!5e0!3m2!1sen!2sus!4v1687330812345!5m2!1sen!2sus"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
              ></iframe>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-medium mb-4 font-['Playfair_Display']">Store Information</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-gray-900 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium font-['Poppins']">Casual Clothings Flagship Store</p>
                        <p className="text-gray-600 font-['Poppins']">Sivsakthi Nagar, 5th Street, Tirupur, Tamil Nadu - 641604</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaPhone className="text-gray-900 flex-shrink-0" />
                      <p className="text-gray-600 font-['Poppins']">(+91) 98765-43210</p>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaEnvelope className="text-gray-900 flex-shrink-0" />
                      <p className="text-gray-600 font-['Poppins']">contact@casualclothings.com</p>
                    </li>
                  </ul>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-medium mb-4 font-['Playfair_Display']">Store Hours</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600 font-['Poppins']">Monday - Saturday</span>
                      <span className="font-medium font-['Poppins']">10:00 AM - 8:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 font-['Poppins']">Sunday</span>
                      <span className="font-medium font-['Poppins']">11:00 AM - 5:00 PM</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* T-Shirt Innovation Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-medium text-gray-900 mb-6 font-['Playfair_Display']">T-Shirt Innovation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                  alt="Premium T-Shirt Fabrics" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-3 font-['Poppins']">Premium Cotton Technology</h3>
                <p className="text-gray-600 mb-4 font-['Poppins']">
                  Our t-shirts are crafted with ultra-soft, breathable cotton that provides exceptional comfort in all weather conditions. Our unique finishing process ensures these t-shirts maintain their shape and color even after multiple washes.
                </p>
                <Link to="/search" className="text-gray-900 font-medium hover:underline font-['Poppins']">Shop collection →</Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                  alt="Custom T-Shirt Design" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-3 font-['Poppins']">Custom Design Experience</h3>
                <p className="text-gray-600 mb-4 font-['Poppins']">
                  Create your perfect t-shirt with our custom design tool. Choose from various styles, colors, and add your personal touch. We offer customization options for individuals and bulk orders for groups, events, or businesses.
                </p>
                <Link to="/search" className="inline-flex items-center justify-center rounded-md border-2 border-gray-900 bg-gray-900 px-6 py-3 text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 font-['Poppins']">
                  Explore now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with company info */}
   
    </div>
  );
}

export default About;