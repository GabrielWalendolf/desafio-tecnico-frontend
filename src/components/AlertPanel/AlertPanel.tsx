/**
 * src/components/AlertPanel/AlertPanel.tsx
 */
import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  ResponsiveContainer, Sector,
} from 'recharts';
import { Warning, ChartDonut, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { countAlerts, formatDateTime, groupByStatus } from '../../utils/machine';
import { getAlertColor, ALERT_DONUT_COLORS } from '../../constants/alertColors';
import { getStatusCategory } from '../../constants/statusMap';
import { Machine, AlertChartEntry } from '../../types';
import styles from './AlertPanel.module.css';

const ALERT_COLORS = ALERT_DONUT_COLORS;

const STATUS_COLORS: Record<string, string> = {
  'Em Alerta':  'var(--kpi-danger)',
  'Em Atenção': 'var(--kpi-warn)',
  'Offline':    'var(--kpi-off)',
  'Operando':   'var(--kpi-ok)',
};

/** Cor da borda esquerda do item — mesma lógica dos KPI cards */
const CATEGORY_BORDER: Record<string, string> = {
  alerta:   'var(--kpi-danger)',
  atencao:  'var(--kpi-warn)',
  offline:  'var(--kpi-off)',
  operando: 'var(--kpi-ok)',
};

const PAGE_SIZE = 4;

type DonutMode = 'alertas' | 'status';

/* ── Tooltip ── */
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CustomTooltip({ active, payload }: TooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{payload[0].name}</span>
      <span className={styles.tooltipValue}>{payload[0].value}</span>
    </div>
  );
}

/* ── Sector ativo ── */
function ActiveShape(props: any): React.ReactElement {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={1}
      />
    </g>
  );
}

/* ── Props ── */
interface AlertPanelProps {
  machines: Machine[];
  activeSlice: string | null;
  onPieClick: (name: string | null, mode: DonutMode) => void;
  /** Id da máquina atualmente filtrada pelo painel de críticos (null = sem filtro) */
  activeMachineId: number | null;
  /** Chamado ao clicar num item de alerta crítico — passa null para desfiltrar */
  onMachineClick: (id: number | null) => void;
}

export default function AlertPanel({
  machines,
  activeSlice,
  onPieClick,
  activeMachineId,
  onMachineClick,
}: AlertPanelProps): React.ReactElement {
  const [mode, setMode] = useState<DonutMode>('alertas');
  const [page, setPage] = useState<number>(0);

  /* Apenas máquinas na categoria "alerta", ordenadas por nº de alertas desc */
  const criticals = machines
    .filter((m) => getStatusCategory(m.status) === 'alerta')
    .sort((a, b) => b.alertas.length - a.alertas.length);

  const totalPages = Math.ceil(criticals.length / PAGE_SIZE);
  const paginated  = criticals.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  /* Dados do donut */
  const alertData: AlertChartEntry[] = countAlerts(machines);
  const counts = groupByStatus(machines);
  const statusData: AlertChartEntry[] = [
    { name: 'Em Alerta',  value: counts.alerta   },
    { name: 'Em Atenção', value: counts.atencao  },
    { name: 'Offline',    value: counts.offline  },
    { name: 'Operando',   value: counts.operando },
  ].filter((d) => d.value > 0);

  const data    = mode === 'alertas' ? alertData : statusData;
  const hasData = data.length > 0;

  const activeIndex = activeSlice
    ? data.findIndex((d) => d.name === activeSlice)
    : -1;

  const handleSliceClick = (entry: AlertChartEntry) => {
    const next = activeSlice === entry.name ? null : entry.name;
    // Limpa o filtro por máquina ao filtrar pelo donut
    if (next) onMachineClick(null);
    onPieClick(next, mode);
  };

  const handleModeChange = (next: DonutMode) => {
    setMode(next);
    onPieClick(null, next);
  };

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  /** Clique num item de alerta crítico: toggle — se já está ativo, remove o filtro */
  const handleAlertItemClick = (m: Machine) => {
    const next = activeMachineId === m.id ? null : m.id;
    // Limpa o filtro de donut ao filtrar por máquina específica
    if (next !== null) onPieClick(null, mode);
    onMachineClick(next);
  };

  return (
    <aside className={styles.panel}>

      {/* ── Alertas Críticos ── */}
      <section className={styles.section}>
        <div className={styles.criticalHeader}>
          <div className={styles.sectionTitle}>
            <span className={styles.titleIcon} style={{ color: 'var(--kpi-danger)' }}>
              <Warning size={14} weight="bold" />
            </span>
            Alertas Críticos
            {criticals.length > 0 && (
              <span className={styles.criticalCount}>{criticals.length}</span>
            )}
          </div>

          {/* Paginação — só aparece quando há mais de uma página */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={handlePrev}
                disabled={page === 0}
                aria-label="Página anterior"
              >
                <CaretLeft size={11} weight="bold" />
              </button>
              <span className={styles.pageInfo}>{page + 1}/{totalPages}</span>
              <button
                className={styles.pageBtn}
                onClick={handleNext}
                disabled={page === totalPages - 1}
                aria-label="Próxima página"
              >
                <CaretRight size={11} weight="bold" />
              </button>
            </div>
          )}
        </div>

        {criticals.length === 0 ? (
          <p className={styles.empty}>Nenhuma máquina em alerta.</p>
        ) : (
          <ul className={styles.alertList}>
            {paginated.map((m) => {
              const category    = getStatusCategory(m.status);
              const borderColor = CATEGORY_BORDER[category] ?? 'var(--kpi-danger)';
              const isActive    = activeMachineId === m.id;
              return (
                <li
                  key={m.id}
                  className={`${styles.alertItem} ${isActive ? styles.alertItemActive : ''}`}
                  style={{ borderLeftColor: borderColor }}
                  onClick={() => handleAlertItemClick(m)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleAlertItemClick(m)}
                  aria-pressed={isActive}
                  title={isActive ? 'Clique para remover o filtro' : `Filtrar por ${m.codigo}`}
                >
                  <div className={styles.alertMachine}>
                    <span className={styles.alertName}>{m.codigo}</span>
                    <span className={styles.alertLocal}>{m.local}</span>
                  </div>
                  <div className={styles.alertTags}>
                    {m.alertas.map((a) => {
                      const cfg = getAlertColor(a);
                      return (
                        <span
                          key={a}
                          className={styles.alertTag}
                          style={{
                            color:      cfg.color,
                            background: cfg.bg,
                            border:     'none',
                            borderTop:  `1px solid ${cfg.borderTop}`,
                          }}
                        >
                          {a}
                        </span>
                      );
                    })}
                  </div>
                  <span className={styles.alertTime}>
                    {formatDateTime(m.ultimaAtualizacao)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Distribuição ── */}
      <section className={styles.section}>
        <div className={styles.donutHeader}>
          <div className={styles.sectionTitle}>
            <span className={styles.titleIcon} style={{ color: 'var(--info)' }}>
              <ChartDonut size={14} weight="fill" />
            </span>
            Distribuição
          </div>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'alertas' ? styles.modeBtnActive : ''}`}
              onClick={() => handleModeChange('alertas')}
            >
              Alertas
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'status' ? styles.modeBtnActive : ''}`}
              onClick={() => handleModeChange('status')}
            >
              Status
            </button>
          </div>
        </div>

        {!hasData ? (
          <p className={styles.empty}>Sem dados para exibir.</p>
        ) : (
          <>
            <p className={styles.clickHint}>
              {activeSlice
                ? `Filtrando: ${activeSlice} — clique novamente para remover`
                : 'Clique em uma fatia para filtrar os cards'}
            </p>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={activeIndex >= 0 ? activeIndex : undefined}
                  activeShape={<ActiveShape />}
                  onClick={(_: any, index: number) => handleSliceClick(data[index])}
                  style={{ cursor: 'pointer' }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        mode === 'status'
                          ? STATUS_COLORS[entry.name] ?? ALERT_COLORS[index % ALERT_COLORS.length]
                          : ALERT_COLORS[index % ALERT_COLORS.length]
                      }
                      opacity={activeSlice && activeSlice !== entry.name ? 0.35 : 1}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className={styles.legend}>
              {data.map((item, i) => {
                const color =
                  mode === 'status'
                    ? STATUS_COLORS[item.name] ?? ALERT_COLORS[i % ALERT_COLORS.length]
                    : ALERT_COLORS[i % ALERT_COLORS.length];
                const isActive = activeSlice === item.name;
                return (
                  <button
                    key={item.name}
                    className={`${styles.legendItem} ${isActive ? styles.legendItemActive : ''}`}
                    style={{ '--legend-color': color } as React.CSSProperties}
                    onClick={() => handleSliceClick(item)}
                    title={isActive ? 'Clique para remover filtro' : `Filtrar por ${item.name}`}
                  >
                    <span className={styles.legendDot} style={{ background: color }} />
                    <span className={styles.legendName}>{item.name}</span>
                    <span className={styles.legendVal}>{item.value}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </aside>
  );
}