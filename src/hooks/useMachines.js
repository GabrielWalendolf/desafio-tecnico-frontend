/**
 * src/hooks/useMachines.js
 * Hook customizado para buscar e gerenciar o estado das máquinas.
 * Encapsula loading, error e lógica de refetch/update local.
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchMachines, updateMachine } from '../services/api';

export function useMachines() {
  const [machines, setMachines]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMachines();
      setMachines(Array.isArray(data) ? data : []);
      setLastFetch(new Date());
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao conectar com a API.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Atualiza metadados de uma máquina e reflete o change localmente
   * sem precisar refazer o GET completo.
   */
  const update = useCallback(async (id, payload) => {
    const result = await updateMachine(id, payload);
    // Atualiza o estado local otimisticamente
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...payload } : m
      )
    );
    return result;
  }, []);

  return { machines, loading, error, refetch: load, update, lastFetch };
}
