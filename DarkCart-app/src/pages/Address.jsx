import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import AddAddress from "../components/AddAddress";
import { MdDelete, MdEdit, MdLocationOn } from "react-icons/md";
import { FaPlus } from "react-icons/fa";
import EditAddressData from "../components/EditAddressData";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";
import AxiosTostError from "../utils/AxiosTostError";
import { useGlobalContext } from "../provider/GlobalProvider";
import { motion } from "framer-motion";

function Address() {
  const addressList = useSelector((state) => state.addresses.addressList);
  const [openAddress, setOpenAddress] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { fetchAddress } = useGlobalContext();
  
  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  // Simulate loading state for smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await Axios({
        ...SummaryApi.deleteAddress,
        data: { _id: id },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAddress();
      }
    } catch (error) {
      AxiosTostError(error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-8">
      {/* Header with premium styling */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-4 sm:p-6 mb-6 shadow-lg flex flex-col sm:flex-row justify-between items-center rounded-lg border border-gray-200"
      >
        <div className="flex items-center mb-3 sm:mb-0">
          <MdLocationOn className="text-gray-800 mr-2 hidden sm:block" size={24} />
          <h1 className="font-bold text-xl md:text-2xl text-gray-900 font-serif">
            Delivery Addresses
          </h1>
        </div>
        <button
          onClick={() => setOpenAddress(true)}
          className="w-full sm:w-auto border-2 border-black text-black px-4 py-2 rounded-md hover:bg-black hover:text-white transition-all duration-300 font-medium tracking-wide flex items-center justify-center"
        >
          <FaPlus className="mr-2" size={12} />
          <span>Add New Address</span>
        </button>
      </motion.div>
      
      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map(item => (
            <div key={item} className="bg-white p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/5"></div>
            </div>
          ))}
        </div>
      )}
      
      {/* Address list with animations */}
      {!isLoading && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-50 p-2 sm:p-4 rounded-lg"
        >
          {addressList.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="bg-white p-6 rounded-lg shadow-sm text-center"
            >
              <div className="text-gray-500 mb-4">No addresses saved yet</div>
              <p className="text-sm text-gray-400 mb-4">Add a new address to get started</p>
            </motion.div>
          ) : (
            addressList.map((address, index) => (
              <motion.div
                key={address._id}
                variants={itemVariants}
                className={`${
                  address.status ? "bg-white" : "hidden"
                } p-4 sm:p-5 mb-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-200`}
                whileHover={{ scale: 1.01 }}
              >
                <div className="w-full">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 md:mb-0">
                      {address.address_line}
                    </h4>
                    <div className="flex flex-row sm:flex-col md:flex-row gap-2 mb-2 md:mb-0">
                      <button
                        onClick={() => {
                          setOpenEdit(true);
                          setEditData(address);
                        }}
                        className="flex-1 bg-gray-100 border border-gray-300 p-2 rounded-md hover:bg-gray-200 hover:text-gray-900 transition-colors text-sm flex items-center justify-center"
                      >
                        <MdEdit size={16} className="mr-1" /> 
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(address._id)}
                        className="flex-1 bg-red-50 border border-red-300 text-red-600 p-2 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <MdDelete size={16} className="mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base my-1">
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="text-gray-600 text-sm sm:text-base">{address.country}</p>
                  <p className="text-gray-700 font-medium text-sm sm:text-base mt-1">
                    Mobile: {address.mobile}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
      
      {/* Add address button with animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => setOpenAddress(true)}
        className="h-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all duration-300 mt-4 group"
        whileHover={{ scale: 1.01 }}
      >
        <FaPlus className="mr-2 text-gray-500 group-hover:text-black transition-colors duration-300" />
        <span className="text-gray-600 font-medium group-hover:text-black transition-colors duration-300">Add New Address</span>
      </motion.div>

      {/* Modal components */}
      {openAddress && <AddAddress close={() => setOpenAddress(false)} />}
      {openEdit && <EditAddressData close={() => setOpenEdit(false)} data={editData} />}
    </div>
  );
}

// Wrapping with an error boundary for better error handling
const AddressWithErrorBoundary = () => {
  try {
    return <Address />;
  } catch (error) {
    console.error("Error in Address component:", error);
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-lg font-medium text-red-700">Something went wrong</h2>
        <p className="text-red-600 mt-2">We couldn't load your addresses. Please try again later.</p>
      </div>
    );
  }
};

export default AddressWithErrorBoundary;
