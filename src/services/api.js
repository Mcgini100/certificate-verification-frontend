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

export const verifyBatchCertificates = async (files, options = {}) => {
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