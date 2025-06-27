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
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [stats, setStats] = useState({
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    successRate: 0
  });

  useEffect(() => {
    // Load user's verification history from localStorage or API
    loadUserData();
  }, []);

  const loadUserData = () => {
    // Mock data for demo - in real app, this would come from API
    const mockVerifications = [
      {
        id: 1,
        filename: 'my_certificate.png',
        certificateNumber: 'BSc-12700',
        status: 'VERIFIED',
        confidence: 0.98,
        timestamp: '2025-06-15T10:30:00Z'
      },
      {
        id: 2,
        filename: 'diploma_scan.jpg',
        certificateNumber: 'MSc-15420',
        status: 'VERIFIED_BY_DATA',
        confidence: 0.87,
        timestamp: '2025-06-14T14:20:00Z'
      },
      {
        id: 3,
        filename: 'certificate_copy.pdf',
        certificateNumber: 'PhD-98765',
        status: 'FAILED',
        confidence: 0.34,
        timestamp: '2025-06-13T09:15:00Z'
      }
    ];

    setRecentVerifications(mockVerifications);
    
    const successful = mockVerifications.filter(v => v.status === 'VERIFIED' || v.status === 'VERIFIED_BY_DATA').length;
    const failed = mockVerifications.filter(v => v.status === 'FAILED').length;
    const total = mockVerifications.length;
    
    setStats({
      totalVerifications: total,
      successfulVerifications: successful,
      failedVerifications: failed,
      successRate: total > 0 ? (successful / total) * 100 : 0
    });
  };

  const quickActions = [
    {
      title: 'Verify Certificate',
      description: 'Upload and verify a certificate',
      icon: CheckCircle,
      link: '/user/verify',
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200'
    },
    {
      title: 'How It Works',
      description: 'Learn about certificate verification',
      icon: Shield,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: () => scrollToSection('how-it-works')
    }
  ];

  const statCards = [
    {
      title: 'Total Verifications',
      value: stats.totalVerifications,
      icon: Activity,
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
      title: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Failed',
      value: stats.failedVerifications,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'VERIFIED_BY_DATA':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'VERIFIED_BY_DATA':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-primary-100 text-lg">
                Verify your certificates securely and instantly
              </p>
            </div>
            <div className="hidden md:block">
              <Shield className="h-20 w-20 text-primary-200" />
            </div>
          </div>
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
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor} mr-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const Component = action.link ? Link : 'button';
            const props = action.link ? { to: action.link } : { onClick: action.onClick };
            
            return (
              <Component
                key={index}
                {...props}
                className={`block p-6 rounded-lg border-2 ${action.borderColor} ${action.bgColor} hover:shadow-md transition-all duration-200 group`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-secondary-700">
                    {action.title}
                  </h3>
                </div>
                <p className="text-secondary-600">
                  {action.description}
                </p>
              </Component>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Verifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            Recent Verifications
          </h3>
          <Link
            to="/user/verify"
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Verify New Certificate
          </Link>
        </div>
        
        {recentVerifications.length > 0 ? (
          <div className="space-y-4">
            {recentVerifications.map((verification) => (
              <div
                key={verification.id}
                className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-secondary-400" />
                  <div>
                    <h4 className="font-medium text-secondary-900">
                      {verification.filename}
                    </h4>
                    <p className="text-sm text-secondary-500">
                      Certificate: {verification.certificateNumber}
                    </p>
                    <p className="text-xs text-secondary-400">
                      {new Date(verification.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {getStatusIcon(verification.status)}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(verification.status)}`}>
                        {verification.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600">
                      {(verification.confidence * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No verifications yet</h3>
            <p className="text-secondary-500 mb-6">
              Upload your first certificate to get started with verification
            </p>
            <Link
              to="/user/verify"
              className="btn-primary inline-flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Verify Certificate
            </Link>
          </div>
        )}
      </motion.div>

      {/* How It Works Section */}
      <motion.div
        id="how-it-works"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-secondary-900 mb-6">
          How Certificate Verification Works
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary-600" />
            </div>
            <h4 className="font-semibold text-secondary-900 mb-2">1. Upload</h4>
            <p className="text-sm text-secondary-600">
              Upload your certificate image or PDF file securely
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h4 className="font-semibold text-secondary-900 mb-2">2. Analyze</h4>
            <p className="text-sm text-secondary-600">
              Our system analyzes embedded hashes and extracts certificate data
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-primary-600" />
            </div>
            <h4 className="font-semibold text-secondary-900 mb-2">3. Verify</h4>
            <p className="text-sm text-secondary-600">
              Get instant verification results with confidence scores
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;