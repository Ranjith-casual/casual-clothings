import React, { useState, useEffect } from 'react';
import { FaEdit, FaSync, FaFilter, FaSearch, FaPlus, FaMinus } from 'react-icons/fa';
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
  const [stockChanges, setStockChanges] = useState({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0
  });
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockOperation, setStockOperation] = useState('add'); // 'add' or 'subtract'

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [currentPage, filterCategory]);

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
    setStockChanges({
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0
    });
    setShowStockModal(true);
  };

  // Handle stock change inputs
  const handleStockChange = (size, value) => {
    setStockChanges({
      ...stockChanges,
      [size]: parseInt(value) || 0
    });
  };

  // Submit stock changes
  const handleStockUpdate = async () => {
    if (!selectedProduct) return;

    try {
      const updatedSizes = { ...selectedProduct.sizes };
      
      // Apply changes based on operation
      Object.keys(stockChanges).forEach(size => {
        if (stockChanges[size] !== 0) {
          if (stockOperation === 'add') {
            updatedSizes[size] = Math.max(0, (updatedSizes[size] || 0) + stockChanges[size]);
          } else {
            updatedSizes[size] = Math.max(0, (updatedSizes[size] || 0) - stockChanges[size]);
          }
        }
      });
      
      // Calculate available sizes and total stock
      const availableSizes = Object.entries(updatedSizes)
        .filter(([_, qty]) => qty > 0)
        .map(([size]) => size);
      
      const totalStock = Object.values(updatedSizes).reduce((sum, qty) => sum + qty, 0);
      
      const response = await Axios({
        ...SummaryApi.updateProductDetails,
        data: {
          _id: selectedProduct._id,
          sizes: updatedSizes,
          availableSizes,
          stock: totalStock
        }
      });

      if (response.data.success) {
        successAlert('Stock updated successfully');
        setShowStockModal(false);
        fetchProducts();
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">Stock Management</h1>
      
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size Inventory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      {Object.entries(product.sizes || {}).map(([size, qty]) => (
                        <div key={size} className={`text-xs px-2 py-1 rounded ${qty > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                          {size}: {qty}
                        </div>
                      ))}
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
      
      {/* Stock Adjustment Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">
              Adjust Stock: {selectedProduct.name}
            </h3>
            
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
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {Object.keys(selectedProduct.sizes || {}).map((size) => (
                  <div key={size} className="text-center">
                    <div className="font-medium mb-1">{size}</div>
                    <div className="text-sm mb-1">
                      Current: {selectedProduct.sizes[size] || 0}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={stockChanges[size]}
                      onChange={(e) => handleStockChange(size, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-center"
                    />
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="font-medium">Preview after changes:</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(selectedProduct.sizes || {}).map(([size, qty]) => {
                    const newQty = stockOperation === 'add' 
                      ? qty + (stockChanges[size] || 0)
                      : Math.max(0, qty - (stockChanges[size] || 0));
                    
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
