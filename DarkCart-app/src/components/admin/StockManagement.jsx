import React, { useState, useEffect } from 'react';
import { FaEdit, FaSync, FaFilter, FaSearch, FaPlus, FaMinus, FaTimes, FaTag } from 'react-icons/fa';
import Axios from '../../utils/Axios';
import SummaryApi from '../../common/SummaryApi';
import AxiosTostError from '../../utils/AxiosTostError';
import successAlert from '../../utils/SuccessAlert';
import Loading from '../Loading';

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockChanges, setStockChanges] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockOperation, setStockOperation] = useState('add'); // 'add' or 'subtract'
  const [availableSizes, setAvailableSizes] = useState([
    'XS', 'S', 'M', 'L', 'XL'
  ]);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [showSizeManagement, setShowSizeManagement] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchAvailableSizes();
  }, [currentPage, filterCategory]);
  
  // Fetch available sizes configuration
  const fetchAvailableSizes = async () => {
    try {
      const response = await Axios({
        url: '/api/config/sizes',
        method: 'GET',
        params: {
          type: 'clothing',
          includeCustom: true
        }
      });
      
      if (response.data.success && Array.isArray(response.data.sizes)) {
        setAvailableSizes(response.data.sizes);
        
        // If we have information about which sizes are default vs custom, store that too
        if (response.data.defaultSizes) {
          // You could store these in state if you need to display differently
          console.log("Default sizes:", response.data.defaultSizes);
          console.log("Custom sizes:", response.data.customSizes || []);
        }
      }
    } catch (error) {
      console.error('Error fetching available sizes:', error);
      // If API fails, fall back to default sizes
    }
  };

  // Fetch products with filters
  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("Fetching products...");
      const response = await Axios({
        ...SummaryApi.getProduct,
        data: {
          limit: 10,
          page: currentPage,
          categoryId: filterCategory || undefined,
          searchTerm: searchTerm || undefined,
          sort: '-createdAt' // Sort by newest first
        }
      });

      console.log("Product API response:", response);
      if (response.data.success && response.data.data) {
        // Check if data is an array (direct products array)
        if (Array.isArray(response.data.data)) {
          setProducts(response.data.data);
          setTotalPages(response.data.totalNoPage || 1);
        } 
        // Check if data.data.products exists (nested products array)
        else if (response.data.data.products) {
          setProducts(response.data.data.products);
          setTotalPages(response.data.totalNoPage || 1);
        } else {
          console.log("No products data in API response");
          setProducts([]);
          setTotalPages(1);
        }
      } else {
        console.log("No products data in API response");
        setProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      AxiosTostError(error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await Axios(SummaryApi.getCategory);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // Open stock adjustment modal
  const openStockModal = (product) => {
    setSelectedProduct(product);
    
    // Initialize stock changes for all available sizes
    const initialStockChanges = {};
    const initialPriceChanges = {};
    
    availableSizes.forEach(size => {
      initialStockChanges[size] = 0;
      
      // If product has size-specific pricing, use that, otherwise use base price
      const sizePrice = product.sizePricing && product.sizePricing[size] 
        ? product.sizePricing[size] 
        : product.price;
      
      initialPriceChanges[size] = sizePrice;
    });
    
    setStockChanges(initialStockChanges);
    setPriceChanges(initialPriceChanges);
    setShowStockModal(true);
  };

  // Handle stock change inputs
  const handleStockChange = (size, value) => {
    setStockChanges({
      ...stockChanges,
      [size]: parseInt(value) || 0
    });
  };
  
  // Handle price change inputs
  const handlePriceChange = (size, value) => {
    setPriceChanges({
      ...priceChanges,
      [size]: parseFloat(value) || 0
    });
  };
  
  // Add new size to system
  const addNewSize = () => {
    if (!newSizeInput.trim() || availableSizes.includes(newSizeInput.trim())) {
      return;
    }
    
    const newSize = newSizeInput.trim().toUpperCase();
    const updatedSizes = [...availableSizes, newSize];
    
    // Update available sizes via API
    updateAvailableSizes(updatedSizes);
    
    // Update local state
    setAvailableSizes(updatedSizes);
    setNewSizeInput('');
    
    // Initialize stock and price for new size
    setStockChanges({
      ...stockChanges,
      [newSize]: 0
    });
    
    setPriceChanges({
      ...priceChanges,
      [newSize]: selectedProduct ? selectedProduct.price : 0
    });
  };
  
  // Remove size from system
  const removeSize = (sizeToRemove) => {
    // Don't allow removing if there are products with this size in stock
    const hasProductsWithSize = products.some(product => 
      product.sizes && 
      product.sizes[sizeToRemove] && 
      product.sizes[sizeToRemove] > 0
    );
    
    if (hasProductsWithSize) {
      alert(`Cannot remove ${sizeToRemove} size because some products have this size in stock. Update products first.`);
      return;
    }
    
    const updatedSizes = availableSizes.filter(size => size !== sizeToRemove);
    
    // Update available sizes via API
    updateAvailableSizes(updatedSizes);
    
    // Update local state
    setAvailableSizes(updatedSizes);
  };
  
  // Update available sizes in the backend
  const updateAvailableSizes = async (sizes) => {
    try {
      await Axios({
        url: '/api/config/sizes',
        method: 'PUT',
        data: { sizes }
      });
      
      successAlert('Size configuration updated successfully');
    } catch (error) {
      AxiosTostError(error);
    }
  };

  // Submit stock and price changes
  const handleStockUpdate = async () => {
    if (!selectedProduct) return;

    try {
      const updatedSizes = { ...selectedProduct.sizes };
      const updatedSizePricing = { ...selectedProduct.sizePricing } || {};
      
      // Apply stock changes based on operation
      availableSizes.forEach(size => {
        // Only update sizes that have stock changes or price changes
        if (stockChanges[size] !== undefined || priceChanges[size] !== undefined) {
          // Update stock if needed
          if (stockChanges[size] !== 0) {
            if (stockOperation === 'add') {
              updatedSizes[size] = Math.max(0, (updatedSizes[size] || 0) + stockChanges[size]);
            } else {
              updatedSizes[size] = Math.max(0, (updatedSizes[size] || 0) - stockChanges[size]);
            }
          }
          
          // Update size-specific pricing if provided
          if (priceChanges[size] > 0) {
            updatedSizePricing[size] = priceChanges[size];
          }
        }
      });
      
      // Calculate available sizes and total stock
      const availableSizesList = Object.entries(updatedSizes)
        .filter(([_, qty]) => qty > 0)
        .map(([size]) => size);
      
      const totalStock = Object.values(updatedSizes).reduce((sum, qty) => sum + qty, 0);
      
      // Calculate base price (minimum of all size prices with stock)
      const sizesWithStock = availableSizesList
        .filter(size => updatedSizes[size] > 0 && updatedSizePricing[size]);
      
      const basePrice = sizesWithStock.length > 0
        ? Math.min(...sizesWithStock.map(size => updatedSizePricing[size] || selectedProduct.price))
        : selectedProduct.price;
      
      const response = await Axios({
        ...SummaryApi.updateProductDetails,
        data: {
          _id: selectedProduct._id,
          sizes: updatedSizes,
          availableSizes: availableSizesList,
          sizePricing: updatedSizePricing,
          price: basePrice,
          stock: totalStock
        }
      });

      if (response.data.success) {
        successAlert('Product stock and pricing updated successfully');
        setShowStockModal(false);
        fetchProducts();
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Stock Management</h1>
        
        <button
          onClick={() => setShowSizeManagement(true)}
          className="px-3 py-1 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700"
        >
          <FaTag className="text-sm" /> Manage Sizes
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-500" />
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search products..."
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaFilter className="text-gray-500" />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => fetchProducts()}
            className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Refresh"
          >
            <FaSync />
          </button>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loading />
          </div>
        ) : products && products.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size-Specific Inventory & Pricing</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products && products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {product.image && product.image[0] ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={product.image[0]} alt={product.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">No img</div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {product.category && product.category.map(cat => cat.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{product.price}</div>
                    {product.discount > 0 && (
                      <div className="text-xs text-green-600">{product.discount}% off</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock} items</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(product.sizes || {}).map(([size, qty]) => {
                        const sizePrice = product.sizePricing && product.sizePricing[size] ? product.sizePricing[size] : product.price;
                        const hasSizeSpecificPrice = product.sizePricing && product.sizePricing[size] && product.sizePricing[size] !== product.price;
                        
                        return (
                          <div 
                            key={size} 
                            className={`
                              flex flex-col items-center px-3 py-1.5 rounded border 
                              ${qty > 0 
                                ? hasSizeSpecificPrice 
                                  ? 'bg-blue-50 border-blue-200 text-blue-800' 
                                  : 'bg-blue-50 border-blue-100 text-blue-800'
                                : 'bg-gray-50 border-gray-200 text-gray-500'
                              }
                            `}
                          >
                            <div className="font-medium">{size}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">
                                {qty} units
                              </span>
                              {hasSizeSpecificPrice ? (
                                <span className="text-xs font-medium bg-green-100 text-green-700 px-1 rounded">
                                  ₹{sizePrice}
                                </span>
                              ) : qty > 0 ? (
                                <span className="text-xs text-gray-500">
                                  ₹{sizePrice}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openStockModal(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      title="Adjust Stock"
                    >
                      <FaEdit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No products found
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && products && products.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        </div>
      )}
      
      {/* Size Management Modal */}
      {showSizeManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Available Sizes</h3>
              <button 
                onClick={() => setShowSizeManagement(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex mb-3">
                <input
                  type="text"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  placeholder="New size (e.g., 2XL)"
                  className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addNewSize}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                Current sizes available in the system:
              </div>
              
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <div key={size} className="bg-gray-100 rounded px-3 py-1 flex items-center gap-2">
                    <span>{size}</span>
                    <button
                      onClick={() => removeSize(size)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-4">
                <strong>Note:</strong> Removing a size will not affect existing products, but the size will no longer
                be available for new stock adjustments. You cannot remove sizes that are currently used by products in stock.
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSizeManagement(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stock Adjustment Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Adjust Stock & Pricing: {selectedProduct.name}
              </h3>
              <button 
                onClick={() => setShowStockModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setStockOperation('add')}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 ${
                    stockOperation === 'add' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <FaPlus size={12} /> Add Stock
                </button>
                <button
                  onClick={() => setStockOperation('subtract')}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 ${
                    stockOperation === 'subtract' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <FaMinus size={12} /> Remove Stock
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                {availableSizes.map((size) => {
                  // Skip sizes not in the product if it doesn't exist in product
                  if (!selectedProduct.sizes && size !== availableSizes[0]) return null;
                  
                  const currentStock = selectedProduct.sizes ? (selectedProduct.sizes[size] || 0) : 0;
                  const currentPrice = selectedProduct.sizePricing && selectedProduct.sizePricing[size] 
                    ? selectedProduct.sizePricing[size] 
                    : selectedProduct.price;
                  
                  const hasSizeSpecificPrice = selectedProduct.sizePricing && 
                    selectedProduct.sizePricing[size] && 
                    selectedProduct.sizePricing[size] !== selectedProduct.price;
                    
                  return (
                    <div key={size} className={`text-center border p-3 rounded-md ${currentStock > 0 ? 'border-blue-200' : 'border-gray-200'}`}>
                      <div className="font-medium mb-1 flex items-center justify-center gap-1">
                        {size}
                        {hasSizeSpecificPrice && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                            Custom Price
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs mb-3">
                        <div><strong>Current Stock:</strong> {currentStock} units</div>
                        <div><strong>Current Price:</strong> ₹{currentPrice}</div>
                      </div>
                      
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stock Change</label>
                      <input
                        type="number"
                        min="0"
                        value={stockChanges[size] || 0}
                        onChange={(e) => handleStockChange(size, e.target.value)}
                        className="w-full p-1 mb-2 border border-gray-300 rounded text-center text-sm"
                      />
                      
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceChanges[size] || 0}
                        onChange={(e) => handlePriceChange(size, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="font-medium">Preview after changes:</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableSizes.map((size) => {
                    if (!selectedProduct.sizes && size !== availableSizes[0]) return null;
                    
                    const currentQty = selectedProduct.sizes ? (selectedProduct.sizes[size] || 0) : 0;
                    const newQty = stockOperation === 'add' 
                      ? currentQty + (stockChanges[size] || 0)
                      : Math.max(0, currentQty - (stockChanges[size] || 0));
                    
                    const newPrice = priceChanges[size] || selectedProduct.price;
                    const priceChanged = selectedProduct.sizePricing && 
                      selectedProduct.sizePricing[size] !== newPrice;
                    
                    return (
                      <div 
                        key={size} 
                        className={`text-sm px-2 py-1 rounded ${
                          newQty > 0 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {size}: {newQty}
                        {newPrice > 0 && (
                          <span className={`ml-1 ${priceChanged ? 'text-green-600 font-medium' : ''}`}>
                            (₹{newPrice})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStockUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
