import React, { useState, useRef, useEffect } from 'react';
import { FaCloudUploadAlt, FaTshirt, FaWhatsapp, FaPhone, FaEnvelope, FaUser, FaPalette, FaRuler, FaCalendarAlt, FaFileImage, FaUpload, FaMinus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CustomTshirtRequest = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state?.user);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [genderImageLoading, setGenderImageLoading] = useState({});

  // Check if user is authenticated
  useEffect(() => {
    if (!user?._id) {
      toast.error('Please login to create a custom t-shirt request');
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.mobile || '',
    tshirtType: '',
    color: '',
    size: '',
    designDescription: '',
    uploadedImage: '',
    preferredDeliveryDate: '',
    genders: [],
    genderImages: {}
  });

  const tshirtTypes = [
    'Round Neck',
    'V-Neck', 
    'Polo',
    'Hoodie',
    'Tank Top',
    'Long Sleeve'
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const colors = [
    'Black', 'White', 'Navy Blue', 'Royal Blue', 'Red', 'Green', 'Yellow', 
    'Orange', 'Purple', 'Pink', 'Gray', 'Maroon', 'Olive', 'Cyan'
  ];

  const genderOptions = ['Men', 'Women', 'Kids', 'Unisex'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenderChange = (gender) => {
    setFormData(prev => {
      const updatedGenders = prev.genders.includes(gender)
        ? prev.genders.filter(g => g !== gender)
        : [...prev.genders, gender];
      
      // Remove image if gender is deselected
      const updatedGenderImages = { ...prev.genderImages };
      if (!updatedGenders.includes(gender)) {
        delete updatedGenderImages[gender];
      }
      
      return {
        ...prev,
        genders: updatedGenders,
        genderImages: updatedGenderImages
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    try {
      const response = await uploadImage(file);
      console.log('Upload response:', response); // Debug log
      
      // Handle different response structures
      let imageUrl;
      if (response?.data?.data?.url) {
        imageUrl = response.data.data.url;
      } else if (response?.data?.url) {
        imageUrl = response.data.url;
      } else if (response?.url) {
        imageUrl = response.url;
      } else {
        throw new Error('Invalid response structure');
      }

      setFormData(prev => ({
        ...prev,
        uploadedImage: imageUrl
      }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      console.error('Image upload error:', error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenderImageUpload = async (e, gender) => {
    const file = e.target.files[0];
    if (!file) return;

    setGenderImageLoading(prev => ({ ...prev, [gender]: true }));
    try {
      const response = await uploadImage(file);
      console.log('Upload response:', response); // Debug log
      
      // Handle different response structures
      let imageUrl;
      if (response?.data?.data?.url) {
        imageUrl = response.data.data.url;
      } else if (response?.data?.url) {
        imageUrl = response.data.url;
      } else if (response?.url) {
        imageUrl = response.url;
      } else {
        throw new Error('Invalid response structure');
      }

      setFormData(prev => ({
        ...prev,
        genderImages: {
          ...prev.genderImages,
          [gender]: imageUrl
        }
      }));
      toast.success(`${gender} design image uploaded successfully!`);
    } catch (error) {
      toast.error(`Failed to upload ${gender} image. Please try again.`);
      console.error('Image upload error:', error);
    } finally {
      setGenderImageLoading(prev => ({ ...prev, [gender]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'tshirtType', 'color', 'size', 'designDescription', 'preferredDeliveryDate'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate gender selection
    if (formData.genders.length === 0) {
      toast.error('Please select at least one gender option');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone number
    const phoneValue = formData.phone?.toString() || '';
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneValue.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate delivery date
    const selectedDate = new Date(formData.preferredDeliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate <= today) {
      toast.error('Delivery date must be at least 1 day in the future');
      return;
    }

    setLoading(true);
    try {
      // Prepare data with proper structure for backend
      const requestData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        tshirtType: formData.tshirtType,
        color: formData.color,
        size: formData.size,
        designDescription: formData.designDescription,
        uploadedImage: formData.uploadedImage,
        preferredDeliveryDate: formData.preferredDeliveryDate,
        genders: formData.genders,
        genderImages: formData.genderImages
      };

      console.log('Submitting request data:', requestData);
      console.log('User info:', user);

      const response = await Axios({
        ...SummaryApi.createCustomTshirtRequest,
        data: requestData
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        toast.success('Custom t-shirt request submitted successfully!');
        
        setTimeout(() => {
          toast.success('Your request has been saved to your account. Redirecting to My Custom T-Shirts...', {
            duration: 3000
          });
        }, 1000);
        
        setTimeout(() => {
          navigate('/dashboard/my-custom-tshirts');
        }, 2500);
      }
    } catch (error) {
      console.error('Request submission error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = '+919876543210'; // Replace with your business WhatsApp number
    const message = 'Hi! I would like to know more about custom t-shirt services.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <FaTshirt className="text-4xl text-black" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-serif">
              Customize Your T-Shirt
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
            Create your unique design with our premium customization service. From concept to creation, we bring your vision to life.
          </p>
          
          {/* User Account Notice */}
          {user?._id ? (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-green-800">
                ✓ You're logged in as <strong>{user.name}</strong>. Your request will be saved to your account for easy tracking.
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> <a href="/login" className="underline hover:text-blue-900">Sign in</a> to save your requests to your account for easy tracking.
              </p>
            </div>
          )}
          
          {/* WhatsApp Contact Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openWhatsApp}
            className="mt-6 inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg"
          >
            <FaWhatsapp className="text-xl" />
            Quick WhatsApp Inquiry
          </motion.button>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaUser className="text-black" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </div>

              {/* T-Shirt Specifications */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaTshirt className="text-black" />
                  T-Shirt Specifications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      T-Shirt Type *
                    </label>
                    <input
                      type="text"
                      name="tshirtType"
                      value={formData.tshirtType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="e.g., Round Neck, V-Neck, Polo, Hoodie, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Popular: Round Neck, V-Neck, Polo, Hoodie, Tank Top, Long Sleeve
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color *
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="e.g., Black, White, Navy Blue, Custom color"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Popular: Black, White, Navy Blue, Red, Green, Yellow, Pink, Gray
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size *
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="e.g., XS, S, M, L, XL, XXL, Custom size"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Standard: XS, S, M, L, XL, XXL, XXXL or specify custom measurements
                    </p>
                  </div>
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaUser className="text-black" />
                  Gender Options *
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {genderOptions.map(gender => (
                      <label
                        key={gender}
                        className={`cursor-pointer p-4 border-2 rounded-lg transition-all text-center font-medium ${
                          formData.genders.includes(gender)
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.genders.includes(gender)}
                          onChange={() => handleGenderChange(gender)}
                          className="sr-only"
                        />
                        {gender}
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Select one or more gender options for your custom t-shirt design
                  </p>
                </div>
              </div>

              {/* Gender-specific Image Uploads */}
              {formData.genders.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <FaFileImage className="text-black" />
                    Design Images for Selected Genders
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.genders.map(gender => (
                      <div key={gender} className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          {gender} Design Image (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                          {formData.genderImages[gender] ? (
                            <div className="space-y-3">
                              <img 
                                src={formData.genderImages[gender]} 
                                alt={`${gender} design`} 
                                className="mx-auto max-h-24 rounded-lg"
                              />
                              <p className="text-sm text-green-600">{gender} image uploaded!</p>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  genderImages: {
                                    ...prev.genderImages,
                                    [gender]: ''
                                  }
                                }))}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Remove {gender} Image
                              </button>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                id={`${gender}Image`}
                                accept="image/*"
                                onChange={(e) => handleGenderImageUpload(e, gender)}
                                className="hidden"
                              />
                              <label 
                                htmlFor={`${gender}Image`} 
                                className="cursor-pointer flex flex-col items-center space-y-2"
                              >
                                {genderImageLoading[gender] ? (
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                ) : (
                                  <>
                                    <FaCloudUploadAlt className="text-3xl text-gray-400" />
                                    <p className="text-gray-600 text-sm">Upload {gender} Design</p>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Design Details */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaPalette className="text-black" />
                  Design Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Design Description *
                    </label>
                    <textarea
                      name="designDescription"
                      value={formData.designDescription}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      maxLength={1000}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                      placeholder="Describe your design in detail. Include colors, text, placement, style preferences, etc. Be as specific as possible to help us create exactly what you envision."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.designDescription.length}/1000 characters
                    </p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Reference Image/Logo (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      {formData.uploadedImage ? (
                        <div className="space-y-3">
                          <img 
                            src={formData.uploadedImage} 
                            alt="Uploaded design" 
                            className="mx-auto max-h-32 rounded-lg"
                          />
                          <p className="text-sm text-green-600">Image uploaded successfully!</p>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, uploadedImage: '' }))}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id="designImage"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label 
                            htmlFor="designImage" 
                            className="cursor-pointer flex flex-col items-center space-y-2"
                          >
                            {imageLoading ? (
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                            ) : (
                              <>
                                <FaCloudUploadAlt className="text-4xl text-gray-400" />
                                <p className="text-gray-600">Click to upload image or drag and drop</p>
                                <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaCalendarAlt className="text-black" />
                  Delivery Preference
                </h2>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="preferredDeliveryDate"
                    value={formData.preferredDeliveryDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Minimum 7-10 business days required for custom orders
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <FaTshirt />
                      Submit Custom Request
                    </>
                  )}
                </motion.button>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  Our team will review your request and contact you within 24-48 hours with a quote and timeline.
                </p>
              </div>
            </form>
          </div>
        </motion.div>

      
      </div>
    </div>
  );
};

export default CustomTshirtRequest;
