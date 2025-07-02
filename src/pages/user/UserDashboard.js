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
  RefreshCw,
  Calendar,
  Download,
  Eye,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getUserVerifications, getStatistics } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const UserDashboard = () => {
  const { user } = useAuth();
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [allVerifications, setAllVerifications] = useState([]);
  const [stats, setStats] = useState({
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Demo data for fallback
  const demoVerifications = [
    {
      id: 1,
      filename: "BSC-28120_certificate.pdf",
      certificate_number: "BSC-28120",
      status: "VERIFIED",
      confidence: 0.98,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      message: "Certificate verified successfully through hash matching",
      certificate_exists_in_ledger: true
    },
    {
      id: 2,
      filename: "CERT-20250702_103145.png",
      certificate_number: "CERT-20250702_103145",
      status: "VERIFIED_BY_DATA",
      confidence: 0.95,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      message: "Certificate verified through data extraction and matching",
      certificate_exists_in_ledger: true
    },
    {
      id: 3,
      filename: "invalid_certificate.jpg",
      certificate_number: null,
      status: "FAILED",
      confidence: 0.12,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: "Certificate could not be verified - invalid format or corrupted data",
      certificate_exists_in_ledger: false
    },
    {
      id: 4,
      filename: "BSC-24116_degree.pdf",
      certificate_number: "BSC-24116",
      status: "VERIFIED",
      confidence: 0.99,
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      message: "Certificate verified successfully with high confidence",
      certificate_exists_in_ledger: true
    },
    {
      id: 5,
      filename: "corrupted_hash.png",
      certificate_number: "CERT-UNKNOWN",
      status: "CORRUPTED_HASH",
      confidence: 0.45,
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      message: "Hash extraction failed - certificate may be corrupted",
      certificate_exists_in_ledger: false
    }
  ];

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setApiConnected(true);

      // Try to fetch user's verification history from API
      const userVerifications = await getUserVerifications(user?.id, { limit: 10 });
      
      // Handle different response formats
      const verifications = Array.isArray(userVerifications) 
        ? userVerifications 
        : userVerifications.verifications || [];
      
      if (verifications.length > 0) {
        setRecentVerifications(verifications);
        setAllVerifications(verifications);
        calculateStats(verifications);
      } else {
        // Use demo data as fallback
        setRecentVerifications(demoVerifications);
        setAllVerifications(demoVerifications);
        calculateStats(demoVerifications);
      }
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      setApiConnected(false);
      
      // Use localStorage as fallback for user data
      const savedVerifications = localStorage.getItem(`user_verifications_${user?.id}`);
      if (savedVerifications) {
        try {
          const verifications = JSON.parse(savedVerifications);
          setRecentVerifications(verifications);
          setAllVerifications(verifications);
          calculateStats(verifications);
        } catch (parseError) {
          console.error('Error parsing saved verifications:', parseError);
          // Use demo data as final fallback
          setRecentVerifications(demoVerifications);
          setAllVerifications(demoVerifications);
          calculateStats(demoVerifications);
        }
      } else {
        // Use demo data as final fallback
        setRecentVerifications(demoVerifications);
        setAllVerifications(demoVerifications);
        calculateStats(demoVerifications);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (verifications) => {
    const successful = verifications.filter(v => 
      v.status === 'VERIFIED' || v.status === 'VERIFIED_BY_DATA'
    ).length;
    const failed = verifications.filter(v => 
      v.status === 'FAILED' || v.status === 'CORRUPTED_HASH'
    ).length;
    const total = verifications.length;
    
    setStats({
      totalVerifications: total,
      successfulVerifications: successful,
      failedVerifications: failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0
    });
  };

  const loadFullHistory = async () => {
    setLoadingHistory(true);
    try {
      const fullHistory = await getUserVerifications(user?.id, { limit: 50 });
      const verifications = Array.isArray(fullHistory) 
        ? fullHistory 
        : fullHistory.verifications || [];
      
      if (verifications.length > 0) {
        setAllVerifications(verifications);
      } else {
        // Use demo data if no real data available
        setAllVerifications(demoVerifications);
      }
    } catch (error) {
      console.error('Failed to load full history:', error);
      // Use saved data or demo data
      const savedVerifications = localStorage.getItem(`user_verifications_${user?.id}`);
      if (savedVerifications) {
        try {
          const verifications = JSON.parse(savedVerifications);
          setAllVerifications(verifications);
        } catch (parseError) {
          setAllVerifications(demoVerifications);
        }
      } else {
        setAllVerifications(demoVerifications);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewHistory = async () => {
    setShowHistoryModal(true);
    await loadFullHistory();
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
    verifications = verifications.slice(0, 50); // Keep only latest 50
    
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
      'CORRUPTED_HASH': 'bg-yellow-100 text-yellow-800',
      'ERROR': 'bg-red-100 text-red-800'
    };
    
    const statusDisplay = {
      'VERIFIED': 'Verified',
      'VERIFIED_BY_DATA': 'Verified by Data',
      'FAILED': 'Failed',
      'CORRUPTED_HASH': 'Corrupted Hash',
      'ERROR': 'Error'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusDisplay[status] || status || 'Unknown'}
      </span>
    );
  };

  const statCards = [
    {
      title: 'Total Verifications',
      value: stats.totalVerifications,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Successful',
      value: stats.successfulVerifications,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Failed',
      value: stats.failedVerifications,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const quickActions = [
    {
      title: 'Verify Certificate',
      description: 'Upload and verify a certificate instantly',
      icon: CheckCircle,
      link: '/user/verify',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Upload Documents',
      description: 'Upload certificates for verification',
      icon: Upload,
      link: '/user/verify',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'View History',
      description: 'See all your verification attempts',
      icon: Clock,
      onClick: handleViewHistory,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Welcome back, {user?.name || 'user'}!
          </h1>
          <p className="text-secondary-600">
            Track your certificate verifications and manage your documents
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* API Connection Status */}
      {!apiConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Using offline data - some features may be limited
            </span>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Verifications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Recent Verifications
            </h3>
            <button
              onClick={handleViewHistory}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all →
            </button>
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
          className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6"
        >
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const ActionComponent = action.link ? Link : 'button';
              const actionProps = action.link 
                ? { to: action.link }
                : { onClick: action.onClick };

              return (
                <ActionComponent
                  key={index}
                  {...actionProps}
                  className={`w-full flex items-center p-4 rounded-lg border ${action.borderColor} ${action.bgColor} hover:shadow-md transition-all duration-200 text-left`}
                >
                  <div className={`p-3 rounded-lg bg-white mr-4`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-secondary-900">{action.title}</h4>
                    <p className="text-sm text-secondary-600">{action.description}</p>
                  </div>
                </ActionComponent>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Certificate Verification Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Certificate Verification Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-700">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Upload high-quality images</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Use clear, well-lit photos for better accuracy</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Check verification status</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Look for 'VERIFIED' status for authentic certificates</span>
                </div>
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
        className="flex items-center justify-between text-sm text-secondary-600"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span>System Status: {apiConnected ? 'Online' : 'Offline'}</span>
        </div>
        <div>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </motion.div>

      {/* View History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Verification History"
        size="xl"
      >
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="medium" />
            </div>
          ) : allVerifications.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">No verification history yet</p>
              <p className="text-sm text-secondary-500 mt-1">
                Your verification attempts will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allVerifications.map((verification, index) => (
                <div key={verification.id || index} className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-secondary-100 rounded">
                        <FileText className="h-4 w-4 text-secondary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          {verification.filename || 'Unknown file'}
                        </p>
                        <p className="text-xs text-secondary-600">
                          {formatDate(verification.timestamp || verification.created_at)}
                        </p>
                        {verification.certificate_number && (
                          <p className="text-xs text-secondary-500">
                            Certificate: {verification.certificate_number}
                          </p>
                        )}
                      </div>
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
                  {(verification.message || verification.certificate_exists_in_ledger) && (
                    <p className="text-sm text-secondary-600 mt-2">
                      {verification.certificate_exists_in_ledger 
                        ? '✅ Found in secure ledger'
                        : verification.message
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-secondary-200">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDashboard;