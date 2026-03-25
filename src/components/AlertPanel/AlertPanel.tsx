/**
 * src/components/AlertPanel/AlertPanel.tsx
 */
import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  ResponsiveContainer, Sector,
} from 'recharts';
import { Warning, ChartDonut } from '@phosphor-icons/react';
import { countAlerts, formatDateTime, groupByStatus } from '../../utils/machine';
import { getAlertColor, ALERT_DONUT_COLORS } from '../../constants/alertColors';
import { Machine, AlertChartEntry } from '../../types';
import styles from './AlertPanel.module.css';

/* ── Paletas ── */
const ALERT_COLORS = ALERT_DONUT_COLORS;

const STATUS_COLORS: Record<string, string> = {
  'Em Alerta':   'var(--kpi-danger)',
  'Em Atenção':  'var(--kpi-warn)',
  'Offline':     'var(--kpi-off)',
  'Operando':    'var(--kpi-ok)',
};

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

/* ── Sector ativo (fatia destacada) ── */
function ActiveShape(props: any): React.ReactElement {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill,
  } = props;
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
  /** Fatia de alerta ativa (nome do alerta ou label de status) */
  activeSlice: string | null;
  onPieClick: (name: string | null, mode: DonutMode) => void;
}

export default function AlertPanel({
  machines,
  activeSlice,
  onPieClick,
}: AlertPanelProps): React.ReactElement {
  const [mode, setMode] = useState<DonutMode>('alertas');

  /* Dados para cada modo */
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

  const criticals = machines
    .filter((m) => m.alertas?.length > 0)
    .sort((a, b) => b.alertas.length - a.alertas.length)
    .slice(0, 5);

  /* Índice do slice ativo para o Recharts */
  const activeIndex = activeSlice
    ? data.findIndex((d) => d.name === activeSlice)
    : -1;

  const handleSliceClick = (entry: AlertChartEntry) => {
    /* Segundo clique no mesmo slice → remove o filtro */
    const next = activeSlice === entry.name ? null : entry.name;
    onPieClick(next, mode);
  };

  const handleModeChange = (next: DonutMode) => {
    setMode(next);
    /* Limpa filtro ao trocar de modo */
    onPieClick(null, next);
  };

  return (
    <aside className={styles.panel}>

      {/* ── Alertas Críticos ── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.titleIcon} style={{ color: 'var(--danger)' }}>
            <Warning size={14} weight="bold" />
          </span>
          Alertas Críticos
        </div>
        {criticals.length === 0 ? (
          <p className={styles.empty}>Nenhum alerta ativo.</p>
        ) : (
          <ul className={styles.alertList}>
            {criticals.map((m) => (
              <li key={m.id} className={styles.alertItem}>
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
            ))}
          </ul>
        )}
      </section>

      {/* ── Distribuição ── */}
      <section className={styles.section}>
        {/* Cabeçalho com toggle */}
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
            {/* Dica de clique */}
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
                      /* Fatias não selecionadas ficam levemente opacas */
                      opacity={
                        activeSlice && activeSlice !== entry.name ? 0.35 : 1
                      }
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
                    <span
                      className={styles.legendDot}
                      style={{ background: color }}
                    />
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