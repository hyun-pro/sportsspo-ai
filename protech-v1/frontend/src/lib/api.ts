import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  signup: (data: { email: string; password: string; name: string }) => api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

// Analysis API
export const analysisAPI = {
  list: (page = 1) => api.get(`/analysis?page=${page}`),
  get: (id: string) => api.get(`/analysis/${id}`),
  create: (data: { address: string; lat: number; lng: number; title?: string }) =>
    api.post('/analysis', data),
  delete: (id: string) => api.delete(`/analysis/${id}`),
};

// Report API
export const reportAPI = {
  list: () => api.get('/reports'),
  create: (analysisId: string, title?: string) => api.post('/reports', { analysisId, title }),
  delete: (id: string) => api.delete(`/reports/${id}`),
};

// Subscription API
export const subscriptionAPI = {
  get: () => api.get('/subscriptions'),
  upgrade: (plan: string) => api.post('/subscriptions/upgrade', { plan }),
  getPlans: () => api.get('/subscriptions/plans'),
};

// User API
export const userAPI = {
  updateProfile: (data: { name: string; phone?: string }) => api.put('/users/profile', data),
  getFavorites: () => api.get('/users/favorites'),
  addFavorite: (data: { address: string; name: string; lat: number; lng: number }) =>
    api.post('/users/favorites', data),
  removeFavorite: (id: string) => api.delete(`/users/favorites/${id}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (page = 1) => api.get(`/admin/users?page=${page}`),
  updateUserRole: (userId: string, role: string) => api.patch(`/admin/users/${userId}/role`, { role }),
};
