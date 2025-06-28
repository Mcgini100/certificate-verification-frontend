import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Hash, 
  Clock, 
  Shield, 
  Copy,
  Eye,
  FileText,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { verifyCertificate, downloadProcessedCertificate, downloadOriginalCertificate } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserVerify = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
    loadRecentVerifications();
  }, [user]);

  const loadRecentVerifications = () => {
    const saved = localStorage.getItem(`user_verifications_${user?.id}`);
    if (saved) {
      try {
        setRecentVerifications(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading verifications:', error);
      }
    }
  };

  const saveVerificationToHistory = (verificationResult) => {
    const verification = {
      id: Date.now(),
      filename: files[0]?.name || 'unknown',
      ...verificationResult,
      timestamp: new Date().toISOString()
    };

    const existing = recentVerifications || [];
    const updated = [verification, ...existing].slice(0, 10);
    
    setRecentVerifications(updated);
    localStorage.setItem(`user_verifications_${user?.id}`, JSON.stringify(updated));
  };

  const handleFilesSelect = (selectedFiles) => {
    setFiles(selectedFiles);
    setResult(null);
  };

  const handleVerification = async () => {
    if (files.length === 0) {
      toast.error('Please select a file to verify');
      return;
    }

    setVerifying(true);
    try {
      const file = files[0].file;
      const options = {
        use_enhanced_extraction: true,
        check_database: true
      };

      const verificationResult = await verifyCertificate(file, options);
      
      // Ensure result has required properties
      const enrichedResult = {
        ...verificationResult,
        filename: file.name,
        fileSize: file.size,
        id: Date.now()
      };

      setResult(enrichedResult);
      saveVerificationToHistory(enrichedResult);

      if (verificationResult.verification_status === 'VERIFIED' || 
          verificationResult.verification_status === 'VERIFIED_BY_DATA') {
        toast.success('Certificate verification completed successfully!');
      } else {
        toast.warning('Certificate verification completed with issues. Check the detailed report.');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      const errorResult = {
        verification_status: 'ERROR',
        confidence: 0,
        message: error.message || 'Verification failed',
        filename: files[0]?.name || 'unknown',
        fileSize: files[0]?.size || 0,
        id: Date.now()
      };
      
      setResult(errorResult);
      toast.error('Verification failed: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadProcessed = async () => {
    if (!result?.certificate_data?.['Certificate Number']) {
      toast.error('No certificate number found for download');
      return;
    }
    
    try {
      await downloadProcessedCertificate(result.certificate_data['Certificate Number'], {
        includeMarkers: true,
        format: 'png'
      });
    } catch (error) {
      console.error('Failed to download processed certificate:', error);
    }
  };

  const handleDownloadOriginal = async () => {
    if (!result?.certificate_data?.['Certificate Number']) {
      toast.error('No certificate number found for download');
      return;
    }
    
    try {
      await downloadOriginalCertificate(result.certificate_data['Certificate Number'], {
        format: 'png'
      });
    } catch (error) {
      console.error('Failed to download original certificate:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return { level: 'Very High', color: 'text-green-600', bg: 'bg-green-500' };
    if (confidence >= 0.7) return { level: 'High', color: 'text-green-600', bg: 'bg-green-400' };
    if (confidence >= 0.5) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-400' };
    if (confidence >= 0.3) return { level: 'Low', color: 'text-orange-600', bg: 'bg-orange-400' };
    return { level: 'Very Low', color: 'text-red-600', bg: 'bg-red-400' };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const retryVerification = () => {
    setResult(null);
    handleVerification();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'VERIFIED_BY_DATA':
        return <CheckCircle className="h-8 w-8 text-blue-600" />;
      case 'FAILED':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      case 'CORRUPTED_HASH':
        return <AlertCircle className="h-8 w-8 text-orange-600" />;
      case 'NO_HASH':
        return <Search className="h-8 w-8 text-yellow-600" />;
      case 'ERROR':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Clock className="h-8 w-8 text-secondary-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'VERIFIED_BY_DATA':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'FAILED':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'CORRUPTED_HASH':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'NO_HASH':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-secondary-50 border-secondary-200 text-secondary-800';
    }
  };

  const getStatusTitle = (status) => {
    switch (status) {
      case 'VERIFIED':
        return '✅ Certificate Verified';
      case 'VERIFIED_BY_DATA':
        return '📊 Verified by Data';
      case 'FAILED':
        return '❌ Verification Failed';
      case 'CORRUPTED_HASH':
        return '🔶 Hash Corrupted';
      case 'NO_HASH':
        return '🔍 No Hash Found';
      case 'ERROR':
        return '⚠️ Verification Error';
      default:
        return '❓ Unknown Status';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'The certificate is authentic and the embedded cryptographic hash matches perfectly. This certificate has not been tampered with.';
      case 'VERIFIED_BY_DATA':
        return 'The certificate data matches our database records. The embedded hash may be corrupted due to image quality, but the certificate appears legitimate.';
      case 'FAILED':
        return 'The certificate could not be verified against our database. It may be invalid, tampered with, or from an unrecognized institution.';
      case 'CORRUPTED_HASH':
        return 'The embedded hash appears to be corrupted, possibly due to poor image quality, scanning artifacts, or compression. Try uploading a higher quality image.';
      case 'NO_HASH':
        return 'No embedded cryptographic hash was found in this certificate. This may be an older certificate or one that doesn\'t use hash embedding.';
      case 'ERROR':
        return 'An error occurred during verification. Please try again or contact support if the problem persists.';
      default:
        return 'Unknown verification status.';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Certificate Verification
        </h1>
        <p className="text-secondary-600">
          Upload your certificate to verify its authenticity instantly
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card mb-8"
      >
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-secondary-900">
            Upload Certificate for Verification
          </h3>
        </div>
        
        <FileUpload
          onFilesSelect={handleFilesSelect}
          accept=".png,.jpg,.jpeg,.pdf"
          maxFiles={1}
          maxSize={10 * 1024 * 1024} // 10MB
        />

        {files.length > 0 && !result && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleVerification}
              disabled={verifying}
              className="btn-primary flex items-center px-8 py-3"
            >
              {verifying ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Verifying Certificate...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Verify Certificate
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>

      {/* Results Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`card border-2 ${getStatusColor(result.verification_status)} mb-8`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {getStatusIcon(result.verification_status)}
              <div>
                <h3 className="text-xl font-bold">
                  {getStatusTitle(result.verification_status)}
                </h3>
                <p className="text-sm opacity-75">
                  {result.filename}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {result.confidence !== undefined ? `${Math.round(result.confidence * 100)}%` : 'N/A'}
              </div>
              {result.confidence !== undefined && (
                <div className={`text-sm ${getConfidenceLevel(result.confidence).color}`}>
                  {getConfidenceLevel(result.confidence).level} Confidence
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm leading-relaxed">
              {getStatusDescription(result.verification_status)}
            </p>
          </div>

          {/* Key Certificate Information - Only show if data exists */}
          {result.certificate_data && Object.keys(result.certificate_data).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {result.certificate_data['Student Name'] && (
                <div className="bg-secondary-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Student
                  </label>
                  <p className="text-sm font-bold text-secondary-900 mt-1">
                    {safeRenderValue(result.certificate_data['Student Name'])}
                  </p>
                </div>
              )}
              {result.certificate_data['Degree Name'] && (
                <div className="bg-secondary-50 rounded-lg p-4 md:col-span-2">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Degree
                  </label>
                  <p className="text-sm font-bold text-secondary-900 mt-1">
                    {safeRenderValue(result.certificate_data['Degree Name'])}
                  </p>
                </div>
              )}
              {result.certificate_data['Faculty Name'] && (
                <div className="bg-secondary-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Faculty
                  </label>
                  <p className="text-sm font-bold text-secondary-900 mt-1">
                    {safeRenderValue(result.certificate_data['Faculty Name'])}
                  </p>
                </div>
              )}
              {result.certificate_data['Date'] && (
                <div className="bg-secondary-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Date Issued
                  </label>
                  <p className="text-sm font-bold text-secondary-900 mt-1">
                    {safeRenderValue(result.certificate_data['Date'])}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Hash Preview */}
          {result.hash && (
            <div className="bg-secondary-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-secondary-500" />
                  <span className="text-sm font-medium text-secondary-700">Certificate Hash (SHA-256)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.hash)}
                  className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </button>
              </div>
              <p className="text-xs font-mono bg-white p-3 rounded border break-all">
                {result.hash}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-current border-opacity-20">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="btn-secondary flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Detailed Report
            </button>
            <div className="flex space-x-3">
              {result.certificate_data?.['Certificate Number'] && (
                <div className="relative group">
                  <button className="btn-secondary flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </button>
                  <div className="absolute right-0 bottom-12 hidden group-hover:block bg-white border border-secondary-200 rounded-lg shadow-lg z-10 min-w-56">
                    <button
                      onClick={handleDownloadProcessed}
                      className="block w-full text-left px-4 py-3 text-sm text-secondary-700 hover:bg-secondary-50 rounded-t-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4" />
                        <span>Download with Visual Markers</span>
                      </div>
                      <div className="text-xs text-secondary-500 mt-1">Shows hash embedding locations (recommended)</div>
                    </button>
                    <button
                      onClick={handleDownloadOriginal}
                      className="block w-full text-left px-4 py-3 text-sm text-secondary-700 hover:bg-secondary-50 rounded-b-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download Original</span>
                      </div>
                      <div className="text-xs text-secondary-500 mt-1">Clean version without markers</div>
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={retryVerification}
                className="btn-secondary"
                disabled={verifying}
              >
                Verify Again
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setFiles([]);
                }}
                className="btn-primary"
              >
                Verify New Certificate
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Verifications */}
      {recentVerifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recent Verifications
          </h3>
          <div className="space-y-3">
            {recentVerifications.slice(0, 5).map((verification, index) => (
              <div
                key={verification.id || index}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(verification.verification_status)}
                  <div>
                    <p className="font-medium text-secondary-900">
                      {safeRenderValue(verification.filename)}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {new Date(verification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    verification.verification_status === 'VERIFIED' || verification.verification_status === 'VERIFIED_BY_DATA'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {safeRenderValue(verification.verification_status?.replace('_', ' '))}
                  </span>
                  <p className="text-sm text-secondary-600 mt-1">
                    {verification.confidence !== undefined ? `${(verification.confidence * 100).toFixed(1)}% confidence` : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detailed Verification Report"
        size="4xl"
      >
        {result && (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Header Summary */}
            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.verification_status)}
                <div>
                  <h4 className="text-lg font-bold text-secondary-900">
                    {getStatusTitle(result.verification_status)}
                  </h4>
                  <p className="text-sm text-secondary-600">{safeRenderValue(result.filename)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-secondary-900">
                  {result.confidence !== undefined ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                </div>
                {result.confidence !== undefined && (
                  <div className={`text-sm ${getConfidenceLevel(result.confidence).color}`}>
                    {getConfidenceLevel(result.confidence).level} Confidence
                  </div>
                )}
              </div>
            </div>

            {/* File Information */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                File Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Filename
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1 break-all">
                    {safeRenderValue(result.filename)}
                  </p>
                </div>
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    File Size
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {result.fileSize ? formatFileSize(result.fileSize) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Verification Details
              </h4>
              <div className="space-y-4">
                <div className="p-4 border border-secondary-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-secondary-900">Confidence Level</span>
                    {result.confidence !== undefined && (
                      <span className={`font-medium ${getConfidenceLevel(result.confidence).color}`}>
                        {(result.confidence * 100).toFixed(2)}% ({getConfidenceLevel(result.confidence).level})
                      </span>
                    )}
                  </div>
                  {result.confidence !== undefined && (
                    <div className="w-full bg-secondary-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${getConfidenceLevel(result.confidence).bg}`}
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {result.extraction_method && (
                  <div className="p-4 border border-secondary-200 rounded-lg">
                    <span className="font-medium text-secondary-900">Extraction Method</span>
                    <p className="text-sm text-secondary-600 mt-1">{safeRenderValue(result.extraction_method)}</p>
                  </div>
                )}

                {result.similarity_score !== undefined && (
                  <div className="p-4 border border-secondary-200 rounded-lg">
                    <span className="font-medium text-secondary-900">Hash Similarity</span>
                    <p className="text-sm text-secondary-600 mt-1">
                      {(result.similarity_score * 100).toFixed(1)}% match with expected hash
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Data */}
            {result.certificate_data && Object.keys(result.certificate_data).length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Extracted Certificate Data
                </h4>
                <div className="space-y-3">
                  {Object.entries(result.certificate_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 border-b border-secondary-100">
                      <span className="text-sm font-medium text-secondary-700">{key}:</span>
                      <span className="text-sm text-secondary-900 text-right max-w-xs break-words">
                        {safeRenderValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hash Information */}
            {result.hash && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  Cryptographic Hash
                </h4>
                <div className="space-y-3">
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-secondary-700">Certificate Hash (SHA-256)</span>
                      <button
                        onClick={() => copyToClipboard(result.hash)}
                        className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Hash
                      </button>
                    </div>
                    <p className="text-xs font-mono bg-white p-3 rounded border break-all">
                      {result.hash}
                    </p>
                    <p className="text-xs text-secondary-500 mt-2">
                      This hash uniquely identifies the certificate and can be used to verify its authenticity.
                    </p>
                  </div>
                  
                  {result.expected_hash && (
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-secondary-700">Expected Hash</span>
                      <p className="text-xs font-mono bg-white p-3 rounded border break-all mt-2">
                        {result.expected_hash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            {result.message && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Verification Message
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">{safeRenderValue(result.message)}</p>
                </div>
              </div>
            )}

            {/* Technical Information */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Technical Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Verification ID
                  </label>
                  <p className="text-sm font-mono text-secondary-900 mt-1">
                    {safeRenderValue(result.id)}
                  </p>
                </div>
                {result.processing_time && (
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Processing Time
                    </label>
                    <p className="text-sm font-medium text-secondary-900 mt-1">
                      {safeRenderValue(result.processing_time)}ms
                    </p>
                  </div>
                )}
                {result.timestamp && (
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Verification Date
                    </label>
                    <p className="text-sm font-medium text-secondary-900 mt-1">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Verification Status
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {safeRenderValue(result.verification_status?.replace('_', ' '))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserVerify;