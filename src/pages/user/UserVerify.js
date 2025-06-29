import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  FileText, 
  Shield, 
  Hash, 
  Eye, 
  Download,
  Clock,
  Info,
  ExternalLink,
  Copy,
  RefreshCw,
  Zap,
  Archive,
  Star,
  Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { verifyCertificate, extractHash } from '../../services/api';

const UserVerify = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [processingStage, setProcessingStage] = useState('');
  const fileInputRef = useRef(null);

  // Load verification history from localStorage on component mount
  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('userVerificationHistory') || '[]');
    setVerificationHistory(history);
  }, []);

  const handleFilesSelect = (selectedFiles) => {
    setFiles(selectedFiles);
    setResult(null);
  };

  const handleVerification = async () => {
    if (files.length === 0) {
      toast.error('Please select a file to verify');
      return;
    }

    setProcessing(true);
    setProcessingStage('Uploading file...');
    
    try {
      const file = files[0].file;
      
      // Simulate processing stages for better UX
      setProcessingStage('Analyzing certificate...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStage('Extracting embedded hash...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStage('Performing OCR extraction...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStage('Verifying against database...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const options = {
        use_enhanced_extraction: true,
        check_database: true
      };

      const verificationResult = await verifyCertificate(file, options);
      
      const processedResult = {
        id: Date.now(),
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        ...verificationResult,
        processed_at: new Date().toISOString(),
        processing_time: Date.now() - Date.now() // In real app, measure actual time
      };

      setResult(processedResult);

      // Save to verification history
      const updatedHistory = [processedResult, ...verificationHistory.slice(0, 19)]; // Keep last 20
      setVerificationHistory(updatedHistory);
      localStorage.setItem('userVerificationHistory', JSON.stringify(updatedHistory));

      // Show success/warning based on result
      if (verificationResult.verification_status === 'VERIFIED') {
        toast.success('Certificate successfully verified! ✅');
      } else if (verificationResult.verification_status === 'VERIFIED_BY_DATA') {
        toast.success('Certificate verified by data matching! 📊');
      } else if (verificationResult.verification_status === 'CORRUPTED_HASH') {
        toast.warning('Hash appears corrupted, but certificate data may be valid 🔶');
      } else {
        toast.error('Certificate verification failed ❌');
      }
      
    } catch (error) {
      const errorResult = {
        id: Date.now(),
        filename: files[0].file.name,
        fileSize: files[0].file.size,
        fileType: files[0].file.type,
        verification_status: 'ERROR',
        message: error.message,
        confidence: 0,
        processed_at: new Date().toISOString()
      };
      
      setResult(errorResult);
      toast.error('Verification failed: ' + error.message);
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  const clearResult = () => {
    setResult(null);
    setFiles([]);
  };

  const viewDetails = () => {
    setShowDetailsModal(true);
  };

  const viewHistory = () => {
    setShowHistoryModal(true);
  };

  const showHelp = () => {
    setShowHelpModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard! 📋');
  };

  const downloadReport = () => {
    if (!result) return;
    
    const report = {
      certificate_verification_report: {
        filename: result.filename,
        verification_status: result.verification_status,
        confidence: result.confidence,
        processed_at: result.processed_at,
        message: result.message
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification_report_${result.filename}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded! 📄');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'VERIFIED_BY_DATA':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'CORRUPTED_HASH':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'NO_HASH':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'ERROR':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'The certificate has been successfully verified with a valid embedded hash that matches our database records.';
      case 'VERIFIED_BY_DATA':
        return 'The certificate data matches our database records, though the hash verification had issues. The certificate appears to be authentic.';
      case 'FAILED':
        return 'The certificate could not be verified against our database. It may be invalid, tampered with, or from an unrecognized institution.';
      case 'CORRUPTED_HASH':
        return 'The embedded hash appears to be corrupted, possibly due to poor image quality, scanning artifacts, or compression. Try uploading a higher quality image.';
      case 'NO_HASH':
        return 'No embedded cryptographic hash was found in this certificate. This may be an older certificate or one that doesn\'t use hash embedding.';
      case 'ERROR':
        return 'An error occurred during verification. Please try again with a different image or contact support if the problem persists.';
      default:
        return 'The verification status is unclear. Please try verifying again.';
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return { level: 'Very High', color: 'text-green-600', bg: 'bg-green-500' };
    if (confidence >= 0.8) return { level: 'High', color: 'text-green-600', bg: 'bg-green-500' };
    if (confidence >= 0.7) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-500' };
    if (confidence >= 0.5) return { level: 'Moderate', color: 'text-orange-600', bg: 'bg-orange-500' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-500' };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Verify Certificate
            </h1>
            <p className="text-secondary-600">
              Upload your certificate to verify its authenticity and extract information
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={viewHistory}
              className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Archive className="h-4 w-4" />
              <span>History</span>
            </button>
            <button
              onClick={showHelp}
              className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Info className="h-4 w-4" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`grid gap-8 ${result ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-1 max-w-2xl mx-auto'}`}>
        {/* Left Column - Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-secondary-200">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Upload className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900">Upload Certificate</h2>
                  <p className="text-sm text-secondary-600">Select your certificate file for verification</p>
                </div>
              </div>

              <FileUpload
                onFilesSelect={handleFilesSelect}
                maxFiles={1}
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']}
                maxFileSize={10 * 1024 * 1024} // 10MB
              />

              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 p-4 bg-secondary-50 rounded-lg border border-secondary-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-secondary-600" />
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{files[0].file.name}</p>
                        <p className="text-xs text-secondary-600">
                          {formatFileSize(files[0].file.size)} • {files[0].file.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles([])}
                      className="text-secondary-400 hover:text-secondary-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="mt-6">
                <button
                  onClick={handleVerification}
                  disabled={files.length === 0 || processing}
                  className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>{processingStage}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Verify Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Results (Only show when result exists) */}
        {result && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-lg border border-secondary-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-secondary-900">Verification Results</h2>
                      <p className="text-sm text-secondary-600">Certificate authentication details</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={viewDetails}
                      className="p-2 text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={downloadReport}
                      className="p-2 text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100 rounded-lg transition-colors"
                      title="Download report"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={clearResult}
                      className="p-2 text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100 rounded-lg transition-colors"
                      title="Clear results"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Status Overview */}
                  <div className="text-center p-6 bg-secondary-50 rounded-lg">
                    <div className="flex items-center justify-center mb-4">
                      {result.verification_status === 'VERIFIED' ? (
                        <CheckCircle className="h-12 w-12 text-green-600" />
                      ) : result.verification_status === 'VERIFIED_BY_DATA' ? (
                        <CheckCircle className="h-12 w-12 text-blue-600" />
                      ) : (
                        <AlertCircle className="h-12 w-12 text-red-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                      {result.verification_status?.replace('_', ' ')}
                    </h3>
                    <p className="text-secondary-600 text-sm mb-4">
                      {result.message}
                    </p>
                    <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(result.verification_status)}`}>
                      {result.verification_status?.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-4 w-4 text-primary-600" />
                        <span className="text-sm font-medium text-primary-900">Confidence</span>
                      </div>
                      <div className="text-2xl font-bold text-primary-900">
                        {(result.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-primary-700">
                        {getConfidenceLevel(result.confidence).level}
                      </div>
                    </div>
                    <div className="p-4 bg-secondary-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-secondary-600" />
                        <span className="text-sm font-medium text-secondary-900">Processed</span>
                      </div>
                      <div className="text-sm font-medium text-secondary-900">
                        {new Date(result.processed_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-secondary-600">
                        {new Date(result.processed_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Certificate Verified Message */}
                  {result.certificate_data && Object.keys(result.certificate_data).length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                        Certificate Verified
                      </h4>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            Certificate information extracted successfully
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          Use "View Details" to see complete verification information.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Detailed Results Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Verification Details"
        size="lg"
      >
        {result && (
          <div className="space-y-6">
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
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {result.filename}
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
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    File Type
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {result.fileType || 'Unknown'}
                  </p>
                </div>
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Processed At
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {new Date(result.processed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Verification Details
              </h4>
              <div className="space-y-3">
                <div className="p-4 border border-secondary-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-secondary-900">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.verification_status)}`}>
                      {result.verification_status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">
                    {getStatusDescription(result.verification_status)}
                  </p>
                </div>
                
                <div className="p-4 border border-secondary-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-secondary-900">Confidence Level</span>
                    <span className={`font-medium ${getConfidenceLevel(result.confidence).color}`}>
                      {(result.confidence * 100).toFixed(2)}% ({getConfidenceLevel(result.confidence).level})
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${getConfidenceLevel(result.confidence).bg}`}
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>

                {result.extraction_method && (
                  <div className="p-4 border border-secondary-200 rounded-lg">
                    <span className="font-medium text-secondary-900">Extraction Method</span>
                    <p className="text-sm text-secondary-600 mt-1">{result.extraction_method}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Verification History"
        size="lg"
      >
        <div className="space-y-4">
          {verificationHistory.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No History Yet</h3>
              <p className="text-secondary-600">Your verification history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {verificationHistory.map((item) => (
                <div key={item.id} className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-secondary-600" />
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{item.filename}</p>
                        <p className="text-xs text-secondary-600">
                          {new Date(item.processed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.verification_status)}`}>
                        {item.verification_status?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-secondary-600">
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {item.message && (
                    <p className="text-xs text-secondary-600 truncate">{item.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="How to Verify Certificates"
        size="lg"
      >
        <div className="space-y-6">
          {/* Quick Start Guide */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-3">
              Quick Start Guide
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">1. Upload Your Certificate</h5>
                <p className="text-sm text-blue-800">
                  Click "Choose File" or drag and drop your certificate image (JPG, PNG) or PDF file.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">2. Start Verification</h5>
                <p className="text-sm text-blue-800">
                  Click "Verify Certificate" to analyze your document for authenticity.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">3. Review Results</h5>
                <p className="text-sm text-blue-800">
                  Get instant verification results with confidence scores and detailed information.
                </p>
              </div>
            </div>
          </div>

          {/* Understanding Results */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-3">
              Understanding Verification Results
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 rounded">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <span className="font-medium text-green-800">Verified</span>
                  <p className="text-sm text-secondary-600">Certificate is authentic with valid hash</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="font-medium text-blue-800">Verified by Data</span>
                  <p className="text-sm text-secondary-600">Data matches but hash may be corrupted</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <span className="font-medium text-orange-800">Hash Corrupted</span>
                  <p className="text-sm text-secondary-600">Try uploading a higher quality image</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <span className="font-medium text-yellow-800">No Hash</span>
                  <p className="text-sm text-secondary-600">Older certificate without embedded hash</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <span className="font-medium text-red-800">Failed</span>
                  <p className="text-sm text-secondary-600">Certificate could not be verified</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips for Best Results */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-3">
              Tips for Best Results
            </h4>
            <div className="space-y-2 text-sm text-secondary-700">
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>Use high-resolution images (at least 300 DPI) for better OCR accuracy</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>Ensure the certificate is well-lit and all text is clearly visible</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>Avoid blurry, rotated, or heavily compressed images</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>PDF files are preferred over images when available</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-600 mt-1">•</span>
                <span>Contact support if you consistently get unexpected results</span>
              </div>
            </div>
          </div>

          {/* Supported Formats */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-3">
              Supported File Formats
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary-50 rounded-lg">
                <h5 className="font-medium text-secondary-900 mb-2">Image Formats</h5>
                <ul className="text-sm text-secondary-700 space-y-1">
                  <li>• JPEG (.jpg, .jpeg)</li>
                  <li>• PNG (.png)</li>
                  <li>• Maximum size: 10MB</li>
                </ul>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <h5 className="font-medium text-secondary-900 mb-2">Document Formats</h5>
                <ul className="text-sm text-secondary-700 space-y-1">
                  <li>• PDF (.pdf)</li>
                  <li>• Maximum size: 10MB</li>
                  <li>• Single page preferred</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserVerify;