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

  const normalizeVerificationStatus = (status) => {
    // Normalize status for better UX - both hash verification and data verification should show as VERIFIED
    if (status === 'VERIFIED_BY_DATA') {
      return 'VERIFIED';
    }
    return status;
  };

  const getDisplayMessage = (result) => {
    // If certificate is verified (either by hash or data), show positive message
    if (result.verification_status === 'VERIFIED' || result.verification_status === 'VERIFIED_BY_DATA') {
      if (result.verification_status === 'VERIFIED_BY_DATA') {
        return 'Certificate verified successfully through data matching';
      }
      return result.message || 'Certificate verified successfully';
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
      
      setResults([{
        filename: file.name,
        ...result,
        processed_at: new Date().toISOString()
      }]);

      if (result.verification_status === 'VERIFIED' || result.verification_status === 'VERIFIED_BY_DATA') {
        toast.success('Certificate verification successful!');
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
    }

    setProcessing(true);
    try {
      console.log(`Starting batch verification of ${files.length} files`); // Debug log
      
      const fileObjects = files.map(f => f.file);
      const options = {
        use_enhanced_extraction: true,
        continue_on_error: true
      };

      const batchResult = await batchVerify(fileObjects, options);
      
      const processedResults = batchResult.results.map((result, index) => ({
        filename: files[index]?.name || `file_${index}`,
        ...result,
        processed_at: new Date().toISOString()
      }));

      setResults(processedResults);

      toast.success(`Batch verification completed: ${batchResult.successful}/${batchResult.total_processed} successful`);
    } catch (error) {
      // Fallback to individual verification if batch API is not available
      console.log('Batch API failed, falling back to individual verification');
      const verificationResults = [];
      
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        console.log(`Processing file ${i + 1}/${files.length}: ${fileItem.name}`);
        
        try {
          const options = {
            use_enhanced_extraction: true,
            check_database: true
          };

          const result = await verifyCertificate(fileItem.file, options);
          
          verificationResults.push({
            filename: fileItem.name,
            ...result,
            processed_at: new Date().toISOString()
          });
        } catch (fileError) {
          verificationResults.push({
            filename: fileItem.name,
            verification_status: 'ERROR',
            message: fileError.message,
            confidence: 0,
            processed_at: new Date().toISOString()
          });
        }
      }

      setResults(verificationResults);
      
      const successCount = verificationResults.filter(r => 
        r.verification_status === 'VERIFIED' || r.verification_status === 'VERIFIED_BY_DATA'
      ).length;
      
      if (successCount > 0) {
        toast.success(`Individual verification completed: ${successCount}/${files.length} successful`);
      } else {
        toast.error('All verifications failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleHashVerification = async () => {
    if (!certificateNumber || !providedHash) {
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

  const getStatusColor = (status) => {
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

  const getStatusIcon = (status) => {
    const normalizedStatus = normalizeVerificationStatus(status);
    switch (normalizedStatus) {
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />;
      case 'FAILED':
      case 'CORRUPTED_HASH':
      case 'NO_HASH':
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />;
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
          // Hash Verification Form
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Hash Verification
            </h3>
            <div>
              <label className="form-label">Certificate Number</label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                className="form-input"
                placeholder="e.g., BSc-12700"
              />
            </div>
            <div>
              <label className="form-label">Hash to Verify</label>
              <textarea
                value={providedHash}
                onChange={(e) => setProvidedHash(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Enter the 64-character hash to verify..."
              />
            </div>
          </div>
        ) : (
          // File Upload Interface
          <div>
            <FileUpload
              onFilesSelect={handleFilesSelect}
              multiple={verificationMode === 'batch'}
              maxFiles={verificationMode === 'upload' ? 1 : undefined}
              disabled={processing}
              key={verificationMode} // Force re-render when mode changes
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between items-center">
          <div>
            <div className="text-sm text-secondary-600">
              {verificationMode === 'hash' ? (
                certificateNumber && providedHash ? 'Ready to verify hash' : 'Enter certificate details'
              ) : (
                files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'
              )}
            </div>
            {verificationMode === 'batch' && files.length === 1 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Consider using single verification mode for one file
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={clearResults}
              className="btn-secondary"
              disabled={processing}
            >
              Clear
            </button>
            <button
              onClick={handleVerification}
              disabled={
                processing || 
                (verificationMode === 'hash' ? !certificateNumber || !providedHash : files.length === 0)
              }
              className="btn-primary flex items-center"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify {verificationMode === 'batch' ? `${files.length} Files` : 'Certificate'}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Verification Results ({results.length} files)
            </h3>
            <button
              onClick={clearResults}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getStatusColor(result.verification_status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(result.verification_status)}
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900 mb-1">
                        {result.filename}
                      </h4>
                      <p className="text-sm mb-2">
                        Status: <span className="font-medium">{normalizeVerificationStatus(result.verification_status)?.replace('_', ' ')}</span>
                      </p>
                      <p className="text-sm text-secondary-600 mb-2">
                        {getDisplayMessage(result)}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <span>Confidence: {((result.confidence || 0) * 100).toFixed(1)}%</span>
                        <span>Processed: {new Date(result.processed_at).toLocaleTimeString()}</span>
                      </div>
                      {result.certificate_data && Object.keys(result.certificate_data).length > 0 && (
                        <div className="mt-2 text-xs text-secondary-600">
                          <p>Certificate Number: {result.certificate_data['Certificate Number'] || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewDetails(result)}
                      className="btn-secondary btn-sm"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {results.length > 1 && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  ✅ {results.filter(r => r.verification_status === 'VERIFIED' || r.verification_status === 'VERIFIED_BY_DATA').length} verified
                </span>
                <span className="text-red-600">
                  ❌ {results.filter(r => ['FAILED', 'ERROR', 'CORRUPTED_HASH', 'NO_HASH'].includes(r.verification_status)).length} failed
                </span>
              </div>
            </div>
          )}
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
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* File Information */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                File Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Filename
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1 break-all">
                    {selectedResult.filename}
                  </p>
                </div>
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Processed At
                  </label>
                  <p className="text-sm font-medium text-secondary-900 mt-1">
                    {new Date(selectedResult.processed_at).toLocaleString()}
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
                <div className="p-3 border border-secondary-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-sm font-medium text-secondary-900">Status:</span>
                    <span className="text-sm text-secondary-700 mt-1 sm:mt-0">
                      {normalizeVerificationStatus(selectedResult.verification_status)?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="p-3 border border-secondary-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-sm font-medium text-secondary-900">Confidence:</span>
                    <span className="text-sm text-secondary-700 mt-1 sm:mt-0">
                      {((selectedResult.confidence || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="p-3 border border-secondary-200 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-secondary-900 mb-2">Message:</span>
                    <span className="text-sm text-secondary-700 break-words">
                      {getDisplayMessage(selectedResult)}
                    </span>
                  </div>
                </div>

                {selectedResult.extraction_method && (
                  <div className="p-3 border border-secondary-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <span className="text-sm font-medium text-secondary-900">Extraction Method:</span>
                      <span className="text-sm text-secondary-700 mt-1 sm:mt-0">
                        {selectedResult.extraction_method}
                      </span>
                    </div>
                  </div>
                )}
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