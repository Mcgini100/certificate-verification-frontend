import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Settings, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { uploadCertificate, uploadBatchCertificates, downloadProcessedCertificate, downloadAllProcessedCertificates } from '../../services/api';

const AdminUpload = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'batch'
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    embedHash: true,
    addWatermark: false,
    watermarkText: '',
    useChecksum: true,
    outputFormat: 'png'
  });

  // Clear files when switching upload mode to prevent confusion
  useEffect(() => {
    setFiles([]);
    setResults([]);
  }, [uploadMode]);

  const handleFilesSelect = (selectedFiles) => {
    console.log('Files selected:', selectedFiles); // Debug log
    setFiles(selectedFiles);
    setResults([]); // Clear previous results
  };

  const handleUploadModeChange = (mode) => {
    setUploadMode(mode);
    setFiles([]); // Clear files when switching modes
    setResults([]);
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

      const result = await uploadCertificate(file, options);
      
      setResults([{
        filename: file.name,
        status: 'success',
        result: result,
        message: 'Certificate uploaded successfully'
      }]);

      toast.success('Certificate uploaded successfully!');
    } catch (error) {
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

    if (files.length === 1) {
      toast.warning('Only one file selected. Consider using single upload mode for individual files.');
    }

    setProcessing(true);
    const uploadResults = [];

    try {
      console.log(`Starting batch upload of ${files.length} files`); // Debug log
      
      // Process files one by one for better error handling
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        console.log(`Processing file ${i + 1}/${files.length}: ${fileItem.name}`); // Debug log
        
        try {
          const options = {
            embed_hash: settings.embedHash,
            add_watermark: settings.addWatermark,
            watermark_text: settings.watermarkText || fileItem.name.split('.')[0],
            use_checksum: settings.useChecksum
          };

          const result = await uploadCertificate(fileItem.file, options);
          
          uploadResults.push({
            filename: fileItem.name,
            status: 'success',
            result: result,
            message: 'Uploaded successfully'
          });
        } catch (error) {
          uploadResults.push({
            filename: fileItem.name,
            status: 'error',
            error: error.message,
            message: 'Upload failed'
          });
        }
      }

      setResults(uploadResults);
      
      const successCount = uploadResults.filter(r => r.status === 'success').length;
      const failCount = uploadResults.filter(r => r.status === 'error').length;
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} certificate(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} certificate(s)`);
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

  const downloadProcessedFile = async (result) => {
    try {
      if (!result.result?.certificate_number) {
        toast.error('Certificate number not found');
        return;
      }
      
      await downloadProcessedCertificate(result.result.certificate_number, {
        format: settings.outputFormat,
        includeMarkers: true
      });
    } catch (error) {
      toast.error('Download failed: ' + error.message);
    }
  };

  const downloadAllProcessed = async () => {
    const successfulUploads = results.filter(r => r.status === 'success' && r.result?.certificate_number);
    
    if (successfulUploads.length === 0) {
      toast.error('No processed certificates available for download');
      return;
    }

    try {
      const certificateNumbers = successfulUploads.map(r => r.result.certificate_number);
      await downloadAllProcessedCertificates(certificateNumbers, {
        format: settings.outputFormat,
        includeMarkers: true
      });
    } catch (error) {
      toast.error('Batch download failed: ' + error.message);
    }
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
              onClick={() => handleUploadModeChange('single')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'single'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Single Upload
            </button>
            <button
              onClick={() => handleUploadModeChange('batch')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                uploadMode === 'batch'
                  ? 'bg-white text-secondary-900 shadow-sm'
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

        {/* Mode Description */}
        <div className="text-sm text-secondary-600">
          {uploadMode === 'single' ? (
            <p>Upload one certificate at a time with detailed processing options.</p>
          ) : (
            <p>Upload multiple certificates simultaneously. Select multiple files using Ctrl+Click or Cmd+Click.</p>
          )}
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card mb-6"
      >
        <FileUpload
          onFilesSelect={handleFilesSelect}
          multiple={uploadMode === 'batch'}
          maxFiles={uploadMode === 'single' ? 1 : undefined}
          disabled={processing}
          key={uploadMode} // Force re-render when mode changes
        />

        {files.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-secondary-600">
                {files.length} file(s) selected for {uploadMode} upload
              </p>
              {uploadMode === 'batch' && files.length === 1 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Consider using single upload mode for one file
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
                onClick={handleUpload}
                disabled={processing || files.length === 0}
                className="btn-primary flex items-center"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {uploadMode === 'batch' ? `${files.length} Files` : 'File'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Upload Results ({results.length} files)
            </h3>
            <div className="flex space-x-2">
              {results.filter(r => r.status === 'success' && r.result?.certificate_number).length > 1 && (
                <button
                  onClick={downloadAllProcessed}
                  className="btn-secondary btn-sm flex items-center"
                  title="Download all processed certificates"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </button>
              )}
              <button
                onClick={clearResults}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-medium text-secondary-900">
                        {result.filename}
                      </h4>
                      <p className={`text-sm ${
                        result.status === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                      {result.status === 'success' && result.result && (
                        <div className="mt-2 text-xs text-secondary-600">
                          <p>Hash: {result.result.hash?.substring(0, 16)}...</p>
                          <p>Filename: {result.result.filename}</p>
                          {result.result.certificate_number && (
                            <p>Certificate Number: {result.result.certificate_number}</p>
                          )}
                        </div>
                      )}
                      {result.status === 'error' && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {result.status === 'success' && result.result?.certificate_number && (
                      <button
                        onClick={() => downloadProcessedFile(result)}
                        className="btn-secondary btn-sm flex items-center"
                        title="Download processed certificate"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
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
                  ✅ {results.filter(r => r.status === 'success').length} successful
                </span>
                <span className="text-red-600">
                  ❌ {results.filter(r => r.status === 'error').length} failed
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Upload Settings"
      >
        <div className="space-y-6">
          {/* Embed Hash */}
          <div className="flex items-center justify-between">
            <div>
              <label className="form-label">
                Embed Hash
              </label>
              <p className="text-sm text-secondary-500">
                Embed cryptographic hash into the certificate
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
          <div className="flex items-center justify-between">
            <div>
              <label className="form-label">
                Use Checksum
              </label>
              <p className="text-sm text-secondary-500">
                Generate checksum for integrity verification
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

          {/* Add Watermark */}
          <div className="flex items-center justify-between">
            <div>
              <label className="form-label">
                Add Watermark
              </label>
              <p className="text-sm text-secondary-500">
                Add visible watermark to processed certificates
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
              <label className="form-label">
                Watermark Text
              </label>
              <input
                type="text"
                value={settings.watermarkText}
                onChange={(e) => handleSettingsChange('watermarkText', e.target.value)}
                className="form-input"
                placeholder="Enter watermark text (optional)"
              />
              <p className="mt-1 text-sm text-secondary-500">
                Leave empty to use filename as watermark
              </p>
            </div>
          )}

          {/* Output Format */}
          <div>
            <label className="form-label">
              Output Format
            </label>
            <select
              value={settings.outputFormat}
              onChange={(e) => handleSettingsChange('outputFormat', e.target.value)}
              className="form-input"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPEG</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowSettings(false)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUpload;