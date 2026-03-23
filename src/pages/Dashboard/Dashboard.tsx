/**
 * src/pages/Dashboard/Dashboard.tsx
 * Página principal: KPIs + grid de máquinas + painel lateral de alertas.
 */
import React, { useState, useMemo } from 'react';
import KpiCards    from '../../components/KpiCards/KpiCards';
import MachineCard  from '../../components/MachineCard/MachineCard';
import AlertPanel   from '../../components/AlertPanel/AlertPanel';
import FilterBar    from '../../components/FilterBar/FilterBar';
import MachineModal from '../../components/MachineModal/MachineModal';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews/StateViews';
import { groupByStatus, filterMachines, getLocations, sortMachines } from '../../utils/machine';
import { getStatusCategory } from '../../constants/statusMap';
import { Machine, StatusCounts, UpdateMachinePayload } from '../../types';
import styles from './Dashboard.module.css';

interface DashboardProps {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  onUpdate: (id: number | string, payload: UpdateMachinePayload) => Promise<unknown>;
  previousCounts: StatusCounts | null;
}

const STATUS_FILTER_LABELS: Record<keyof StatusCounts, string> = {
  operando: 'Operando',
  alerta:   'Em Alerta',
  atencao:  'Em Atenção',
  offline:  'Offline',
};

export default function Dashboard({
  machines,
  loading,
  error,
  onRefetch,
  onUpdate,
  previousCounts,
}: DashboardProps): React.ReactElement {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [search, setSearch]                   = useState<string>('');
  const [localFilter, setLocalFilter]         = useState<string>('');
  const [statusFilter, setStatusFilter]       = useState<keyof StatusCounts | null>(null);

  const counts    = useMemo(() => groupByStatus(machines), [machines]);
  const locations = useMemo(() => getLocations(machines),  [machines]);

  const filtered = useMemo(() => {
    let list = filterMachines(machines, { search, local: localFilter });

    if (statusFilter) {
      list = list.filter((m) => getStatusCategory(m.status) === statusFilter);
    }

    return sortMachines(list);
  }, [machines, search, localFilter, statusFilter]);

  const handleKpiClick = (key: keyof StatusCounts) => {
    setStatusFilter((prev) => (prev === key ? null : key));
  };

  return (
    <main className={styles.page}>

      {/* ── KPI Cards ── */}
      <section className={styles.kpiSection}>
        <KpiCards
          counts={counts}
          total={machines.length}
          previousCounts={previousCounts}
          activeFilter={statusFilter}
          onCardClick={handleKpiClick}
        />
      </section>

      {/* ── Pill de filtro ativo ── */}
      {statusFilter && (
        <div className={styles.filterPill}>
          <span className={styles.filterPillLabel}>
            Filtrado por: <strong>{STATUS_FILTER_LABELS[statusFilter]}</strong>
          </span>
          <button
            className={styles.filterPillClear}
            onClick={() => setStatusFilter(null)}
            aria-label="Remover filtro"
          >
            × Limpar filtro
          </button>
        </div>
      )}

      {/* ── Layout: grid + sidebar ── */}
      <div className={styles.layout}>
        <div className={styles.gridArea}>
          {!loading && !error && (
            <FilterBar
              search={search}
              onSearch={setSearch}
              local={localFilter}
              onLocal={setLocalFilter}
              locations={locations}
              total={machines.length}
              filtered={filtered.length}
            />
          )}

          {loading && <LoadingState count={9} />}

          {error && <ErrorState message={error} onRetry={onRefetch} />}

          {!loading && !error && filtered.length === 0 && <EmptyState />}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map((m, i) => (
                <div
                  key={m.id}
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <MachineCard machine={m} onClick={setSelectedMachine} />
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && <AlertPanel machines={machines} />}
      </div>

      {/* ── Modal de detalhes ── */}
      {selectedMachine && (
        <MachineModal
          machine={selectedMachine}
          onClose={() => setSelectedMachine(null)}
          onUpdate={onUpdate}
        />
      )}
    </main>
  );
}
