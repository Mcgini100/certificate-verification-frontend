import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Hash, Upload, FileText, Eye, Download, X } from 'lucide-react';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { verifyCertificate, batchVerify, extractHash, verifyByHash } from '../../services/api';

const AdminVerify = () => {
  const [verificationMode, setVerificationMode] = useState('upload'); // 'upload', 'batch', 'hash'
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [certificateNumber, setCertificateNumber] = useState('');
  const [providedHash, setProvidedHash] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

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
      return 'Certificate verified! Found in secure ledger';
    }
    if (result.verification_status === 'VERIFIED_BY_DATA') {
      return 'Certificate verified through data matching';
    }
    return 'Certificate verified successfully';
  };

  const normalizeVerificationStatus = (status) => {
    // Normalize status for better UX - both hash verification and data verification should show as VERIFIED
    if (status === 'VERIFIED_BY_DATA') {
      return 'VERIFIED';
    }
    return status;
  };

  const getDisplayMessage = (result) => {
    // ✅ ENHANCED: Show positive messages for verified certificates
    if (isVerificationSuccessful(result)) {
      return getSuccessMessage(result);
    }
    return result.message;
  };

  // Clear files when switching verification mode to prevent confusion
  useEffect(() => {
    setFiles([]);
    setResults([]);
  }, [verificationMode]);

  const handleFilesSelect = (selectedFiles) => {
    console.log('Files selected for verification:', selectedFiles); // Debug log
    setFiles(selectedFiles);
    setResults([]);
  };

  const handleVerificationModeChange = (mode) => {
    setVerificationMode(mode);
    setFiles([]); // Clear files when switching modes
    setResults([]);
    setCertificateNumber('');
    setProvidedHash('');
  };

  const handleSingleVerification = async () => {
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

      const result = await verifyCertificate(file, options);
      
      const completeResult = {
        filename: file.name,
        ...result,
        processed_at: new Date().toISOString()
      };
      
      setResults([completeResult]);

      // ✅ ENHANCED: Show appropriate success/failure toast
      if (isVerificationSuccessful(completeResult)) {
        toast.success(getSuccessMessage(completeResult));
      } else {
        toast.warning('Certificate verification failed or incomplete');
      }
    } catch (error) {
      setResults([{
        filename: files[0].file.name,
        verification_status: 'ERROR',
        message: error.message,
        confidence: 0,
        processed_at: new Date().toISOString()
      }]);
      toast.error('Verification failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchVerification = async () => {
    if (files.length === 0) {
      toast.error('Please select files to verify');
      return;
    }

    if (files.length === 1) {
      toast.warning('Only one file selected. Consider using single verification mode for individual files.');
      return;
    }

    setProcessing(true);
    try {
      const fileObjects = files.map(f => f.file);
      const options = {
        use_enhanced_extraction: true,
        check_database: true
      };

      const results = await batchVerify(fileObjects, options);
      
      const processedResults = results.map((result, index) => ({
        filename: fileObjects[index].name,
        ...result,
        processed_at: new Date().toISOString()
      }));

      setResults(processedResults);

      // ✅ ENHANCED: Count successful verifications including ledger matches
      const successful = processedResults.filter(result => isVerificationSuccessful(result)).length;
      const total = processedResults.length;

      if (successful === total) {
        toast.success(`All ${total} certificates verified successfully!`);
      } else if (successful > 0) {
        toast.warning(`${successful}/${total} certificates verified successfully`);
      } else {
        toast.error('No certificates could be verified');
      }
    } catch (error) {
      toast.error('Batch verification failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleHashVerification = async () => {
    if (!certificateNumber.trim() || !providedHash.trim()) {
      toast.error('Please provide both certificate number and hash');
      return;
    }

    setProcessing(true);
    try {
      const result = await verifyByHash(certificateNumber, providedHash);
      
      setResults([{
        filename: 'Hash Verification',
        verification_status: result.verified ? 'VERIFIED' : 'FAILED',
        message: result.message,
        confidence: result.verified ? 1.0 : 0,
        certificate_data: { 'Certificate Number': certificateNumber },
        hash: providedHash,
        processed_at: new Date().toISOString()
      }]);

      if (result.verified) {
        toast.success('Hash verification successful!');
      } else {
        toast.error('Hash verification failed!');
      }
    } catch (error) {
      setResults([{
        filename: 'Hash Verification',
        verification_status: 'ERROR',
        message: error.message,
        confidence: 0,
        processed_at: new Date().toISOString()
      }]);
      toast.error('Hash verification failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerification = () => {
    if (verificationMode === 'upload') {
      handleSingleVerification();
    } else if (verificationMode === 'batch') {
      handleBatchVerification();
    } else {
      handleHashVerification();
    }
  };

  const clearResults = () => {
    setResults([]);
    setFiles([]);
    setCertificateNumber('');
    setProvidedHash('');
  };

  const viewDetails = (result) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  // ✅ ENHANCED: Better status color handling
  const getStatusColor = (status, certificateExists = false) => {
    // If certificate exists in ledger, always show as success
    if (certificateExists) {
      return 'bg-green-50 border-green-200';
    }
    
    const normalizedStatus = normalizeVerificationStatus(status);
    switch (normalizedStatus) {
      case 'VERIFIED':
        return 'bg-green-50 border-green-200';
      case 'FAILED':
        return 'bg-red-50 border-red-200';
      case 'CORRUPTED_HASH':
        return 'bg-orange-50 border-orange-200';
      case 'NO_HASH':
        return 'bg-yellow-50 border-yellow-200';
      case 'ERROR':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // ✅ ENHANCED: Better status icon handling
  const getStatusIcon = (status, certificateExists = false) => {
    // If certificate exists in ledger, always show success icon
    if (certificateExists || isVerificationSuccessful({ verification_status: status, certificate_exists_in_ledger: certificateExists })) {
      return <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />;
    }
    
    return <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />;
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
          Verify Certificates
        </h1>
        <p className="text-secondary-600">
          Verify individual certificates, batch process multiple files, or validate hashes directly
        </p>
      </motion.div>

      {/* Verification Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          <label className="form-label">Verification Mode:</label>
          <div className="flex bg-secondary-100 rounded-lg p-1">
            <button
              onClick={() => handleVerificationModeChange('upload')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                verificationMode === 'upload'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => handleVerificationModeChange('batch')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                verificationMode === 'batch'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Batch Verify
            </button>
            <button
              onClick={() => handleVerificationModeChange('hash')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                verificationMode === 'hash'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Hash Only
            </button>
          </div>
        </div>

        {/* Mode Description */}
        <div className="text-sm text-secondary-600">
          {verificationMode === 'upload' && (
            <p>Verify one certificate at a time with optional expected hash comparison.</p>
          )}
          {verificationMode === 'batch' && (
            <p>Verify multiple certificates simultaneously. Select multiple files using Ctrl+Click or Cmd+Click.</p>
          )}
          {verificationMode === 'hash' && (
            <p>Verify a certificate by directly comparing hash values without file upload.</p>
          )}
        </div>
      </motion.div>

      {/* Verification Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card mb-6"
      >
        {verificationMode === 'hash' ? (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Hash Verification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Certificate Number</label>
                <input
                  type="text"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="Enter certificate number"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Expected Hash</label>
                <input
                  type="text"
                  value={providedHash}
                  onChange={(e) => setProvidedHash(e.target.value)}
                  placeholder="Enter expected hash value"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              {verificationMode === 'batch' ? 'Batch Upload' : 'Single Upload'}
            </h2>
            <FileUpload
              onFilesSelect={handleFilesSelect}
              acceptedTypes={['image/*', '.pdf']}
              maxFiles={verificationMode === 'batch' ? 10 : 1}
              className="mb-4"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-secondary-200">
          <div className="mb-4 sm:mb-0">
            {verificationMode === 'hash' ? (
              <p className="text-sm text-secondary-600">
                Enter certificate details to verify hash integrity
              </p>
            ) : (
              <p className="text-sm text-secondary-600">
                Supported: PNG, JPG, JPEG, PDF (max 10MB each)
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {results.length > 0 && (
              <motion.button
                onClick={clearResults}
                className="btn-secondary flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </motion.button>
            )}
            <motion.button
              onClick={handleVerification}
              disabled={
                processing ||
                (verificationMode === 'hash' && (!certificateNumber.trim() || !providedHash.trim())) ||
                (verificationMode !== 'hash' && files.length === 0)
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              whileHover={!processing ? { scale: 1.02 } : {}}
              whileTap={!processing ? { scale: 0.98 } : {}}
            >
              {processing ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  {verificationMode === 'batch' ? 'Processing...' : 'Verifying...'}
                </>
              ) : (
                <>
                  {verificationMode === 'hash' ? (
                    <Hash className="h-4 w-4 mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {verificationMode === 'batch' ? 'Verify All' : 'Verify'}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Verification Results ({results.length})
            </h2>
            <div className="text-sm text-secondary-600">
              {/* ✅ ENHANCED: Better success count calculation */}
              {(() => {
                const successful = results.filter(result => isVerificationSuccessful(result)).length;
                const total = results.length;
                return `${successful}/${total} verified`;
              })()}
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-4 border rounded-lg ${getStatusColor(result.verification_status, result.certificate_exists_in_ledger)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(result.verification_status, result.certificate_exists_in_ledger)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-secondary-900">
                          {result.filename}
                        </h3>
                        {/* ✅ ENHANCED: Better status display */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isVerificationSuccessful(result)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.certificate_exists_in_ledger 
                            ? 'VERIFIED (Ledger)'
                            : normalizeVerificationStatus(result.verification_status)
                          }
                        </span>
                      </div>
                      
                      <p className="text-sm text-secondary-700 mb-2">
                        {getDisplayMessage(result)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                        <span>
                          Processed: {new Date(result.processed_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => viewDetails(result)}
                    className="ml-4 p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
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
        {selectedResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-secondary-700 block mb-1">
                      Status
                    </label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      isVerificationSuccessful(selectedResult)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedResult.certificate_exists_in_ledger 
                        ? 'VERIFIED (Ledger)'
                        : normalizeVerificationStatus(selectedResult.verification_status)
                      }
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-secondary-700 block mb-1">
                      Confidence
                    </label>
                    <div className="text-lg font-semibold text-secondary-900">
                      {(selectedResult.confidence * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-secondary-700 block mb-1">
                      Filename
                    </label>
                    <p className="text-sm text-secondary-900">{selectedResult.filename}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-secondary-700 block mb-1">
                      Processed At
                    </label>
                    <p className="text-sm text-secondary-900">
                      {new Date(selectedResult.processed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ✅ ENHANCED: Better message display */}
              <div className="mt-4">
                <label className="text-sm font-medium text-secondary-700 block mb-2">
                  Message
                </label>
                <div className={`p-3 rounded-lg ${
                  isVerificationSuccessful(selectedResult)
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    isVerificationSuccessful(selectedResult)
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {selectedResult.certificate_exists_in_ledger 
                      ? '✅ Certificate found in secure ledger and verified as authentic'
                      : getDisplayMessage(selectedResult)
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Hash Information */}
            {selectedResult.hash && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Hash Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-secondary-700 block mb-2">
                      Extracted Hash
                    </label>
                    <div className="bg-secondary-50 p-3 rounded-lg">
                      <p className="text-xs font-mono text-secondary-700 break-all">
                        {selectedResult.hash}
                      </p>
                    </div>
                  </div>
                  
                  {selectedResult.similarity_score !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700 block mb-2">
                        Similarity Score
                      </label>
                      <div className="bg-secondary-50 p-3 rounded-lg">
                        <p className="text-sm text-secondary-700">
                          {(selectedResult.similarity_score * 100).toFixed(1)}% match
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Certificate Data */}
            {selectedResult.certificate_data && Object.keys(selectedResult.certificate_data).length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Certificate Data
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-secondary-200 rounded-lg p-3">
                  {Object.entries(selectedResult.certificate_data)
                    .filter(([key, value]) => value && !['verification_history'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-secondary-100 last:border-b-0">
                        <span className="text-sm font-medium text-secondary-700 capitalize mb-1 sm:mb-0 sm:min-w-0 sm:pr-4">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span className="text-sm text-secondary-900 break-words sm:text-right">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminVerify;