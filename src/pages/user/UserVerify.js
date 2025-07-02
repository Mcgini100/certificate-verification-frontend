import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Upload, Download, Eye, Clock, Shield, X, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { verifyCertificate, getUserVerifications } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserVerify = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ✅ ENHANCED: Function to check if verification is successful
  const isVerificationSuccessful = (result) => {
    return (
      result.certificate_exists_in_ledger ||  // ✅ Key addition: existing certificates are successful
      result.verification_status === 'VERIFIED' || 
      result.verification_status === 'VERIFIED_BY_DATA'
    );
  };

  // ✅ ENHANCED: Get appropriate success message
  const getSuccessMessage = (result) => {
    if (result.certificate_exists_in_ledger) {
      return '✅ Certificate verified! Found in secure ledger';
    }
    if (result.verification_status === 'VERIFIED_BY_DATA') {
      return '✅ Certificate verified through data matching';
    }
    return '✅ Certificate verified successfully!';
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

    setProcessing(true);
    try {
      const file = files[0].file;
      const options = {
        use_enhanced_extraction: true,
        check_database: true
      };

      const verificationResult = await verifyCertificate(file, options);
      
      // ✅ ENHANCED: Create complete result object with all necessary data
      const completeResult = {
        filename: file.name,
        ...verificationResult,
        processed_at: new Date().toISOString()
      };

      setResult(completeResult);

      // ✅ ENHANCED: Show appropriate success/failure toast
      if (isVerificationSuccessful(completeResult)) {
        toast.success(getSuccessMessage(completeResult));
      } else {
        toast.warning('Certificate verification failed or incomplete');
      }

      // Save to localStorage as fallback
      saveVerificationLocally(completeResult);

    } catch (error) {
      const errorResult = {
        filename: files[0].file.name,
        verification_status: 'ERROR',
        message: error.message,
        confidence: 0,
        processed_at: new Date().toISOString()
      };
      
      setResult(errorResult);
      toast.error('Verification failed: ' + error.message);
      saveVerificationLocally(errorResult);
    } finally {
      setProcessing(false);
    }
  };

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
    verifications = verifications.slice(0, 10);
    
    localStorage.setItem(`user_verifications_${user?.id}`, JSON.stringify(verifications));
  };

  const loadVerificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await getUserVerifications(user?.id, { limit: 20 });
      setVerificationHistory(Array.isArray(history) ? history : history.verifications || []);
    } catch (error) {
      console.error('Failed to load verification history:', error);
      
      // Fallback to localStorage
      const savedVerifications = localStorage.getItem(`user_verifications_${user?.id}`);
      if (savedVerifications) {
        try {
          setVerificationHistory(JSON.parse(savedVerifications));
        } catch (parseError) {
          console.error('Error parsing saved verifications:', parseError);
          setVerificationHistory([]);
        }
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setResult(null);
  };

  const viewDetails = () => {
    setShowDetailsModal(true);
  };

  const shareResult = () => {
    if (!result) return;
    
    const shareText = `Certificate Verification Result:
    
Filename: ${result.filename}
Status: ${result.verification_status?.replace('_', ' ') || 'Unknown'}
Confidence: ${(result.confidence * 100).toFixed(1)}%
Verified: ${new Date(result.processed_at).toLocaleDateString()}

${result.certificate_exists_in_ledger ? 
  '✅ Certificate found in secure ledger' : 
  result.message || 'Verification completed'
}

Generated by CertVerify`;

    if (navigator.share) {
      navigator.share({
        title: 'Certificate Verification Result',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Result copied to clipboard! 📋');
    }
  };

  const downloadReport = () => {
    if (!result) return;
    
    const report = {
      certificate_verification_report: {
        filename: result.filename,
        verification_status: result.verification_status,
        confidence: result.confidence,
        processed_at: result.processed_at,
        message: result.message,
        certificate_exists_in_ledger: result.certificate_exists_in_ledger || false
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

  // ✅ ENHANCED: Better status color handling
  const getStatusColor = (status, certificateExists = false) => {
    // If certificate exists in ledger, always show as success
    if (certificateExists) {
      return 'bg-green-100 text-green-800 border border-green-200';
    }
    
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

  // ✅ ENHANCED: Better status descriptions
  const getStatusDescription = (status, certificateExists = false) => {
    // If certificate exists in ledger, show positive message
    if (certificateExists) {
      return 'This certificate has been verified and exists in our secure ledger. It is authentic and trusted.';
    }
    
    switch (status) {
      case 'VERIFIED':
        return 'The certificate has been successfully verified with a valid embedded hash that matches our database records.';
      case 'VERIFIED_BY_DATA':
        return 'The certificate data matches our database records. The certificate appears to be authentic.';
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
    if (confidence >= 0.9) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-500' };
    if (confidence >= 0.8) return { level: 'Very Good', color: 'text-green-600', bg: 'bg-green-400' };
    if (confidence >= 0.7) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-400' };
    if (confidence >= 0.5) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-400' };
    return { level: 'Poor', color: 'text-red-600', bg: 'bg-red-400' };
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

  // ✅ ENHANCED: Better status badge for history
  const getStatusBadge = (verification) => {
    const isSuccess = isVerificationSuccessful(verification);
    const statusClasses = isSuccess
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
    
    const displayStatus = verification.certificate_exists_in_ledger 
      ? 'VERIFIED (Ledger)'
      : verification.verification_status?.replace('_', ' ') || 'Unknown';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses}`}>
        {displayStatus}
      </span>
    );
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Verify Certificate
            </h1>
            <p className="text-secondary-600">
              Upload your certificate to verify its authenticity instantly
            </p>
          </div>
          <motion.button
            onClick={() => {
              loadVerificationHistory();
              setShowHistoryModal(true);
            }}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Clock className="h-4 w-4 mr-2" />
            View History
          </motion.button>
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card mb-6"
      >
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">
          Upload Certificate
        </h2>
        
        <FileUpload
          onFilesSelect={handleFilesSelect}
          acceptedTypes={['image/*', '.pdf']}
          maxFiles={1}
          className="mb-4"
        />
        
        {files.length > 0 && (
          <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary-200 rounded">
                  <Upload className="h-4 w-4 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    {files[0].file.name}
                  </p>
                  <p className="text-xs text-secondary-600">
                    {(files[0].file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={clearFiles}
                className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t border-secondary-200">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-secondary-600">
              Supported formats: PNG, JPG, JPEG, PDF (max 10MB)
            </p>
          </div>
          <motion.button
            onClick={handleVerification}
            disabled={files.length === 0 || processing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            whileHover={files.length > 0 && !processing ? { scale: 1.02 } : {}}
            whileTap={files.length > 0 && !processing ? { scale: 0.98 } : {}}
          >
            {processing ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Certificate
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Results Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-2 sm:mb-0">
              Verification Result
            </h2>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={shareResult}
                className="btn-secondary text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Share
              </motion.button>
              <motion.button
                onClick={downloadReport}
                className="btn-secondary text-sm flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="h-4 w-4 mr-1" />
                Report
              </motion.button>
              <motion.button
                onClick={viewDetails}
                className="btn-primary text-sm flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Details
              </motion.button>
            </div>
          </div>

          {/* ✅ ENHANCED: Main result display with better logic */}
          <div className={`p-6 rounded-lg border-2 ${
            isVerificationSuccessful(result) 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-4">
              {isVerificationSuccessful(result) ? (
                <CheckCircle className="h-8 w-8 text-green-600 mt-1 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-600 mt-1 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isVerificationSuccessful(result) ? 'text-green-900' : 'text-red-900'
                }`}>
                  {isVerificationSuccessful(result) ? 'Certificate Verified' : 'Verification Failed'}
                </h3>
                <p className={`text-sm mb-4 ${
                  isVerificationSuccessful(result) ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.certificate_exists_in_ledger 
                    ? '✅ Certificate found in secure ledger and verified as authentic'
                    : result.message || getStatusDescription(result.verification_status)
                  }
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-medium text-primary-900">Status</span>
                    </div>
                    <div className="text-sm font-medium text-primary-900">
                      {result.certificate_exists_in_ledger 
                        ? 'VERIFIED (Ledger)' 
                        : result.verification_status?.replace('_', ' ') || 'Unknown'
                      }
                    </div>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-secondary-600" />
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
                {(result.certificate_data && Object.keys(result.certificate_data).length > 0) && (
                  <div className="mt-4">
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
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Verification Details"
        size="lg"
      >
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Summary
              </h4>
              <div className="space-y-3">
                <div className="p-4 border border-secondary-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-secondary-900">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusColor(result.verification_status, result.certificate_exists_in_ledger)
                    }`}>
                      {result.certificate_exists_in_ledger 
                        ? 'VERIFIED (Ledger)' 
                        : result.verification_status?.replace('_', ' ')
                      }
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">
                    {getStatusDescription(result.verification_status, result.certificate_exists_in_ledger)}
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
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="medium" />
            </div>
          ) : verificationHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">No verification history yet</p>
              <p className="text-sm text-secondary-500 mt-1">
                Your verification attempts will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {verificationHistory.map((verification, index) => (
                <div key={index} className="p-4 border border-secondary-200 rounded-lg">
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
                          {formatDate(verification.processed_at)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(verification)}
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
        </div>
      </Modal>
    </div>
  );
};

export default UserVerify;