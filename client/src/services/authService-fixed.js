import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const authService = {
  // Login endpoint
  login: (email, password) => {
    return axios.post(`${API_BASE_URL}/users/login`, { email, password });
  },

  // Register endpoint
  register: (userData) => {
    return axios.post(`${API_BASE_URL}/users/register`, userData);
  },

  // Logout endpoint
  logout: () => {
    return axios.post(`${API_BASE_URL}/users/logout`);
  },

  // Fetch current user endpoint
  fetchUser: () => {
    return axios.get(`${API_BASE_URL}/users/me`);
  },

  // Change password endpoint
  changePassword: (currentPassword, newPassword) => {
    return axios.put(`${API_BASE_URL}/users/change-password`, {
      currentPassword,
      newPassword
    });
  },
};

export default authService;
