/**
 * src/pages/Dashboard/Dashboard.jsx
 * Página principal: KPIs + grid de máquinas + painel lateral de alertas.
 */
import React, { useState, useMemo } from 'react';
import KpiCards    from '../../components/KpiCards/KpiCards';
import MachineCard  from '../../components/MachineCard/MachineCard';
import AlertPanel   from '../../components/AlertPanel/AlertPanel';
import FilterBar    from '../../components/FilterBar/FilterBar';
import MachineModal from '../../components/MachineModal/MachineModal';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews/StateViews';
import { groupByStatus, filterMachines, getLocations } from '../../utils/machine';
import styles from './Dashboard.module.css';

export default function Dashboard({
  machines,
  loading,
  error,
  onRefetch,
  onUpdate,
  previousCounts,
}) {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [search, setSearch]                   = useState('');
  const [localFilter, setLocalFilter]         = useState('');
  const [statusFilter, setStatusFilter]       = useState(null); // 'operando' | 'alerta' | 'atencao' | 'offline' | null

  const counts    = useMemo(() => groupByStatus(machines), [machines]);
  const locations = useMemo(() => getLocations(machines),  [machines]);

  /* Filtra por texto + local + categoria KPI (statusFilter) */
  const filtered  = useMemo(() => {
    let list = filterMachines(machines, { search, local: localFilter });
    if (statusFilter) {
      list = list.filter((m) => {
        const { getStatusCategory } = require('../../constants/statusMap');
        return getStatusCategory(m.status) === statusFilter;
      });
    }
    return list;
  }, [machines, search, localFilter, statusFilter]);

  /* Alterna o filtro: clique no mesmo card remove o filtro */
  const handleKpiClick = (key) => {
    setStatusFilter((prev) => (prev === key ? null : key));
  };

  return (
    <main className={styles.page}>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <section className={styles.kpiSection}>
        <KpiCards
          counts={counts}
          total={machines.length}
          previousCounts={previousCounts}
          activeFilter={statusFilter}
          onCardClick={handleKpiClick}
        />
      </section>

      {/* ── Pill de filtro ativo ───────────────────────────────── */}
      {statusFilter && (
        <div className={styles.filterPill}>
          <span className={styles.filterPillLabel}>
            Filtrando por: <strong>{
              { operando: 'Operando', alerta: 'Em Alerta', atencao: 'Em Atenção', offline: 'Offline' }[statusFilter]
            }</strong>
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

      {/* ── Main content: grid + sidebar ──────────────────────── */}
      <div className={styles.layout}>

        {/* Área central: filtros + grid de máquinas */}
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

        {/* Painel lateral de alertas */}
        {!loading && <AlertPanel machines={machines} />}
      </div>

      {/* ── Modal de detalhes ─────────────────────────────────── */}
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