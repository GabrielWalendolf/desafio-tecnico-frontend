/**
 * src/pages/Dashboard/Dashboard.jsx
 * Página principal: KPIs + grid de máquinas + painel lateral de alertas.
 * Orquestra todos os componentes e o estado de filtros.
 */
import React, { useState, useMemo } from 'react';
import KpiCards   from '../../components/KpiCards/KpiCards';
import MachineCard from '../../components/MachineCard/MachineCard';
import AlertPanel  from '../../components/AlertPanel/AlertPanel';
import FilterBar   from '../../components/FilterBar/FilterBar';
import MachineModal from '../../components/MachineModal/MachineModal';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews/StateViews';
import { groupByStatus, filterMachines, getLocations } from '../../utils/machine';
import styles from './Dashboard.module.css';

export default function Dashboard({ machines, loading, error, onRefetch, onUpdate }) {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [search, setSearch]                   = useState('');
  const [localFilter, setLocalFilter]         = useState('');

  const counts    = useMemo(() => groupByStatus(machines), [machines]);
  const locations = useMemo(() => getLocations(machines), [machines]);

  const filtered  = useMemo(
    () => filterMachines(machines, { search, local: localFilter }),
    [machines, search, localFilter]
  );

  return (
    <main className={styles.page}>
      {/* ── KPI Cards ─────────────────────────────────── */}
      <section className={styles.kpiSection}>
        <KpiCards counts={counts} total={machines.length} />
      </section>

      {/* ── Main content: grid + sidebar ──────────────── */}
      <div className={styles.layout}>

        {/* Left / center: filter + machine grid */}
        <div className={styles.gridArea}>

          {/* Filter bar */}
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

          {/* States */}
          {loading && <LoadingState count={9} />}

          {error && (
            <ErrorState message={error} onRetry={onRefetch} />
          )}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState />
          )}

          {/* Machine grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map((m, i) => (
                <div
                  key={m.id}
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <MachineCard
                    machine={m}
                    onClick={setSelectedMachine}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: alert panel */}
        {!loading && (
          <AlertPanel machines={machines} />
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────── */}
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
