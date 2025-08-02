/**
 * API service for backend communication
 */
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service object
export const apiService = {
  // Appointment endpoints
  appointments: {
    getAll: (params = {}) => api.get('/api/appointments', { params }),
    getById: (id) => api.get(`/api/appointments/${id}`),
    create: (data) => api.post('/api/appointments', data),
    updateStatus: (id, status) => api.put(`/api/appointments/${id}/status`, { new_status: status }),
    cancel: (id) => api.delete(`/api/appointments/${id}`),
    getAvailability: (params) => api.get('/api/appointments/availability', { params }),
    createPayment: (id, successUrl, cancelUrl) => 
      api.post(`/api/appointments/${id}/payment`, { success_url: successUrl, cancel_url: cancelUrl })
  },

  // TTS endpoints
  tts: {
    synthesize: (text, language = 'it') => 
      api.post('/api/tts/synthesize', { text, language }, { responseType: 'blob' }),
    getStatus: () => api.get('/api/tts/status')
  },

  // Payment endpoints
  payments: {
    createIntent: (amount, currency = 'eur', appointmentId = null) =>
      api.post('/api/payments/create-intent', { amount, currency, appointment_id: appointmentId })
  },

  // Auth endpoints
  auth: {
    login: (username, password) => {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      return api.post('/api/auth/token', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  }
};

export default api;