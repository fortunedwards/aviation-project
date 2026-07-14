import axios from 'axios';

const trimTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_URL) || 'http://localhost:5000';
export const SOCKET_URL = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) || API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
