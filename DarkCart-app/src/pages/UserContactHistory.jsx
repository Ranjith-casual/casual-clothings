import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { baseURL } from '../common/SummaryApi';
import axios from 'axios';
import { FaEnvelope, FaCheck, FaClock, FaReply, FaEye, FaComment, FaExclamationTriangle, FaInfo, FaUserTie } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuthHeader } from '../store/userSlice';

const MySwal = withReactContent(Swal);

function UserContactHistory() {
  // Fix Redux state access - use state.user instead of state.auth
  const user = useSelector((state) => state?.user || {});
  
  // Determine authentication status based on user data
  const isAuthenticated = !!user && !!user._id && Object.keys(user).length > 0;
  
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch user's contact messages
  // State to trigger contact refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Function to manually refresh contacts
  const refreshContacts = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Get location state (might be passed when navigating from Contact component)
  const location = useLocation();
  
  // Check if we need to refresh on mount (e.g., after sending a new message)
  useEffect(() => {
    if (location.state?.refresh) {
      refreshContacts();
    }
  }, [location]);
  
  useEffect(() => {
    const fetchUserContacts = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Use our centralized auth header helper
        const authHeader = getAuthHeader();
        
        if (!authHeader.Authorization) {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'No authentication token found. Please login again.',
            confirmButtonColor: "#111827"
          });
          navigate('/login');
          throw new Error('No authentication token found');
        }
        
        const response = await axios.get(`${baseURL}/api/contact/user`, {
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
            Origin: window.location.origin
          }
        });
        
        if (response.data.success) {
          setContacts(response.data.data);
        } else {
          throw new Error('Failed to fetch contact messages');
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch your contact messages. Please try again later.',
          confirmButtonColor: '#111827'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserContacts();
  }, [isAuthenticated, user, navigate, refreshTrigger]);

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaClock className="mr-1" size={10} /> Pending
          </span>
        );
      case 'read':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaEye className="mr-1" size={10} /> Received
          </span>
        );
      case 'replied':
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaReply className="mr-1" size={10} /> Replied
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaCheck className="mr-1" size={10} /> Resolved
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaInfo className="mr-1" size={10} /> {status}
          </span>
        );
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaExclamationTriangle className="mr-1" size={10} /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FaInfo className="mr-1" size={10} /> High Priority
          </span>
        );
      case 'medium':
        return null;
      case 'low':
        return null;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <FaEnvelope className="mx-auto text-4xl text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your contact history.
            </p>
            <a
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link to="/about" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">Contact</Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">History</span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FaEnvelope className="mr-3 text-indigo-600" />
                My Contact History
              </h1>
              <p className="text-gray-600 mt-1">
                View your inquiries and our responses
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-gray-300 rounded-lg">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
                <FaEnvelope className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No contact history</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                You haven't sent any inquiries yet. If you need assistance, please use our contact form on the About page.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/about"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
                >
                  Go to Contact Form
                </a>
                <Link
                  to="/"
                  className="inline-block border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-6 rounded-md transition-colors"
                >
                  Return Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Contact List */}
              <div className="w-full md:w-1/3 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700">Your Messages</h3>
                </div>
                <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedContact && selectedContact._id === contact._id
                          ? 'bg-indigo-50 border-l-4 border-indigo-500'
                          : ''
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 truncate max-w-[200px]">
                          {contact.subject}
                        </h4>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {getStatusBadge(contact.status)}
                        {getPriorityBadge(contact.priority)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Detail */}
              <div className="w-full md:w-2/3 border border-gray-200 rounded-lg overflow-hidden">
                {selectedContact ? (
                  <div className="h-full flex flex-col">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-lg text-gray-900">{selectedContact.subject}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        Sent {new Date(selectedContact.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                      {/* Original Message */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="text-sm text-gray-500 mb-2">Your message:</div>
                        <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                      </div>

                      {/* Admin Replies */}
                      {selectedContact.adminReplies && selectedContact.adminReplies.filter(reply => reply.sentToUser).length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                            <FaReply className="mr-2 text-indigo-600" /> Responses
                          </h4>
                          <div className="space-y-4">
                            {selectedContact.adminReplies
                              .filter(reply => reply.sentToUser)
                              .map((reply, index) => (
                                <div 
                                  key={index} 
                                  className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 transition-all duration-200 hover:bg-indigo-100 hover:shadow-md"
                                >
                                  <div className="flex items-start">
                                    <FaUserTie className="text-indigo-700 mr-2 mt-1 flex-shrink-0" />
                                    <div>
                                      <div className="text-xs text-gray-500 mb-2">
                                        {new Date(reply.createdAt).toLocaleString()}
                                      </div>
                                      <p className="whitespace-pre-wrap">{reply.message}</p>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Public Admin Comments */}
                      {selectedContact.adminComments && selectedContact.adminComments.filter(comment => comment.displayToUser).length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                            <FaComment className="mr-2 text-green-600" /> Additional Information
                          </h4>
                          <div className="space-y-4">
                            {selectedContact.adminComments
                              .filter(comment => comment.displayToUser)
                              .map((comment, index) => (
                                <div 
                                  key={index} 
                                  className="bg-green-50 border border-green-100 rounded-lg p-4 transition-all duration-200 hover:bg-green-100 hover:shadow-md"
                                >
                                  <div className="flex items-start">
                                    <FaUserTie className="text-green-700 mr-2 mt-1 flex-shrink-0" />
                                    <div>
                                      <div className="text-xs text-gray-500 mb-2">
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </div>
                                      <p className="whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Replies Message */}
                      {(!selectedContact.adminReplies || selectedContact.adminReplies.filter(reply => reply.sentToUser).length === 0) && 
                       (!selectedContact.adminComments || selectedContact.adminComments.filter(comment => comment.displayToUser).length === 0) && (
                        <div className="text-center p-8">
                          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                            <FaClock className="h-6 w-6 text-yellow-600" />
                          </div>
                          <h4 className="mt-3 text-md font-medium text-gray-700">Awaiting Response</h4>
                          <p className="mt-2 text-sm text-gray-500">
                            We haven't responded to this message yet. We'll get back to you soon.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 border-t border-gray-200 text-center flex justify-center gap-3">
                      <Link 
                        to="/about#contact" 
                        className="inline-block bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                      >
                        Send Another Message
                      </Link>
                      <Link
                        to="/" 
                        className="inline-block bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors text-sm"
                      >
                        Return Home
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
                        <FaEnvelope className="h-8 w-8 text-indigo-600" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Select a message</h3>
                      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                        Choose a message from the list to view details and our responses.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserContactHistory;
