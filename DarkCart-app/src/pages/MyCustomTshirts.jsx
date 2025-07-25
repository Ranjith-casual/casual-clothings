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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Custom T-Shirts</h1>
              <p className="text-gray-600">Track your custom t-shirt requests and their status</p>
            </div>
            <Link
              to="/custom-tshirt-request"
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              New Request
            </Link>
          </div>
        </div>

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <div className="text-center py-16">
            <FaTshirt className="text-6xl text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-4">No Custom T-Shirt Requests</h3>
            <p className="text-gray-500 mb-8">You haven't made any custom t-shirt requests yet.</p>
            <Link
              to="/custom-tshirt-request"
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Create Your First Request
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                {/* Request Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FaTshirt className="text-gray-600" />
                      <span className="font-medium text-gray-900">Request #{request._id?.slice(-6)}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {formatStatus(request.status)}
                    </span>
                  </div>

                  {/* Request Details Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaUser className="text-xs" />
                      <span>Gender: {Array.isArray(request.gender) ? request.gender.join(', ') : request.gender}</span>
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
                    {request.images && Object.keys(request.images).length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaImages className="text-xs" />
                        <span>{Object.keys(request.images).length} image(s) uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Special Instructions Preview */}
                  {request.specialInstructions && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {request.specialInstructions}
                      </p>
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="mt-4 w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaEye className="text-sm" />
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
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                      <p className="text-gray-600">Request ID: #{selectedRequest._id}</p>
                    </div>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                            {Array.isArray(selectedRequest.gender) ? selectedRequest.gender.join(', ') : selectedRequest.gender}
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Images</h3>
                      {selectedRequest.images && Object.keys(selectedRequest.images).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(selectedRequest.images).map(([gender, imageUrl]) => (
                            <div key={gender} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{gender}</h4>
                              <img
                                src={imageUrl}
                                alt={`${gender} design`}
                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-48 bg-gray-100 rounded-lg border border-gray-200 items-center justify-center">
                                <span className="text-gray-400">Image not available</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <FaImages className="text-4xl text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No images uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedRequest.adminNotes && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Admin Notes</h4>
                      <p className="text-blue-800">{selectedRequest.adminNotes}</p>
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
