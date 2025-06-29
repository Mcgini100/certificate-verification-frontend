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
    const params = new URLSearchParams({
      include_markers: options.includeMarkers !== false ? 'true' : 'false',
      format: options.format || 'png'
    });

    const response = await api.get(`/certificates/${certificateNumber}/download/processed?${params}`, {
      responseType: 'blob'
    });

    // Create download link
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificateNumber}_processed.${options.format || 'png'}`;
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

    // Create download link
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificateNumber}_original.${options.format || 'png'}`;
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
      format = 'png',
      includeMarkers = true,
      addWatermark = false,
      watermarkText = '',
      watermarkOpacity = 40
    } = downloadOptions;

    let params = new URLSearchParams({
      format: format
    });

    if (type === 'processed') {
      params.append('include_markers', includeMarkers ? 'true' : 'false');
    }

    if (addWatermark) {
      params.append('add_watermark', 'true');
      params.append('watermark_text', watermarkText || certificateNumber);
      params.append('watermark_opacity', watermarkOpacity.toString());
    }

    const endpoint = type === 'processed' 
      ? `/certificates/${certificateNumber}/download/processed`
      : `/certificates/${certificateNumber}/download/original`;

    const response = await api.get(`${endpoint}?${params}`, {
      responseType: 'blob'
    });

    // Create download link
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificateNumber}_${type}.${format}`;
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

// Batch download function
export const downloadAllProcessedCertificates = async (certificateNumbers, options = {}) => {
  try {
    const format = options.format || 'png';
    const includeMarkers = options.includeMarkers !== false;
    
    const downloadPromises = certificateNumbers.map(async (certNumber, index) => {
      try {
        // Add delay between downloads to avoid overwhelming the server
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await downloadProcessedCertificate(certNumber, { format, includeMarkers });
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

export const batchVerify = async (files, options = {}) => {
  try {
    const formData = new FormData();
    
    // Add all files
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add options
    Object.keys(options).forEach(key => {
      formData.append(key, JSON.stringify(options[key]));
    });

    const response = await api.post('/verify/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
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

// Statistics
export const getStatistics = async () => {
  try {
    const response = await api.get('/certificates/stats/summary');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    throw error;
  }
};

export const getDetailedStatistics = async () => {
  try {
    const response = await api.get('/certificates/stats/detailed');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch detailed statistics:', error);
    throw error;
  }
};

// System Management
export const getSystemStatus = async () => {
  try {
    const response = await api.get('/system/status');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system status:', error);
    throw error;
  }
};

export const getSystemLogs = async (params = {}) => {
  try {
    const response = await api.get('/system/logs', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system logs:', error);
    throw error;
  }
};

// User Management
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    toast.error(error.response?.data?.detail || 'Registration failed');
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    toast.error(error.response?.data?.detail || 'Login failed');
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    toast.error(error.response?.data?.detail || 'Profile update failed');
    throw error;
  }
};

export const getUserVerifications = async (params = {}) => {
  try {
    const response = await api.get('/auth/verifications', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user verifications:', error);
    throw error;
  }
};

export const validateToken = async () => {
  try {
    const response = await api.get('/auth/validate');
    return response.data;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw error;
  }
};

// Utility Functions
export const checkApiConnection = async () => {
  try {
    await healthCheck();
    return true;
  } catch (error) {
    return false;
  }
};

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