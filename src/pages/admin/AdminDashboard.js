import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Users,
  TrendingUp,
  Activity,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStatistics, getCertificates } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentCertificates, setRecentCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setApiConnected(true);
      
      // Fetch statistics from real API
      const statsData = await getStatistics();
      setStats(statsData);

      // Fetch recent certificates from real API
      const certificatesData = await getCertificates({ 
        limit: 5,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      // Handle both array and object responses
      const certificates = Array.isArray(certificatesData) 
        ? certificatesData 
        : certificatesData.certificates || [];
        
      setRecentCertificates(certificates);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setApiConnected(false);
      
      // Only use mock data as absolute fallback
      console.warn('Using mock data as fallback - API connection failed');
      setStats({
        total_certificates: 0,
        total_verifications: 0,
        status_distribution: {
          VERIFIED: 0,
          VERIFIED_BY_DATA: 0,
          FAILED: 0,
          CORRUPTED_HASH: 0
        },
        database_size_bytes: 0,
        recent_activity: {
          uploads_today: 0,
          verifications_today: 0,
          success_rate: 0
        }
      });
      
      setRecentCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const refreshData = () => {
    fetchDashboardData();
  };

  // Helper function to format bytes - moved before use
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Upload Certificates',
      description: 'Upload new certificates for processing',
      icon: Upload,
      link: '/admin/upload',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'View Database',
      description: 'Browse all certificates in the system',
      icon: Database,
      link: '/admin/database',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Verify Certificates',
      description: 'Verify and validate certificates',
      icon: CheckCircle,
      link: '/admin/verify',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const statCards = [
    {
      title: 'Total Certificates',
      value: stats?.total_certificates || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: stats?.recent_activity?.uploads_today ? `+${stats.recent_activity.uploads_today} today` : null
    },
    {
      title: 'Total Verifications',
      value: stats?.total_verifications || 0,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: stats?.recent_activity?.verifications_today ? `+${stats.recent_activity.verifications_today} today` : null
    },
    {
      title: 'Success Rate',
      value: stats?.status_distribution && stats?.total_certificates > 0 ? 
        `${Math.round(((stats.status_distribution.VERIFIED + stats.status_distribution.VERIFIED_BY_DATA) / stats.total_certificates) * 100)}%` : 
        '0%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: stats?.recent_activity?.success_rate ? `${stats.recent_activity.success_rate}% avg` : null
    },
    {
      title: 'Database Size',
      value: stats?.database_size_bytes ? 
        formatBytes(stats.database_size_bytes) : 
        '0 B',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prepare chart data from real API response
  const statusData = stats?.status_distribution ? 
    Object.entries(stats.status_distribution)
      .filter(([status, count]) => count > 0) // Only show non-zero counts
      .map(([status, count]) => ({
        name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        percentage: stats.total_certificates > 0 ? Math.round((count / stats.total_certificates) * 100) : 0
      })) : [];

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* API Connection Status */}
      {!apiConnected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-yellow-800 font-medium">API Connection Failed</p>
              <p className="text-yellow-700 text-sm">Displaying cached/demo data. Check if the backend is running on port 8000.</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md text-sm font-medium transition-colors"
          >
            Retry Connection
          </button>
        </motion.div>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-secondary-600">
              Manage and monitor the certificate verification system
            </p>
          </div>
          {apiConnected && (
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p className="text-xs text-secondary-500 mt-1">
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Status Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Verification Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} certificates`, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-secondary-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
                {apiConnected && (
                  <p className="text-sm">Upload some certificates to see statistics</p>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Certificates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="card"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Recent Certificates
            </h3>
            <Link
              to="/admin/database"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          
          {recentCertificates.length > 0 ? (
            <div className="space-y-3">
              {recentCertificates.slice(0, 5).map((cert, index) => (
                <div
                  key={cert.certificate_number || index}
                  className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">
                      {cert.certificate_number || `Certificate ${index + 1}`}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {cert.certificate_data?.['Student Name'] || 'Unknown Student'}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {cert.created_at ? new Date(cert.created_at).toLocaleDateString() : 'Unknown Date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cert.verification_status === 'VERIFIED' 
                        ? 'bg-green-100 text-green-800'
                        : cert.verification_status === 'VERIFIED_BY_DATA'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cert.verification_status || 'Unknown'}
                    </span>
                    {cert.confidence && (
                      <p className="text-xs text-secondary-500 mt-1">
                        {Math.round(cert.confidence * 100)}% confidence
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-secondary-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No certificates found</p>
                {apiConnected && (
                  <p className="text-sm">Upload certificates to see them here</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mb-8"
      >
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className={`block p-6 rounded-lg border-2 ${action.borderColor} ${action.bgColor} hover:shadow-md transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-secondary-900">
                    {action.title}
                  </h4>
                </div>
                <p className="text-secondary-600 text-sm">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;