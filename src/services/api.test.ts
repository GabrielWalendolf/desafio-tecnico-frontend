/**
 * src/services/api.test.ts
 */
jest.mock('axios', () => {
  const mockGet  = jest.fn();
  const mockPost = jest.fn();
  return {
    default: {
      create: jest.fn(() => ({
        get:  mockGet,
        post: mockPost,
        interceptors: { response: { use: jest.fn() } },
      })),
    },
    create: jest.fn(() => ({
      get:  mockGet,
      post: mockPost,
      interceptors: { response: { use: jest.fn() } },
    })),
  };
});

import { fetchMachines, updateMachine } from './api';
import axios from 'axios';

const mockInstance = (axios as any).create();

const mockMachines = [
  {
    id: 101,
    codigo: 'Torno CNC 101',
    local: 'Setor A',
    status: 'Operando',
    alertas: [],
    ultimaAtualizacao: '2026-03-17T14:00:00-03:00',
    dados: [{ timestamp: '2026-03-17T14:00:00-03:00', rpm: 2100, potencia: 550, temperatura: 42 }],
  },
];

describe('fetchMachines', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna lista de máquinas em caso de sucesso', async () => {
    mockInstance.get.mockResolvedValueOnce({ data: mockMachines });
    const result = await fetchMachines();
    expect(result).toEqual(mockMachines);
    expect(mockInstance.get).toHaveBeenCalledWith('/maquinas');
  });

  it('lança erro quando a API falha', async () => {
    mockInstance.get.mockRejectedValueOnce(new Error('Network Error'));
    await expect(fetchMachines()).rejects.toThrow('Network Error');
  });
});

describe('updateMachine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('envia payload correto e retorna resposta', async () => {
    const payload = { nome: 'Torno Atualizado', local: 'Setor B' };
    mockInstance.post.mockResolvedValueOnce({ data: { success: true } });
    const result = await updateMachine(101, payload);
    expect(result).toEqual({ success: true });
    expect(mockInstance.post).toHaveBeenCalledWith('/maquinas/101', payload);
  });

  it('lança erro quando atualização falha', async () => {
    mockInstance.post.mockRejectedValueOnce(new Error('Update failed'));
    await expect(updateMachine(101, {})).rejects.toThrow('Update failed');
  });
});
