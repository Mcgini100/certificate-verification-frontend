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
    if (user.token && !user.token.startsWith('mock-')) {
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

// Authentication endpoints
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
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

export const validateToken = async () => {
  try {
    const response = await api.get('/auth/validate');
    return response.data;
  } catch (error) {
    console.error('Token validation failed:', error);
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
      if (options[key] !== undefined) {
        formData.append(key, options[key]);
      }
    });

    const response = await api.post('/certificates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error.response?.data?.detail || 'Upload failed';
    toast.error(errorMessage);
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
      if (options[key] !== undefined) {
        formData.append(key, options[key]);
      }
    });

    const response = await api.post('/certificates/batch-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Batch upload failed:', error);
    const errorMessage = error.response?.data?.detail || 'Batch upload failed';
    toast.error(errorMessage);
    throw error;
  }
};

export const getCertificates = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add all parameters to query string
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/certificates?${queryString}` : '/certificates';
    
    const response = await api.get(url);
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
    const errorMessage = error.response?.data?.detail || 'Delete failed';
    toast.error(errorMessage);
    throw error;
  }
};

export const getCertificateHistory = async (certificateNumber) => {
  try {
    const response = await api.get(`/certificates/${certificateNumber}/history`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch certificate history:', error);
    // Return empty array if endpoint doesn't exist
    if (error.response?.status === 404) {
      return [];
    }
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
      if (options[key] !== undefined) {
        formData.append(key, options[key]);
      }
    });

    const response = await api.post('/verify/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error);
    const errorMessage = error.response?.data?.detail || 'Verification failed';
    toast.error(errorMessage);
    throw error;
  }
};

export const batchVerify = async (files, options = {}) => {
  try {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    // Add optional parameters
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined) {
        formData.append(key, options[key]);
      }
    });

    const response = await api.post('/verify/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Batch verification failed:', error);
    const errorMessage = error.response?.data?.detail || 'Batch verification failed';
    toast.error(errorMessage);
    throw error;
  }
};

export const extractHash = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

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

export const getDetailedStatistics = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/certificates/stats/detailed?${queryString}` : '/certificates/stats/detailed';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch detailed statistics:', error);
    throw error;
  }
};

// User-specific endpoints
export const getUserVerifications = async (userId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/users/${userId}/verifications?${queryString}` : `/users/${userId}/verifications`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user verifications:', error);
    // If endpoint doesn't exist, return empty array
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Failed to update user profile:', error);
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

// Download functions - NEW ADDITIONS
export const downloadProcessedCertificate = async (certificateNumber, options = {}) => {
  try {
    const response = await api.get(`/certificates/${certificateNumber}/download/processed`, {
      params: {
        include_markers: options.includeMarkers !== false, // Default to true
        format: options.format || 'png'
      },
      responseType: 'blob'
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use processed filename
    const filename = `${certificateNumber}_with_markers.${options.format || 'png'}`;
    link.download = filename;
    
    // Trigger download
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Processed certificate downloaded with visual markers!');
    return response.data;
  } catch (error) {
    console.error('Download processed certificate failed:', error);
    toast.error('Failed to download processed certificate');
    throw error;
  }
};

export const downloadOriginalCertificate = async (certificateNumber, options = {}) => {
  try {
    const response = await api.get(`/certificates/${certificateNumber}/download/original`, {
      params: {
        format: options.format || 'png'
      },
      responseType: 'blob'
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certificateNumber}_original.${options.format || 'png'}`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Original certificate downloaded!');
    return response.data;
  } catch (error) {
    console.error('Download original certificate failed:', error);
    toast.error('Failed to download original certificate');
    throw error;
  }
};

export const downloadCertificateWithOptions = async (certificateNumber, downloadType = 'processed', options = {}) => {
  try {
    const endpoint = downloadType === 'processed' 
      ? `/certificates/${certificateNumber}/download/processed`
      : `/certificates/${certificateNumber}/download/original`;
    
    const params = {
      format: options.format || 'png'
    };
    
    if (downloadType === 'processed') {
      params.include_markers = options.includeMarkers !== false;
      params.include_hash_boxes = options.includeHashBoxes !== false;
      params.include_watermark = options.includeWatermark || false;
    }
    
    const response = await api.get(endpoint, {
      params,
      responseType: 'blob'
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const suffix = downloadType === 'processed' ? '_with_markers' : '_original';
    link.download = `${certificateNumber}${suffix}.${options.format || 'png'}`;
    
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`${downloadType === 'processed' ? 'Processed' : 'Original'} certificate downloaded!`);
    return response.data;
  } catch (error) {
    console.error(`Download ${downloadType} certificate failed:`, error);
    toast.error(`Failed to download ${downloadType} certificate`);
    throw error;
  }
};

// Legacy download function (updated to use new endpoints)
export const downloadCertificate = async (certificateNumber, format = 'png') => {
  try {
    // Default to downloading processed version with markers
    return await downloadProcessedCertificate(certificateNumber, { format });
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Download failed');
    throw error;
  }
};

// Export/Download functions
export const exportCertificates = async (format = 'csv', filters = {}) => {
  try {
    const response = await api.get('/certificates/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificates_export.${format}`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Export failed');
    throw error;
  }
};

// System monitoring
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
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/system/logs?${queryString}` : '/system/logs';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system logs:', error);
    throw error;
  }
};

// Utility function to check API connectivity
export const checkApiConnection = async () => {
  try {
    await healthCheck();
    return true;
  } catch (error) {
    return false;
  }
};

export default api;