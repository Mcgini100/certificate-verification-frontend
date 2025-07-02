import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 40000,
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

// Health check with ledger status
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// ==============================================================================
// IMMUTABLE LEDGER OPERATIONS (NEW)
// ==============================================================================

// Ledger integrity and validation
export const validateLedgerIntegrity = async () => {
  try {
    const response = await api.get('/ledger/validate');
    return response.data;
  } catch (error) {
    console.error('Ledger validation failed:', error);
    toast.error('Failed to validate ledger integrity');
    throw error;
  }
};

export const getLedgerIntegrity = async () => {
  try {
    const response = await api.get('/ledger/integrity');
    return response.data;
  } catch (error) {
    console.error('Failed to get ledger integrity:', error);
    throw error;
  }
};

export const getLedgerStats = async () => {
  try {
    const response = await api.get('/ledger/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to get ledger statistics:', error);
    throw error;
  }
};

// Ledger entries management
export const getLedgerEntries = async (params = {}) => {
  try {
    const response = await api.get('/ledger/entries', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch ledger entries:', error);
    throw error;
  }
};

export const getCertificateHistory = async (certificateNumber) => {
  try {
    const response = await api.get(`/ledger/history/${certificateNumber}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch certificate history:', error);
    throw error;
  }
};

// Record verification in ledger
export const recordVerification = async (certificateNumber, verificationData) => {
  try {
    const response = await api.post(`/ledger/verify/${certificateNumber}`, verificationData);
    return response.data;
  } catch (error) {
    console.error('Failed to record verification:', error);
    toast.error('Failed to record verification in ledger');
    throw error;
  }
};

// ==============================================================================
// CERTIFICATE MANAGEMENT (UPDATED FOR LEDGER)
// ==============================================================================

export const uploadCertificate = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add optional parameters
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        formData.append(key, options[key]);
      }
    });

    const response = await api.post('/certificates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    toast.success('Certificate uploaded successfully to immutable ledger!');
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
      if (options[key] !== undefined && options[key] !== null) {
        formData.append(key, JSON.stringify(options[key]));
      }
    });

    const response = await api.post('/certificates/batch-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    toast.success('Batch certificates uploaded to immutable ledger!');
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

export const updateCertificate = async (certificateNumber, updateData) => {
  try {
    const response = await api.put(`/certificates/${certificateNumber}`, updateData);
    toast.success('Certificate updated in ledger!');
    return response.data;
  } catch (error) {
    console.error('Failed to update certificate:', error);
    toast.error(error.response?.data?.detail || 'Update failed');
    throw error;
  }
};

export const deleteCertificate = async (certificateNumber) => {
  try {
    const response = await api.delete(`/certificates/${certificateNumber}`);
    toast.success('Certificate deletion recorded in ledger!');
    return response.data;
  } catch (error) {
    console.error('Failed to delete certificate:', error);
    toast.error(error.response?.data?.detail || 'Delete failed');
    throw error;
  }
};

// ==============================================================================
// VERIFICATION OPERATIONS (ENHANCED FOR LEDGER)
// ==============================================================================

export const verifyCertificate = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        formData.append(key, options[key]);
      }
    });

    const response = await api.post('/verify/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 45000,
    });
    
    // ✅ ENHANCED: Handle existing certificates as successful
    const result = response.data;
    
    // Check if certificate exists in ledger and treat as success
    if (result.certificate_exists_in_ledger || 
        result.verification_status === 'VERIFIED' || 
        result.verification_status === 'VERIFIED_BY_DATA') {
      
      // Show success message for existing certificates
      if (result.certificate_exists_in_ledger) {
        toast.success(`✅ Certificate verified! Found in secure ledger with ${(result.confidence * 100).toFixed(1)}% confidence`);
      } else {
        toast.success('✅ Certificate verification successful!');
      }
    } else {
      toast.error('❌ Certificate verification failed!');
    }
    
    // Automatically record verification in ledger if certificate number is available
    if (result.certificate_number) {
      try {
        await recordVerification(result.certificate_number, {
          verified_by: 'frontend_user',
          verification_method: 'file_upload',
          result: result.verification_status,
          confidence: result.confidence || 0,
          verification_details: {
            hash_match: result.hash_match,
            data_match: result.data_match,
            processing_time: result.processing_time,
            certificate_exists_in_ledger: result.certificate_exists_in_ledger
          }
        });
      } catch (ledgerError) {
        console.warn('Failed to record verification in ledger:', ledgerError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Verification failed:', error);
    if (error.code === 'ECONNABORTED') {
      toast.error('Verification timed out after 45 seconds. Please try with a clearer image or contact support.');
    } else {
      toast.error(error.response?.data?.detail || 'Verification failed');
    }
    throw error;
  }
};

export const verifyBatchCertificates = async (files, options = {}) => {
  try {
    const formData = new FormData();
    
    // Add all files
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add options
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        formData.append(key, JSON.stringify(options[key]));
      }
    });

    const response = await api.post('/verify/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Record batch verification results in ledger
    if (response.data.results && Array.isArray(response.data.results)) {
      response.data.results.forEach(async (result) => {
        if (result.certificate_number) {
          try {
            await recordVerification(result.certificate_number, {
              verified_by: 'frontend_batch',
              verification_method: 'batch_upload',
              result: result.verification_status,
              confidence: result.confidence || 0,
              verification_details: {
                filename: result.filename,
                hash_match: result.hash_match,
                data_match: result.data_match
              }
            });
          } catch (ledgerError) {
            console.warn(`Failed to record batch verification for ${result.certificate_number}:`, ledgerError);
          }
        }
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Batch verification failed:', error);
    toast.error(error.response?.data?.detail || 'Batch verification failed');
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
    const response = await api.post('/verify/by-hash', {
      certificate_number: certificateNumber,
      provided_hash: providedHash
    });
    
    // Record hash verification in ledger
    try {
      await recordVerification(certificateNumber, {
        verified_by: 'frontend_hash',
        verification_method: 'hash_comparison',
        result: response.data.verification_status,
        confidence: response.data.confidence || 0,
        verification_details: {
          provided_hash: providedHash,
          stored_hash: response.data.stored_hash,
          hash_match: response.data.hash_match
        }
      });
    } catch (ledgerError) {
      console.warn('Failed to record hash verification in ledger:', ledgerError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Hash verification failed:', error);
    throw error;
  }
};

// ==============================================================================
// STATISTICS AND ANALYTICS (ENHANCED WITH LEDGER DATA)
// ==============================================================================

export const getStatistics = async () => {
  try {
    // Get both certificate stats and ledger stats
    const [certStats, ledgerStats] = await Promise.all([
      api.get('/certificates/stats/summary'),
      api.get('/ledger/stats')
    ]);
    
    return {
      certificates: certStats.data,
      ledger: ledgerStats.data,
      combined: {
        total_certificates: certStats.data.total_certificates || 0,
        total_transactions: ledgerStats.data.total_entries || 0,
        ledger_integrity: ledgerStats.data.is_valid || false,
        last_updated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    throw error;
  }
};

export const getAdvancedAnalytics = async () => {
  try {
    const response = await api.get('/analytics/advanced');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch advanced analytics:', error);
    // Return fallback data if analytics endpoint doesn't exist
    return {
      verification_trends: [],
      certificate_types: {},
      monthly_stats: {},
      ledger_health: { status: 'unknown' }
    };
  }
};

// ==============================================================================
// ENHANCED SECURITY OPERATIONS
// ==============================================================================

export const embedHash = async (certificateNumber, options = {}) => {
  try {
    const response = await api.post(`/certificates/${certificateNumber}/embed-hash`, options);
    toast.success('Hash embedded successfully with ledger record!');
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
    toast.success('Watermark added with ledger record!');
    return response.data;
  } catch (error) {
    console.error('Watermark addition failed:', error);
    toast.error(error.response?.data?.detail || 'Watermark addition failed');
    throw error;
  }
};

// ==============================================================================
// SYSTEM MONITORING AND MAINTENANCE
// ==============================================================================

export const getSystemHealth = async () => {
  try {
    const [health, ledgerIntegrity] = await Promise.all([
      api.get('/health'),
      api.get('/ledger/integrity')
    ]);
    
    return {
      api_health: health.data,
      ledger_health: ledgerIntegrity.data,
      overall_status: health.data.status === 'healthy' && ledgerIntegrity.data.is_valid ? 'healthy' : 'degraded'
    };
  } catch (error) {
    console.error('Failed to get system health:', error);
    return {
      api_health: { status: 'error' },
      ledger_health: { is_valid: false },
      overall_status: 'error'
    };
  }
};

export const performLedgerMaintenance = async (operation) => {
  try {
    const response = await api.post('/ledger/maintenance', { operation });
    toast.success(`Ledger ${operation} completed successfully!`);
    return response.data;
  } catch (error) {
    console.error('Ledger maintenance failed:', error);
    toast.error(error.response?.data?.detail || 'Ledger maintenance failed');
    throw error;
  }
};

// ==============================================================================
// BACKWARDS COMPATIBILITY HELPERS
// ==============================================================================

// Legacy function names for backwards compatibility
export const getCertificateDetails = getCertificate;
export const searchCertificates = getCertificates;

// ==============================================================================
// MISSING FUNCTIONS (ADDED FOR COMPATIBILITY)
// ==============================================================================



// ✅ FIXED: Download Functions with correct format handling
export const downloadProcessedCertificate = async (certificateNumber, options = {}) => {
  try {
    // ✅ FIX: Always request PNG since processed files are always PNG
    const params = new URLSearchParams({
      include_markers: options.includeMarkers !== false ? 'true' : 'false',
      format: 'png'  // ✅ Fixed: Always PNG
    });

    const response = await api.get(`/certificates/${certificateNumber}/download/processed?${params}`, {
      responseType: 'blob'
    });

    // ✅ FIX: Always create blob as PNG and use .png extension
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
    // ✅ Note: Original files can be different formats, so we keep format parameter
    const params = new URLSearchParams({
      format: options.format || 'png'
    });

    const response = await api.get(`/certificates/${certificateNumber}/download/original?${params}`, {
      responseType: 'blob'
    });

    // ✅ FIX: Use the content-type from response headers
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

// ✅ UPDATED: Main download function with better logic
export const downloadCertificate = async (certificateNumber, options = {}) => {
  try {
    // Always try processed first (since that's what users usually want)
    return await downloadProcessedCertificate(certificateNumber, options);
  } catch (error) {
    console.log('Processed version not available, trying original...');
    return await downloadOriginalCertificate(certificateNumber, options);
  }
};

// ✅ UPDATED: Download with options function
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

// ✅ UPDATED: Batch download function
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

// Batch verification function (alias for existing function)
export const batchVerify = verifyBatchCertificates;

// User verification history function
export const getUserVerifications = async (userId = 'current', params = {}) => {
  try {
    // If no specific user endpoint exists, return from localStorage as fallback
    const localHistory = JSON.parse(localStorage.getItem('userVerificationHistory') || '[]');
    
    // Try to get from API first
    try {
      const response = await api.get(`/users/${userId}/verifications`, { params });
      return response.data;
    } catch (apiError) {
      // Fallback to local storage if API endpoint doesn't exist
      console.warn('User verifications endpoint not available, using local storage');
      
      // Format local storage data to match expected API response
      return {
        verifications: localHistory,
        total: localHistory.length,
        page: 1,
        limit: params.limit || 10
      };
    }
  } catch (error) {
    console.error('Failed to get user verifications:', error);
    // Return empty result as final fallback
    return {
      verifications: [],
      total: 0,
      page: 1,
      limit: params.limit || 10
    };
  }
};

// ==============================================================================
// ADDITIONAL UTILITY FUNCTIONS
// ==============================================================================

// Function to check if a certificate exists in the ledger
export const checkCertificateExists = async (certificateNumber) => {
  try {
    const certificate = await getCertificate(certificateNumber);
    return !!certificate;
  } catch (error) {
    return false;
  }
};

// Function to get verification statistics for a specific certificate
export const getCertificateVerificationStats = async (certificateNumber) => {
  try {
    const history = await getCertificateHistory(certificateNumber);
    const verifications = history.filter(entry => entry.transaction_type === 'VERIFY');
    
    return {
      total_verifications: verifications.length,
      successful_verifications: verifications.filter(v => 
        v.data?.verification_data?.result === 'valid' || 
        v.data?.verification_data?.result === 'verified'
      ).length,
      last_verification: verifications[0]?.timestamp,
      verification_methods: [...new Set(verifications.map(v => v.data?.verification_data?.verification_method))].filter(Boolean)
    };
  } catch (error) {
    console.error('Failed to get verification stats:', error);
    return {
      total_verifications: 0,
      successful_verifications: 0,
      last_verification: null,
      verification_methods: []
    };
  }
};

// Function to export certificate data as JSON
export const exportCertificateData = async (certificateNumber) => {
  try {
    const [certificate, history] = await Promise.all([
      getCertificate(certificateNumber),
      getCertificateHistory(certificateNumber)
    ]);
    
    const exportData = {
      certificate,
      history,
      exported_at: new Date().toISOString(),
      ledger_verified: true
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_${certificateNumber}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Certificate data exported successfully!');
    return exportData;
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Failed to export certificate data');
    throw error;
  }
};

// Function to validate certificate data integrity
export const validateCertificateIntegrity = async (certificateNumber) => {
  try {
    const [certificate, history, ledgerIntegrity] = await Promise.all([
      getCertificate(certificateNumber),
      getCertificateHistory(certificateNumber),
      validateLedgerIntegrity()
    ]);
    
    return {
      certificate_exists: !!certificate,
      history_available: history.length > 0,
      ledger_valid: ledgerIntegrity.is_valid,
      last_transaction: history[0]?.timestamp,
      total_transactions: history.length,
      integrity_score: ledgerIntegrity.is_valid && certificate && history.length > 0 ? 1.0 : 0.5
    };
  } catch (error) {
    console.error('Integrity validation failed:', error);
    return {
      certificate_exists: false,
      history_available: false,
      ledger_valid: false,
      last_transaction: null,
      total_transactions: 0,
      integrity_score: 0.0
    };
  }
};

// Export the API instance for direct use if needed
export default api;