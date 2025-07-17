import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Contact from '../components/Contact'; // Import your Contact component

function About() {
  // Default store location
  const [storeLocation] = useState({
    name: "Casual Clothing Fashion Headquarters",
    address: "123 Fashion Avenue, New York, NY 10001"
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className='bg-white shadow-sm p-4 mb-6 flex items-center justify-between border-b border-gray-200'>
        <h1 className='text-xl font-bold text-gray-900 font-serif'>About Us</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="bg-gray-900 text-white rounded-lg overflow-hidden mb-12">
          <div className="relative h-64 md:h-80">
            <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80')] bg-cover bg-center"></div>
            <div className="absolute inset-0 flex items-center z-20 p-8 md:p-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Casual Clothing Fashion</h2>
                <p className="text-gray-200 text-lg md:text-xl max-w-2xl">Redefining style with premium quality clothing and accessories for the modern individual.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                Founded in 2020, Casual Clothing Fashion began as a passion project by fashion enthusiasts determined to offer high-quality clothing that doesn't compromise on style or sustainability. What started as a small online boutique has grown into a trusted fashion destination for customers worldwide.
              </p>
              <p className="mb-4">
                Our designs blend contemporary trends with timeless elegance, ensuring that each piece in our collection stands the test of time. We believe in creating clothing that empowers the wearer and celebrates individuality.
              </p>
              <p>
                At Casual Clothing Fashion, sustainability isn't just a buzzword—it's a commitment. We work with ethical manufacturers and use eco-friendly materials whenever possible, reducing our environmental footprint while delivering exceptional quality to our customers.
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality First</h3>
              <p className="text-gray-600">We never compromise on the quality of our materials or craftsmanship, ensuring each piece meets our exacting standards.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Sustainability</h3>
              <p className="text-gray-600">We're committed to reducing our environmental impact through responsible sourcing and ethical production practices.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Inclusive Fashion</h3>
              <p className="text-gray-600">We design for people of all shapes, sizes, and backgrounds, because everyone deserves to feel confident and stylish.</p>
            </div>
          </div>
        </div>

        {/* Our Location */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Visit Our Store</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-96 w-full">
              {/* Google Maps Embed */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343004!2d-74.00880222384068!3d40.71277247132755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a22a3bda30d%3A0xb89d1fe6bc499443!2sDowntown%20Manhattan%2C%20New%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1687330812345!5m2!1sen!2sus"
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
                  <h3 className="text-xl font-semibold mb-4">Store Information</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-gray-900 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Casual Clothing Fashion Flagship Store</p>
                        <p className="text-gray-600">{storeLocation.address}</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaPhone className="text-gray-900 flex-shrink-0" />
                      <p className="text-gray-600">(555) 123-4567</p>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaEnvelope className="text-gray-900 flex-shrink-0" />
                      <p className="text-gray-600">contact@casualclothingfashion.com</p>
                    </li>
                  </ul>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">Store Hours</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600">Monday - Friday</span>
                      <span className="font-medium">10:00 AM - 8:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Saturday</span>
                      <span className="font-medium">10:00 AM - 6:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Sunday</span>
                      <span className="font-medium">11:00 AM - 5:00 PM</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fashion Innovation Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Fashion Innovation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                  alt="Sustainable Fashion" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">Smart Fabric Technology</h3>
                <p className="text-gray-600 mb-4">
                  Our latest collection incorporates temperature-regulating fabrics that keep you comfortable in any weather. These advanced materials wick away moisture and provide breathability while maintaining their luxurious look and feel.
                </p>
                <Link to="/" className="text-gray-900 font-medium hover:underline">Learn more →</Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                  alt="Virtual Fitting Room" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">Virtual Try-On Experience</h3>
                <p className="text-gray-600 mb-4">
                  Experience clothing before you buy with our innovative AR technology. Our virtual fitting room allows you to see how garments will look on your body type, helping you make confident purchasing decisions.
                </p>
                <Link to="/" className="inline-flex items-center justify-center rounded-md border-2 border-gray-900 bg-gray-900 px-6 py-3 text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
                  Try it now →
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Import your Contact component here */}
            <Contact />
          </div>
        </div>
      </div>

      {/* Footer with company info */}
   
    </div>
  );
}

export default About;