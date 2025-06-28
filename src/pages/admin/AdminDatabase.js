import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCertificates, deleteCertificate, getCertificateHistory, downloadProcessedCertificate, downloadOriginalCertificate } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

const AdminDatabase = () => {
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [confidenceRange, setConfidenceRange] = useState({ min: 0, max: 100 });
  const [facultyFilter, setFacultyFilter] = useState('all');
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [selectedCert, setSelectedCert] = useState(null);
  const [certHistory, setCertHistory] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const itemsPerPage = 10;

  // Helper function to safely render values
  const safeRenderValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  useEffect(() => {
    fetchCertificates();
  }, [currentPage, sortBy, sortOrder, statusFilter, searchTerm]);

  const fetchCertificates = async (resetPage = false) => {
    try {
      setLoading(true);
      setApiConnected(true);
      
      if (resetPage) {
        setCurrentPage(1);
      }
      
      const params = {
        limit: itemsPerPage,
        offset: resetPage ? 0 : (currentPage - 1) * itemsPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        minConfidence: confidenceRange.min / 100,
        maxConfidence: confidenceRange.max / 100,
        faculty: facultyFilter !== 'all' ? facultyFilter : undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await getCertificates(params);
      
      // Handle different response formats
      if (response.certificates) {
        // Paginated response
        setCertificates(response.certificates);
        setTotalCount(response.total || response.certificates.length);
        setTotalPages(Math.ceil((response.total || response.certificates.length) / itemsPerPage));
      } else if (Array.isArray(response)) {
        // Simple array response
        setCertificates(response);
        setTotalCount(response.length);
        setTotalPages(Math.ceil(response.length / itemsPerPage));
      } else {
        // Handle unexpected response format
        console.warn('Unexpected response format:', response);
        setCertificates([]);
        setTotalCount(0);
        setTotalPages(1);
      }
      
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      setApiConnected(false);
      
      // Only show empty state when API is not connected
      setCertificates([]);
      setTotalCount(0);
      setTotalPages(1);
      
      if (error.code !== 'ECONNREFUSED' && !error.message.includes('Network Error')) {
        toast.error('Failed to fetch certificates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (cert) => {
    setSelectedCert(cert);
    setLoadingHistory(true);
    
    try {
      // Fetch verification history from API
      const history = await getCertificateHistory(cert.certificate_number);
      setCertHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Failed to fetch certificate history:', error);
      setCertHistory([]);
    } finally {
      setLoadingHistory(false);
    }
    
    setShowDetailsModal(true);
  };

  const handleDeleteCert = (cert) => {
    setSelectedCert(cert);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCertificate(selectedCert.certificate_number);
      toast.success('Certificate deleted successfully');
      fetchCertificates();
      setShowDeleteModal(false);
      setSelectedCert(null);
    } catch (error) {
      console.error('Failed to delete certificate:', error);
      toast.error('Failed to delete certificate');
    }
  };

  const handleDownloadProcessed = async (cert) => {
    try {
      await downloadProcessedCertificate(cert.certificate_number, {
        includeMarkers: true,
        format: 'png'
      });
    } catch (error) {
      console.error('Failed to download processed certificate:', error);
    }
  };

  const handleDownloadOriginal = async (cert) => {
    try {
      await downloadOriginalCertificate(cert.certificate_number, {
        format: 'png'
      });
    } catch (error) {
      console.error('Failed to download original certificate:', error);
    }
  };

  const refreshData = () => {
    fetchCertificates();
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchCertificates(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setConfidenceRange({ min: 0, max: 100 });
    setFacultyFilter('all');
    setCurrentPage(1);
    fetchCertificates(true);
  };

  const exportCertificates = async () => {
    try {
      // This would implement CSV/Excel export
      toast.info('Export functionality will be implemented');
    } catch (error) {
      toast.error('Export failed');
    }
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

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

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
              <p className="text-yellow-700 text-sm">Unable to fetch certificates. Check if the backend is running.</p>
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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Certificate Database</h1>
            <p className="text-secondary-600 mt-2">
              {totalCount > 0 ? `${totalCount} certificates in the system` : 'No certificates found'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCertificates}
              className="btn-secondary flex items-center"
              disabled={!apiConnected || certificates.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by certificate number, student name, or degree..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              className="form-input pl-10"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="VERIFIED_BY_DATA">Verified by Data</option>
              <option value="FAILED">Failed</option>
              <option value="CORRUPTED_HASH">Corrupted Hash</option>
            </select>

            <button
              onClick={() => setShowFilterModal(true)}
              className="btn-secondary flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </button>

            <button
              onClick={applyFilters}
              className="btn-primary"
            >
              Search
            </button>

            {(searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
              <button
                onClick={resetFilters}
                className="btn-secondary text-red-600 hover:text-red-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Certificates Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card overflow-hidden"
      >
        {certificates.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100"
                      onClick={() => {
                        const newOrder = sortBy === 'certificate_number' && sortOrder === 'asc' ? 'desc' : 'asc';
                        setSortBy('certificate_number');
                        setSortOrder(newOrder);
                      }}
                    >
                      <div className="flex items-center">
                        Certificate Number
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100"
                      onClick={() => {
                        const newOrder = sortBy === 'verification_status' && sortOrder === 'asc' ? 'desc' : 'asc';
                        setSortBy('verification_status');
                        setSortOrder(newOrder);
                      }}
                    >
                      <div className="flex items-center">
                        Status
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100"
                      onClick={() => {
                        const newOrder = sortBy === 'confidence' && sortOrder === 'asc' ? 'desc' : 'asc';
                        setSortBy('confidence');
                        setSortOrder(newOrder);
                      }}
                    >
                      <div className="flex items-center">
                        Confidence
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100"
                      onClick={() => {
                        const newOrder = sortBy === 'created_at' && sortOrder === 'asc' ? 'desc' : 'asc';
                        setSortBy('created_at');
                        setSortOrder(newOrder);
                      }}
                    >
                      <div className="flex items-center">
                        Created
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {certificates.map((cert, index) => (
                    <tr key={cert.certificate_number || index} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">
                          {cert.certificate_number || 'Unknown'}
                        </div>
                        {cert.hash && (
                          <div className="text-xs text-secondary-500 font-mono">
                            {cert.hash.substring(0, 16)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-secondary-900">
                          {safeRenderValue(cert.certificate_data?.['Student Name']) || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {cert.certificate_data?.['Degree Name']?.substring(0, 50) || 'Unknown Degree'}
                          {cert.certificate_data?.['Degree Name']?.length > 50 && '...'}
                        </div>
                        <div className="text-xs text-secondary-500">
                          {safeRenderValue(cert.certificate_data?.['Faculty Name']) || 'Unknown Faculty'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(cert.verification_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {cert.confidence ? `${Math.round(cert.confidence * 100)}%` : 'Unknown'}
                        </div>
                        <div className="w-full bg-secondary-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(cert.confidence || 0) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {formatDate(cert.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(cert)}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <div className="relative group">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="Download Options"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 top-6 hidden group-hover:block bg-white border border-secondary-200 rounded-lg shadow-lg z-10 min-w-48">
                              <button
                                onClick={() => handleDownloadProcessed(cert)}
                                className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-t-lg"
                              >
                                <div className="flex items-center space-x-2">
                                  <ImageIcon className="h-4 w-4" />
                                  <span>Download with Markers</span>
                                </div>
                                <div className="text-xs text-secondary-500">Processed version with visual indicators</div>
                              </button>
                              <button
                                onClick={() => handleDownloadOriginal(cert)}
                                className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-b-lg"
                              >
                                <div className="flex items-center space-x-2">
                                  <Download className="h-4 w-4" />
                                  <span>Download Original</span>
                                </div>
                                <div className="text-xs text-secondary-500">Clean version without markers</div>
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCert(cert)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
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
              <div className="px-6 py-3 bg-secondary-50 border-t border-secondary-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-secondary-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <span className="text-sm text-secondary-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-secondary-500">
              {!apiConnected ? (
                <div>
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Unable to connect to the database</p>
                  <p className="text-sm">Please check if the backend API is running</p>
                </div>
              ) : searchTerm || statusFilter !== 'all' ? (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No certificates match your search criteria</p>
                  <p className="text-sm">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div>
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No certificates found</p>
                  <p className="text-sm">Upload some certificates to get started</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Certificate Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Certificate Details - ${selectedCert?.certificate_number}`}
        size="4xl"
      >
        {selectedCert && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Certificate Data */}
            <div>
              <h4 className="text-lg font-medium text-secondary-900 mb-3">Certificate Information</h4>
              <div className="space-y-3">
                {selectedCert.certificate_data && Object.entries(selectedCert.certificate_data).map(([key, value]) => (
                  value && (
                    <div key={key} className="bg-secondary-50 rounded-lg p-3">
                      <dt className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">{key}</dt>
                      <dd className="text-sm text-secondary-900 break-words">{safeRenderValue(value)}</dd>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Technical Details */}
            <div>
              <h4 className="text-lg font-medium text-secondary-900 mb-3">Technical Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary-50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Status</dt>
                  <dd>{getStatusBadge(selectedCert.verification_status)}</dd>
                </div>
                <div className="bg-secondary-50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Confidence</dt>
                  <dd className="text-sm text-secondary-900">{selectedCert.confidence ? `${Math.round(selectedCert.confidence * 100)}%` : 'Unknown'}</dd>
                </div>
                <div className="bg-secondary-50 rounded-lg p-3 md:col-span-2">
                  <dt className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Hash</dt>
                  <dd className="text-xs font-mono text-secondary-900 break-all bg-white p-2 rounded border">
                    {selectedCert.hash || 'Not available'}
                  </dd>
                </div>
                <div className="bg-secondary-50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Source Image</dt>
                  <dd className="text-sm text-secondary-900 break-words">{selectedCert.source_image || 'Unknown'}</dd>
                </div>
                <div className="bg-secondary-50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Created</dt>
                  <dd className="text-sm text-secondary-900">{formatDate(selectedCert.created_at)}</dd>
                </div>
              </div>
            </div>

            {/* Verification History */}
            <div>
              <h4 className="text-lg font-medium text-secondary-900 mb-3">Verification History</h4>
              {loadingHistory ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : certHistory.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {certHistory.map((entry, index) => (
                    <div key={index} className="bg-secondary-50 rounded-lg p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(entry.status)}
                            <span className="text-sm text-secondary-600">
                              {entry.confidence ? `${Math.round(entry.confidence * 100)}% confidence` : ''}
                            </span>
                          </div>
                          <div className="text-xs text-secondary-500">
                            {formatDate(entry.timestamp)}
                          </div>
                        </div>
                        {entry.message && (
                          <p className="text-sm text-secondary-700 break-words">{entry.message}</p>
                        )}
                        <div className="text-xs text-secondary-500 space-y-1">
                          <div>Source: <span className="font-mono">{entry.source}</span></div>
                          <div>IP: <span className="font-mono">{entry.ip_address}</span></div>
                          {entry.user_agent && (
                            <div>User Agent: <span className="font-mono text-xs break-all">{entry.user_agent}</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-secondary-500">No verification history available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Are you sure you want to delete certificate <strong>{selectedCert?.certificate_number}</strong>? 
            This action cannot be undone.
          </p>
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
            <label className="form-label">Confidence Range ({confidenceRange.min}% - {confidenceRange.max}%)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceRange.min}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-secondary-600 text-center">Min: {confidenceRange.min}%</div>
              </div>
              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceRange.max}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-secondary-600 text-center">Max: {confidenceRange.max}%</div>
              </div>
            </div>
          </div>

          {/* Faculty Filter */}
          <div>
            <label className="form-label">Faculty</label>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Faculties</option>
              <option value="Faculty of Computing and Information Technology">Computing and IT</option>
              <option value="Faculty of Health Sciences and Medical Research">Health Sciences</option>
              <option value="Faculty of Engineering">Engineering</option>
              <option value="Faculty of Business">Business</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowFilterModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowFilterModal(false);
                applyFilters();
              }}
              className="btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDatabase;