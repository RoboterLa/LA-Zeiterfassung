import axios from 'axios';

// Axios-Instanz mit Standard-Konfiguration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor für Auth-Token
api.interceptors.request.use(
  (config) => {
    // Hier könnte später ein Auth-Token hinzugefügt werden
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor für Error-Handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login bei 401
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/login', credentials),
  logout: () => api.post('/api/logout'),
  me: () => api.get('/api/me'),
};

// Aufträge API
export const auftraegeAPI = {
  getAll: (filters = {}) => api.get('/api/auftraege', { params: filters }),
  create: (data) => api.post('/api/auftraege', data),
  update: (id, data) => api.put(`/api/auftraege/${id}`, data),
  delete: (id) => api.delete(`/api/auftraege/${id}`),
};

// Zeiterfassung API
export const zeiterfassungAPI = {
  getAll: (filters = {}) => api.get('/api/zeiterfassung', { params: filters }),
  create: (data) => api.post('/api/zeiterfassung', data),
  update: (id, data) => api.put(`/api/zeiterfassung/${id}`, data),
  delete: (id) => api.delete(`/api/zeiterfassung/${id}`),
};

// Arbeitszeit API
export const arbeitszeitAPI = {
  getAll: () => api.get('/api/arbeitszeit'),
  create: (data) => api.post('/api/arbeitszeit', data),
  update: (id, data) => api.put(`/api/arbeitszeit/${id}`, data),
  delete: (id) => api.delete(`/api/arbeitszeit/${id}`),
};

// Urlaub API
export const urlaubAPI = {
  getAll: () => api.get('/api/urlaub'),
  create: (data) => api.post('/api/urlaub', data),
  update: (id, data) => api.put(`/api/urlaub/${id}`, data),
  delete: (id) => api.delete(`/api/urlaub/${id}`),
};

// Status API
export const statusAPI = {
  getStatus: () => api.get('/api/status'),
  getHealth: () => api.get('/health'),
};

export default api; 