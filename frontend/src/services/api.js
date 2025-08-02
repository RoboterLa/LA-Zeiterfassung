import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request Interceptor - JWT Token hinzufügen
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - 401 Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  me: () => api.get('/api/auth/me'),
  register: (userData) => api.post('/api/auth/register', userData),
  getUsers: () => api.get('/api/auth/users'),
  updateUser: (userId, userData) => api.put(`/api/auth/users/${userId}`, userData),
  changePassword: (passwordData) => api.post('/api/auth/change-password', passwordData),
};

// TimeClock API
export const timeclockAPI = {
  clockIn: () => api.post('/api/timeclock/clock-in'),
  clockOut: () => api.post('/api/timeclock/clock-out'),
  getStatus: () => api.get('/api/timeclock/status'),
  getTodayRecords: () => api.get('/api/timeclock/today'),
  startBreak: () => api.post('/api/timeclock/break'),
  endBreak: () => api.put('/api/timeclock/break'),
};

// Work Reports API
export const reportsAPI = {
  create: (reportData) => api.post('/api/reports', reportData),
  submit: (reportId) => api.post(`/api/reports/${reportId}/submit`),
  approve: (reportId) => api.post(`/api/reports/${reportId}/approve`),
  reject: (reportId, reason) => api.post(`/api/reports/${reportId}/reject`, { reason }),
  getAll: (filters) => api.get('/api/reports', { params: filters }),
  getById: (reportId) => api.get(`/api/reports/${reportId}`),
};

// Job Sites API
export const sitesAPI = {
  getAll: () => api.get('/api/sites'),
  getById: (siteId) => api.get(`/api/sites/${siteId}`),
  create: (siteData) => api.post('/api/sites', siteData),
  update: (siteId, siteData) => api.put(`/api/sites/${siteId}`, siteData),
  delete: (siteId) => api.delete(`/api/sites/${siteId}`),
};

// Absences API
export const absencesAPI = {
  create: (absenceData) => api.post('/api/absences', absenceData),
  getAll: (filters) => api.get('/api/absences', { params: filters }),
  getById: (absenceId) => api.get(`/api/absences/${absenceId}`),
  approve: (absenceId) => api.post(`/api/absences/${absenceId}/approve`),
  reject: (absenceId, reason) => api.post(`/api/absences/${absenceId}/reject`, { reason }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/api/notifications'),
  markAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  delete: (notificationId) => api.delete(`/api/notifications/${notificationId}`),
};

// Export API
export const exportAPI = {
  exportTimeRecords: (filters) => api.get('/api/export/time-records', { 
    params: filters,
    responseType: 'blob'
  }),
  exportWorkReports: (filters) => api.get('/api/export/work-reports', { 
    params: filters,
    responseType: 'blob'
  }),
  exportAbsences: (filters) => api.get('/api/export/absences', { 
    params: filters,
    responseType: 'blob'
  }),
  exportPayroll: (month, year) => api.get('/api/export/payroll', { 
    params: { month, year },
    responseType: 'blob'
  }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getPendingApprovals: () => api.get('/api/dashboard/pending-approvals'),
  getTeamStatus: () => api.get('/api/dashboard/team-status'),
  getAbsenceCalendar: (month, year) => api.get('/api/dashboard/absence-calendar', {
    params: { month, year }
  }),
};

// Health API
export const healthAPI = {
  check: () => api.get('/health'),
  apiStatus: () => api.get('/api/status'),
};

export default api; 