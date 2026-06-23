import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api", // URL do seu back-end Express
  withCredentials: true, // 🚨 CRÍTICO: Permite o envio e recebimento de cookies/tokens entre front e back
});