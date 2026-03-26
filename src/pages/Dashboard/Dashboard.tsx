/**
 * src/pages/Dashboard/Dashboard.tsx
 * Página principal: KPIs + grid de máquinas + painel lateral de alertas.
 */
import React, { useState, useMemo, useRef } from 'react';
import KpiCards     from '../../components/KpiCards/KpiCards';
import MachineCard  from '../../components/MachineCard/MachineCard';
import AlertPanel   from '../../components/AlertPanel/AlertPanel';
import FilterBar    from '../../components/FilterBar/FilterBar';
import MachineModal from '../../components/MachineModal/MachineModal';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews/StateViews';
import { groupByStatus, filterMachines, getLocations, sortMachines } from '../../utils/machine';
import { getStatusCategory } from '../../constants/statusMap';
import { Machine, StatusCounts, UpdateMachinePayload } from '../../types';
import styles from './Dashboard.module.css';

type DonutMode = 'alertas' | 'status';

/** Mapeia label do donut de status → categoria interna */
const STATUS_LABEL_MAP: Record<string, keyof StatusCounts> = {
  'Em Alerta':  'alerta',
  'Em Atenção': 'atencao',
  'Offline':    'offline',
  'Operando':   'operando',
};

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

  /** Nome do slice clicado no donut (alerta ou label de status) */
  const [pieSlice, setPieSlice] = useState<string | null>(null);
  /** Modo ativo do donut no momento do clique */
  const [pieMode, setPieMode]   = useState<DonutMode>('alertas');
  /** Id da máquina clicada no painel de alertas críticos */
  const [machineFilter, setMachineFilter] = useState<number | null>(null);

  /** Ref da área de cards — scroll automático ao filtrar */
  const gridRef = useRef<HTMLDivElement>(null);

  const scrollToGrid = () => {
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const counts    = useMemo(() => groupByStatus(machines), [machines]);
  const locations = useMemo(() => getLocations(machines),  [machines]);

  /* ── Filtragem principal ── */
  const filtered = useMemo(() => {
    let list = filterMachines(machines, { search, local: localFilter });

    /* Filtro por KPI card (status) */
    if (statusFilter) {
      list = list.filter((m) => getStatusCategory(m.status) === statusFilter);
    }

    /* Filtro por clique no donut */
    if (pieSlice) {
      if (pieMode === 'alertas') {
        list = list.filter((m) => m.alertas?.includes(pieSlice));
      } else {
        const cat = STATUS_LABEL_MAP[pieSlice];
        if (cat) list = list.filter((m) => getStatusCategory(m.status) === cat);
      }
    }

    /* Filtro por clique num item de alerta crítico — filtra pelo id da máquina */
    if (machineFilter !== null) {
      list = list.filter((m) => m.id === machineFilter);
    }

    return sortMachines(list);
  }, [machines, search, localFilter, statusFilter, pieSlice, pieMode, machineFilter]);

  const handleKpiClick = (key: keyof StatusCounts) => {
    if (statusFilter === key) {
      setStatusFilter(null);
    } else {
      setStatusFilter(key);
      setPieSlice(null);
      setMachineFilter(null);
      scrollToGrid();
    }
  };

  const handlePieClick = (name: string | null, mode: DonutMode) => {
    setPieSlice(name);
    setPieMode(mode);
    if (name) {
      setStatusFilter(null);
      setMachineFilter(null);
      scrollToGrid();
    }
  };

  const handleMachineClick = (id: number | null) => {
    setMachineFilter(id);
    if (id !== null) {
      setStatusFilter(null);
      setPieSlice(null);
      scrollToGrid();
    }
  };

  /* Label amigável do filtro ativo para exibir na pill */
  const activePillLabel = useMemo(() => {
    if (machineFilter !== null) {
      return machines.find((m) => m.id === machineFilter)?.codigo ?? String(machineFilter);
    }
    if (statusFilter) return STATUS_FILTER_LABELS[statusFilter];
    if (pieSlice)     return pieSlice;
    return null;
  }, [statusFilter, pieSlice, machineFilter, machines]);

  const clearAllFilters = () => {
    setStatusFilter(null);
    setPieSlice(null);
    setMachineFilter(null);
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
      {activePillLabel && (
        <div className={styles.filterPill}>
          <span className={styles.filterPillLabel}>
            Filtrado por: <strong>{activePillLabel}</strong>
          </span>
          <button
            className={styles.filterPillClear}
            onClick={clearAllFilters}
            aria-label="Remover filtro"
          >
            × Limpar filtro
          </button>
        </div>
      )}

      {/* ── Layout: grid + sidebar ── */}
      <div className={styles.layout}>
        <div className={styles.gridArea} ref={gridRef}>
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

        {!loading && (
          <AlertPanel
            machines={machines}
            activeSlice={pieSlice}
            onPieClick={handlePieClick}
            activeMachineId={machineFilter}
            onMachineClick={handleMachineClick}
          />
        )}
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