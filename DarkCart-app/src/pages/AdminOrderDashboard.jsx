import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FaSearch, FaRedo, FaSortAmountDown,FaBox ,FaSortAmountUp, FaFilter, FaEllipsisV, FaBoxOpen, FaCheck, FaTruck, FaCog, FaBan, FaEye, FaUndo, FaTimes, FaSpinner, FaCreditCard, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { useGlobalContext } from '../provider/GlobalProvider';
import AdminOrderDetails from '../components/AdminOrderDetails';

const AdminOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'orderDate', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [refundStatuses, setRefundStatuses] = useState({}); // Track refund status for each order
  
  // New filter states
  const [activeTab, setActiveTab] = useState('ALL');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  
  const user = useSelector(state => state.user);
  
  // Get orders from Redux store
  const orderData = useSelector(state => state.order.orders);
  
  // Log user role for debugging
  // Get global context functions
  const { updateOrderStatus: contextUpdateOrderStatus, fetchAllOrders, refreshingOrders } = useGlobalContext();
  
  // Check if user is admin using case-insensitive comparison
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  
  useEffect(() => {
    console.log("Current user state:", user);
    console.log("User role:", user?.role);
    console.log("Admin status:", isAdmin);
    
    // Initialize component when user data is available
    if (user && user.role && isAdmin) {
      fetchOrders();
    }
  }, [user, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update local state when orderData changes in Redux store
  useEffect(() => {
    if (orderData && orderData.length > 0) {
      setOrders(orderData);
      applyFilters();
    }
  }, [orderData]); // Only depends on orderData changes, other filters are handled in the dedicated effect
  
  // Handle clicks outside of dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if click target is part of a dropdown
      const isClickInsideDropdown = event.target.closest('[data-dropdown="true"]');
      
      // If clicking outside any dropdown, close the open dropdown
      if (!isClickInsideDropdown && openDropdownId !== null) {
        setOpenDropdownId(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  // Fetch countries on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchCountries();
    }
  }, [isAdmin]);

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    }
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      console.log("Triggering city fetch for:", { country: selectedCountry, state: selectedState });
      fetchCities(selectedCountry, selectedState);
    } else {
      // Reset cities when either country or state is deselected
      setCities([]);
    }
  }, [selectedCountry, selectedState]);

  // Apply all filters whenever filter values change
  useEffect(() => {
    if (orders.length > 0) {
      applyFilters();
    }
  }, [activeTab, selectedCountry, selectedState, selectedCity, dateFilter, searchQuery]);

  // Fetch refund statuses for cancelled orders
  useEffect(() => {
    if (orders.length > 0) {
      const cancelledOrders = orders.filter(order => order.orderStatus === 'CANCELLED');
      
      // Fetch refund status for each cancelled order
      cancelledOrders.forEach(order => {
        if (!refundStatuses[order.orderId]) {
          fetchRefundStatus(order.orderId);
        }
      });
    }
  }, [orders]);

  // Function to apply all filters
  const applyFilters = () => {
    let result = [...orders];
    
    // Filter by tab (status)
    if (activeTab !== 'ALL') {
      result = result.filter(order => order.orderStatus === activeTab);
    } else {
      // For "All Orders" tab, sort so DELIVERED and CANCELLED appear at bottom
      result.sort((a, b) => {
        const statusPriority = {
          'DELIVERED': 1,
          'CANCELLED': 1,
          'ORDER PLACED': 0,
          'PROCESSING': 0,
          'OUT FOR DELIVERY': 0
        };
        return (statusPriority[a.orderStatus] || 0) - (statusPriority[b.orderStatus] || 0);
      });
    }
    
    // Filter by location
    if (selectedCountry) {
      result = result.filter(order => 
        order.deliveryAddress?.country?.toLowerCase() === selectedCountry.toLowerCase());
    }
    
    if (selectedState) {
      result = result.filter(order => 
        order.deliveryAddress?.state?.toLowerCase() === selectedState.toLowerCase());
    }
    
    if (selectedCity) {
      result = result.filter(order => 
        order.deliveryAddress?.city?.toLowerCase() === selectedCity.toLowerCase());
    }
    
    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === filterDate.getTime();
      });
    }
    
    // Filter by search query (email or order ID)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderId.toLowerCase().includes(query) ||
        order.userId?.email?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(result);
  };
  
  // Add debug info
  console.log("isAdmin value:", isAdmin);
  console.log("Role check details:", {
    user: user,
    role: user?.role,
    roleUppercase: user?.role?.toUpperCase(),
    isAdminCheck: user?.role?.toUpperCase() === 'ADMIN'
  });
  
  // Status options for dropdown
  const statusOptions = [
    { value: 'ORDER PLACED', label: 'Order Placed', icon: <FaBoxOpen className="text-blue-500" /> },
    { value: 'PROCESSING', label: 'Processing', icon: <FaCog className="text-yellow-500" /> },
    { value: 'OUT FOR DELIVERY', label: 'Out for Delivery', icon: <FaTruck className="text-orange-500" /> },
    { value: 'DELIVERED', label: 'Delivered', icon: <FaCheck className="text-green-500" /> },
    { value: 'CANCELLED', label: 'Cancelled', icon: <FaBan className="text-red-500" /> }
  ];

  // Add the missing fetchOrders function declaration
  const fetchOrders = async () => {
    // Check user permissions first
    if (!user || !user.role) {
      toast.error('User information not available. Please log in again.');
      return;
    }
    
    if (!isAdmin) {
      toast.error('You do not have permission to access this page');
      return;
    }
    
    setLoading(true);
    try {
      await fetchAllOrders(); // Use the global context function
      
      // We don't need to manually set orders from orderData here
      // The useEffect hook watching orderData will handle it
      toast.success('Orders loaded successfully');
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Update order status using the context function
  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const result = await contextUpdateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        // Update local state to reflect the change immediately for better UX
        setOrders(orders.map(order => 
          order.orderId === orderId 
            ? { ...order, orderStatus: newStatus }
            : order
        ));
        setFilteredOrders(filteredOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, orderStatus: newStatus }
            : order
        ));
        
        // The global context will refresh all orders to ensure consistency
      } else {
        // Handle specific error messages
        if (result.isBlocked) {
          toast.error(`${result.message}\nCancellation Status: ${result.cancellationStatus}`, {
            duration: 5000
          });
        } else {
          toast.error(result.message || 'Failed to update order status');
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };
  
  // Handle search - simplified to focus on email or order ID only
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    // The applyFilters function will handle the actual filtering
  };
  
  // Handle tab/status change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // The applyFilters function will handle the actual filtering
  };
  
  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    
    const sortedOrders = [...filteredOrders].sort((a, b) => {
      // Handle nested properties
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (!a[parent] || !b[parent]) return 0;
        
        if (direction === 'asc') {
          return a[parent][child] > b[parent][child] ? 1 : -1;
        } else {
          return a[parent][child] < b[parent][child] ? 1 : -1;
        }
      }
      
      // Handle dates
      if (key === 'orderDate') {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        
        if (direction === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      }
      
      // Handle regular properties
      if (direction === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      } else {
        return a[key] < b[key] ? 1 : -1;
      }
    });
    
    setFilteredOrders(sortedOrders);
  };

  // This effect is no longer needed as we're handling fetching in the user effect
  // useEffect(() => {
  //  fetchOrders();
  // }, []);
  
  // Get status icon and color
  const getStatusDisplay = (status) => {
    const statusInfo = statusOptions.find(option => option.value === status);
    if (!statusInfo) {
      return {
        icon: <FaBoxOpen className="text-gray-500" />,
        color: 'text-gray-500 bg-gray-100 border-gray-200'
      };
    }
    
    let colorClass;
    switch (status) {
      case 'ORDER PLACED':
        colorClass = 'text-blue-700 bg-blue-100 border-blue-200';
        break;
      case 'PROCESSING':
        colorClass = 'text-yellow-700 bg-yellow-100 border-yellow-200';
        break;
      case 'OUT FOR DELIVERY':
        colorClass = 'text-orange-700 bg-orange-100 border-orange-200';
        break;
      case 'DELIVERED':
        colorClass = 'text-green-700 bg-green-100 border-green-200';
        break;
      case 'CANCELLED':
        colorClass = 'text-red-700 bg-red-100 border-red-200';
        break;
      default:
        colorClass = 'text-gray-700 bg-gray-100 border-gray-200';
    }
    
    return {
      icon: statusInfo.icon,
      color: colorClass
    };
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short'
    }).format(date);
  };

  // Fetch refund status for a specific order
  const fetchRefundStatus = async (orderId) => {
    try {
      const response = await Axios({
        ...SummaryApi.getCancellationByOrderId,
        url: `${SummaryApi.getCancellationByOrderId.url}/${orderId}`
      });

      if (response.data.success && response.data.data) {
        const cancellationData = response.data.data;
        let refundStatus = 'NOT_APPLICABLE';
        
        if (cancellationData.status === 'APPROVED' || cancellationData.status === 'PROCESSED') {
          if (cancellationData.refundDetails?.refundStatus) {
            refundStatus = cancellationData.refundDetails.refundStatus;
          } else if (cancellationData.adminResponse?.refundAmount > 0) {
            refundStatus = 'PENDING';
          }
        } else if (cancellationData.status === 'REJECTED') {
          refundStatus = 'NOT_APPLICABLE';
        } else {
          refundStatus = 'AWAITING_APPROVAL';
        }

        setRefundStatuses(prev => ({
          ...prev,
          [orderId]: refundStatus
        }));
      }
    } catch (error) {
      console.error(`Error fetching refund status for order ${orderId}:`, error);
      setRefundStatuses(prev => ({
        ...prev,
        [orderId]: 'UNKNOWN'
      }));
    }
  };

  // Get refund status display
  const getRefundStatusDisplay = (orderId, orderStatus) => {
    if (orderStatus !== 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          N/A
        </span>
      );
    }

    const refundStatus = refundStatuses[orderId];
    
    if (!refundStatus) {
      // Fetch refund status if not already cached
      fetchRefundStatus(orderId);
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <FaSpinner className="animate-spin mr-1" size={10} />
          Loading...
        </span>
      );
    }

    switch (refundStatus) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <FaCheck className="mr-1" size={10} />
            Refunded
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <FaSpinner className="animate-spin mr-1" size={10} />
            Processing
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            <FaCreditCard className="mr-1" size={10} />
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <FaTimes className="mr-1" size={10} />
            Failed
          </span>
        );
      case 'AWAITING_APPROVAL':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <FaCog className="mr-1" size={10} />
            Awaiting Approval
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            N/A
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Unknown
          </span>
        );
    }
  };

  // Fetch countries for filter
  const fetchCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/positions");
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setCountries(data.data.map((c) => ({ name: c.name, code: c.iso2 || "" })));
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // Fetch states for the selected country
  const fetchStates = async (country) => {
    if (!country) return;

    setIsLoadingStates(true);
    setStates([]);
    setCities([]);

    try {
      console.log("Fetching states for country:", country);
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });

      const data = await response.json();
      console.log("States API response:", data);
      
      if (data.error) {
        console.error("API returned error:", data.msg);
        toast.error(`Error loading states: ${data.msg}`);
        // Similar to checkout page, provide a fallback for countries without state data
        setStates([{ name: country + " State", code: "default" }]);
      } else if (data.data && data.data.states) {
        console.log("Setting states:", data.data.states);
        // Normalize state objects to ensure they all have the same structure
        const normalizedStates = data.data.states.map(state => {
          // If the state is already an object with a name property, use it as is
          // Otherwise, convert it to an object with a name property
          if (typeof state === 'string') {
            return { name: state, code: state };
          } else if (typeof state === 'object' && state !== null) {
            return { name: state.name || state.state_name || "Unknown", code: state.state_code || "" };
          }
          return state;
        });
        
        setStates(normalizedStates);
      } else {
        console.warn("Unexpected response format for states:", data);
        // Fallback for error case
        setStates([{ name: country + " State", code: "default" }]);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      toast.error("Failed to load states. Please try again.");
    } finally {
      setIsLoadingStates(false);
    }
  };

  // Fetch cities for the selected state
  const fetchCities = async (country, state) => {
    if (!country || !state) return;

    setIsLoadingCities(true);
    setCities([]);

    try {
      // Get the state object's name property if it's an object, or use the string value directly
      const stateName = typeof state === 'object' ? state.name : state;
      
      console.log(`Fetching cities for ${country}, state:`, stateName);
      
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          country, 
          state: stateName 
        }),
      });

      const data = await response.json();
      console.log("Cities API response:", data);
      
      if (data.error) {
        console.error("API returned error:", data.msg);
        toast.error(`Error loading cities: ${data.msg}`);
      } else if (data.data && Array.isArray(data.data)) {
        console.log("Setting cities:", data.data);
        setCities(data.data);
      } else {
        console.warn("Unexpected response format for cities:", data);
        
        // Fallback method - similar to checkout page approach
        // If no cities are returned but we have a state, create at least a default city
        if (selectedState) {
          setCities([`${stateName} City`]);
        }
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities. Please try again.");
    } finally {
      setIsLoadingCities(false);
    }
  };
  
  // Check if user is not admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="bg-red-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
            <FaBan className="text-red-500 text-4xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access the admin dashboard.</p>
          <p className="text-gray-500 mb-4 text-sm">
            Current role: {user?.role || "Unknown"}
          </p>
          <a href="/" className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // Handle showing order details
  const handleShowOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    setOpenDropdownId(null); // Close dropdown when showing order details
  };

  // Handle closing order details modal
  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    // Refresh orders after closing modal to ensure we have the latest data
    fetchOrders();
  };

  console.log("Filtered orders:", filteredOrders);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Order Management</h1>
            <button
              onClick={fetchOrders}
              disabled={loading || refreshingOrders}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaRedo className={`w-4 h-4 ${loading || refreshingOrders ? 'animate-spin' : ''}`} />
              {loading || refreshingOrders ? 'Loading...' : 'Refresh Orders'}
            </button>
          </div>
          
          {/* Status Tabs */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <nav className="flex flex-nowrap -mb-px">
              <button
                className={`py-3 px-4 text-center border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === 'ALL' 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                onClick={() => handleTabChange('ALL')}
              >
                All Orders
              </button>
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  className={`py-3 px-4 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap
                    ${activeTab === option.value 
                      ? 'border-black text-black' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                  onClick={() => handleTabChange(option.value)}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Search and filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="col-span-1 lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by order ID or email..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            {/* Country filter */}
            <div className="col-span-1">
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState('');
                    setSelectedCity('');
                  }}
                  disabled={isLoadingCountries}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country.code || country.name} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {isLoadingCountries && (
                  <div className="absolute right-2 top-2 animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                )}
              </div>
            </div>
            
            {/* State filter */}
            <div className="col-span-1">
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const stateValue = e.target.value;
                    console.log("Selected state:", stateValue);
                    setSelectedState(stateValue);
                    setSelectedCity('');
                  }}
                  disabled={!selectedCountry || isLoadingStates}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
                >
                  <option value="">All States</option>
                  {states.map(state => (
                    <option key={state.name} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {states.length > 0 && (
                  <div className="absolute right-8 top-3 text-xs text-gray-500">
                    {states.length}
                  </div>
                )}
                {isLoadingStates && (
                  <div className="absolute right-2 top-2 animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                )}
              </div>
            </div>
            
            {/* City filter */}
            <div className="col-span-1">
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedState || isLoadingCities}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
                >
                  <option value="">All Cities</option>
                  {cities && cities.length > 0 ? (
                    cities.map((city, index) => (
                      <option key={`${city}-${index}`} value={city}>
                        {city}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No cities found</option>
                  )}
                </select>
                {cities.length > 0 && (
                  <div className="absolute right-8 top-3 text-xs text-gray-500">
                    {cities.length}
                  </div>
                )}
                {isLoadingCities && (
                  <div className="absolute right-2 top-2 animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                )}
              </div>
            </div>
            
            {/* Date filter */}
            <div className="col-span-1">
              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Sort options */}
          <div className="mt-4 flex items-center justify-end">
            <div className="relative w-48">
              <select
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onChange={(e) => {
                  const [key, direction] = e.target.value.split('-');
                  setSortConfig({ key, direction });
                  handleSort(key);
                }}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
              >
                <option value="orderDate-desc">Latest Orders</option>
                <option value="orderDate-asc">Oldest Orders</option>
                <option value="totalAmt-desc">Highest Amount</option>
                <option value="totalAmt-asc">Lowest Amount</option>
              </select>
              {sortConfig.direction === 'asc' ? (
                <FaSortAmountUp className="absolute left-3 top-3 text-gray-400" />
              ) : (
                <FaSortAmountDown className="absolute left-3 top-3 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Refund Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full mb-4"></div>
                        <p className="text-gray-500">Loading orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No orders found</p>
                        <p className="text-gray-400 mt-1 max-w-md text-center">
                          {activeTab !== 'ALL' 
                            ? `No orders with status "${statusOptions.find(opt => opt.value === activeTab)?.label}" found.` 
                            : "Try adjusting your filters or search criteria to find what you're looking for."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusDisplay = getStatusDisplay(order.orderStatus);
                    
                    // Debug log to understand order structure
                    if (order.orderId && order.orderId.includes('687a655d')) {
                      console.log('Order structure debug:', {
                        orderId: order.orderId,
                        items: order.items,
                        firstItem: order.items?.[0],
                        productDetails: order.productDetails,
                        bundleDetails: order.bundleDetails
                      });
                    }
                    
                    return (
                      <tr 
                        key={order.orderId} 
                        className={`hover:bg-gray-50 transition-colors ${
                          order.hasCancellationRequest ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{order.userId?.name}</span>
                              {order.hasCancellationRequest && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <FaExclamationTriangle className="w-3 h-3 mr-1" />
                                  Cancellation Request
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{order.userId?.email}</span>
                            {order.cancellationRequest && (
                              <div className="text-xs text-yellow-600 mt-1">
                                Status: {order.cancellationRequest.status} | Reason: {order.cancellationRequest.reason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                              {/* Enhanced image display logic */}
                              {(() => {
                                let imageUrl = null;
                                let altText = 'Product';
                                
                                // Check for items array first (new order structure)
                                if (order.items && order.items.length > 0) {
                                  const firstItem = order.items[0];
                                  
                                  // Check if productId is populated object
                                  if (firstItem.productId && typeof firstItem.productId === 'object') {
                                    imageUrl = firstItem.productId.image?.[0];
                                    altText = firstItem.productId.name || firstItem.productId.title || 'Product';
                                  }
                                  // Check productDetails
                                  else if (firstItem.productDetails?.image?.[0]) {
                                    imageUrl = firstItem.productDetails.image[0];
                                    altText = firstItem.productDetails.name || firstItem.productDetails.title || 'Product';
                                  }
                                  // Check bundleId is populated object
                                  else if (firstItem.bundleId && typeof firstItem.bundleId === 'object') {
                                    imageUrl = firstItem.bundleId.images?.[0];
                                    altText = firstItem.bundleId.title || firstItem.bundleId.name || 'Bundle';
                                  }
                                  // Check bundleDetails
                                  else if (firstItem.bundleDetails?.image?.[0]) {
                                    imageUrl = firstItem.bundleDetails.image[0];
                                    altText = firstItem.bundleDetails.title || firstItem.bundleDetails.name || 'Bundle';
                                  }
                                }
                                // Fall back to old structure
                                else if (order.productDetails?.image?.[0]) {
                                  imageUrl = order.productDetails.image[0];
                                  altText = order.productDetails.name || order.productDetails.title || 'Product';
                                }
                                
                                return imageUrl ? (
                                  <img 
                                    src={imageUrl}
                                    alt={altText}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <FaBox className="text-gray-400 text-lg" />
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {/* Enhanced product name resolution */}
                                  {(() => {
                                    // Check for items array first (new order structure)
                                    if (order.items && order.items.length > 0) {
                                      const firstItem = order.items[0];
                                      let productName = '';
                                      let isBundle = false;
                                      
                                      // Check if productId is populated object
                                      if (firstItem.productId && typeof firstItem.productId === 'object') {
                                        productName = firstItem.productId.name || firstItem.productId.title || 'Product';
                                      }
                                      // Check productDetails
                                      else if (firstItem.productDetails) {
                                        productName = firstItem.productDetails.name || firstItem.productDetails.title || 'Product';
                                      }
                                      // Check bundleDetails
                                      else if (firstItem.bundleDetails) {
                                        productName = firstItem.bundleDetails.title || firstItem.bundleDetails.name || 'Bundle';
                                        isBundle = true;
                                      }
                                      // Check if bundleId is populated object
                                      else if (firstItem.bundleId && typeof firstItem.bundleId === 'object') {
                                        productName = firstItem.bundleId.title || firstItem.bundleId.name || 'Bundle';
                                        isBundle = true;
                                      }
                                      // Check itemType
                                      else if (firstItem.itemType === 'bundle') {
                                        productName = 'Bundle Item';
                                        isBundle = true;
                                      } else if (firstItem.itemType === 'product') {
                                        productName = 'Product Item';
                                      }
                                      
                                      // If multiple items, show count
                                      if (order.items.length > 1) {
                                        productName += ` (+${order.items.length - 1} more)`;
                                      }
                                      
                                      return productName;
                                    }
                                    
                                    // Fall back to old structure
                                    if (order.productDetails) {
                                      return order.productDetails.name || order.productDetails.title || 'Product';
                                    }
                                    
                                    // Last resort
                                    return `${order.items?.length || 1} Item${order.items?.length > 1 ? 's' : ''}`;
                                  })()}
                                </span>
                                
                                {/* Bundle indicator */}
                                {(() => {
                                  if (order.items && order.items.length > 0) {
                                    const firstItem = order.items[0];
                                    const isBundle = firstItem.itemType === 'bundle' || 
                                                   firstItem.bundleId || 
                                                   firstItem.bundleDetails;
                                    
                                    if (isBundle) {
                                      return (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          Bundle
                                        </span>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </div>
                              
                              <span className="text-xs text-gray-500">{order.orderId}</span>
                              
                              {/* Bundle items preview */}
                              {(() => {
                                if (order.items && order.items.length > 0) {
                                  const firstItem = order.items[0];
                                  const isBundle = firstItem.itemType === 'bundle';
                                  
                                  if (isBundle) {
                                    // Get bundle items count
                                    let bundleItemsCount = 0;
                                    if (firstItem.bundleId && typeof firstItem.bundleId === 'object' && firstItem.bundleId.items) {
                                      bundleItemsCount = firstItem.bundleId.items.length;
                                    } else if (firstItem.bundleDetails && firstItem.bundleDetails.items) {
                                      bundleItemsCount = firstItem.bundleDetails.items.length;
                                    }
                                    
                                    if (bundleItemsCount > 0) {
                                      return (
                                        <span className="text-xs text-blue-600 mt-1">
                                          Contains {bundleItemsCount} items
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span className="text-xs text-amber-600 mt-1">
                                          Bundle details pending
                                        </span>
                                      );
                                    }
                                  }
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">₹{order.totalAmt.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-500">{formatDate(order.orderDate)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color} border`}>
                            {statusDisplay.icon}
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {getRefundStatusDisplay(order.orderId, order.orderStatus)}
                        </td>
                        <td className="px-4 py-4 text-right relative"> {/* Add relative positioning */}
                          <div className="relative inline-block text-left" data-dropdown="true">
                            <button 
                              className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === order.orderId ? null : order.orderId);
                              }}
                            >
                              <FaEllipsisV className="w-4 h-4 text-gray-500" />
                            </button>
                            
                            {/* Updated Dropdown menu with better z-index and positioning */}
                            <div 
                              data-dropdown="true"
                              className={`
                                absolute right-0 top-full mt-2 w-56 
                                rounded-md shadow-xl bg-white 
                                ring-1 ring-black ring-opacity-5 
                                focus:outline-none 
                                z-[9999]
                                transform transition-all duration-200 ease-out
                                ${openDropdownId === order.orderId 
                                  ? 'opacity-100 scale-100 visible' 
                                  : 'opacity-0 scale-95 invisible pointer-events-none'
                                }
                              `}
                              style={{
                                filter: 'drop-shadow(0 10px 15px -3px rgba(0, 0, 0, 0.1)) drop-shadow(0 4px 6px -2px rgba(0, 0, 0, 0.05))'
                              }}
                            >
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleShowOrderDetails(order);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-b border-gray-200 transition-colors"
                                >
                                  <FaEye className="text-blue-500" />
                                  View Order Details
                                </button>
                              
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 mt-1 bg-gray-50">
                                  Update Status
                                  {order.hasCancellationRequest && (
                                    <div className="flex items-center gap-1 text-yellow-600 mt-1">
                                      <FaExclamationTriangle className="w-3 h-3" />
                                      <span>Restricted - Cancellation Request</span>
                                    </div>
                                  )}
                                </div>
                                {statusOptions.map(option => (
                                  <button
                                    key={option.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!order.hasCancellationRequest) {
                                        updateOrderStatus(order.orderId, option.value);
                                        setOpenDropdownId(null);
                                      }
                                    }}
                                    disabled={
                                      updatingOrderId === order.orderId || 
                                      order.orderStatus === option.value || 
                                      order.hasCancellationRequest
                                    }
                                    className={`
                                      w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                                      ${order.orderStatus === option.value 
                                        ? 'bg-gray-100 text-gray-800' 
                                        : order.hasCancellationRequest
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                      } 
                                      ${updatingOrderId === order.orderId ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                    title={order.hasCancellationRequest ? 'Cannot modify order with active cancellation request' : ''}
                                  >
                                    {option.icon}
                                    {option.label}
                                    {order.orderStatus === option.value && (
                                      <span className="ml-auto text-xs bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded">
                                        Current
                                      </span>
                                    )}
                                    {order.hasCancellationRequest && (
                                      <FaExclamationTriangle className="ml-auto text-yellow-500 w-3 h-3" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer with stats */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredOrders.length}</span> of <span className="font-medium">{orders.length}</span> orders
              </div>
              
              {filteredOrders.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {activeTab === 'ALL' && statusOptions.map(option => {
                    const count = filteredOrders.filter(order => order.orderStatus === option.value).length;
                    if (count === 0) return null;
                    
                    return (
                      <div key={option.value} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" 
                        style={{ 
                          backgroundColor: option.value === 'DELIVERED' ? '#dcfce7' : 
                                          option.value === 'CANCELLED' ? '#fee2e2' :
                                          option.value === 'PROCESSING' ? '#fef3c7' :
                                          option.value === 'OUT FOR DELIVERY' ? '#ffedd5' : 
                                          '#dbeafe'
                        }}>
                        {option.icon}
                        <span>{option.label}: {count}</span>
                      </div>
                    );
                  })}
                  
                  {selectedCountry && (
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      Country: {selectedCountry}
                    </div>
                  )}
                  
                  {selectedState && (
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      State: {selectedState}
                    </div>
                  )}
                  
                  {selectedCity && (
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      City: {selectedCity}
                    </div>
                  )}
                  
                  {dateFilter && (
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      Date: {new Date(dateFilter).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <AdminOrderDetails 
            order={selectedOrder} 
            onClose={handleCloseOrderDetails}
          />
        )}
      </div>
    </div>
  )
}
export default AdminOrderDashboard;
