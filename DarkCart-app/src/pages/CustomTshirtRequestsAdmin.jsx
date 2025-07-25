import React, { useState, useEffect } from 'react';
import { 
  FaTshirt, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaWhatsapp, 
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaCog,
  FaDownload
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CustomTshirtRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusUpdateModal, setStatusUpdateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalRequests: 0
  });

  const statusOptions = [
    { value: 'all', label: 'All Requests', color: 'bg-gray-500' },
    { value: 'Pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'Accepted', label: 'Accepted', color: 'bg-green-500' },
    { value: 'Rejected', label: 'Rejected', color: 'bg-red-500' },
    { value: 'In Production', label: 'In Production', color: 'bg-blue-500' },
    { value: 'Completed', label: 'Completed', color: 'bg-purple-500' }
  ];

  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    adminNotes: '',
    estimatedPrice: 0,
    rejectionReason: ''
  });

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.getAllCustomTshirtRequests,
        data: filters
      });

      if (response.data.success) {
        setRequests(response.data.data);
        setStatusCounts(response.data.statusSummary);
        setPagination({
          totalPages: response.data.totalPages,
          currentPage: response.data.currentPage,
          totalRequests: response.data.totalRequests
        });
      }
    } catch (error) {
      toast.error('Failed to fetch requests');
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !statusUpdateData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.updateCustomTshirtRequestStatus,
        data: {
          requestId: selectedRequest._id,
          ...statusUpdateData
        }
      });

      if (response.data.success) {
        toast.success('Status updated successfully');
        setStatusUpdateModal(false);
        setSelectedRequest(null);
        setStatusUpdateData({
          status: '',
          adminNotes: '',
          estimatedPrice: 0,
          rejectionReason: ''
        });
        fetchRequests();
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Status update error:', error);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.deleteCustomTshirtRequest,
        url: `${SummaryApi.deleteCustomTshirtRequest.url}/${requestId}`,
        method: 'delete'
      });

      if (response.data.success) {
        toast.success('Request deleted successfully');
        fetchRequests();
      }
    } catch (error) {
      toast.error('Failed to delete request');
      console.error('Delete request error:', error);
    }
  };

  const openWhatsApp = (phone, name) => {
    const message = `Hi ${name}, regarding your custom t-shirt request. How can we help you?`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Accepted': 'bg-green-100 text-green-800 border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
      'In Production': 'bg-blue-100 text-blue-800 border-blue-200',
      'Completed': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'T-Shirt Type', 'Color', 'Size', 
      'Genders', 'Status', 'Created At', 'Delivery Date', 'Estimated Price', 
      'Has General Image', 'Gender Images Count', 'Admin Notes'
    ];
    const csvData = requests.map(req => [
      req.name,
      req.email,
      req.phone,
      req.tshirtType,
      req.color,
      req.size,
      req.genders ? req.genders.join(', ') : '',
      req.status,
      format(new Date(req.createdAt), 'dd/MM/yyyy'),
      format(new Date(req.preferredDeliveryDate), 'dd/MM/yyyy'),
      req.estimatedPrice || 0,
      req.uploadedImage ? 'Yes' : 'No',
      req.genderImages ? Object.keys(req.genderImages).filter(key => req.genderImages[key]).length : 0,
      req.adminNotes || ''
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-tshirt-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaTshirt className="text-3xl text-black" />
            <h1 className="text-3xl font-bold text-gray-900">Custom T-Shirt Requests</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FaDownload />
              Export CSV
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaCog />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {statusOptions.map(option => (
            <div key={option.value} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${option.color} text-white`}>
                {option.label}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {option.value === 'all' 
                  ? Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
                  : statusCounts[option.value] || 0
                }
              </div>
              {option.value === 'all' && (
                <div className="text-xs text-gray-500 mt-1">
                  Total Images: {requests.reduce((total, req) => {
                    let imageCount = req.uploadedImage ? 1 : 0;
                    if (req.genderImages) {
                      imageCount += Object.keys(req.genderImages).filter(key => req.genderImages[key]).length;
                    }
                    return total + imageCount;
                  }, 0)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T-Shirt Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map(request => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{request.name}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                        <div className="text-sm text-gray-500">{request.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{request.tshirtType}</div>
                        <div className="text-sm text-gray-500">{request.color} • {request.size}</div>
                        {request.genders && request.genders.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.genders.map(gender => (
                              <span key={gender} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {gender}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {request.designDescription.substring(0, 50)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>Created: {format(new Date(request.createdAt), 'dd/MM/yyyy')}</div>
                      <div>Delivery: {format(new Date(request.preferredDeliveryDate), 'dd/MM/yyyy')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setStatusUpdateData({
                              status: request.status,
                              adminNotes: request.adminNotes || '',
                              estimatedPrice: request.estimatedPrice || 0,
                              rejectionReason: request.rejectionReason || ''
                            });
                            setStatusUpdateModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Update Status"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => openWhatsApp(request.phone, request.name)}
                          className="text-green-500 hover:text-green-700 p-1"
                          title="WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
              {Math.min(pagination.currentPage * filters.limit, pagination.totalRequests)} of{' '}
              {pagination.totalRequests} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50">
                {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <AnimatePresence>
        {showModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Request Details</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimesCircle className="text-xl" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Name</label>
                        <p className="text-gray-900">{selectedRequest.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedRequest.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{selectedRequest.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* T-Shirt Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">T-Shirt Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Type</label>
                        <p className="text-gray-900">{selectedRequest.tshirtType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Color</label>
                        <p className="text-gray-900">{selectedRequest.color}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Size</label>
                        <p className="text-gray-900">{selectedRequest.size}</p>
                      </div>
                    </div>
                    {selectedRequest.genders && selectedRequest.genders.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-500 mb-2">Selected Genders</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.genders.map(gender => (
                            <span key={gender} className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
                              {gender}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Design Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Design Details & Images</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Description</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.designDescription}</p>
                      </div>
                      
                      {/* General Reference Image */}
                      {selectedRequest.uploadedImage && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-2">General Reference Image</label>
                          <div className="relative inline-block">
                            <img 
                              src={selectedRequest.uploadedImage} 
                              alt="Design reference" 
                              className="max-w-xs h-auto rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => window.open(selectedRequest.uploadedImage, '_blank')}
                            />
                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                              Click to enlarge
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gender-specific Images */}
                      {selectedRequest.genderImages && Object.keys(selectedRequest.genderImages).length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-3">Gender-Specific Design Images</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(selectedRequest.genderImages).map(([gender, imageUrl]) => (
                              imageUrl && (
                                <div key={gender} className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-700">{gender} Design</h4>
                                  <div className="relative">
                                    <img 
                                      src={imageUrl} 
                                      alt={`${gender} design`} 
                                      className="w-full max-w-xs h-auto rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                      onClick={() => window.open(imageUrl, '_blank')}
                                    />
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                      {gender}
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Image Summary */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">
                          <strong>Image Summary:</strong> 
                          {selectedRequest.uploadedImage ? ' 1 general reference' : ' No general reference'}
                          {selectedRequest.genderImages && Object.keys(selectedRequest.genderImages).filter(key => selectedRequest.genderImages[key]).length > 0 
                            ? `, ${Object.keys(selectedRequest.genderImages).filter(key => selectedRequest.genderImages[key]).length} gender-specific images`
                            : ', no gender-specific images'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Admin Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Timeline & Admin Notes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Created At</label>
                        <p className="text-gray-900">{format(new Date(selectedRequest.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Preferred Delivery</label>
                        <p className="text-gray-900">{format(new Date(selectedRequest.preferredDeliveryDate), 'dd/MM/yyyy')}</p>
                      </div>
                      {selectedRequest.estimatedPrice > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Estimated Price</label>
                          <p className="text-gray-900">₹{selectedRequest.estimatedPrice}</p>
                        </div>
                      )}
                      {selectedRequest.adminNotes && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500">Admin Notes</label>
                          <p className="text-gray-900">{selectedRequest.adminNotes}</p>
                        </div>
                      )}
                      {selectedRequest.rejectionReason && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500">Rejection Reason</label>
                          <p className="text-red-600">{selectedRequest.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setStatusUpdateData({
                        status: selectedRequest.status,
                        adminNotes: selectedRequest.adminNotes || '',
                        estimatedPrice: selectedRequest.estimatedPrice || 0,
                        rejectionReason: selectedRequest.rejectionReason || ''
                      });
                      setStatusUpdateModal(true);
                    }}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    <FaEdit />
                    Update Status
                  </button>
                  <button
                    onClick={() => openWhatsApp(selectedRequest.phone, selectedRequest.name)}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    <FaWhatsapp />
                    WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Update Modal */}
      <AnimatePresence>
        {statusUpdateModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setStatusUpdateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-lg w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Update Request Status</h2>
                  <button
                    onClick={() => setStatusUpdateModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimesCircle />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusUpdateData.status}
                      onChange={(e) => setStatusUpdateData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {statusOptions.slice(1).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {statusUpdateData.status === 'Accepted' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Price (₹)</label>
                      <input
                        type="number"
                        value={statusUpdateData.estimatedPrice}
                        onChange={(e) => setStatusUpdateData(prev => ({ ...prev, estimatedPrice: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Enter estimated price"
                      />
                    </div>
                  )}

                  {statusUpdateData.status === 'Rejected' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                      <textarea
                        value={statusUpdateData.rejectionReason}
                        onChange={(e) => setStatusUpdateData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Explain why the request was rejected"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                    <textarea
                      value={statusUpdateData.adminNotes}
                      onChange={(e) => setStatusUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Add any notes for the customer"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={handleStatusUpdate}
                    className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => setStatusUpdateModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomTshirtRequestsAdmin;
