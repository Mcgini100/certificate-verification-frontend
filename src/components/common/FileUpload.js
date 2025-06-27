import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';

const FileUpload = ({ 
  onFilesSelect, 
  multiple = false, 
  accept = { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
  disabled = false 
}) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(rejection => ({
        file: rejection.file.name,
        errors: rejection.errors.map(error => error.message)
      }));
      setErrors(newErrors);
    } else {
      setErrors([]);
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));

      if (multiple) {
        setFiles(prev => [...prev, ...newFiles]);
        onFilesSelect([...files, ...newFiles]);
      } else {
        setFiles(newFiles);
        onFilesSelect(newFiles);
      }
    }
  }, [files, multiple, onFilesSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled
  });

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesSelect(updatedFiles);
    
    // Clean up preview URLs
    const removedFile = files.find(f => f.id === fileId);
    if (removedFile?.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          dropzone
          ${isDragActive ? 'active' : ''}
          ${isDragReject ? 'rejected' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-12 w-12 text-secondary-400" />
          <div className="text-center">
            <p className="text-lg font-medium text-secondary-900">
              {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
            </p>
            <p className="text-sm text-secondary-500">
              Supports PNG, JPG, JPEG, PDF (max {formatFileSize(maxSize)})
            </p>
          </div>
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h4 className="text-sm font-medium text-red-800">Upload Errors</h4>
          </div>
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-700">
              <span className="font-medium">{error.file}:</span> {error.errors.join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-secondary-900">
            Selected Files ({files.length})
          </h4>
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-center justify-between p-3 bg-secondary-50 border border-secondary-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {fileItem.preview ? (
                  <img
                    src={fileItem.preview}
                    alt={fileItem.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <File className="h-10 w-10 text-secondary-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    {fileItem.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {formatFileSize(fileItem.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(fileItem.id)}
                className="p-1 text-secondary-400 hover:text-red-600 transition-colors"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;