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
  const [extractedHash, setExtractedHash] = useState('');
  const [showHashExtraction, setShowHashExtraction] = useState(false);
  const fileInputRef = useRef(null);

  // Load verification history from localStorage on component mount
  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('userVerificationHistory') || '[]');
    setVerificationHistory(history);
  }, []);

  const handleFilesSelect = (selectedFiles) => {
    setFiles(selectedFiles);
    setResult(null);
    setExtractedHash('');
    setShowHashExtraction(false);
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

  const handleHashExtraction = async () => {
    if (files.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    setProcessing(true);
    setProcessingStage('Extracting hash...');
    
    try {
      const file = files[0].file;
      const hashResult = await extractHash(file, true);
      setExtractedHash(hashResult.hash || 'No hash found');
      setShowHashExtraction(true);
      toast.success('Hash extraction completed');
    } catch (error) {
      toast.error('Hash extraction failed: ' + error.message);
      setExtractedHash('');
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  const clearResult = () => {
    setResult(null);
    setFiles([]);
    setExtractedHash('');
    setShowHashExtraction(false);
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
        certificate_data: result.certificate_data,
        hash: result.hash,
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
              className="btn-secondary flex items-center"
            >
              <Archive className="h-4 w-4 mr-2" />
              History ({verificationHistory.length})
            </button>
            <button
              onClick={showHelp}
              className="btn-secondary flex items-center"
            >
              <Info className="h-4 w-4 mr-2" />
              Help
            </button>
          </div>
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Upload Certificate
          </h3>
          {files.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={handleHashExtraction}
                disabled={processing}
                className="btn-secondary text-sm flex items-center"
              >
                <Hash className="h-4 w-4 mr-1" />
                Extract Hash Only
              </button>
            </div>
          )}
        </div>
        
        <FileUpload
          onFilesSelect={handleFilesSelect}
          multiple={false}
          disabled={processing}
        />

        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="bg-secondary-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-secondary-500" />
                  <div>
                    <p className="font-medium text-secondary-900">{files[0].name}</p>
                    <p className="text-sm text-secondary-500">
                      {formatFileSize(files[0].file.size)} • {files[0].file.type}
                    </p>
                  </div>
                </div>
                {files[0].preview && (
                  <img
                    src={files[0].preview}
                    alt="Certificate preview"
                    className="h-16 w-16 object-cover rounded border"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-secondary-600">
                Ready to verify certificate
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={clearResult}
                  className="btn-secondary"
                  disabled={processing}
                >
                  Clear
                </button>
                <button
                  onClick={handleVerification}
                  disabled={processing}
                  className="btn-primary flex items-center"
                >
                  {processing ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      {processingStage || 'Verifying...'}
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Certificate
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Hash Extraction Result */}
      <AnimatePresence>
        {showHashExtraction && extractedHash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card mb-6 border-2 border-blue-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Hash className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Extracted Hash
              </h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">SHA-256 Hash</span>
                <button
                  onClick={() => copyToClipboard(extractedHash)}
                  className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </button>
              </div>
              <p className="text-xs font-mono text-blue-900 bg-white p-3 rounded border break-all">
                {extractedHash}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Stage Display */}
      <AnimatePresence>
        {processing && processingStage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card mb-6 border-2 border-primary-200"
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Processing...</h3>
                <p className="text-sm text-secondary-600">{processingStage}</p>
              </div>
            </div>
            <div className="mt-3 bg-primary-100 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`card border-2 ${getStatusColor(result.verification_status)} mb-6`}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {getStatusIcon(result.verification_status)}
              </motion.div>
              <h3 className="text-2xl font-bold text-secondary-900 mt-4 mb-2">
                {getStatusTitle(result.verification_status)}
              </h3>
              <p className="text-secondary-600 max-w-2xl mx-auto">
                {getStatusDescription(result.verification_status)}
              </p>
            </div>

            {/* Confidence Score */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-700">Confidence Score</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-secondary-900">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                  <span className={`text-xs ml-2 ${getConfidenceLevel(result.confidence).color}`}>
                    ({getConfidenceLevel(result.confidence).level})
                  </span>
                </div>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-3 rounded-full ${getConfidenceLevel(result.confidence).bg}`}
                ></motion.div>
              </div>
            </div>

            {/* Quick Info Grid */}
            {result.certificate_data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {result.certificate_data['Certificate Number'] && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Certificate Number
                    </label>
                    <p className="text-sm font-bold text-secondary-900 mt-1">
                      {result.certificate_data['Certificate Number']}
                    </p>
                  </div>
                )}
                {result.certificate_data['Student Name'] && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Student Name
                    </label>
                    <p className="text-sm font-bold text-secondary-900 mt-1">
                      {result.certificate_data['Student Name']}
                    </p>
                  </div>
                )}
                {result.certificate_data['Degree Name'] && (
                  <div className="bg-secondary-50 rounded-lg p-4 md:col-span-2">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Degree
                    </label>
                    <p className="text-sm font-bold text-secondary-900 mt-1">
                      {result.certificate_data['Degree Name']}
                    </p>
                  </div>
                )}
                {result.certificate_data['Faculty Name'] && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Faculty
                    </label>
                    <p className="text-sm font-bold text-secondary-900 mt-1">
                      {result.certificate_data['Faculty Name']}
                    </p>
                  </div>
                )}
                {result.certificate_data['Date'] && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Date Issued
                    </label>
                    <p className="text-sm font-bold text-secondary-900 mt-1">
                      {result.certificate_data['Date']}
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
                    <span className="text-sm font-medium text-secondary-700">Certificate Hash</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-secondary-500">SHA-256</span>
                    <button
                      onClick={() => copyToClipboard(result.hash)}
                      className="text-primary-600 hover:text-primary-700 flex items-center text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
                <p className="text-xs font-mono bg-white p-3 rounded border break-all">
                  {result.hash}
                </p>
              </div>
            )}

            {/* Message */}
            {result.message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Additional Information</h4>
                    <p className="text-sm text-blue-800 mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={viewDetails}
                className="btn-secondary flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Details
              </button>
              <button
                onClick={downloadReport}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
              {(result.verification_status === 'FAILED' || result.verification_status === 'ERROR') && (
                <button
                  onClick={retryVerification}
                  className="btn-primary flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Verification
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Verifications Summary */}
      {verificationHistory.length > 0 && !result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Recent Verifications
            </h3>
            <button
              onClick={viewHistory}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All ({verificationHistory.length})
            </button>
          </div>
          
          <div className="space-y-3">
            {verificationHistory.slice(0, 3).map((verification) => (
              <div
                key={verification.id}
                className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors cursor-pointer"
                onClick={() => {
                  setResult(verification);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(verification.verification_status)}
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-900">
                      {verification.filename}
                    </h4>
                    {verification.certificate_data?.['Certificate Number'] && (
                      <p className="text-sm text-secondary-500">
                        {verification.certificate_data['Certificate Number']}
                      </p>
                    )}
                    <p className="text-xs text-secondary-400">
                      {new Date(verification.processed_at).toLocaleDateString()} at{' '}
                      {new Date(verification.processed_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    verification.verification_status === 'VERIFIED' || verification.verification_status === 'VERIFIED_BY_DATA'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {verification.verification_status?.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-secondary-600 mt-1">
                    {(verification.confidence * 100).toFixed(1)}% confidence
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
                  <p className="text-sm text-secondary-600">{result.filename}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-secondary-900">
                  {(result.confidence * 100).toFixed(1)}%
                </div>
                <div className={`text-sm ${getConfidenceLevel(result.confidence).color}`}>
                  {getConfidenceLevel(result.confidence).level} Confidence
                </div>
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
                        {value || 'N/A'}
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
                  <p className="text-sm text-blue-800">{result.message}</p>
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
                    {result.id}
                  </p>
                </div>
                {result.processing_time && (
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Processing Time
                    </label>
                    <p className="text-sm font-medium text-secondary-900 mt-1">
                      {result.processing_time}ms
                    </p>
                  </div>
                )}
                {result.timestamp && (
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Server Timestamp
                    </label>
                    <p className="text-sm font-medium text-secondary-900 mt-1">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Verification Method
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    Enhanced Hash + OCR
                  </p>
                </div>
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
        size="4xl"
      >
        <div className="space-y-4">
          {verificationHistory.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-secondary-600">
                  {verificationHistory.length} verification{verificationHistory.length !== 1 ? 's' : ''} found
                </p>
                <button
                  onClick={() => {
                    setVerificationHistory([]);
                    localStorage.removeItem('userVerificationHistory');
                    toast.success('History cleared');
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Clear History
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {verificationHistory.map((verification) => (
                  <div
                    key={verification.id}
                    className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(verification.verification_status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-secondary-900 truncate">
                              {verification.filename}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(verification.verification_status)}`}>
                              {verification.verification_status?.replace('_', ' ')}
                            </span>
                          </div>
                          
                          {verification.certificate_data?.['Certificate Number'] && (
                            <p className="text-sm text-secondary-600 mb-1">
                              Certificate: {verification.certificate_data['Certificate Number']}
                            </p>
                          )}
                          
                          {verification.certificate_data?.['Student Name'] && (
                            <p className="text-sm text-secondary-600 mb-1">
                              Student: {verification.certificate_data['Student Name']}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-secondary-500">
                            <span>{new Date(verification.processed_at).toLocaleDateString()}</span>
                            <span>{new Date(verification.processed_at).toLocaleTimeString()}</span>
                            <span>{(verification.confidence * 100).toFixed(1)}% confidence</span>
                            {verification.fileSize && (
                              <span>{formatFileSize(verification.fileSize)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setResult(verification);
                            setShowHistoryModal(false);
                            setShowDetailsModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-700 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const updatedHistory = verificationHistory.filter(v => v.id !== verification.id);
                            setVerificationHistory(updatedHistory);
                            localStorage.setItem('userVerificationHistory', JSON.stringify(updatedHistory));
                            toast.success('Verification removed from history');
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Remove from History"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Archive className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No verification history</h3>
              <p className="text-secondary-500">
                Your verification history will appear here after you verify certificates.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Certificate Verification Help"
        size="2xl"
      >
        <div className="space-y-6">
          {/* Getting Started */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Getting Started
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">1. Upload Your Certificate</h5>
                <p className="text-sm text-blue-800">
                  Drag and drop or click to select your certificate image (PNG, JPG) or PDF file.
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
            <ul className="space-y-2 text-sm text-secondary-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Use high-quality, clear images (PNG or JPEG format preferred)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Ensure the entire certificate is visible in the image</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Avoid blurry, rotated, or heavily compressed images</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span>For scanned documents, use at least 300 DPI resolution</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span>File size should be under 10MB for optimal processing</span>
              </li>
            </ul>
          </div>

          {/* Security Information */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-3">
              Security & Privacy
            </h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-green-900 mb-2">Your data is secure</h5>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• Certificates are processed securely and not stored permanently</li>
                    <li>• Only verification metadata is kept for your history</li>
                    <li>• All communications are encrypted</li>
                    <li>• Your personal information remains private</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-3">
              Need Help?
            </h4>
            <div className="bg-secondary-50 rounded-lg p-4">
              <p className="text-sm text-secondary-700 mb-3">
                If you're experiencing issues or have questions about verification results:
              </p>
              <div className="flex space-x-4">
                <button className="btn-secondary text-sm flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Contact Support
                </button>
                <button className="btn-secondary text-sm flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  View FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserVerify;