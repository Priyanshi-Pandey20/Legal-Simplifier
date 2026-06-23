import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
   
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/api/auth/register', data);
export const loginUser    = (data) => API.post('/api/auth/login', data);
export const analyzeDoc   = (data) => API.post('/api/document/analyze', data);
export const getHistory   = ()     => API.get('/api/history');
export const changePassword = (data) => API.post('/api/auth/change-password', data);
export const deleteHistory = (id) => API.delete(`/api/document/${id}`)
export const uploadFile = (formData) => API.post('/api/document/upload-file',formData);
export const getDocumentFile = (filename) => `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/file/${filename}`;

export default API;