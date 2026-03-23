/**
 * src/services/api.ts
 * Camada centralizada de comunicação com a API ECO+.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Machine, UpdateMachinePayload } from '../types';

const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  auth: {
    username: process.env.REACT_APP_API_USER ?? '',
    password: process.env.REACT_APP_API_PASS ?? '',
  },
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.REACT_APP_API_KEY
      ? { 'x-api-key': process.env.REACT_APP_API_KEY }
      : {}),
  },
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', err?.response?.status, err?.config?.url, err?.message);
    }
    return Promise.reject(err);
  }
);

export async function fetchMachines(): Promise<Machine[]> {
  const response = await api.get<Machine[]>('/maquinas');
  return response.data;
}

export async function updateMachine(
  id: number | string,
  payload: UpdateMachinePayload
): Promise<unknown> {
  const response = await api.post(`/maquinas/${id}`, payload);
  return response.data;
}

export default api;
