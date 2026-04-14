import axios from 'axios';

// ENSURE THIS IS YOUR LIVE RENDER URL
const API_URL = 'https://br-fresh-extracts-api.onrender.com/api/';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const rs = await axios.post(API_URL + 'auth/token/refresh/', {
            refresh: refreshToken,
          });
          const { access } = rs.data;
          localStorage.setItem('accessToken', access);
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          return api(originalRequest);
        } catch (_error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(_error);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;