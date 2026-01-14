import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi.js';
import AxiosTostError from '../utils/AxiosTostError';
import toast from 'react-hot-toast';
import SizeInventoryManager from '../components/SizeInventoryManager';
import Loading from '../components/Loading';

function InventoryManagement() {
  const params = useParams();
  const productId = params.productId;
  console.log("InventoryManagement component mounted with params:", params);
  console.log("Extracted productId:", productId);
  console.log("Current route path:", window.location.pathname);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [sizeData, setSizeData] = useState({
    sizes: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0
    },
    availableSizes: [],
    totalStock: 0
  });

  // Fetch product details on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        toast.error('Product ID is missing');
        navigate('/dashboard/product');
        return;
      }

      try {
        setLoading(true);
        console.log("Calling API with productId:", productId);
        console.log("API endpoint:", SummaryApi.getProductDetails);
        
        const response = await Axios({
          ...SummaryApi.getProductDetails,
          data: { productId: productId }
        });

        console.log("API response received:", response);
        const { data: responseData } = response;
        if (responseData.success) {
          const productData = responseData.data;
          setProduct(productData);
          
          // Initialize size inventory from product data
          const sizes = productData.sizes || {
            XS: 0,
            S: 0,
            M: 0,
            L: 0,
            XL: 0
          };
          
          const availableSizes = productData.availableSizes || 
            Object.entries(sizes)
              .filter(([_, qty]) => Number(qty) > 0)
              .map(([size]) => size);
              
          const totalStock = Object.values(sizes).reduce((sum, qty) => sum + Number(qty), 0);
          
          setSizeData({
            sizes,
            availableSizes,
            totalStock
          });
        } else {
          toast.error('Failed to fetch product data');
          navigate('/dashboard/product');
        }
      } catch (error) {
        AxiosTostError(error);
        navigate('/dashboard/product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  const handleSizeInventoryChange = (newSizeData) => {
    setSizeData(newSizeData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log("Saving inventory data:", {
        productId,
        sizes: sizeData.sizes,
        availableSizes: sizeData.availableSizes,
        totalStock: sizeData.totalStock
      });
      
      const response = await Axios({
        ...SummaryApi.updateProductDetails,
        data: {
          _id: productId,
          sizes: sizeData.sizes,
          availableSizes: sizeData.availableSizes,
          stock: sizeData.totalStock // Update legacy stock field too
        }
      });

      const { data: responseData } = response;
      console.log("Server response:", responseData);
      
      if (responseData.success) {
        toast.success('Inventory updated successfully');
      } else {
        console.error("Error updating inventory:", responseData);
        toast.error('Failed to update inventory: ' + responseData.message);
      }
    } catch (error) {
      console.error("Exception during inventory update:", error);
      AxiosTostError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-700">Product not found</h2>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => navigate('/dashboard/product')}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <button
            onClick={() => navigate('/dashboard/product')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>

        <div className="mb-6 flex items-center">
          <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden mr-4">
            {product.image && product.image[0] && (
              <img 
                src={product.image[0]} 
                alt={product.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                }}
              />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">Price: ₹{product.price}</p>
            <p className="text-sm text-gray-500">ID: {productId}</p>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50 mb-6">
          <SizeInventoryManager 
            value={sizeData.sizes}
            onChange={handleSizeInventoryChange}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryManagement;
