import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL, 
  withCredentials: true, 
  timeout: 15000,
});

console.log("API_URL =", API_URL);
console.log("BASE_URL =", api.defaults.baseURL);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@TKBarber:token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }


  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("@TKBarber:user");
      localStorage.removeItem("@TKBarber:token");

      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);
