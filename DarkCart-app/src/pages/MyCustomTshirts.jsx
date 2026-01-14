import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FaTshirt, FaUser, FaCalendarAlt, FaEye, FaImages, FaPlus, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosTostError from '../utils/AxiosTostError';

const MyCustomTshirts = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's custom t-shirt requests
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching user custom t-shirt requests...');
      console.log('API endpoint:', SummaryApi.getUserCustomTshirtRequests);
      
      const response = await Axios({
        ...SummaryApi.getUserCustomTshirtRequests
      });

      console.log('API Response:', response);
      console.log('Response data:', response.data);

      if (response.data.success) {
        console.log('Requests found:', response.data.data);
        setRequests(response.data.data || []);
      } else {
        console.log('API returned success: false, message:', response.data.message);
        setError(response.data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching custom t-shirt requests:', error);
      console.error('Error response:', error.response);
      setError('Failed to fetch your custom t-shirt requests');
      AxiosTostError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
  };

  // Handle view details
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your custom t-shirt requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMyRequests}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">My Custom T-Shirts</h1>
              <p className="text-sm sm:text-base text-gray-600">Track your custom t-shirt requests and their status</p>
            </div>
            <Link
              to="/custom-tshirt"
              className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              <FaPlus className="text-xs sm:text-sm" />
              New Request
            </Link>
          </div>
        </div>

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <FaTshirt className="text-4xl sm:text-6xl text-gray-300 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-3 sm:mb-4 px-4">No Custom T-Shirt Requests</h3>
            <p className="text-gray-500 mb-6 sm:mb-8 px-4">You haven't made any custom t-shirt requests yet.</p>
            <Link
              to="/custom-tshirt"
              className="bg-black text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPlus className="text-xs sm:text-sm" />
              Create Your First Request
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {requests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                {/* Request Header */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FaTshirt className="text-gray-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate">Request #{request._id?.slice(-6)}</span>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(request.status)}`}>
                      {formatStatus(request.status)}
                    </span>
                  </div>

                  {/* Request Details Preview */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaUser className="text-xs" />
                      <span>Gender: {Array.isArray(request.genders) ? request.genders.join(', ') : request.genders}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaCalendarAlt className="text-xs" />
                      <span>Requested: {format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                    </div>

                    {request.color && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Color:</span> {request.color}
                      </div>
                    )}

                    {request.size && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Size:</span> {request.size}
                      </div>
                    )}

                    {request.tshirtType && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {request.tshirtType}
                      </div>
                    )}

                    {/* Images Preview */}
                    {request.genderImages && Object.keys(request.genderImages).length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <FaImages className="text-xs" />
                          <span className="hidden sm:inline">Uploaded Images ({Object.keys(request.genderImages).length})</span>
                          <span className="sm:hidden">Images ({Object.keys(request.genderImages).length})</span>
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                          {Object.entries(request.genderImages).map(([gender, imageUrl]) => (
                            <div key={gender} className="relative">
                              <div className="aspect-square rounded-md sm:rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors">
                                <img
                                  src={imageUrl}
                                  alt={`${gender} design`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden w-full h-full items-center justify-center">
                                  <FaImages className="text-gray-400 text-lg sm:text-xl" />
                                </div>
                              </div>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-center min-w-0 max-w-full overflow-hidden">
                                <span className="block truncate">{gender}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Special Instructions Preview */}
                  {request.specialInstructions && (
                    <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                        {request.specialInstructions}
                      </p>
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="mt-3 sm:mt-4 w-full bg-gray-900 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <FaEye className="text-xs sm:text-sm" />
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Request Details Modal */}
        <AnimatePresence>
          {showModal && selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Request Details</h2>
                      <p className="text-sm sm:text-base text-gray-600 truncate">Request ID: #{selectedRequest._id}</p>
                    </div>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl flex-shrink-0 p-1"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Request Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                            {formatStatus(selectedRequest.status)}
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                          <p className="text-gray-900">
                            {Array.isArray(selectedRequest.genders) ? selectedRequest.genders.join(', ') : selectedRequest.genders}
                          </p>
                        </div>

                        {selectedRequest.color && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                            <p className="text-gray-900">{selectedRequest.color}</p>
                          </div>
                        )}

                        {selectedRequest.size && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                            <p className="text-gray-900">{selectedRequest.size}</p>
                          </div>
                        )}

                        {selectedRequest.tshirtType && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">T-Shirt Type</label>
                            <p className="text-gray-900">{selectedRequest.tshirtType}</p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                          <p className="text-gray-900">{format(new Date(selectedRequest.createdAt), 'MMMM dd, yyyy at hh:mm a')}</p>
                        </div>

                        {selectedRequest.specialInstructions && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.specialInstructions}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Uploaded Images</h3>
                      {selectedRequest.genderImages && Object.keys(selectedRequest.genderImages).length > 0 ? (
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {Object.entries(selectedRequest.genderImages).map(([gender, imageUrl]) => (
                            <div key={gender} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <img
                                  src={imageUrl}
                                  alt={`${gender} design`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden w-full h-full items-center justify-center bg-gray-100">
                                  <div className="text-center">
                                    <FaImages className="text-gray-400 text-2xl sm:text-3xl mx-auto mb-2" />
                                    <span className="text-gray-400 text-xs sm:text-sm">Image not available</span>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full capitalize font-medium">
                                {gender}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <FaImages className="text-3xl sm:text-4xl text-gray-300 mx-auto mb-3 sm:mb-4" />
                          <p className="text-gray-500 font-medium text-sm sm:text-base">No images uploaded</p>
                          <p className="text-gray-400 text-xs sm:text-sm mt-1">Images will appear here once uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedRequest.adminNotes && (
                    <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Admin Notes</h4>
                      <p className="text-blue-800 text-sm sm:text-base">{selectedRequest.adminNotes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyCustomTshirts;
