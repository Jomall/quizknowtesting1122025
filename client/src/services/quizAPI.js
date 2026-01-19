import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Add interceptor to include JWT token in requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const quizAPI = {
  // Quiz endpoints
  getAllQuizzes: () => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_BASE_URL}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getQuizById: (id) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_BASE_URL}/quizzes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createQuiz: (quizData) => axios.post(`${API_BASE_URL}/quizzes`, quizData),
  updateQuiz: (id, quizData) => axios.put(`${API_BASE_URL}/quizzes/${id}`, quizData),
  deleteQuiz: (id) => axios.delete(`${API_BASE_URL}/quizzes/${id}`),
  publishQuiz: (id, studentIds) => axios.post(`${API_BASE_URL}/quizzes/${id}/publish`, { studentIds }),

  // Quiz session endpoints
  startQuizSession: (quizId) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_BASE_URL}/quiz/${quizId}/start`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  submitQuiz: (quizId, answers) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_BASE_URL}/submissions`, { quizId, answers }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getSessionDetails: (quizId, sessionId) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_BASE_URL}/quiz/${quizId}/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateAnswer: (quizId, sessionId, questionId, answer) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API_BASE_URL}/quiz/${quizId}/session/${sessionId}/answer`, { questionId, answer }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getProgress: (quizId, sessionId) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_BASE_URL}/quiz/${quizId}/session/${sessionId}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getQuizSubmissions: (quizId) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_BASE_URL}/submissions/quiz/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  markSubmissionReviewed: (submissionId) => {
    const token = localStorage.getItem('token');
    console.log('API call - markSubmissionReviewed:', { submissionId, token: token ? 'present' : 'missing' });
    return axios.put(`${API_BASE_URL}/submissions/${submissionId}/review`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getSubmittedQuizzes: () => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_BASE_URL}/submissions/my-submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteSubmission: (submissionId) => {
    const token = localStorage.getItem('token');
    return axios.delete(`${API_BASE_URL}/submissions/${submissionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteSubmissionsBatch: (submissionIds) => {
    const token = localStorage.getItem('token');
    return axios.delete(`${API_BASE_URL}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { submissionIds }
    });
  },

  // Global stats (public)
  getGlobalStats: () => axios.get(`${API_BASE_URL}/users/global-stats`, { timeout: 10000 }),
};

export default quizAPI;
