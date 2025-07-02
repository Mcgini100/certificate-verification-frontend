import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// ✅ Added system health function (alias for healthCheck for AdminDashboard compatibility)
export const getSystemHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('System health check failed:', error);
    throw error;
  }
};

// Certificate Management
export const uploadCertificate = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add optional parameters
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const response = await api.post('/certificates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error(error.response?.data?.detail || 'Upload failed');
    throw error;
  }
};

export const uploadBatchCertificates = async (files, options = {}) => {
  try {
    const formData = new FormData();
    
    // Add all files
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add options
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const response = await api.post('/certificates/batch-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Batch upload failed:', error);
    toast.error(error.response?.data?.detail || 'Batch upload failed');
    throw error;
  }
};

export const getCertificates = async (params = {}) => {
  try {
    const response = await api.get('/certificates/', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
    throw error;
  }
};

export const getCertificate = async (certificateNumber) => {
  try {
    const response = await api.get(`/certificates/${certificateNumber}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch certificate:', error);
    throw error;
  }
};

export const deleteCertificate = async (certificateNumber) => {
  try {
    const response = await api.delete(`/certificates/${certificateNumber}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete certificate:', error);
    toast.error(error.response?.data?.detail || 'Delete failed');
    throw error;
  }
};

export const getCertificateHistory = async (certificateNumber) => {
  try {
    const response = await api.get(`/certificates/${certificateNumber}/history`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch certificate history:', error);
    throw error;
  }
};

// Download Functions
export const downloadProcessedCertificate = async (certificateNumber, options = {}) => {
  try {
    // ✅ Fixed: Always request PNG since processed files are always PNG
    const params = new URLSearchParams({
      include_markers: options.includeMarkers !== false ? 'true' : 'false',
      format: 'png'  // ✅ Fixed: Always PNG
    });

    const response = await api.get(`/certificates/${certificateNumber}/download/processed?${params}`, {
      responseType: 'blob'
    });

    // ✅ Fixed: Always create blob as PNG and use .png extension
    const blob = new Blob([response.data], { type: 'image/png' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificateNumber}_processed.png`;  // ✅ Fixed: Always .png
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Certificate downloaded successfully!');
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    toast.error(error.response?.data?.detail || 'Download failed');
    throw error;
  }
};

export const downloadOriginalCertificate = async (certificateNumber, options = {}) => {
  try {
    const params = new URLSearchParams({
      format: options.format || 'png'
    });

    const response = await api.get(`/certificates/${certificateNumber}/download/original?${params}`, {
      responseType: 'blob'
    });

    // ✅ Fixed: Use the content-type from response headers
    const contentType = response.headers['content-type'] || 'image/png';
    const extension = contentType.includes('jpeg') ? 'jpg' : 
                     contentType.includes('pdf') ? 'pdf' : 'png';

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificateNumber}_original.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Certificate downloaded successfully!');
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    toast.error(error.response?.data?.detail || 'Download failed');
    throw error;
  }
};

export const downloadCertificate = async (certificateNumber, options = {}) => {
  try {
    // Default to processed if available, otherwise original
    return await downloadProcessedCertificate(certificateNumber, options);
  } catch (error) {
    console.log('Processed version not available, trying original...');
    return await downloadOriginalCertificate(certificateNumber, options);
  }
};

export const downloadCertificateWithOptions = async (certificateNumber, downloadOptions = {}) => {
  try {
    const {
      type = 'processed', // 'processed' or 'original'
      includeMarkers = true,
      addWatermark = false,
      watermarkText = '',
      watermarkOpacity = 40
    } = downloadOptions;

    if (type === 'processed') {
      // ✅ Processed files are always PNG
      return await downloadProcessedCertificate(certificateNumber, { 
        includeMarkers,
        format: 'png'  // Always PNG for processed
      });
    } else {
      // Original files can be different formats
      return await downloadOriginalCertificate(certificateNumber, { 
        format: downloadOptions.format || 'png'
      });
    }

  } catch (error) {
    console.error('Download with options failed:', error);
    toast.error(error.response?.data?.detail || 'Download failed');
    throw error;
  }
};

// Batch download function
export const downloadAllProcessedCertificates = async (certificateNumbers, options = {}) => {
  try {
    const includeMarkers = options.includeMarkers !== false;
    
    const downloadPromises = certificateNumbers.map(async (certNumber, index) => {
      try {
        // Add delay between downloads to avoid overwhelming the server
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // ✅ Always download as PNG for processed certificates
        await downloadProcessedCertificate(certNumber, { 
          includeMarkers,
          format: 'png'  // Always PNG
        });
        return { success: true, certificateNumber: certNumber };
      } catch (error) {
        console.error(`Failed to download ${certNumber}:`, error);
        return { success: false, certificateNumber: certNumber, error: error.message };
      }
    });

    const results = await Promise.all(downloadPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (successful > 0) {
      toast.success(`Successfully downloaded ${successful} certificate(s)`);
    }
    if (failed > 0) {
      toast.warning(`Failed to download ${failed} certificate(s)`);
    }

    return results;
  } catch (error) {
    console.error('Batch download failed:', error);
    toast.error('Batch download failed');
    throw error;
  }
};

// Verification
export const verifyCertificate = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add optional parameters
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const response = await api.post('/verify/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error);
    toast.error(error.response?.data?.detail || 'Verification failed');
    throw error;
  }
};

// ✅ Fixed batch verification function
export const batchVerify = async (files, options = {}) => {
  try {
    console.log(`Starting batch verification of ${files.length} files`);
    
    const formData = new FormData();
    
    // ✅ FIX: Add files with correct parameter name
    files.forEach((file, index) => {
      console.log(`Adding file ${index + 1}: ${file.name} (${file.size} bytes)`);
      formData.append('files', file);  // FastAPI expects 'files' parameter
    });
    
    // ✅ FIX: Add options as form fields (not JSON)
    formData.append('use_enhanced_extraction', options.use_enhanced_extraction !== false ? 'true' : 'false');
    formData.append('check_database', options.check_database !== false ? 'true' : 'false');
    formData.append('continue_on_error', options.continue_on_error !== false ? 'true' : 'false');

    console.log('FormData prepared, sending request...');

    const response = await api.post('/verify/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for batch operations
    });
    
    console.log('Batch verification completed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Batch verification failed:', error);
    
    // Provide more specific error information
    if (error.response) {
      const errorMsg = error.response.data?.detail || 'Batch verification failed';
      toast.error(`Batch verification failed: ${errorMsg}`);
      throw new Error(errorMsg);
    } else if (error.request) {
      toast.error('Network error: Could not reach verification service');
      throw new Error('Network error');
    } else {
      toast.error('Unexpected error during batch verification');
      throw error;
    }
  }
};

// ✅ Enhanced: Individual verification fallback function
export const batchVerifyFallback = async (files, options = {}) => {
  try {
    console.log(`Starting individual verification fallback for ${files.length} files`);
    
    const results = [];
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        const result = await verifyCertificate(file, {
          use_enhanced_extraction: options.use_enhanced_extraction !== false,
          check_database: options.check_database !== false
        });
        
        results.push({
          filename: file.name,
          ...result
        });
        
        if (result.verification_status === 'VERIFIED' || 
            result.verification_status === 'VERIFIED_BY_DATA' ||
            result.certificate_exists_in_ledger) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to verify ${file.name}:`, error);
        failed++;
        results.push({
          filename: file.name,
          verification_status: 'ERROR',
          message: error.message || 'Verification failed',
          confidence: 0
        });
      }
    }
    
    return {
      total_processed: files.length,
      successful,
      failed,
      results,
      processing_time: 0,
      message: `Individual verification completed: ${successful}/${files.length} successful`
    };
  } catch (error) {
    console.error('Individual verification fallback failed:', error);
    throw error;
  }
};

export const extractHash = async (file, useEnhanced = true) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('use_enhanced', useEnhanced);

    const response = await api.post('/verify/extract-hash', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Hash extraction failed:', error);
    throw error;
  }
};

export const verifyByHash = async (certificateNumber, providedHash) => {
  try {
    const formData = new FormData();
    formData.append('certificate_number', certificateNumber);
    formData.append('provided_hash', providedHash);

    const response = await api.post('/verify/by-hash', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Hash verification failed:', error);
    throw error;
  }
};

// Statistics and reporting
export const getStatistics = async () => {
  try {
    const response = await api.get('/certificates/stats/summary');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    throw error;
  }
};

// ✅ Added missing ledger integrity validation function
export const validateLedgerIntegrity = async () => {
  try {
    const response = await api.get('/ledger/integrity');
    return response.data;
  } catch (error) {
    console.error('Failed to validate ledger integrity:', error);
    throw error;
  }
};

// ✅ Added ledger integrity function (alias for validateLedgerIntegrity for AdminDashboard compatibility)
export const getLedgerIntegrity = async () => {
  try {
    const response = await api.get('/ledger/integrity');
    return response.data;
  } catch (error) {
    console.error('Failed to get ledger integrity:', error);
    throw error;
  }
};

// ✅ Added ledger statistics function
export const getLedgerStats = async () => {
  try {
    const response = await api.get('/ledger/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch ledger stats:', error);
    throw error;
  }
};

// ✅ Added ledger entries function
export const getLedgerEntries = async (params = {}) => {
  try {
    const response = await api.get('/ledger/entries', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch ledger entries:', error);
    throw error;
  }
};

// ✅ Added ledger history function for specific certificates
export const getLedgerHistory = async (certificateNumber) => {
  try {
    const response = await api.get(`/ledger/history/${certificateNumber}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch ledger history:', error);
    throw error;
  }
};

export const getUserVerifications = async (userId, params = {}) => {
  try {
    // This is a mock function for user verifications
    // In a real app, you'd have a specific endpoint for this
    const response = await api.get(`/users/${userId}/verifications`, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user verifications:', error);
    // Return empty array as fallback
    return [];
  }
};

// Export and import
export const exportCertificates = async (format = 'json', filters = {}) => {
  try {
    const params = new URLSearchParams({
      format,
      ...filters
    });

    const response = await api.get(`/certificates/export?${params}`, {
      responseType: 'blob'
    });

    // Create download link
    const blob = new Blob([response.data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates_export_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Certificates exported as ${format.toUpperCase()}`);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    toast.error(error.response?.data?.detail || 'Export failed');
    throw error;
  }
};

// Watermark and Hash Embedding
export const embedHash = async (certificateNumber, options = {}) => {
  try {
    const response = await api.post(`/certificates/${certificateNumber}/embed-hash`, options);
    return response.data;
  } catch (error) {
    console.error('Hash embedding failed:', error);
    toast.error(error.response?.data?.detail || 'Hash embedding failed');
    throw error;
  }
};

export const addWatermark = async (certificateNumber, watermarkOptions) => {
  try {
    const response = await api.post(`/certificates/${certificateNumber}/watermark`, watermarkOptions);
    return response.data;
  } catch (error) {
    console.error('Watermark addition failed:', error);
    toast.error(error.response?.data?.detail || 'Watermark addition failed');
    throw error;
  }
};

export default api;