/**
 * Axios instance for farmaze-agent (Phase G).
 *
 * The agent service handles all AI reasoning (Procurement + Insights agents)
 * via Claude, replacing the OpenAI + MCP client architecture.
 */
import axios from 'axios';

const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8090';

console.log('Using Agent API URL:', AGENT_API_URL);

export const agentAxios = axios.create({
  baseURL: AGENT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds — agent calls can take 10-30s with multiple tool invocations
  withCredentials: false,
});

// Add auth token interceptor
agentAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('farmaze_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor with error logging
agentAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`Agent API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

export default agentAxios;
