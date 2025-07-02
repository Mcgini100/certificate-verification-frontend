import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const FileUpload = ({ 
  onFilesSelect, 
  acceptedTypes = ['image/*', '.pdf'], 
  maxFiles = 1, 
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
  multiple = false,
  placeholder = null
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    console.log('📁 Files dropped:', { acceptedFiles, rejectedFiles });

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        console.error(`❌ File ${file.name} rejected:`, errors);
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`File ${file.name} is too large (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File ${file.name} has invalid type`);
          } else if (error.code === 'too-many-files') {
            toast.error(`Too many files (max ${maxFiles})`);
          } else {
            toast.error(`File ${file.name}: ${error.message}`);
          }
        });
      });
    }

    // Process accepted files
    if (acceptedFiles.length > 0) {
      // ✅ FIX: Handle both single and multiple file modes
      let filesToAdd;
      
      if (multiple) {
        // For batch mode: add to existing selection (up to maxFiles)
        const combinedFiles = [...selectedFiles, ...acceptedFiles];
        filesToAdd = combinedFiles.slice(0, maxFiles);
        
        if (combinedFiles.length > maxFiles) {
          toast.warning(`Only first ${maxFiles} files will be processed`);
        }
      } else {
        // For single mode: replace existing selection
        filesToAdd = acceptedFiles.slice(0, 1);
      }

      // ✅ FIX: Create consistent file objects
      const fileObjects = filesToAdd.map((file, index) => ({
        id: `${Date.now()}_${index}`,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));

      console.log('✅ File objects created:', fileObjects.map(f => ({ name: f.name, size: f.size })));

      setSelectedFiles(fileObjects);
      onFilesSelect(fileObjects);
    }
  }, [selectedFiles, maxFiles, maxSize, multiple, onFilesSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      if (type.startsWith('.')) {
        // File extension
        acc[`application/${type.slice(1)}`] = [type];
      } else {
        // MIME type
        acc[type] = [];
      }
      return acc;
    }, {}),
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple
  });

  const removeFile = (fileId) => {
    const updatedFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(updatedFiles);
    onFilesSelect(updatedFiles);
  };

  const clearAllFiles = () => {
    // Clean up object URLs to prevent memory leaks
    selectedFiles.forEach(fileObj => {
      if (fileObj.preview) {
        URL.revokeObjectURL(fileObj.preview);
      }
    });
    setSelectedFiles([]);
    onFilesSelect([]);
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <Upload className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-secondary-700 font-medium mb-2">
              {placeholder || (multiple 
                ? `Drag & drop files here, or click to select (max ${maxFiles})`
                : 'Drag & drop a file here, or click to select'
              )}
            </p>
            <p className="text-sm text-secondary-500">
              Supported: {acceptedTypes.join(', ')} • Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
            </p>
            {multiple && (
              <p className="text-xs text-secondary-400 mt-1">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple files
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-secondary-900">
              Selected Files ({selectedFiles.length}{multiple ? `/${maxFiles}` : ''})
            </h4>
            {multiple && selectedFiles.length > 1 && (
              <button
                onClick={clearAllFiles}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((fileObj) => (
              <div
                key={fileObj.id}
                className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {fileObj.preview ? (
                    <img
                      src={fileObj.preview}
                      alt={fileObj.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <File className="h-10 w-10 text-secondary-400" />
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {fileObj.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {(fileObj.size / 1024 / 1024).toFixed(2)} MB • {fileObj.type || 'Unknown type'}
                  </p>
                </div>
                
                {/* Status */}
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="flex-shrink-0 p-1 text-secondary-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;