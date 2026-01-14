import React, { useState, useEffect } from 'react';
import { 
  FaTshirt, 
  FaUsers, 
  FaChartBar, 
  FaMoneyBillWave,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaEye
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const CustomTshirtDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await Axios({
        ...SummaryApi.getCustomTshirtDashboardStats
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaTshirt className="text-3xl text-black" />
            <h1 className="text-3xl font-bold text-gray-900">Custom T-Shirt Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/admin/custom-tshirt-requests')}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FaEye />
            View All Requests
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalRequests || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaTshirt className="text-2xl text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <FaArrowUp className="text-green-500 mr-1" />
              <span className="text-green-600">{stats?.overview?.monthlyRequests || 0} this month</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">This Week</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.overview?.weeklyRequests || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCalendarAlt className="text-2xl text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">New requests this week</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats?.revenue?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaMoneyBillWave className="text-2xl text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">Avg: ₹{Math.round(stats?.revenue?.averageOrder || 0)}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Gender Diversity</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.genderStats?.length || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaUsers className="text-2xl text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">Gender categories served</span>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaChartBar className="text-blue-600" />
              Status Breakdown
            </h3>
            <div className="space-y-3">
              {stats?.statusBreakdown?.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(item._id)}`}>
                      {item._id}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{item.count}</div>
                    <div className="text-sm text-gray-500">
                      {((item.count / stats.overview.totalRequests) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gender Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUsers className="text-purple-600" />
              Gender Distribution
            </h3>
            <div className="space-y-3">
              {stats?.genderStats?.map((item, index) => {
                const colors = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500'];
                return (
                  <div key={item._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="font-medium">{item._id}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{item.count}</div>
                      <div className="text-sm text-gray-500">requests</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Popular Items Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Popular T-Shirt Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-4">Popular T-Shirt Types</h3>
            <div className="space-y-3">
              {stats?.tshirtTypeStats?.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="font-medium">{item._id}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(item.count / stats.tshirtTypeStats[0].count) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold min-w-[2rem]">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Popular Colors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-4">Popular Colors</h3>
            <div className="space-y-3">
              {stats?.colorStats?.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="font-medium">{item._id}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(item.count / stats.colorStats[0].count) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold min-w-[2rem]">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats?.recentRequests?.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{request.name}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ₹{request.estimatedPrice || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(request.createdAt), 'dd/MM/yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomTshirtDashboard;
