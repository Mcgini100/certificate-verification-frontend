import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  RefreshCw,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Edit,
  Hash
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getCertificates, deleteCertificate, getCertificateHistory } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const AdminDatabase = () => {
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);
  const [certHistory, setCertHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Advanced filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [confidenceRange, setConfidenceRange] = useState({ min: 0, max: 100 });
  const [facultyFilter, setFacultyFilter] = useState('all');

  const itemsPerPage = 10;

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [certificates, searchTerm, statusFilter, dateRange, confidenceRange, facultyFilter]);

  useEffect(() => {
    applySorting();
  }, [filteredCertificates, sortBy, sortOrder]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      
      // In production, this would use the actual API
      // const response = await getCertificates();
      // setCertificates(response);
      
      // Mock data for demo
      const mockCertificates = [
        {
          certificate_number: 'BSc-12700',
          certificate_data: {
            'Student Name': 'John Doe',
            'Degree Name': 'Bachelor of Science Honours in Data Science and Analytics',
            'Faculty Name': 'Faculty of Health Sciences and Medical Research',
            'Date': '15 June 2025',
            'Degree Classification': 'First Class Honours'
          },
          hash: 'b7f069b63ad42d547a116fea8d49f878bb792beaa1fe07f2dfc3cd64f10c8801',
          verification_status: 'VERIFIED',
          confidence: 0.98,
          source_image: 'cert_001.png',
          created_at: '2025-06-15T10:30:00Z',
          last_verified: '2025-06-15T10:30:00Z'
        },
        {
          certificate_number: 'BSc-12701',
          certificate_data: {
            'Student Name': 'Jane Smith',
            'Degree Name': 'Bachelor of Science Honours in Computer Science',
            'Faculty Name': 'Faculty of Computing and Information Technology',
            'Date': '14 June 2025',
            'Degree Classification': 'Upper Second Class Honours'
          },
          hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
          verification_status: 'VERIFIED_BY_DATA',
          confidence: 0.85,
          source_image: 'cert_002.jpg',
          created_at: '2025-06-14T14:20:00Z',
          last_verified: '2025-06-14T14:20:00Z'
        },
        {
          certificate_number: 'BSc-12702',
          certificate_data: {
            'Student Name': 'Mike Johnson',
            'Degree Name': 'Bachelor of Science in Engineering',
            'Faculty Name': 'Faculty of Engineering',
            'Date': '13 June 2025',
            'Degree Classification': 'Second Class Honours'
          },
          hash: 'f1e2d3c4b5a6978563214785239614785296374185296374123456789012345',
          verification_status: 'FAILED',
          confidence: 0.42,
          source_image: 'cert_003.png',
          created_at: '2025-06-13T09:15:00Z',
          last_verified: '2025-06-13T09:15:00Z'
        },
        {
          certificate_number: 'MSc-15420',
          certificate_data: {
            'Student Name': 'Sarah Wilson',
            'Degree Name': 'Master of Science in Artificial Intelligence',
            'Faculty Name': 'Faculty of Computing and Information Technology',
            'Date': '12 June 2025',
            'Degree Classification': 'Distinction'
          },
          hash: '9f8e7d6c5b4a392847561029384756102938475610293847561029384756102',
          verification_status: 'VERIFIED',
          confidence: 0.96,
          source_image: 'cert_004.png',
          created_at: '2025-06-12T16:45:00Z',
          last_verified: '2025-06-12T16:45:00Z'
        },
        {
          certificate_number: 'PhD-98765',
          certificate_data: {
            'Student Name': 'Dr. Robert Brown',
            'Degree Name': 'Doctor of Philosophy in Computer Science',
            'Faculty Name': 'Faculty of Computing and Information Technology',
            'Date': '11 June 2025',
            'Degree Classification': 'Pass'
          },
          hash: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
          verification_status: 'CORRUPTED_HASH',
          confidence: 0.34,
          source_image: 'cert_005.jpg',
          created_at: '2025-06-11T11:30:00Z',
          last_verified: '2025-06-11T11:30:00Z'
        },
        {
          certificate_number: 'BSc-12703',
          certificate_data: {
            'Student Name': 'Emma Davis',
            'Degree Name': 'Bachelor of Science in Mathematics',
            'Faculty Name': 'Faculty of Science',
            'Date': '10 June 2025',
            'Degree Classification': 'First Class Honours'
          },
          hash: '3f4e5d6c7b8a9910203948576102938475610293847561029384756102938475',
          verification_status: 'VERIFIED',
          confidence: 0.92,
          source_image: 'cert_006.png',
          created_at: '2025-06-10T08:20:00Z',
          last_verified: '2025-06-10T08:20:00Z'
        }
      ];

      setCertificates(mockCertificates);
      
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      toast.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...certificates];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(cert => 
        cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificate_data['Student Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificate_data['Degree Name']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cert => cert.verification_status === statusFilter);
    }

    // Faculty filter
    if (facultyFilter !== 'all') {
      filtered = filtered.filter(cert => 
        cert.certificate_data['Faculty Name']?.includes(facultyFilter)
      );
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(cert => 
        new Date(cert.created_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(cert => 
        new Date(cert.created_at) <= new Date(dateRange.end)
      );
    }

    // Confidence range filter
    filtered = filtered.filter(cert => 
      cert.confidence * 100 >= confidenceRange.min && 
      cert.confidence * 100 <= confidenceRange.max
    );

    setFilteredCertificates(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const applySorting = () => {
    const sorted = [...filteredCertificates].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'certificate_number':
          aValue = a.certificate_number;
          bValue = b.certificate_number;
          break;
        case 'student_name':
          aValue = a.certificate_data['Student Name'] || '';
          bValue = b.certificate_data['Student Name'] || '';
          break;
        case 'verification_status':
          aValue = a.verification_status;
          bValue = b.verification_status;
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    setFilteredCertificates(sorted);
  };

  const handleViewDetails = async (cert) => {
    setSelectedCert(cert);
    setLoadingHistory(true);
    
    try {
      // Mock history - in production, use actual API
      const mockHistory = [
        {
          timestamp: '2025-06-15T10:30:00Z',
          status: 'VERIFIED',
          confidence: 0.98,
          source: 'cert_001.png',
          message: 'Hash verification successful',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          timestamp: '2025-06-14T16:45:00Z',
          status: 'VERIFIED',
          confidence: 0.96,
          source: 'cert_001_copy.png',
          message: 'Re-verification successful',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          timestamp: '2025-06-13T08:20:00Z',
          status: 'VERIFIED_BY_DATA',
          confidence: 0.87,
          source: 'cert_001_scan.jpg',
          message: 'Hash corrupted but data verified',
          ip_address: '192.168.1.105',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        }
      ];
      setCertHistory(mockHistory);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setCertHistory([]);
    } finally {
      setLoadingHistory(false);
    }
    
    setShowDetailsModal(true);
  };

  const handleDeleteCert = (cert) => {
    setCertToDelete(cert);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!certToDelete) return;
    
    try {
      await deleteCertificate(certToDelete.certificate_number);
      setCertificates(prev => prev.filter(c => c.certificate_number !== certToDelete.certificate_number));
      toast.success('Certificate deleted successfully');
    } catch (error) {
      toast.error('Failed to delete certificate');
    } finally {
      setShowDeleteModal(false);
      setCertToDelete(null);
    }
  };

  const exportData = (format = 'csv') => {
    const exportCerts = getCurrentPageCertificates();
    
    if (format === 'csv') {
      const csvContent = [
        ['Certificate Number', 'Student Name', 'Degree', 'Faculty', 'Status', 'Confidence', 'Date Created'],
        ...exportCerts.map(cert => [
          cert.certificate_number,
          cert.certificate_data['Student Name'] || '',
          cert.certificate_data['Degree Name'] || '',
          cert.certificate_data['Faculty Name'] || '',
          cert.verification_status,
          (cert.confidence * 100).toFixed(1) + '%',
          new Date(cert.created_at).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(exportCerts, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    toast.success(`Data exported as ${format.toUpperCase()}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFacultyFilter('all');
    setDateRange({ start: '', end: '' });
    setConfidenceRange({ min: 0, max: 100 });
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const getCurrentPageCertificates = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCertificates.slice(startIndex, endIndex);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'VERIFIED_BY_DATA':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'CORRUPTED_HASH':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-secondary-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'VERIFIED_BY_DATA':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CORRUPTED_HASH':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getUniqueFacties = () => {
    const faculties = certificates.map(cert => cert.certificate_data['Faculty Name']).filter(Boolean);
    return [...new Set(faculties)];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Certificate Database
            </h1>
            <p className="text-secondary-600">
              View and manage all certificates in the system ({filteredCertificates.length} total)
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchCertificates}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="relative">
              <button
                onClick={() => setShowFilterModal(true)}
                className="btn-secondary flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced Filters
              </button>
            </div>
            <div className="relative group">
              <button className="btn-primary flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => exportData('csv')}
                    className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 w-full text-left"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 w-full text-left"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input pl-10"
            >
              <option value="all">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="VERIFIED_BY_DATA">Verified by Data</option>
              <option value="FAILED">Failed</option>
              <option value="CORRUPTED_HASH">Corrupted Hash</option>
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input"
          >
            <option value="created_at">Date Created</option>
            <option value="certificate_number">Certificate Number</option>
            <option value="student_name">Student Name</option>
            <option value="verification_status">Status</option>
            <option value="confidence">Confidence</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="form-input"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || statusFilter !== 'all' || facultyFilter !== 'all' || dateRange.start || dateRange.end || confidenceRange.min > 0 || confidenceRange.max < 100) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Search: {searchTerm}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Status: {statusFilter}
                </span>
              )}
              {facultyFilter !== 'all' && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  Faculty: {facultyFilter}
                </span>
              )}
              {(dateRange.start || dateRange.end) && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                  Date Range
                </span>
              )}
              {(confidenceRange.min > 0 || confidenceRange.max < 100) && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                  Confidence: {confidenceRange.min}%-{confidenceRange.max}%
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-secondary-600 hover:text-secondary-900"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card overflow-hidden"
      >
        {filteredCertificates.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {getCurrentPageCertificates().map((cert, index) => (
                    <tr key={index} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-secondary-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-secondary-900">
                              {cert.certificate_number}
                            </div>
                            <div className="text-sm text-secondary-500">
                              {cert.source_image}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {cert.certificate_data['Student Name'] || 'N/A'}
                        </div>
                        <div className="text-sm text-secondary-500 max-w-xs truncate">
                          {cert.certificate_data['Degree Name'] || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cert.verification_status)}`}>
                          {getStatusIcon(cert.verification_status)}
                          <span className="ml-1">{cert.verification_status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-secondary-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                cert.confidence >= 0.8 ? 'bg-green-500' : 
                                cert.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${cert.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-secondary-900">
                            {(cert.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <div>
                            <div>{new Date(cert.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-secondary-400">
                              {new Date(cert.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(cert)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toast.info('Edit feature would be implemented here')}
                            className="text-secondary-600 hover:text-secondary-900 p-1 rounded hover:bg-secondary-50"
                            title="Edit Certificate"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCert(cert)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete Certificate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-secondary-200">
                <div className="text-sm text-secondary-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCertificates.length)} of {filteredCertificates.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No certificates found</h3>
            <p className="mt-1 text-sm text-secondary-500">
              {searchTerm || statusFilter !== 'all' || facultyFilter !== 'all' ? 
                'Try adjusting your filters' : 
                'Upload your first certificate to get started'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || facultyFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-3 btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Certificate Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Certificate Details"
        size="4xl"
      >
        {selectedCert && (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Header with Status */}
            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
              <div>
                <h4 className="text-xl font-bold text-secondary-900">
                  {selectedCert.certificate_number}
                </h4>
                <p className="text-secondary-600">{selectedCert.source_image}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCert.verification_status)}`}>
                  {getStatusIcon(selectedCert.verification_status)}
                  <span className="ml-2">{selectedCert.verification_status.replace('_', ' ')}</span>
                </span>
                <p className="text-sm text-secondary-600 mt-1">
                  Confidence: {(selectedCert.confidence * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Certificate Data */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Certificate Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedCert.certificate_data).map(([key, value]) => (
                  <div key={key} className="p-3 bg-secondary-50 rounded-lg">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      {key}
                    </label>
                    <p className="text-sm font-medium text-secondary-900 mt-1">
                      {value || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hash Information */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center">
                <Hash className="h-5 w-5 mr-2" />
                Hash Information
              </h4>
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">SHA-256 Hash</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedCert.hash)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs font-mono bg-white p-3 rounded border break-all">
                  {selectedCert.hash}
                </p>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Timestamps
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Created At
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {new Date(selectedCert.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Last Verified
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {new Date(selectedCert.last_verified).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification History */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Verification History
              </h4>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="medium" />
                </div>
              ) : certHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {certHistory.map((record, index) => (
                    <div key={index} className="border border-secondary-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.status)}
                          <span className="text-sm font-medium text-secondary-900">
                            {record.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-sm text-secondary-600">
                          {(record.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-secondary-700 mb-2">{record.message}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-secondary-500">
                        <div>
                          <span className="font-medium">Time:</span> {new Date(record.timestamp).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Source:</span> {record.source}
                        </div>
                        <div>
                          <span className="font-medium">IP:</span> {record.ip_address}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">User Agent:</span> {record.user_agent}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary-500 text-center py-4">
                  No verification history available
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Advanced Filters Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Advanced Filters"
        size="lg"
      >
        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className="form-label">Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary-600">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="text-sm text-secondary-600">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Confidence Range */}
          <div>
            <label className="form-label">
              Confidence Range: {confidenceRange.min}% - {confidenceRange.max}%
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary-600">Minimum</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceRange.min}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-xs text-secondary-500">{confidenceRange.min}%</span>
              </div>
              <div>
                <label className="text-sm text-secondary-600">Maximum</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceRange.max}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-xs text-secondary-500">{confidenceRange.max}%</span>
              </div>
            </div>
          </div>

          {/* Faculty Filter */}
          <div>
            <label className="form-label">Faculty</label>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Faculties</option>
              {getUniqueFacties().map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowFilterModal(false)}
              className="btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        size="md"
      >
        {certToDelete && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h4 className="text-lg font-medium text-secondary-900">Delete Certificate</h4>
                <p className="text-sm text-secondary-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                You are about to permanently delete certificate <strong>{certToDelete.certificate_number}</strong> 
                for student <strong>{certToDelete.certificate_data['Student Name']}</strong>.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-danger"
              >
                Delete Certificate
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDatabase;