import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL, 
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@TKBarber:token');
  console.log("DEBUG API: Token recuperado do Storage:", token); // <-- VEJA ISSO NO ERUDA
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Adicione este interceptor de resposta para detectar o 401 e limpar token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // O token expirou ou é inválido
      localStorage.removeItem('@TKBarber:token');
      // Opcional: window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);