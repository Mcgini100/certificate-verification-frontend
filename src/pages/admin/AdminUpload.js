import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Settings, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { uploadCertificate, downloadProcessedCertificate } from '../../services/api';

const AdminUpload = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'batch'
  const [showSettings, setShowSettings] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [settings, setSettings] = useState({
    embedHash: true,
    addWatermark: false,
    watermarkText: '',
    useChecksum: true,
    outputFormat: 'png'
  });

  const handleFilesSelect = (selectedFiles) => {
    setFiles(selectedFiles);
    setResults([]); // Clear previous results
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSingleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    setProcessing(true);
    try {
      const file = files[0].file;
      const options = {
        embed_hash: settings.embedHash,
        add_watermark: settings.addWatermark,
        watermark_text: settings.watermarkText || file.name.split('.')[0],
        use_checksum: settings.useChecksum
      };

      console.log('Uploading with options:', options);

      const result = await uploadCertificate(file, options);
      
      console.log('Upload result:', result);

      const uploadResult = {
        filename: file.name,
        status: 'success',
        result: result,
        message: result.message || 'Certificate uploaded successfully',
        hash: result.hash,
        processed: result.processed,
        processed_filename: result.processed_filename,
        certificate_number: extractCertificateNumber(result) // Extract cert number for downloads
      };

      setResults([uploadResult]);

      toast.success('Certificate uploaded and processed successfully!');

      // Auto-download the processed certificate if it was processed
      if (result.processed && uploadResult.certificate_number) {
        try {
          await downloadProcessedCertificate(uploadResult.certificate_number, {
            includeMarkers: true,
            format: 'png'
          });
          toast.success('Processed certificate downloaded automatically!');
        } catch (downloadError) {
          console.error('Auto-download failed:', downloadError);
          toast.warning('Upload successful, but auto-download failed. Use the download button.');
        }
      }

    } catch (error) {
      console.error('Upload error:', error);
      setResults([{
        filename: files[0].file.name,
        status: 'error',
        error: error.message,
        message: 'Upload failed'
      }]);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setProcessing(true);
    const uploadResults = [];
    let successCount = 0;
    let failCount = 0;
    const downloadQueue = []; // Queue for auto-downloads

    try {
      // Process files one by one since backend doesn't have batch endpoint
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        try {
          const options = {
            embed_hash: settings.embedHash,
            add_watermark: settings.addWatermark,
            watermark_text: settings.watermarkText || fileItem.name.split('.')[0],
            use_checksum: settings.useChecksum
          };

          console.log(`Uploading file ${i + 1}/${files.length}:`, fileItem.name);

          const result = await uploadCertificate(fileItem.file, options);
          
          const uploadResult = {
            filename: fileItem.name,
            status: 'success',
            result: result,
            message: result.message || 'Uploaded successfully',
            hash: result.hash,
            processed: result.processed,
            processed_filename: result.processed_filename,
            certificate_number: extractCertificateNumber(result)
          };

          uploadResults.push(uploadResult);
          successCount++;

          // Add to download queue if processed
          if (result.processed && uploadResult.certificate_number) {
            downloadQueue.push(uploadResult.certificate_number);
          }

        } catch (error) {
          console.error(`Upload error for ${fileItem.name}:`, error);
          uploadResults.push({
            filename: fileItem.name,
            status: 'error',
            error: error.message,
            message: 'Upload failed'
          });
          failCount++;
        }
      }

      setResults(uploadResults);
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} certificate(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} certificate(s)`);
      }

      // Auto-download all processed certificates
      if (downloadQueue.length > 0) {
        toast.info(`Starting download of ${downloadQueue.length} processed certificates...`);
        
        for (const certNumber of downloadQueue) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
            await downloadProcessedCertificate(certNumber, {
              includeMarkers: true,
              format: 'png'
            });
          } catch (downloadError) {
            console.error(`Download failed for ${certNumber}:`, downloadError);
          }
        }
        
        toast.success(`Downloaded ${downloadQueue.length} processed certificates!`);
      }

    } catch (error) {
      toast.error('Batch upload failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = () => {
    if (uploadMode === 'single') {
      handleSingleUpload();
    } else {
      handleBatchUpload();
    }
  };

  // Helper function to extract certificate number from upload result
  const extractCertificateNumber = (result) => {
    // Try to extract certificate number from the result
    // This depends on your backend response format
    if (result.certificate_number) {
      return result.certificate_number;
    }
    
    // If filename contains certificate number, extract it
    if (result.filename) {
      const match = result.filename.match(/BSc-\d+|MSc-\d+|PhD-\d+|\d{8}_([^_]+)/);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    // Extract from processed filename
    if (result.processed_filename) {
      const match = result.processed_filename.match(/embedded_\d{8}_\d{6}_([^.]+)/);
      if (match) {
        return match[1];
      }
    }
    
    console.warn('Could not extract certificate number from result:', result);
    return null;
  };

  // Manual download function for individual results
  const downloadCertificate = async (result) => {
    if (!result.certificate_number) {
      toast.error('Certificate number not found - cannot download');
      return;
    }

    try {
      await downloadProcessedCertificate(result.certificate_number, {
        includeMarkers: true,
        format: 'png'
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed: ' + error.message);
    }
  };

  const viewResults = () => {
    setShowResultsModal(true);
  };

  const clearResults = () => {
    setResults([]);
    setFiles([]);
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
          Upload Certificates
        </h1>
        <p className="text-secondary-600">
          Upload individual certificates or process multiple files in batch
        </p>
      </motion.div>

      {/* Upload Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          <label className="form-label">Upload Mode:</label>
          <div className="flex bg-secondary-100 rounded-lg p-1">
            <button
              onClick={() => setUploadMode('single')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'single'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Single Upload
            </button>
            <button
              onClick={() => setUploadMode('batch')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'batch'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Batch Upload
            </button>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-secondary flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card mb-8"
      >
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          {uploadMode === 'single' ? 'Upload Single Certificate' : 'Upload Multiple Certificates'}
        </h3>
        
        <FileUpload
          onFilesSelect={handleFilesSelect}
          accept=".png,.jpg,.jpeg,.pdf"
          maxFiles={uploadMode === 'single' ? 1 : 10}
          maxSize={10 * 1024 * 1024} // 10MB
        />

        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Current Settings Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Processing Settings:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
                <div>
                  <span className="font-medium">Hash Embedding:</span> {settings.embedHash ? '✅' : '❌'}
                </div>
                <div>
                  <span className="font-medium">Watermark:</span> {settings.addWatermark ? '✅' : '❌'}
                </div>
                <div>
                  <span className="font-medium">Checksum:</span> {settings.useChecksum ? '✅' : '❌'}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {settings.outputFormat.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-center">
              <button
                onClick={handleUpload}
                disabled={processing}
                className="btn-primary flex items-center px-8 py-3"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    {uploadMode === 'single' ? 'Processing...' : `Processing ${results.length + 1}/${files.length}...`}
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    {uploadMode === 'single' ? 'Upload & Process Certificate' : `Upload & Process ${files.length} Certificates`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Results Summary */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Upload Results
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={viewResults}
                className="btn-secondary flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </button>
              <button
                onClick={clearResults}
                className="btn-secondary"
              >
                Clear Results
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </p>
                <p className="text-sm text-secondary-600">Successful</p>
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {results.filter(r => r.status === 'success' && r.processed).length}
                </p>
                <p className="text-sm text-secondary-600">Processed</p>
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </p>
                <p className="text-sm text-secondary-600">Failed</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Upload Settings"
        size="lg"
      >
        <div className="space-y-6">
          {/* Hash Embedding */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-secondary-900">
                Embed Hash
              </label>
              <p className="text-sm text-secondary-500">
                Embed cryptographic hash into the certificate (creates visual markers)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.embedHash}
                onChange={(e) => handleSettingsChange('embedHash', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Use Checksum */}
          {settings.embedHash && (
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-secondary-900">
                  Use Checksum
                </label>
                <p className="text-sm text-secondary-500">
                  Add error correction to embedded hash
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useChecksum}
                  onChange={(e) => handleSettingsChange('useChecksum', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          )}

          {/* Watermark */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-secondary-900">
                Add Watermark
              </label>
              <p className="text-sm text-secondary-500">
                Add visible watermark to certificate
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.addWatermark}
                onChange={(e) => handleSettingsChange('addWatermark', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Watermark Text */}
          {settings.addWatermark && (
            <div>
              <label className="form-label">Watermark Text</label>
              <input
                type="text"
                value={settings.watermarkText}
                onChange={(e) => handleSettingsChange('watermarkText', e.target.value)}
                placeholder="Enter watermark text (optional)"
                className="form-input"
              />
              <p className="text-sm text-secondary-500 mt-1">
                Leave empty to use the filename as watermark
              </p>
            </div>
          )}

          {/* Output Format */}
          <div>
            <label className="form-label">Output Format</label>
            <select
              value={settings.outputFormat}
              onChange={(e) => handleSettingsChange('outputFormat', e.target.value)}
              className="form-select"
            >
              <option value="png">PNG (Recommended)</option>
              <option value="jpg">JPG</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowSettings(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </Modal>

      {/* Results Details Modal */}
      <Modal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        title="Upload Results Details"
        size="xl"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{result.filename}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-sm text-secondary-600 mb-2">{result.message}</p>
              
              {result.status === 'success' && result.result && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs text-secondary-500">
                    <div>Hash Generated: {result.hash ? '✅' : '❌'}</div>
                    <div>Processed: {result.processed ? '✅' : '❌'}</div>
                    {result.processed_filename && (
                      <div className="col-span-2">
                        Processed File: {result.processed_filename}
                      </div>
                    )}
                  </div>
                  
                  {/* Download Button for Individual Results */}
                  {result.processed && result.certificate_number && (
                    <div className="pt-2">
                      <button
                        onClick={() => downloadCertificate(result)}
                        className="btn-secondary btn-sm flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Processed Certificate
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {result.status === 'error' && (
                <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AdminUpload;