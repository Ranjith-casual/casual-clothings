import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaUpload, FaTrash, FaEdit, FaEye, FaGift, FaTag, FaStar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import SummaryApi from "../common/SummaryApi";
import ImageDropzone from "../components/ImageDropzone";

// Add axios interceptor for debugging
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios Error:', error);
    console.error('Request URL:', error.config.url);
    console.error('Request Method:', error.config.method);
    console.error('Response Status:', error.response?.status);
    console.error('Response Data:', error.response?.data);
    return Promise.reject(error);
  }
);

const BundleAdmin = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBundles: 0,
    // Removed activeBundles property
    averageDiscount: 0,
    averageRating: 0
  });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    bundlePrice: "",
    originalPrice: "",
    image: "",
    items: []
  });

  // Initialize form data
  const initializeForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      bundlePrice: "",
      originalPrice: "",
      image: "",
      items: [],
      isActive: true
    });
  };

  // Fetch bundles from API
  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(SummaryApi.getAllBundles.url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setBundles(response.data.data);
        calculateStats(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch bundles");
      console.error("Error fetching bundles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(SummaryApi.getBundleStats.url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Calculate stats from bundles data
  const calculateStats = (bundleData) => {
    const totalBundles = bundleData.length;
    // Removed active bundles count
    const averageDiscount = totalBundles > 0 
      ? bundleData.reduce((acc, b) => acc + (b.discount || 0), 0) / totalBundles 
      : 0;
    const averageRating = totalBundles > 0 
      ? bundleData.reduce((acc, b) => acc + (b.rating || 0), 0) / totalBundles 
      : 0;

    setStats({
      totalBundles,
      // Removed activeBundles property
      averageDiscount,
      averageRating
    });
  };

  // Load data on component mount
  useEffect(() => {
    fetchBundles();
    fetchStats();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add item to bundle
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: "", price: "", image: "" }]
    }));
  };

  // Remove item from bundle
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.bundlePrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      const bundleData = {
        ...formData,
        bundlePrice: parseFloat(formData.bundlePrice),
        originalPrice: parseFloat(formData.originalPrice)
      };

      let response;
      if (editingBundle) {
        response = await axios.put(
          `${SummaryApi.updateBundle.url}/${editingBundle._id}`, 
          bundleData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        response = await axios.post(
          SummaryApi.createBundle.url, 
          bundleData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.data.success) {
        toast.success(editingBundle ? "Bundle updated successfully!" : "Bundle created successfully!");
        setShowUploadForm(false);
        setEditingBundle(null);
        initializeForm();
        fetchBundles();
      }
    } catch (error) {
      console.error("Error saving bundle:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to save bundle");
    } finally {
      setLoading(false);
    }
  };

  // Handle bundle deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bundle?")) {
      return;
    }

    try {
      const response = await axios.delete(`${SummaryApi.deleteBundle.url}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success("Bundle deleted successfully!");
        fetchBundles();
      }
    } catch (error) {
      toast.error("Failed to delete bundle");
      console.error("Error deleting bundle:", error);
    }
  };

  // Handle bundle editing
  const handleEdit = (bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description,
      category: bundle.category,
      bundlePrice: bundle.bundlePrice.toString(),
      originalPrice: bundle.originalPrice.toString(),
      image: bundle.image,
      items: bundle.items || []
      // Removed isActive property
    });
    setShowUploadForm(true);
  };

  // Toggle bundle status
  const toggleBundleStatus = async (id, event) => {
    // Prevent event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      console.log(`Toggling bundle status for ID: ${id}`);
      console.log(`Using URL: ${SummaryApi.toggleBundleStatus.url}/${id}`);
      
      // Use the correct endpoint path with the bundle ID
      const response = await axios.patch(`/api/bundle/toggle-status/${id}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success("Bundle visibility updated!");
        fetchBundles();
      }
    } catch (error) {
      toast.error("Failed to update bundle visibility");
      console.error("Error updating bundle visibility:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bundle Management</h1>
        <p className="text-gray-600">Create and manage product bundles for your store</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Bundles</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalBundles}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaGift className="text-blue-600 w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg. Discount</p>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(stats.averageDiscount)}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <FaTag className="text-orange-600 w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg. Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.averageRating.toFixed(1)}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaStar className="text-yellow-600 w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Bundle Button */}
      <div className="mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowUploadForm(true);
            setEditingBundle(null);
            initializeForm();
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:shadow-lg transition-all"
        >
          <FaPlus className="w-4 h-4" />
          <span>Create New Bundle</span>
        </motion.button>
      </div>

      {/* Upload Form Modal */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingBundle ? "Edit Bundle" : "Create New Bundle"}
                </h2>
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setEditingBundle(null);
                    initializeForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bundle Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bundle Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter bundle name"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Garden</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="books">Books</option>
                      <option value="beauty">Beauty & Health</option>
                    </select>
                  </div>

                  {/* Bundle Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bundle Price *
                    </label>
                    <input
                      type="number"
                      name="bundlePrice"
                      value={formData.bundlePrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Original Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <ImageDropzone
                      label="Bundle Image"
                      initialImage={formData.image}
                      onImageUpload={(imageUrl) => setFormData(prev => ({
                        ...prev,
                        image: imageUrl
                      }))}
                      height="h-64"
                      className="mb-4"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be the main image shown for your bundle
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bundle description"
                  />
                </div>

                {/* Bundle Items */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Bundle Items
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <FaPlus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                        <div>
                          <ImageDropzone
                            label=""
                            initialImage={item.image}
                            onImageUpload={(imageUrl) => handleItemChange(index, 'image', imageUrl)}
                            height="h-24"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Visibility Control */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Visible to customers (When unchecked, bundle will be hidden from customers)
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadForm(false);
                      setEditingBundle(null);
                      initializeForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : (editingBundle ? "Update Bundle" : "Create Bundle")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bundles List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Bundle List</h3>
          <p className="text-gray-600 mt-1">Manage your existing bundles</p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading bundles...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="p-12 text-center">
            <FaGift className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No bundles created yet</h3>
            <p className="text-gray-500">Create your first bundle to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bundle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bundles.map((bundle) => (
                  <tr key={bundle._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={bundle.image || "/api/placeholder/100/100"}
                            alt={bundle.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {bundle.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bundle.items?.length || 0} items
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {bundle.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        ₹{bundle.bundlePrice?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        ₹{bundle.originalPrice?.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600">
                        {bundle.discount}% off
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => toggleBundleStatus(bundle._id, e)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bundle.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bundle.isActive ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(bundle)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit Bundle"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bundle._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Bundle"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleAdmin;
