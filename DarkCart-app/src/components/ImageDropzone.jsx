import React, { useState, useRef, useEffect } from 'react';
import { FaImage, FaUpload, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';

const ImageDropzone = ({ 
  onImageUpload, 
  initialImage = '', 
  initialImages = [],
  multiple = false,
  label = 'Upload Image',
  height = 'h-48',
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(initialImage);
  const [images, setImages] = useState(initialImages);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Update preview when initialImage changes
    if (initialImage) {
      setPreview(initialImage);
    }
  }, [initialImage]);

  useEffect(() => {
    // Update images when initialImages changes
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  // Handle file selection and upload
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple) {
        // Upload multiple files
        Array.from(e.dataTransfer.files).forEach(file => {
          if (validateFile(file)) {
            uploadImage(file);
          }
        });
      } else {
        // Upload single file
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          uploadImage(file);
        }
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple) {
        // Upload multiple files
        Array.from(e.target.files).forEach(file => {
          if (validateFile(file)) {
            uploadImage(file);
          }
        });
      } else {
        // Upload single file
        const file = e.target.files[0];
        if (validateFile(file)) {
          uploadImage(file);
        }
      }
    }
  };

  // File validation
  const validateFile = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WEBP, GIF)');
      return false;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return false;
    }
    
    return true;
  };

  // Upload image to server
  const uploadImage = async (file) => {
    setIsUploading(true);
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('image', file);
      
      // Upload to server
      const response = await Axios({
        ...SummaryApi.uploadImage,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Check if response exists and has data property
      if (response && response.data && response.data.success) {
        // Make sure secure_url exists before using it
        const imageUrl = response.data.data && response.data.data.secure_url;
        
        if (!imageUrl) {
          console.error('Invalid response format:', response);
          toast.error('Server returned invalid response format');
          return;
        }
        
        if (multiple) {
          // Add to images array for multiple mode
          const newImages = [...images, imageUrl];
          setImages(newImages);
          
          // Pass the URLs to parent component
          if (onImageUpload) {
            onImageUpload(newImages);
          }
        } else {
          // Set single preview
          setPreview(imageUrl);
          
          // Pass the URL to parent component
          if (onImageUpload) {
            onImageUpload(imageUrl);
          }
        }
        
        toast.success('Image uploaded successfully');
      } else {
        console.error('Upload failed:', response);
        toast.error('Failed to upload image: Server returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Check if this is a CORS error
      if (error.message && error.message.includes('Network Error')) {
        toast.error('Network error: CORS issue detected. Please contact support.');
      } else {
        toast.error('Error uploading image: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Remove an image from the list (for multiple mode)
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    // Pass the updated URLs to parent component
    if (onImageUpload) {
      onImageUpload(newImages);
    }
  };

  // Handle click on dropzone to trigger file input
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Render multiple images view
  if (multiple) {
    return (
      <div className={`flex flex-col ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        
        {/* Image grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {images.map((img, index) => (
            <div key={index} className="relative border rounded-lg overflow-hidden h-32">
              <img 
                src={img} 
                alt={`Image ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
          
          {/* Add image button */}
          <div
            className={`relative h-32 border-2 border-dashed rounded-lg cursor-pointer 
              flex flex-col items-center justify-center
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
              ${isUploading ? 'opacity-70' : ''}
              transition-all duration-200 ease-in-out
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            {isUploading ? (
              <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
            ) : (
              <>
                <FaPlus className="h-8 w-8 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Add Image</span>
              </>
            )}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <p className="text-xs text-gray-500">
          Drag and drop images here, or click to select files
        </p>
      </div>
    );
  }

  // Render single image view
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div
        className={`relative ${height} border-2 border-dashed rounded-lg cursor-pointer 
          flex flex-col items-center justify-center overflow-hidden
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${isUploading ? 'opacity-70' : ''}
          transition-all duration-200 ease-in-out
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        {/* Preview or placeholder */}
        {preview ? (
          <div className="relative w-full h-full">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center">
              <div className="text-white opacity-0 hover:opacity-100 p-2">
                <FaUpload className="mx-auto mb-1" />
                <span className="text-xs">Change image</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <FaImage className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP or GIF (max. 5MB)
            </p>
          </div>
        )}
        
        {/* Upload indicator */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
            <div className="text-center">
              <FaSpinner className="animate-spin h-8 w-8 mx-auto text-blue-500" />
              <p className="mt-2 text-sm text-gray-600">Uploading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDropzone;
