/**
 * src/services/api.js
 * Camada centralizada de comunicação com a API ECO+.
 * Usa axios com Basic Auth + x-api-key header.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  auth: {
    username: process.env.REACT_APP_API_USER,
    password: process.env.REACT_APP_API_PASS,
  },
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.REACT_APP_API_KEY
      ? { 'x-api-key': process.env.REACT_APP_API_KEY }
      : {}),
  },
  timeout: 15000,
});

/* ── Interceptor: loga erros em desenvolvimento ─────────────────── */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', err?.response?.status, err?.config?.url, err?.message);
    }
    return Promise.reject(err);
  }
);

/**
 * Busca todas as máquinas monitoradas.
 * @returns {Promise<Array>} Lista de máquinas com campo `dados[]`
 */
export async function fetchMachines() {
  const response = await api.get('/maquinas');
  return response.data;
}

/**
 * Atualiza metadados de uma máquina.
 * @param {number|string} id - ID da máquina
 * @param {{ nome?: string, descricao?: string, local?: string }} payload
 * @returns {Promise<Object>} Máquina atualizada ou mensagem de sucesso
 */
export async function updateMachine(id, payload) {
  const response = await api.post(`/maquinas/${id}`, payload);
  return response.data;
}

export default api;
