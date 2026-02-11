import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    const { state } = JSON.parse(authData);
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  googleLogin: (idToken) => api.post('/api/auth/google', { id_token: idToken }),
  getProfile: () => api.get('/api/user/profile'),
};

// Query endpoints
export const queryAPI = {
  execute: (data) => api.post('/api/query/execute', data),
  getHistory: (limit = 50) => api.get(`/api/query/history?limit=${limit}`),
};

// Database endpoints
export const databaseAPI = {
  add: (data) => api.post('/api/database/add', data),
  list: () => api.get('/api/database/list'),
  getSchema: (databaseId) => api.get(`/api/database/${databaseId}/schema`),
};

export default api;
