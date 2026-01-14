"use client"

import { useState, useEffect } from "react"
import {
  FaEnvelope,
  FaCheck,
  FaClock,
  FaReply,
  FaEye,
  FaTrash,
  FaStar,
  FaComment,
  FaExclamationTriangle,
  FaInfo,
} from "react-icons/fa"
import axios from "axios"
import { baseURL as importedBaseURL } from "../common/SummaryApi"
import Swal from "sweetalert2"
import { formatDistanceToNow } from "date-fns"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

// Ensure baseURL is defined, fallback to localhost:8080 if not
const baseURL = importedBaseURL || "http://localhost:8080"

function AdminContactManagement() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  // Fix Redux state access - use state.user instead of state.auth
  const user = useSelector((state) => state?.user || {})
  
  // Get token from Redux or localStorage
  const reduxToken = user?.token || null
  const localStorageToken = localStorage.getItem("token")
  
  // Use token from Redux first, then from localStorage
  const token = reduxToken || localStorageToken
  
  // Save token to localStorage if it exists in Redux but not in localStorage
  useEffect(() => {
    if (reduxToken && !localStorageToken) {
      console.log("Saving token from Redux to localStorage")
      localStorage.setItem("token", reduxToken)
    }
  }, [reduxToken, localStorageToken])

  // Determine authentication status based on user data
  const isAuthenticated = !!user && !!user._id && Object.keys(user).length > 0
  const hasToken = !!token

  console.log("Auth State from Redux:", {
    user,
    isAuthenticated,
    userRole: user?.role || "none",
    hasToken,
    tokenSource: reduxToken ? "redux" : localStorageToken ? "localStorage" : "none",
  })

  const [filter, setFilter] = useState("all")
  const [selectedContact, setSelectedContact] = useState(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [internalComment, setInternalComment] = useState("")
  const [sendToUser, setSendToUser] = useState(true)
  const [publicComment, setPublicComment] = useState(false)
  const [displayToUser, setDisplayToUser] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date-desc")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  console.log("baseURL:", baseURL)
  
  // Set up axios interceptor for authentication
  useEffect(() => {
    console.log("Setting up Axios interceptor")
    
    // Create a request interceptor to automatically add auth token
    const interceptor = axios.interceptors.request.use(
      (config) => {
        // Get token using our enhanced function
        const token = getAuthToken()
        
        if (token) {
          // Add the Authorization header to the request if not already present
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`
          }
          console.log("Axios interceptor added token to request")
        } else {
          console.warn("Axios interceptor: No token available for request")
        }
        
        return config
      },
      (error) => {
        console.error("Axios request interceptor error:", error)
        return Promise.reject(error)
      }
    )
    
    // Clean up the interceptor when the component unmounts
    return () => {
      axios.interceptors.request.eject(interceptor)
      console.log("Axios interceptor cleaned up")
    }
  }, []) // Empty dependency array means this only runs once on mount
  
  // Enhanced helper function to get the auth token consistently
  const getAuthToken = () => {
    console.log("Getting authentication token...")
    
    // 1. Try to get token from Redux state first (freshest source)
    if (user && user.token) {
      console.log("Token found in Redux state")
      
      // Save to localStorage for persistence
      localStorage.setItem("token", user.token)
      
      return user.token
    }
    
    // 2. Try to get token from localStorage as fallback
    const localToken = localStorage.getItem("token")
    if (localToken) {
      console.log("Token found in localStorage")
      return localToken
    }
    
    // 3. No token found in any source
    console.error("No authentication token found in Redux or localStorage")
    return null
  }

  // Fetch all contact messages
  useEffect(() => {
    const fetchContacts = async () => {
      console.log("Fetch Contacts - Auth State:", { isAuthenticated, user, hasToken })

      // Check authentication - we only need isAuthenticated since hasToken might be false in certain cases
      // when the user is actually logged in through Redux
      if (!isAuthenticated) {
        console.log("No authentication detected")
        setLoading(false)
        Swal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "You need to be logged in to access this page.",
          confirmButtonColor: "#111827",
        }).then(() => {
          navigate("/login")
        })
        return
      }

      // Check if user has admin role
      const isAdmin = user.role === "ADMIN" || user.role === "admin" || user.isAdmin === true

      console.log("Admin check:", { role: user.role, isAdmin })

      if (!isAdmin) {
        setLoading(false)
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "You need administrator privileges to access this page.",
          confirmButtonColor: "#111827",
        })
        return
      }

      setLoading(true)
      try {
        // Get token using our enhanced function
        const token = getAuthToken()
        
        // If there's still no token, we need to handle this explicitly
        if (!token) {
          console.error("Authentication token not found in Redux or localStorage")
          
          // Check if we should try to extract token from user object directly
          if (user && typeof user === 'object') {
            console.log("Attempting to extract token from user object properties:", Object.keys(user))
            
            // Look for common token property names in user object
            const possibleTokens = [
              user.token,
              user.accessToken,
              user.authToken,
              user.jwt,
              user.idToken
            ].filter(Boolean)
            
            if (possibleTokens.length > 0) {
              console.log("Found potential token in user object")
              localStorage.setItem("token", possibleTokens[0])
              
              // Retry with the newly found token
              return fetchContacts()
            }
          }
          
          // If all token retrieval methods failed, show a helpful error to the user
          Swal.fire({
            icon: "error",
            title: "Authentication Problem",
            text: "Your session appears to be invalid. Please log out and log in again.",
            confirmButtonColor: "#111827",
            showCancelButton: true,
            confirmButtonText: "Go to Login",
            cancelButtonText: "Stay Here"
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/login")
            }
          })
          
          throw new Error("No authentication token found. Please log in again.")
        }

        console.log("Making API call with token:", token.substring(0, 10) + "...")

        // Remove the Origin header - browsers don't allow setting it manually
        const response = await axios.get(`${baseURL}/api/contact/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        })

        console.log("API Response:", response.data)

        if (response.data && response.data.success) {
          setContacts(response.data.data || [])
        } else {
          throw new Error(response.data?.message || "Failed to fetch contact messages")
        }
      } catch (error) {
        console.error("Error fetching contacts:", error)

        if (error.response) {
          console.log("Response error status:", error.response.status)
          console.log("Response error data:", error.response.data)

          if (error.response.status === 401) {
            // Authentication error
            localStorage.removeItem("token")
            Swal.fire({
              icon: "error",
              title: "Session Expired",
              text: "Your session has expired. Please log in again.",
              confirmButtonColor: "#111827",
            }).then(() => {
              navigate("/login")
            })
          } else if (error.response.status === 403) {
            // Forbidden - insufficient permissions
            Swal.fire({
              icon: "error",
              title: "Access Denied",
              text: "You do not have permission to access this resource.",
              confirmButtonColor: "#111827",
            })
          } else {
            // Other HTTP error
            Swal.fire({
              icon: "error",
              title: "Server Error",
              text: `Error ${error.response.status}: ${error.response.data?.message || "Unable to fetch contact messages."}`,
              confirmButtonColor: "#111827",
            })
          }
        } else if (error.request) {
          // Network error
          console.log("Network error:", error.request)
          Swal.fire({
            icon: "error",
            title: "Network Error",
            text: "Unable to connect to the server. Please check your internet connection.",
            confirmButtonColor: "#111827",
          })
        } else {
          // Other error
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "Failed to fetch contact messages. Please try again later.",
            confirmButtonColor: "#111827",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [refreshTrigger, isAuthenticated, user, hasToken, navigate])

  // Handle status update
  const handleStatusUpdate = async (contactId, newStatus) => {
    try {
      const token = getAuthToken()
      const response = await axios.put(
        `${baseURL}/api/contact/${contactId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data && response.data.success) {
        // Update local state
        setContacts(
          contacts.map((contact) => (contact._id === contactId ? { ...contact, status: newStatus } : contact)),
        )

        // Update selected contact if it's the one being modified
        if (selectedContact && selectedContact._id === contactId) {
          setSelectedContact({ ...selectedContact, status: newStatus })
        }

        Swal.fire({
          icon: "success",
          title: "Status Updated",
          text: `Message status has been updated to ${newStatus}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        })
      } else {
        throw new Error(response.data?.message || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update message status",
        confirmButtonColor: "#111827",
      })
    }
  }

  // Handle priority update
  const handlePriorityUpdate = async (contactId, newPriority) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.put(
        `${baseURL}/api/contact/${contactId}/status`,
        { priority: newPriority },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data && response.data.success) {
        // Update local state
        setContacts(
          contacts.map((contact) => (contact._id === contactId ? { ...contact, priority: newPriority } : contact)),
        )

        // Update selected contact if it's the one being modified
        if (selectedContact && selectedContact._id === contactId) {
          setSelectedContact({ ...selectedContact, priority: newPriority })
        }

        Swal.fire({
          icon: "success",
          title: "Priority Updated",
          text: `Message priority has been set to ${newPriority}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        })
      } else {
        throw new Error(response.data?.message || "Failed to update priority")
      }
    } catch (error) {
      console.error("Error updating priority:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update message priority",
        confirmButtonColor: "#111827",
      })
    }
  }

  // Handle send reply
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Empty Message",
        text: "Please enter a reply message",
        confirmButtonColor: "#111827",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${baseURL}/api/contact/${selectedContact._id}/reply`,
        {
          message: replyMessage,
          sendToUser,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data && response.data.success) {
        // Update local state
        setRefreshTrigger((prev) => prev + 1)
        setReplyMessage("")

        Swal.fire({
          icon: "success",
          title: "Reply Sent",
          text: sendToUser ? "Your reply has been sent to the user" : "Your reply has been saved",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        })

        // Update selected contact
        if (response.data.data) {
          setSelectedContact(response.data.data)
        }
      } else {
        throw new Error(response.data?.message || "Failed to send reply")
      }
    } catch (error) {
      console.error("Error sending reply:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to send reply",
        confirmButtonColor: "#111827",
      })
    }
  }

  // Handle add comment
  const handleAddComment = async () => {
    if (!internalComment.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Empty Comment",
        text: "Please enter a comment",
        confirmButtonColor: "#111827",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${baseURL}/api/contact/${selectedContact._id}/comment`,
        {
          text: internalComment,
          isPublic: publicComment,
          displayToUser: publicComment && displayToUser,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data && response.data.success) {
        // Update local state
        setRefreshTrigger((prev) => prev + 1)
        setInternalComment("")

        Swal.fire({
          icon: "success",
          title: "Comment Added",
          text: publicComment ? "Your public comment has been added" : "Your internal comment has been added",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        })

        // Update selected contact
        if (response.data.data) {
          setSelectedContact(response.data.data)
        }
      } else {
        throw new Error(response.data?.message || "Failed to add comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add comment",
        confirmButtonColor: "#111827",
      })
    }
  }

  // Handle delete contact
  const handleDeleteContact = async (contactId) => {
    const result = await Swal.fire({
      title: "Delete Contact Message",
      text: "Are you sure you want to delete this contact message? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#111827",
    })

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.delete(`${baseURL}/api/contact/${contactId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.data && response.data.success) {
          // Update local state
          setContacts(contacts.filter((contact) => contact._id !== contactId))

          // Clear selected contact if it was deleted
          if (selectedContact && selectedContact._id === contactId) {
            setSelectedContact(null)
          }

          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "Contact message has been deleted successfully",
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          })
        } else {
          throw new Error(response.data?.message || "Failed to delete message")
        }
      } catch (error) {
        console.error("Error deleting contact:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to delete contact message",
          confirmButtonColor: "#111827",
        })
      }
    }
  }

  // Filter contacts based on status
  const filteredContacts = contacts.filter((contact) => {
    // First apply status filter
    if (filter !== "all" && contact.status !== filter) {
      return false
    }

    // Then apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        (contact.fullName && contact.fullName.toLowerCase().includes(search)) ||
        (contact.email && contact.email.toLowerCase().includes(search)) ||
        (contact.subject && contact.subject.toLowerCase().includes(search)) ||
        (contact.message && contact.message.toLowerCase().includes(search))
      )
    }

    return true
  })

  // Sort contacts based on sortBy value
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.createdAt) - new Date(b.createdAt)
      case "date-desc":
        return new Date(b.createdAt) - new Date(a.createdAt)
      case "priority-high":
        const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 }
        return priorityOrder[b.priority || "medium"] - priorityOrder[a.priority || "medium"]
      case "priority-low":
        const priorityOrderAsc = { urgent: 3, high: 2, medium: 1, low: 0 }
        return priorityOrderAsc[a.priority || "medium"] - priorityOrderAsc[b.priority || "medium"]
      case "name-asc":
        return (a.fullName || "").localeCompare(b.fullName || "")
      case "name-desc":
        return (b.fullName || "").localeCompare(a.fullName || "")
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaClock className="mr-1" size={10} /> Pending
          </span>
        )
      case "read":
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaEye className="mr-1" size={10} /> Read
          </span>
        )
      case "replied":
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaReply className="mr-1" size={10} /> Replied
          </span>
        )
      case "resolved":
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaCheck className="mr-1" size={10} /> Resolved
          </span>
        )
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaInfo className="mr-1" size={10} /> {status}
          </span>
        )
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaExclamationTriangle className="mr-1" size={10} /> Urgent
          </span>
        )
      case "high":
        return (
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaStar className="mr-1" size={10} /> High
          </span>
        )
      case "medium":
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaInfo className="mr-1" size={10} /> Medium
          </span>
        )
      case "low":
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaInfo className="mr-1" size={10} /> Low
          </span>
        )
      default:
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaInfo className="mr-1" size={10} /> Medium
          </span>
        )
    }
  }

  // Toggle dropdown visibility
  const toggleDropdown = (dropdownId) => {
    const dropdown = document.getElementById(dropdownId)
    if (dropdown) {
      dropdown.classList.toggle("hidden")
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const statusDropdown = document.getElementById("statusDropdown")
      const priorityDropdown = document.getElementById("priorityDropdown")

      if (statusDropdown && !statusDropdown.contains(event.target)) {
        statusDropdown.classList.add("hidden")
      }
      if (priorityDropdown && !priorityDropdown.contains(event.target)) {
        priorityDropdown.classList.add("hidden")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white shadow-md border border-gray-200 p-6 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FaEnvelope className="mr-3 text-indigo-600" />
                Contact Management
              </h1>
              <p className="text-gray-600 mt-1">Manage and respond to customer inquiries and messages</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="border border-gray-300 rounded-md p-2 pl-8 w-full sm:w-auto focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 absolute left-2 top-2.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <select
                className="border border-gray-300 rounded-md p-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="priority-high">Highest Priority</option>
                <option value="priority-low">Lowest Priority</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
              <button
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <div className="flex flex-wrap -mb-px">
              <button
                className={`mr-2 inline-block py-2 px-4 border-b-2 font-medium text-sm ${
                  filter === "all"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setFilter("all")}
              >
                All Messages
              </button>
              <button
                className={`mr-2 inline-block py-2 px-4 border-b-2 font-medium text-sm ${
                  filter === "pending"
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setFilter("pending")}
              >
                <div className="flex items-center">
                  <FaClock className="mr-1" />
                  Pending
                </div>
              </button>
              <button
                className={`mr-2 inline-block py-2 px-4 border-b-2 font-medium text-sm ${
                  filter === "read"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setFilter("read")}
              >
                <div className="flex items-center">
                  <FaEye className="mr-1" />
                  Read
                </div>
              </button>
              <button
                className={`mr-2 inline-block py-2 px-4 border-b-2 font-medium text-sm ${
                  filter === "replied"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setFilter("replied")}
              >
                <div className="flex items-center">
                  <FaReply className="mr-1" />
                  Replied
                </div>
              </button>
              <button
                className={`mr-2 inline-block py-2 px-4 border-b-2 font-medium text-sm ${
                  filter === "resolved"
                    ? "border-gray-500 text-gray-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setFilter("resolved")}
              >
                <div className="flex items-center">
                  <FaCheck className="mr-1" />
                  Resolved
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Contact List */}
          <div className="w-full lg:w-1/3 bg-white shadow-md border border-gray-200 rounded-lg p-4 h-[calc(100vh-220px)] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">
              Contact Messages
              {filteredContacts.length > 0 && (
                <span className="text-gray-500 text-sm font-normal ml-2">({filteredContacts.length})</span>
              )}
            </h2>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedContacts.length === 0 ? (
                  <div className="text-center p-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                      <FaEnvelope className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? "No messages match your search criteria."
                        : "There are no messages in this category."}
                    </p>
                  </div>
                ) : (
                  sortedContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className={`border rounded-lg p-3 hover:border-indigo-300 transition-all cursor-pointer ${
                        selectedContact && selectedContact._id === contact._id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => {
                        setSelectedContact(contact)
                        if (contact.status === "pending") {
                          handleStatusUpdate(contact._id, "read")
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 truncate max-w-[200px]">
                          {contact.fullName || "Unknown"}
                        </h3>
                        <div className="text-xs text-gray-500">
                          {contact.createdAt
                            ? formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })
                            : ""}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">{contact.subject || "No subject"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        {getStatusBadge(contact.status)}
                        {getPriorityBadge(contact.priority || "medium")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Message Detail View */}
          <div className="w-full lg:w-2/3 bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
            {selectedContact ? (
              <div className="h-[calc(100vh-220px)] flex flex-col">
                {/* Message Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedContact.subject || "No Subject"}</h2>
                      <div className="flex items-center mt-1 gap-2">
                        <span className="text-sm text-gray-600">{selectedContact.fullName || "Unknown"}</span>
                        <span className="text-xs text-gray-500">({selectedContact.email || "No email"})</span>
                      </div>
                      <div className="flex items-center mt-2 gap-2">
                        <span className="text-xs text-gray-500">
                          Received{" "}
                          {selectedContact.createdAt
                            ? new Date(selectedContact.createdAt).toLocaleString()
                            : "Unknown date"}
                        </span>
                        {getStatusBadge(selectedContact.status)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors"
                          onClick={() => toggleDropdown("statusDropdown")}
                        >
                          <span className="text-xs font-medium mr-1">Status</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <div
                          id="statusDropdown"
                          className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 p-1 z-10 hidden"
                        >
                          <button
                            onClick={() => handleStatusUpdate(selectedContact._id, "pending")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaClock className="mr-2 text-yellow-500" />
                            Mark as Pending
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(selectedContact._id, "read")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaEye className="mr-2 text-blue-500" />
                            Mark as Read
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(selectedContact._id, "replied")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaReply className="mr-2 text-green-500" />
                            Mark as Replied
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(selectedContact._id, "resolved")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaCheck className="mr-2 text-gray-500" />
                            Mark as Resolved
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors"
                          onClick={() => toggleDropdown("priorityDropdown")}
                        >
                          <span className="text-xs font-medium mr-1">Priority</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <div
                          id="priorityDropdown"
                          className="absolute right-0 mt-1 w-40 bg-white shadow-lg rounded-md border border-gray-200 p-1 z-10 hidden"
                        >
                          <button
                            onClick={() => handlePriorityUpdate(selectedContact._id, "low")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaInfo className="mr-2 text-green-500" />
                            Low Priority
                          </button>
                          <button
                            onClick={() => handlePriorityUpdate(selectedContact._id, "medium")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaInfo className="mr-2 text-blue-500" />
                            Medium Priority
                          </button>
                          <button
                            onClick={() => handlePriorityUpdate(selectedContact._id, "high")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaStar className="mr-2 text-orange-500" />
                            High Priority
                          </button>
                          <button
                            onClick={() => handlePriorityUpdate(selectedContact._id, "urgent")}
                            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <FaExclamationTriangle className="mr-2 text-red-500" />
                            Urgent Priority
                          </button>
                        </div>
                      </div>

                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={() => handleDeleteContact(selectedContact._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Original Message */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{selectedContact.message || "No message content"}</p>
                    </div>
                  </div>

                  {/* Admin Replies */}
                  {selectedContact.adminReplies && selectedContact.adminReplies.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-semibold mb-2 text-gray-700 flex items-center">
                        <FaReply className="mr-2" /> Admin Replies
                      </h3>
                      <div className="space-y-3">
                        {selectedContact.adminReplies.map((reply, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${reply.sentToUser ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`text-xs font-medium ${reply.sentToUser ? "text-blue-700" : "text-gray-700"}`}
                              >
                                {reply.sentToUser ? "Sent to User" : "Internal Reply"} •{" "}
                                {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : "Unknown date"}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.message || "No message"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Comments */}
                  {selectedContact.adminComments && selectedContact.adminComments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-semibold mb-2 text-gray-700 flex items-center">
                        <FaComment className="mr-2" /> Admin Comments
                      </h3>
                      <div className="space-y-3">
                        {selectedContact.adminComments.map((comment, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              comment.displayToUser
                                ? "bg-green-50 border border-green-200"
                                : comment.isPublic
                                  ? "bg-blue-50 border border-blue-200"
                                  : "bg-gray-50 border border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`text-xs font-medium ${
                                    comment.displayToUser
                                      ? "text-green-700"
                                      : comment.isPublic
                                        ? "text-blue-700"
                                        : "text-gray-700"
                                  }`}
                                >
                                  {comment.displayToUser
                                    ? "Customer Visible"
                                    : comment.isPublic
                                      ? "Staff Only"
                                      : "Internal Comment"}{" "}
                                  • {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown date"}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.text || "No comment"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply and Comment Form */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-2 text-sm font-medium rounded-t-md ${
                        !selectedContact.showCommentForm
                          ? "bg-indigo-50 text-indigo-700 border-t border-l border-r border-indigo-300"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setSelectedContact({ ...selectedContact, showCommentForm: false })}
                    >
                      <FaReply className="inline mr-1" /> Reply
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium rounded-t-md ${
                        selectedContact.showCommentForm
                          ? "bg-indigo-50 text-indigo-700 border-t border-l border-r border-indigo-300"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setSelectedContact({ ...selectedContact, showCommentForm: true })}
                    >
                      <FaComment className="inline mr-1" /> Add Comment
                    </button>
                  </div>

                  {!selectedContact.showCommentForm ? (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-b-md rounded-tr-md p-3">
                      <textarea
                        className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                        rows="3"
                        placeholder="Type your reply here..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                      ></textarea>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sendToUser"
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                            checked={sendToUser}
                            onChange={(e) => setSendToUser(e.target.checked)}
                          />
                          <label htmlFor="sendToUser" className="ml-2 text-sm text-gray-700">
                            Send email to user
                          </label>
                        </div>
                        <button
                          className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                          onClick={handleSendReply}
                        >
                          {sendToUser ? "Send Reply" : "Save Reply"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-b-md rounded-tl-md p-3">
                      <textarea
                        className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                        rows="3"
                        placeholder="Add an internal comment..."
                        value={internalComment}
                        onChange={(e) => setInternalComment(e.target.value)}
                      ></textarea>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="publicComment"
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                              checked={publicComment}
                              onChange={(e) => setPublicComment(e.target.checked)}
                            />
                            <label htmlFor="publicComment" className="ml-2 text-sm text-gray-700">
                              Make comment public (visible to staff)
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="displayToUser"
                              className="rounded text-green-600 focus:ring-green-500"
                              checked={publicComment && displayToUser}
                              onChange={(e) => setDisplayToUser(e.target.checked)}
                              disabled={!publicComment}
                            />
                            <label htmlFor="displayToUser" className="ml-2 text-sm text-gray-700">
                              Display comment to customer
                            </label>
                          </div>
                        </div>
                        <button
                          className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                          onClick={handleAddComment}
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[calc(100vh-220px)] flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
                    <FaEnvelope className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No message selected</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                    Select a contact message from the list to view its details, reply to the user, or add internal
                    comments.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminContactManagement
