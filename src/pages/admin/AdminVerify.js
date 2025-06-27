import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Hash, Upload, FileText, Eye, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { verifyCertificate, verifyBatchCertificates, extractHash, verifyByHash } from '../../services/api';

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

      const batchResult = await verifyBatchCertificates(fileObjects, options);
      
      const processedResults = batchResult.results.map((result, index) => ({
        filename: files[index]?.name || `file_${index}`,
        ...result,
        processed_at: new Date().toISOString()
      }));

      setResults(processedResults);

      toast.success(`Batch verification completed: ${batchResult.successful}/${batchResult.total_processed} successful`);
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
      toast.error('Hash verification failed: ' + error.message);
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
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setVerificationMode('batch')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                verificationMode === 'batch'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Batch Verify
            </button>
            <button
              onClick={() => setVerificationMode('hash')}
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
              disabled={processing}
            />
            
            {verificationMode === 'upload' && (
              <div className="mt-4">
                <label className="form-label">Expected Hash (Optional)</label>
                <input
                  type="text"
                  value={expectedHash}
                  onChange={(e) => setExpectedHash(e.target.value)}
                  className="form-input"
                  placeholder="Enter expected hash for comparison (optional)"
                />
                <p className="mt-1 text-sm text-secondary-500">
                  If provided, the extracted hash will be compared against this value
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-secondary-600">
            {verificationMode === 'hash' ? (
              certificateNumber && providedHash ? 'Ready to verify hash' : 'Enter certificate details'
            ) : (
              files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'
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
              Verification Results
            </h3>
            <div className="text-sm text-secondary-600">
              {results.length} result(s)
            </div>
          </div>

          <div className="space-y-4">
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
                        Status: <span className="font-medium">{result.verification_status?.replace('_', ' ')}</span>
                      </p>
                      <p className="text-sm mb-2">
                        Confidence: <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
                      </p>
                      {result.message && (
                        <p className="text-sm text-secondary-600">
                          {result.message}
                        </p>
                      )}
                      
                      {/* Quick Info */}
                      {result.certificate_data && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {result.certificate_data['Certificate Number'] && (
                            <div>
                              <span className="font-medium">Cert #:</span> {result.certificate_data['Certificate Number']}
                            </div>
                          )}
                          {result.certificate_data['Student Name'] && (
                            <div>
                              <span className="font-medium">Student:</span> {result.certificate_data['Student Name']}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {result.hash && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Hash:</span>
                          <p className="text-xs font-mono bg-secondary-100 p-2 rounded mt-1 break-all">
                            {result.hash.substring(0, 32)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => viewDetails(result)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {results.length > 1 && (
            <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.verification_status === 'VERIFIED' || r.verification_status === 'VERIFIED_BY_DATA').length}
                  </p>
                  <p className="text-sm text-secondary-600">Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.verification_status === 'FAILED' || r.verification_status === 'ERROR').length}
                  </p>
                  <p className="text-sm text-secondary-600">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {results.filter(r => !['VERIFIED', 'VERIFIED_BY_DATA', 'FAILED', 'ERROR'].includes(r.verification_status)).length}
                  </p>
                  <p className="text-sm text-secondary-600">Other</p>
                </div>
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
        size="2xl"
      >
        {selectedResult && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-secondary-700">File</label>
                  <p className="text-sm text-secondary-900">{selectedResult.filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedResult.verification_status)}
                    <span className="text-sm text-secondary-900">
                      {selectedResult.verification_status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Confidence</label>
                  <p className="text-sm text-secondary-900">{(selectedResult.confidence * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Processed At</label>
                  <p className="text-sm text-secondary-900">
                    {new Date(selectedResult.processed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            {selectedResult.message && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Message
                </h4>
                <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">
                  {selectedResult.message}
                </p>
              </div>
            )}

            {/* Certificate Data */}
            {selectedResult.certificate_data && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Extracted Data
                </h4>
                <div className="space-y-2">
                  {Object.entries(selectedResult.certificate_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="text-sm font-medium text-secondary-700">{key}:</span>
                      <span className="text-sm text-secondary-900 text-right">{value || 'N/A'}</span>
                    </div>
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
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-secondary-700">Extracted Hash</label>
                    <div className="bg-secondary-50 p-3 rounded-lg mt-1">
                      <p className="text-xs font-mono text-secondary-700 break-all">
                        {selectedResult.hash}
                      </p>
                    </div>
                  </div>
                  
                  {selectedResult.expected_hash && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Expected Hash</label>
                      <div className="bg-secondary-50 p-3 rounded-lg mt-1">
                        <p className="text-xs font-mono text-secondary-700 break-all">
                          {selectedResult.expected_hash}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedResult.similarity_score !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Similarity Score</label>
                      <p className="text-sm text-secondary-900">
                        {(selectedResult.similarity_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extraction Method */}
            {selectedResult.extraction_method && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-3">
                  Technical Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-secondary-700">Extraction Method</label>
                    <p className="text-sm text-secondary-900">{selectedResult.extraction_method}</p>
                  </div>
                  {selectedResult.timestamp && (
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Timestamp</label>
                      <p className="text-sm text-secondary-900">
                        {new Date(selectedResult.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
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