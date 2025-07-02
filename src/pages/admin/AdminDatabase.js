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
  FileText,
  User,
  Shield,
  Settings,
  Clock,
  History
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

  const applyFilters = () => {
    fetchCertificates(true); // Reset to first page when applying filters
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setConfidenceRange({ min: 0, max: 100 });
    setFacultyFilter('all');
    setCurrentPage(1);
    fetchCertificates(true);
  };

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
        faculty: facultyFilter !== 'all' ? facultyFilter : undefined,
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
        min_confidence: confidenceRange.min > 0 ? confidenceRange.min / 100 : undefined,
        max_confidence: confidenceRange.max < 100 ? confidenceRange.max / 100 : undefined
      };

      console.log('📊 Fetching certificates with params:', params);
      
      const response = await getCertificates(params);
      console.log('✅ Certificates response:', response);
      
      if (response && response.certificates) {
        setCertificates(response.certificates);
        setTotalCount(response.total || response.certificates.length);
        setTotalPages(Math.ceil((response.total || response.certificates.length) / itemsPerPage));
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setCertificates(response || []);
        setTotalCount((response || []).length);
        setTotalPages(Math.ceil((response || []).length / itemsPerPage));
      }
      
    } catch (error) {
      console.error('❌ Error fetching certificates:', error);
      setApiConnected(false);
      setCertificates([]);
      toast.error('Failed to fetch certificates. Check if the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    // The useEffect will trigger fetchCertificates
  };

  const handleViewDetails = async (cert) => {
    setSelectedCert(cert);
    setShowDetailsModal(true);
    
    // Fetch verification history for this certificate
    try {
      const history = await getCertificateHistory(cert.certificate_number);
      setSelectedCert(prev => ({ ...prev, verification_history: history || [] }));
    } catch (error) {
      console.error('Error fetching certificate history:', error);
      setSelectedCert(prev => ({ ...prev, verification_history: [] }));
    }
  };

  const handleViewHistory = async (cert) => {
    setLoadingHistory(true);
    try {
      const history = await getCertificateHistory(cert.certificate_number);
      setSelectedCert({ ...cert, verification_history: history });
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch verification history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownload = async (cert, type = 'processed') => {
    try {
      let response;
      if (type === 'original') {
        response = await downloadOriginalCertificate(cert.certificate_number);
      } else {
        response = await downloadProcessedCertificate(cert.certificate_number);
      }
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cert.certificate_number}_${type}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} certificate downloaded successfully`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${type} certificate`);
    }
  };

  const handleDelete = async () => {
    if (!selectedCert) return;
    
    try {
      await deleteCertificate(selectedCert.certificate_number);
      toast.success('Certificate deleted successfully');
      setShowDeleteModal(false);
      setSelectedCert(null);
      fetchCertificates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete certificate');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'VERIFIED': { color: 'bg-green-100 text-green-800', text: 'Verified' },
      'VERIFIED_BY_DATA': { color: 'bg-blue-100 text-blue-800', text: 'Verified by Data' },
      'FAILED': { color: 'bg-red-100 text-red-800', text: 'Failed' },
      'CORRUPTED_HASH': { color: 'bg-yellow-100 text-yellow-800', text: 'Corrupted Hash' },
      'NO_HASH': { color: 'bg-gray-100 text-gray-800', text: 'No Hash' },
      'UNKNOWN': { color: 'bg-gray-100 text-gray-800', text: 'Unknown' }
    };
    
    const config = statusConfig[status] || statusConfig['UNKNOWN'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Get unique faculties from certificates for filter options
  const getUniqueFaculties = () => {
    const faculties = new Set();
    certificates.forEach(cert => {
      const faculty = cert.certificate_data?.['Faculty Name'];
      if (faculty) faculties.add(faculty);
    });
    return Array.from(faculties).sort();
  };

  const displayCertificates = certificates;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Certificate Database</h1>
            <p className="mt-2 text-secondary-600">
              Manage and view all certificates in the system
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={() => fetchCertificates(true)}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">Total Certificates</p>
                <p className="text-2xl font-bold text-secondary-900">{totalCount}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">Verified</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {certificates.filter(c => c.verification_status === 'VERIFIED' || c.verification_status === 'VERIFIED_BY_DATA').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">Failed</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {certificates.filter(c => c.verification_status === 'FAILED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">Processing</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {certificates.filter(c => c.verification_status === 'UNKNOWN').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="form-input min-w-40"
              >
                <option value="all">All Status</option>
                <option value="VERIFIED">Verified</option>
                <option value="VERIFIED_BY_DATA">Verified by Data</option>
                <option value="FAILED">Failed</option>
                <option value="CORRUPTED_HASH">Corrupted Hash</option>
                <option value="NO_HASH">No Hash</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="btn-secondary flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced
              {(dateRange.start || dateRange.end || confidenceRange.min > 0 || confidenceRange.max < 100 || facultyFilter !== 'all') && (
                <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
              )}
            </button>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end || confidenceRange.min > 0 || confidenceRange.max < 100 || facultyFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="btn-secondary text-red-600 hover:text-red-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Certificates Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card overflow-hidden"
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : displayCertificates.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100"
                      onClick={() => handleSort('certificate_number')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Certificate Number</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100"
                      onClick={() => handleSort('confidence')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Confidence</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {displayCertificates.map((cert, index) => (
                    <tr key={cert.certificate_number || index} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">
                          {cert.certificate_number || 'N/A'}
                        </div>
                        <div className="text-sm text-secondary-500 truncate max-w-xs">
                          {cert.hash ? `${cert.hash.substring(0, 20)}...` : 'No hash'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {cert.certificate_data?.['Student Name'] || 
                           cert.certificate_data?.['student_name'] || 
                           'N/A'}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {cert.certificate_data?.['Institution Name'] || 
                           cert.certificate_data?.['institution_name'] || 
                           'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(cert.verification_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-secondary-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${(cert.confidence || 0) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-secondary-900">
                            {cert.confidence ? `${Math.round(cert.confidence * 100)}%` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {formatDate(cert.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(cert)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(cert)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
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

      {/* Certificate Details Modal - FIXED VERSION */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Certificate Details - ${selectedCert?.certificate_number}`}
        size="7xl"
      >
        {selectedCert && (
          <div className="max-h-[85vh] overflow-y-auto">
            <div className="space-y-6">
              
              {/* Certificate Information Section */}
              <div className="bg-white rounded-lg border border-secondary-200">
                <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
                  <h4 className="text-xl font-semibold text-secondary-900 flex items-center">
                    <FileText className="h-6 w-6 mr-3 text-primary-600" />
                    Certificate Information
                  </h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCert.certificate_data && Object.entries(selectedCert.certificate_data).map(([key, value]) => (
                      value && (
                        <div key={key} className="bg-secondary-50 rounded-lg p-4 border border-secondary-100">
                          <dt className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-2">
                            {key.replace(/_/g, ' ')}
                          </dt>
                          <dd className="text-sm text-secondary-900 break-words font-medium">
                            {safeRenderValue(value)}
                          </dd>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Information Section */}
              {selectedCert.certificate_data?.['Student Name'] && (
                <div className="bg-white rounded-lg border border-secondary-200">
                  <div className="px-6 py-4 border-b border-secondary-200 bg-blue-50">
                    <h4 className="text-xl font-semibold text-secondary-900 flex items-center">
                      <User className="h-6 w-6 mr-3 text-blue-600" />
                      Student Information
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Student Name', key: 'Student Name' },
                        { label: 'Faculty', key: 'Faculty Name' },
                        { label: 'Institution', key: 'Institution Name' },
                        { label: 'Degree', key: 'Degree Name' },
                        { label: 'Degree Classification', key: 'Degree Classification' },
                        { label: 'Research Focus Area', key: 'Research Focus Area' }
                      ].map(({ label, key }) => (
                        selectedCert.certificate_data?.[key] && (
                          <div key={key} className="flex flex-col space-y-1 p-4 bg-secondary-50 rounded-lg">
                            <span className="text-sm font-medium text-secondary-600">{label}:</span>
                            <span className="text-base text-secondary-900 font-semibold break-words">
                              {selectedCert.certificate_data[key]}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Status Section */}
              <div className="bg-white rounded-lg border border-secondary-200">
                <div className="px-6 py-4 border-b border-secondary-200 bg-green-50">
                  <h4 className="text-xl font-semibold text-secondary-900 flex items-center">
                    <Shield className="h-6 w-6 mr-3 text-green-600" />
                    Verification Status
                  </h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Status Badge */}
                    <div className="flex flex-col space-y-2 p-4 bg-secondary-50 rounded-lg">
                      <span className="text-sm font-medium text-secondary-600">Status:</span>
                      <div className="flex items-center">
                        {getStatusBadge(selectedCert.verification_status)}
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="flex flex-col space-y-2 p-4 bg-secondary-50 rounded-lg">
                      <span className="text-sm font-medium text-secondary-600">Confidence:</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-secondary-200 rounded-full h-3">
                          <div 
                            className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${(selectedCert.confidence || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold text-secondary-900">
                          {selectedCert.confidence ? `${Math.round(selectedCert.confidence * 100)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Creation Date */}
                    <div className="flex flex-col space-y-2 p-4 bg-secondary-50 rounded-lg">
                      <span className="text-sm font-medium text-secondary-600">Created:</span>
                      <span className="text-base text-secondary-900 font-medium">
                        {formatDate(selectedCert.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details Section */}
              <div className="bg-white rounded-lg border border-secondary-200">
                <div className="px-6 py-4 border-b border-secondary-200 bg-purple-50">
                  <h4 className="text-xl font-semibold text-secondary-900 flex items-center">
                    <Settings className="h-6 w-6 mr-3 text-purple-600" />
                    Technical Details
                  </h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Certificate Number', value: selectedCert.certificate_number },
                      { label: 'Hash', value: selectedCert.hash, mono: true },
                      { label: 'Processing Time', value: selectedCert.processing_time ? `${selectedCert.processing_time}s` : null },
                      { label: 'Extraction Quality', value: selectedCert.extraction_quality },
                      { label: 'Version', value: selectedCert.version },
                      { label: 'Source Image', value: selectedCert.source_image }
                    ].map(({ label, value, mono }) => (
                      value && (
                        <div key={label} className="flex flex-col space-y-2 p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                          <div className="text-sm font-medium text-secondary-600">
                            {label}
                          </div>
                          <div className={`text-sm text-secondary-900 break-all ${mono ? 'font-mono text-xs bg-gray-100 p-2 rounded' : 'font-medium'}`}>
                            {value}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Section - REMOVED */}
              {/* This section has been removed as requested */}

            {/* Verification History Section - Full Width */}
            {selectedCert.verification_history && selectedCert.verification_history.length > 0 && (
              <div className="bg-white rounded-lg border border-secondary-200">
                <div className="px-6 py-4 border-b border-secondary-200 bg-orange-50">
                  <h4 className="text-xl font-semibold text-secondary-900 flex items-center">
                    <History className="h-6 w-6 mr-3 text-orange-600" />
                    Recent Verification History
                  </h4>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {selectedCert.verification_history.slice(0, 5).map((entry, index) => (
                      <div key={index} className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                entry.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                entry.status === 'VERIFIED_BY_DATA' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {entry.status}
                              </span>
                              <span className="text-sm text-secondary-500">
                                {entry.confidence ? `${Math.round(entry.confidence * 100)}% confidence` : ''}
                              </span>
                            </div>
                            <div className="text-sm text-secondary-500 mb-2">
                              {formatDate(entry.timestamp)}
                            </div>
                            {entry.message && (
                              <p className="text-base text-secondary-700 break-words">{entry.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
            <h4 className="text-lg font-medium text-secondary-900 mb-3">Date Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
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
            <h4 className="text-lg font-medium text-secondary-900 mb-3">Confidence Range</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Minimum (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={confidenceRange.min}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Maximum (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={confidenceRange.max}
                  onChange={(e) => setConfidenceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
                  className="form-input"
                />
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
              {getUniqueFaculties().map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
              {/* Fallback options in case no faculties are found */}
              {getUniqueFaculties().length === 0 && (
                <>
                  <option value="Faculty of Computing and Information Technology">Computing and IT</option>
                  <option value="Faculty of Health Sciences and Medical Research">Health Sciences</option>
                  <option value="Faculty of Engineering">Engineering</option>
                  <option value="Faculty of Business">Business</option>
                </>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                // Reset filters to default
                setDateRange({ start: '', end: '' });
                setConfidenceRange({ min: 0, max: 100 });
                setFacultyFilter('all');
                setShowFilterModal(false);
              }}
              className="btn-secondary"
            >
              Reset
            </button>
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

      {/* Delete Confirmation Modal - REMOVED */}
      {/* Delete functionality has been removed as requested */}
    </div>
  );
};

export default AdminDatabase;