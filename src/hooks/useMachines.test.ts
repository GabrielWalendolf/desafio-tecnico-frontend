/**
 * src/hooks/useMachines.test.ts
 */
import { renderHook, act } from '@testing-library/react';
import { useMachines } from './useMachines';
import * as api from '../services/api';
import { Machine } from '../types';

jest.mock('../services/api');

const mockMachines: Machine[] = [
  {
    id: 101, codigo: 'Torno CNC 101', local: 'Setor A', status: 'Operando',
    alertas: [], ultimaAtualizacao: '2026-03-17T14:00:00-03:00',
    dados: [{ timestamp: '2026-03-17T14:00:00-03:00', rpm: 2100, potencia: 550, temperatura: 42 }],
  },
  {
    id: 203, codigo: 'Máquina CNC 203', local: 'Setor B', status: 'Temp. Alta',
    alertas: ['Temp. Alta'], ultimaAtualizacao: '2026-03-17T14:00:00-03:00',
    dados: [{ timestamp: '2026-03-17T14:00:00-03:00', rpm: 8290, potencia: 1220, temperatura: 79 }],
  },
];

describe('useMachines', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inicia com loading true e machines vazio', () => {
    (api.fetchMachines as jest.Mock).mockResolvedValue(mockMachines);
    const { result } = renderHook(() => useMachines());
    expect(result.current.loading).toBe(true);
    expect(result.current.machines).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('carrega máquinas com sucesso', async () => {
    (api.fetchMachines as jest.Mock).mockResolvedValue(mockMachines);
    const { result } = renderHook(() => useMachines());
    await act(async () => { await api.fetchMachines(); });
    expect(result.current.machines).toEqual(mockMachines);
    expect(result.current.lastFetch).toBeInstanceOf(Date);
  });

  it('atualiza máquina localmente após update', async () => {
    (api.fetchMachines as jest.Mock).mockResolvedValue(mockMachines);
    (api.updateMachine as jest.Mock).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useMachines());
    await act(async () => { await api.fetchMachines(); });
    await act(async () => { await result.current.update(101, { local: 'Setor C' }); });
    expect(result.current.machines.find((m) => m.id === 101)?.local).toBe('Setor C');
  });

  it('previousCounts começa como null', () => {
    (api.fetchMachines as jest.Mock).mockResolvedValue(mockMachines);
    const { result } = renderHook(() => useMachines());
    expect(result.current.previousCounts).toBeNull();
  });
});
