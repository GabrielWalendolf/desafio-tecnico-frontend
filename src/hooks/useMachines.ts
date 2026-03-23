/**
 * src/hooks/useMachines.js
 * Hook customizado para buscar e gerenciar o estado das máquinas.
 * Guarda um snapshot do counts anterior para exibir tendência nos KPI Cards.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMachines, updateMachine } from '../services/api';
import { groupByStatus } from '../utils/machine';

export function useMachines() {
  const [machines, setMachines]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [lastFetch, setLastFetch]           = useState(null);
  const [previousCounts, setPreviousCounts] = useState(null);

  /* Ref para guardar counts atuais antes de sobrescrever */
  const currentCountsRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMachines();
      const list = Array.isArray(data) ? data : [];

      /* Salva snapshot dos counts atuais ANTES de atualizar */
      if (currentCountsRef.current) {
        setPreviousCounts(currentCountsRef.current);
      }

      /* Calcula e registra os novos counts */
      currentCountsRef.current = groupByStatus(list);

      setMachines(list);
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
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...payload } : m))
    );
    return result;
  }, []);

  return { machines, loading, error, refetch: load, update, lastFetch, previousCounts };
}