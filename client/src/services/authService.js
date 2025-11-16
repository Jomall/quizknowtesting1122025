import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const authService = {
  // Login endpoint
  login: (email, password) => {
    return axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  },

  // Register endpoint
  register: (userData) => {
    return axios.post(`${API_BASE_URL}/auth/register`, userData);
  },

  // Logout endpoint
  logout: () => {
    return axios.post(`${API_BASE_URL}/auth/logout`);
  },

  // Fetch current user endpoint
  fetchUser: () => {
    return axios.get(`${API_BASE_URL}/auth/me`);
  },
};

export default authService;
