import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Upload, 
  Shield, 
  Clock,
  TrendingUp,
  FileText,
  Award,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getUserVerifications, getStatistics } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserDashboard = () => {
  const { user } = useAuth();
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [stats, setStats] = useState({
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setApiConnected(true);

      // Fetch user's verification history
      const userVerifications = await getUserVerifications(user?.id, { limit: 10 });
      
      // Handle different response formats
      const verifications = Array.isArray(userVerifications) 
        ? userVerifications 
        : userVerifications.verifications || [];
      
      setRecentVerifications(verifications);
      
      // Calculate user stats from verifications
      const successful = verifications.filter(v => 
        v.status === 'VERIFIED' || v.status === 'VERIFIED_BY_DATA'
      ).length;
      const failed = verifications.filter(v => v.status === 'FAILED').length;
      const total = verifications.length;
      
      setStats({
        totalVerifications: total,
        successfulVerifications: successful,
        failedVerifications: failed,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0
      });
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      setApiConnected(false);
      
      // Use localStorage as fallback for user data
      const savedVerifications = localStorage.getItem(`user_verifications_${user?.id}`);
      if (savedVerifications) {
        try {
          const verifications = JSON.parse(savedVerifications);
          setRecentVerifications(verifications);
          
          const successful = verifications.filter(v => 
            v.status === 'VERIFIED' || v.status === 'VERIFIED_BY_DATA'
          ).length;
          const failed = verifications.filter(v => v.status === 'FAILED').length;
          const total = verifications.length;
          
          setStats({
            totalVerifications: total,
            successfulVerifications: successful,
            failedVerifications: failed,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 0
          });
        } catch (parseError) {
          console.error('Error parsing saved verifications:', parseError);
          setRecentVerifications([]);
        }
      } else {
        setRecentVerifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to save verification to localStorage (fallback when API not available)
  const saveVerificationLocally = (verification) => {
    const savedVerifications = localStorage.getItem(`user_verifications_${user?.id}`);
    let verifications = [];
    
    if (savedVerifications) {
      try {
        verifications = JSON.parse(savedVerifications);
      } catch (error) {
        console.error('Error parsing saved verifications:', error);
      }
    }
    
    verifications.unshift(verification);
    verifications = verifications.slice(0, 10); // Keep only latest 10
    
    localStorage.setItem(`user_verifications_${user?.id}`, JSON.stringify(verifications));
  };

  const refreshData = () => {
    loadUserData();
  };

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

  const getStatusBadge = (status) => {
    const statusClasses = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'VERIFIED_BY_DATA': 'bg-blue-100 text-blue-800',
      'FAILED': 'bg-red-100 text-red-800',
      'CORRUPTED_HASH': 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ') || 'Unknown'}
      </span>
    );
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
      title: 'Verify Certificate',
      description: 'Upload and verify a certificate instantly',
      icon: CheckCircle,
      link: '/user/verify',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Upload Documents',
      description: 'Upload certificates for verification',
      icon: Upload,
      link: '/user/verify',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'View History',
      description: 'See all your verification attempts',
      icon: Clock,
      link: '/user/history',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const statCards = [
    {
      title: 'Total Verifications',
      value: stats.totalVerifications,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Successful',
      value: stats.successfulVerifications,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Failed',
      value: stats.failedVerifications,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

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
              <p className="text-yellow-800 font-medium">Using Offline Mode</p>
              <p className="text-yellow-700 text-sm">API connection failed. Showing cached data.</p>
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
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-secondary-600">
              Track your certificate verifications and manage your documents
            </p>
          </div>
          {apiConnected && (
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
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
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Verifications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Recent Verifications
            </h3>
            <Link
              to="/user/history"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          
          {recentVerifications.length > 0 ? (
            <div className="space-y-3">
              {recentVerifications.slice(0, 5).map((verification, index) => (
                <div
                  key={verification.id || index}
                  className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">
                      {verification.filename || verification.certificate_number || `Verification ${index + 1}`}
                    </p>
                    {verification.certificate_number && (
                      <p className="text-sm text-secondary-600">
                        {verification.certificate_number}
                      </p>
                    )}
                    <p className="text-xs text-secondary-500">
                      {formatDate(verification.timestamp || verification.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(verification.status || verification.verification_status)}
                    {verification.confidence && (
                      <p className="text-xs text-secondary-500 mt-1">
                        {Math.round(verification.confidence * 100)}% confidence
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-secondary-500">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg">No verifications yet</p>
                <p className="text-sm">Upload a certificate to get started</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className={`block p-4 rounded-lg border-2 ${action.borderColor} ${action.bgColor} hover:shadow-md transition-all duration-200 hover:scale-105`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary-900">
                        {action.title}
                      </h4>
                      <p className="text-secondary-600 text-sm">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Security Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Certificate Verification Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">✓ Upload high-quality images</p>
                <p className="text-blue-700">Use clear, well-lit photos for better accuracy</p>
              </div>
              <div>
                <p className="font-medium mb-1">✓ Check verification status</p>
                <p className="text-blue-700">Look for "VERIFIED" status for authentic certificates</p>
              </div>
              <div>
                <p className="font-medium mb-1">✓ Keep your certificates safe</p>
                <p className="text-blue-700">Store original documents securely</p>
              </div>
              <div>
                <p className="font-medium mb-1">✓ Report suspicious results</p>
                <p className="text-blue-700">Contact support if results seem incorrect</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8"
      >
        <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${apiConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-secondary-600">
              System Status: {apiConnected ? 'Online' : 'Offline Mode'}
            </span>
          </div>
          <div className="text-xs text-secondary-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;