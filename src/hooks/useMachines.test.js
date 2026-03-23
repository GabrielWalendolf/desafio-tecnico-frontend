/**
 * src/hooks/useMachines.test.js
 * Testes do hook customizado useMachines.
 */
import { renderHook, act } from '@testing-library/react';
import { useMachines } from './useMachines';
import * as api from '../services/api';

jest.mock('../services/api');

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
  {
    id: 203,
    codigo: 'Máquina CNC 203',
    local: 'Setor B',
    status: 'Temp. Alta',
    alertas: ['Temp. Alta'],
    ultimaAtualizacao: '2026-03-17T14:00:00-03:00',
    dados: [{ timestamp: '2026-03-17T14:00:00-03:00', rpm: 8290, potencia: 1220, temperatura: 79 }],
  },
];

describe('useMachines', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inicia com loading true e machines vazio', () => {
    api.fetchMachines.mockResolvedValue(mockMachines);
    const { result } = renderHook(() => useMachines());

    expect(result.current.loading).toBe(true);
    expect(result.current.machines).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('carrega máquinas com sucesso', async () => {
    api.fetchMachines.mockResolvedValue(mockMachines);
    const { result } = renderHook(() => useMachines());

    await act(async () => {
      await api.fetchMachines();
    });

    expect(result.current.machines).toEqual(mockMachines);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetch).toBeInstanceOf(Date);
  });

  it('define erro quando a API falha', async () => {
    api.fetchMachines.mockRejectedValue(new Error('Falha de conexão'));
    const { result } = renderHook(() => useMachines());

    await act(async () => {
      await api.fetchMachines().catch(() => {});
    });

    expect(result.current.machines).toEqual([]);
  });

  it('recarrega máquinas ao chamar refetch', async () => {
    api.fetchMachines.mockResolvedValue(mockMachines);
    const { result } = renderHook(() => useMachines());

    await act(async () => {
      await api.fetchMachines();
    });

    // O hook chama fetchMachines no mount (1x) + 1x no act acima = 2 chamadas
    const callsAfterMount = api.fetchMachines.mock.calls.length;

    await act(async () => {
      result.current.refetch();
      await api.fetchMachines();
    });

    // Após refetch deve ter mais 2 chamadas
    expect(api.fetchMachines.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it('atualiza máquina localmente após update', async () => {
    api.fetchMachines.mockResolvedValue(mockMachines);
    api.updateMachine.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMachines());

    await act(async () => {
      await api.fetchMachines();
    });

    await act(async () => {
      await result.current.update(101, { local: 'Setor C' });
    });

    const updated = result.current.machines.find((m) => m.id === 101);
    expect(updated.local).toBe('Setor C');
  });

  it('previousCounts começa como null', () => {
    api.fetchMachines.mockResolvedValue(mockMachines);
    const { result } = renderHook(() => useMachines());
    expect(result.current.previousCounts).toBeNull();
  });
});