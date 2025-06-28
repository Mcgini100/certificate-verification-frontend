import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Hash, Upload, FileText, Eye, Download } from 'lucide-react';
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
  const [expectedHash, setExpectedHash] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [providedHash, setProvidedHash] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

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

  const handleFilesSelect = (selectedFiles) => {
    setFiles(selectedFiles);
    setResults([]);
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
        expected_hash: expectedHash || undefined,
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

    setProcessing(true);
    try {
      const fileObjects = files.map(f => f.file);
      const options = {
        use_enhanced_extraction: true,
        continue_on_error: true
      };

      const batchResult = await batchVerify(fileObjects, options);
      
      // Handle different response formats from the API
      let processedResults = [];
      
      if (batchResult.results) {
        // Standard batch response format
        processedResults = batchResult.results.map((result, index) => ({
          filename: files[index]?.name || `file_${index}`,
          ...result,
          processed_at: new Date().toISOString()
        }));
      } else if (Array.isArray(batchResult)) {
        // Direct array response
        processedResults = batchResult.map((result, index) => ({
          filename: files[index]?.name || `file_${index}`,
          ...result,
          processed_at: new Date().toISOString()
        }));
      } else {
        // Single result wrapped as array
        processedResults = [{
          filename: files[0]?.name || 'file_0',
          ...batchResult,
          processed_at: new Date().toISOString()
        }];
      }

      setResults(processedResults);

      const successful = processedResults.filter(r => 
        r.verification_status === 'VERIFIED' || r.verification_status === 'VERIFIED_BY_DATA'
      ).length;

      toast.success(`Batch verification completed: ${successful}/${processedResults.length} successful`);
    } catch (error) {
      toast.error('Batch verification failed: ' + error.message);
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
        message: result.message || (result.verified ? 'Hash verification successful' : 'Hash verification failed'),
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
      toast.error('Hash verification failed: ' + error.message);
      setResults([{
        filename: 'Hash Verification',
        verification_status: 'ERROR',
        message: error.message,
        confidence: 0,
        certificate_data: { 'Certificate Number': certificateNumber },
        hash: providedHash,
        processed_at: new Date().toISOString()
      }]);
    } finally {
      setProcessing(false);
    }
  };

  const handleHashExtraction = async () => {
    if (files.length === 0) {
      toast.error('Please select a file to extract hash from');
      return;
    }

    setProcessing(true);
    try {
      const file = files[0].file;
      const result = await extractHash(file);
      
      if (result.hash) {
        setExpectedHash(result.hash);
        toast.success('Hash extracted successfully!');
      } else {
        toast.warning('No hash found in the certificate');
      }
    } catch (error) {
      toast.error('Hash extraction failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerification = () => {
    switch (verificationMode) {
      case 'upload':
        handleSingleVerification();
        break;
      case 'batch':
        handleBatchVerification();
        break;
      case 'hash':
        handleHashVerification();
        break;
    }
  };

  const viewDetails = (result) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'VERIFIED_BY_DATA':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAILED':
      case 'CORRUPTED_HASH':
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'VERIFIED_BY_DATA':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'FAILED':
      case 'CORRUPTED_HASH':
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-orange-50 border-orange-200 text-orange-800';
    }
  };

  const clearResults = () => {
    setResults([]);
    setFiles([]);
    setExpectedHash('');
    setCertificateNumber('');
    setProvidedHash('');
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
          Verify certificate authenticity using multiple methods
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
              onClick={() => setVerificationMode('upload')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                verificationMode === 'upload'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Single Upload
            </button>
            <button
              onClick={() => setVerificationMode('batch')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                verificationMode === 'batch'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Batch Upload
            </button>
            <button
              onClick={() => setVerificationMode('hash')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                verificationMode === 'hash'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Hash Verification
            </button>
          </div>
        </div>
      </motion.div>

      {/* Verification Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card mb-8"
      >
        {verificationMode === 'upload' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Single Certificate Verification
            </h3>
            
            <FileUpload
              onFilesSelect={handleFilesSelect}
              accept=".png,.jpg,.jpeg,.pdf"
              maxFiles={1}
              maxSize={10 * 1024 * 1024} // 10MB
            />

            {files.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Expected Hash (Optional)</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter expected hash for verification"
                      value={expectedHash}
                      onChange={(e) => setExpectedHash(e.target.value)}
                      className="form-input flex-1 font-mono text-sm"
                    />
                    <button
                      onClick={handleHashExtraction}
                      disabled={processing}
                      className="btn-secondary flex items-center"
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      Extract Hash
                    </button>
                  </div>
                  <p className="text-sm text-secondary-500 mt-1">
                    If provided, the system will compare against this hash value
                  </p>
                </div>

                <button
                  onClick={handleVerification}
                  disabled={processing}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {processing ? (
                    <LoadingSpinner size="small" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  {processing ? 'Verifying...' : 'Verify Certificate'}
                </button>
              </div>
            )}
          </div>
        )}

        {verificationMode === 'batch' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Batch Certificate Verification
            </h3>
            
            <FileUpload
              onFilesSelect={handleFilesSelect}
              accept=".png,.jpg,.jpeg,.pdf"
              maxFiles={10}
              maxSize={10 * 1024 * 1024} // 10MB per file
            />

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium">
                      {files.length} file{files.length !== 1 ? 's' : ''} selected for batch verification
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleVerification}
                  disabled={processing}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {processing ? (
                    <LoadingSpinner size="small" className="mr-2" />
                  ) : (
                    <Upload className="h-5 w-5 mr-2" />
                  )}
                  {processing ? 'Processing Batch...' : 'Verify All Certificates'}
                </button>
              </div>
            )}
          </div>
        )}

        {verificationMode === 'hash' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Hash-Based Verification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Certificate Number</label>
                <input
                  type="text"
                  placeholder="e.g., BSc-12700"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Provided Hash</label>
                <input
                  type="text"
                  placeholder="Enter the hash to verify"
                  value={providedHash}
                  onChange={(e) => setProvidedHash(e.target.value)}
                  className="form-input font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleVerification}
              disabled={processing || !certificateNumber || !providedHash}
              className="btn-primary w-full flex items-center justify-center"
            >
              {processing ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <Hash className="h-5 w-5 mr-2" />
              )}
              {processing ? 'Verifying Hash...' : 'Verify Hash'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Results Section */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Verification Results
            </h3>
            <button
              onClick={clearResults}
              className="btn-secondary text-sm"
            >
              Clear Results
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.verification_status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.verification_status)}
                    <div>
                      <p className="font-medium">
                        {result.filename}
                      </p>
                      <p className="text-sm opacity-75">
                        Status: {result.verification_status?.replace('_', ' ')}
                      </p>
                      {result.confidence !== undefined && (
                        <p className="text-sm opacity-75">
                          Confidence: {Math.round(result.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.confidence !== undefined && (
                      <div className="text-right mr-4">
                        <div className="text-lg font-bold">
                          {Math.round(result.confidence * 100)}%
                        </div>
                        <div className="w-20 bg-white bg-opacity-50 rounded-full h-2">
                          <div
                            className="bg-current h-2 rounded-full transition-all duration-300"
                            style={{ width: `${result.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => viewDetails(result)}
                      className="btn-secondary flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </button>
                  </div>
                </div>

                {result.message && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-sm">
                      <strong>Message:</strong> {result.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Verification Details - ${selectedResult?.filename}`}
        size="xl"
      >
        {selectedResult && (
          <div className="space-y-6">
            {/* Status and Confidence */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Verification Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-secondary-700">Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedResult.verification_status)}`}>
                      {selectedResult.verification_status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Confidence</label>
                  <p className="text-lg font-semibold text-secondary-900">
                    {selectedResult.confidence !== undefined ? `${Math.round(selectedResult.confidence * 100)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Data */}
            {selectedResult.certificate_data && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Extracted Certificate Data
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(selectedResult.certificate_data).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex justify-between items-start border-b border-secondary-200 pb-2">
                        <span className="text-sm font-medium text-secondary-700">{key}:</span>
                        <span className="text-sm text-secondary-900 text-right max-w-xs">{safeRenderValue(value)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Hash Information */}
            {selectedResult.hash && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Hash Information
                </h4>
                <div className="bg-secondary-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-secondary-700">Extracted/Provided Hash</label>
                  <p className="font-mono text-sm text-secondary-900 break-all mt-1">
                    {selectedResult.hash}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Technical Details */}
            {(selectedResult.similarity_score !== undefined || selectedResult.extraction_method) && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Technical Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedResult.similarity_score !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Similarity Score</label>
                      <p className="text-sm text-secondary-900">
                        {(selectedResult.similarity_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {selectedResult.extraction_method && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Extraction Method</label>
                      <p className="text-sm text-secondary-900">{selectedResult.extraction_method}</p>
                    </div>
                  )}
                  {selectedResult.processed_at && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Processed At</label>
                      <p className="text-sm text-secondary-900">
                        {new Date(selectedResult.processed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            {selectedResult.message && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  System Message
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">{selectedResult.message}</p>
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