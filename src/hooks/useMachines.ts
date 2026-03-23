/**
 * src/hooks/useMachines.ts
 * Hook customizado para buscar e gerenciar o estado das máquinas.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMachines, updateMachine } from '../services/api';
import { groupByStatus } from '../utils/machine';
import { Machine, StatusCounts, UpdateMachinePayload } from '../types';

export interface UseMachinesReturn {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (id: number | string, payload: UpdateMachinePayload) => Promise<unknown>;
  lastFetch: Date | null;
  previousCounts: StatusCounts | null;
}

export function useMachines(): UseMachinesReturn {
  const [machines, setMachines]             = useState<Machine[]>([]);
  const [loading, setLoading]               = useState<boolean>(true);
  const [error, setError]                   = useState<string | null>(null);
  const [lastFetch, setLastFetch]           = useState<Date | null>(null);
  const [previousCounts, setPreviousCounts] = useState<StatusCounts | null>(null);

  const currentCountsRef = useRef<StatusCounts | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMachines();
      const list = Array.isArray(data) ? data : [];

      if (currentCountsRef.current) {
        setPreviousCounts(currentCountsRef.current);
      }

      currentCountsRef.current = groupByStatus(list);
      setMachines(list);
      setLastFetch(new Date());
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr?.response?.data?.message ??
        axiosErr?.message ??
        'Erro ao conectar com a API.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(async (
    id: number | string,
    payload: UpdateMachinePayload
  ): Promise<unknown> => {
    const result = await updateMachine(id, payload);
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...payload } : m))
    );
    return result;
  }, []);

  return { machines, loading, error, refetch: load, update, lastFetch, previousCounts };
}
