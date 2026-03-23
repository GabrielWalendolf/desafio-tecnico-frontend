/**
 * src/pages/Reports/Reports.tsx
 * Página de Relatórios — visão consolidada da frota industrial.
 *
 * Seções:
 *  1. Resumo executivo (4 KPIs rápidos)
 *  2. Alertas Críticos + Distribuição de Alertas (donut)
 *  3. Ranking de Criticidade (tabela ordenável)
 *  4. Tabela de Médias por Máquina + Máquinas sem Comunicação
 *  5. Histórico de Status por Local (barras empilhadas)
 *  6. Dispersão RPM × Temperatura (scatter)
 */
import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  ScatterChart, Scatter,
  XAxis, YAxis, ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Warning, CheckCircle, WifiX, Gauge,
  ChartBar, MapPin, ChartDonut,
  CaretUp, CaretDown, DownloadSimple,
} from '@phosphor-icons/react';
import { Machine } from '../../types';
import {
  countAlerts,
  groupByStatus,
  getLocations,
  getLatestSensorData,
  formatDateTime,
} from '../../utils/machine';
import { getStatusCategory } from '../../constants/statusMap';
import { LoadingState, ErrorState } from '../../components/StateViews/StateViews';
import styles from './Reports.module.css';

// ── Color palette ───────────────────────────────────────────────
const DONUT_COLORS = [
  'var(--danger)', 'var(--warning)', 'var(--accent)',
  'var(--info)', '#a371f7', '#ffa657',
];

const STATUS_BAR_COLORS: Record<string, string> = {
  operando: 'var(--kpi-ok)',
  alerta:   'var(--kpi-danger)',
  atencao:  'var(--kpi-warn)',
  offline:  'var(--kpi-off)',
};

// ── Internal utilities ──────────────────────────────────────────
function calcMachineAverages(machine: Machine) {
  const dados = machine.dados || [];
  if (dados.length === 0) {
    return { avgRpm: 0, avgPotencia: 0, avgTemperatura: 0, readings: 0 };
  }
  const sum = dados.reduce(
    (acc, d) => ({
      rpm:  acc.rpm  + (d.rpm         ?? 0),
      pot:  acc.pot  + (d.potencia    ?? 0),
      temp: acc.temp + (d.temperatura ?? 0),
    }),
    { rpm: 0, pot: 0, temp: 0 }
  );
  return {
    avgRpm:         Math.round(sum.rpm  / dados.length),
    avgPotencia:    Math.round(sum.pot  / dados.length),
    avgTemperatura: Math.round(sum.temp / dados.length),
    readings:       dados.length,
  };
}

function groupStatusByLocal(machines: Machine[]) {
  const locals = getLocations(machines);
  return locals.map((local) => {
    const group  = machines.filter((m) => m.local === local);
    const counts = groupByStatus(group);
    return { local, ...counts, total: group.length };
  });
}

function getMachinesWithoutRecentComm(machines: Machine[], thresholdMinutes = 60) {
  const now = Date.now();
  return machines
    .map((m) => {
      const ts = m.ultimaAtualizacao
        ? new Date(m.ultimaAtualizacao).getTime()
        : 0;
      return { ...m, minutesAgo: Math.round((now - ts) / 60_000) };
    })
    .filter((m) => m.minutesAgo >= thresholdMinutes)
    .sort((a, b) => b.minutesAgo - a.minutesAgo);
}

function formatMinutesAgo(minutes: number): string {
  if (minutes < 60)  return `${minutes}min atrás`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h atrás`;
  return `${Math.round(minutes / 1440)}d atrás`;
}

// ── Sub-components ──────────────────────────────────────────────
interface SectionHeaderProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  sub?: string;
}

function SectionHeader({ icon: Icon, iconColor, title, sub }: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <div
        className={styles.sectionIcon}
        style={{
          background: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
          color: iconColor,
        }}
      >
        <Icon size={15} weight="bold" />
      </div>
      <span className={styles.sectionTitle}>{title}</span>
      {sub && <span className={styles.sectionSub}>{sub}</span>}
    </div>
  );
}

/* Tooltip genérico para BarChart e PieChart */
function GenericTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; fill?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label && <div className={styles.tooltipLabel}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className={styles.tooltipRow}>
          <span className={styles.tooltipKey} style={{ color: p.color ?? p.fill }}>
            {p.name}:
          </span>
          <span className={styles.tooltipVal}>
            {p.value?.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Tooltip específico para o ScatterChart */
function ScatterTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { x: number; y: number; z: number; name: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{d.name}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>RPM:</span>
        <span className={styles.tooltipVal}>{d.x.toLocaleString('pt-BR')}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>Temp:</span>
        <span className={styles.tooltipVal}>{d.y}°C</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>Alertas:</span>
        <span className={styles.tooltipVal}>{d.z}</span>
      </div>
    </div>
  );
}

// ── Sort helpers ────────────────────────────────────────────────
type SortKey = 'alertas' | 'avgRpm' | 'avgTemperatura' | 'avgPotencia';
type SortDir = 'asc' | 'desc';

// ── Props ───────────────────────────────────────────────────────
interface ReportsProps {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
}

// ── Component ───────────────────────────────────────────────────
export default function Reports({
  machines, loading, error, onRefetch,
}: ReportsProps): React.ReactElement {
  const [sortKey, setSortKey] = useState<SortKey>('alertas');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ── Derived data ────────────────────────────────────────────
  const counts        = useMemo(() => groupByStatus(machines), [machines]);
  const alertData     = useMemo(() => countAlerts(machines),   [machines]);
  const statusByLocal = useMemo(() => groupStatusByLocal(machines), [machines]);
  const noComm        = useMemo(() => getMachinesWithoutRecentComm(machines, 60), [machines]);

  const criticals = useMemo(
    () =>
      machines
        .filter((m) => (m.alertas?.length ?? 0) > 0)
        .sort((a, b) => b.alertas.length - a.alertas.length),
    [machines]
  );

  const scatterData = useMemo(
    () =>
      machines.map((m) => {
        const { rpm, temperatura } = getLatestSensorData(m);
        return {
          x:    rpm,
          y:    temperatura,
          z:    m.alertas?.length ?? 0,
          name: m.codigo,
        };
      }),
    [machines]
  );

  const averagesData = useMemo(() => {
    const enriched = machines.map((m) => ({ ...m, ...calcMachineAverages(m) }));
    return [...enriched].sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      switch (sortKey) {
        case 'alertas':        return dir * ((b.alertas?.length ?? 0) - (a.alertas?.length ?? 0));
        case 'avgRpm':         return dir * (b.avgRpm - a.avgRpm);
        case 'avgTemperatura': return dir * (b.avgTemperatura - a.avgTemperatura);
        case 'avgPotencia':    return dir * (b.avgPotencia - a.avgPotencia);
        default:               return 0;
      }
    });
  }, [machines, sortKey, sortDir]);

  const totalAlerts = useMemo(
    () => machines.reduce((acc, m) => acc + (m.alertas?.length ?? 0), 0),
    [machines]
  );

  const avgEfficiency = useMemo(() => {
    if (!machines.length) return 0;
    const sum = machines.reduce(
      (acc, m) => acc + Math.max(0, 100 - (m.alertas?.length ?? 0) * 12),
      0
    );
    return Math.round(sum / machines.length);
  }, [machines]);

  // ── Sort click handler ──────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return (
      <span className={styles.sortIcon}>
        {sortDir === 'desc'
          ? <CaretDown size={11} weight="bold" />
          : <CaretUp   size={11} weight="bold" />}
      </span>
    );
  };

  // ── Status pill helper ──────────────────────────────────────
  function StatusPill({ status }: { status: string }) {
    const cat = getStatusCategory(status);
    const styleMap: Record<string, { bg: string; color: string }> = {
      operando: { bg: 'var(--accent-dim)',                    color: 'var(--accent)'  },
      alerta:   { bg: 'var(--danger-dim)',                    color: 'var(--danger)'  },
      atencao:  { bg: 'var(--warning-dim)',                   color: 'var(--warning)' },
      offline:  { bg: 'rgba(87, 96, 106, 0.10)',              color: 'var(--muted)'   },
    };
    const s = styleMap[cat] ?? styleMap.offline;
    return (
      <span
        className={styles.statusPill}
        style={{ background: s.bg, color: s.color }}
      >
        {status}
      </span>
    );
  }

  // ── Loading / error ─────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '1.5rem' }}>
        <LoadingState count={6} />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '1.5rem' }}>
        <ErrorState message={error} onRetry={onRefetch} />
      </main>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <main className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Relatórios</h1>
          <p className={styles.pageSub}>
            Visão consolidada da frota · {machines.length} máquinas monitoradas
          </p>
        </div>
        <button className={styles.exportBtn} title="Exportar relatório (em breve)">
          <DownloadSimple size={14} weight="bold" />
          Exportar PDF
        </button>
      </div>

      {/* ── 1. Summary stats ── */}
      <div className={styles.statsRow}>
        {[
          {
            label: 'Total de Alertas',
            value: totalAlerts,
            Icon:  Warning,
            color: 'var(--danger)',
            delay: 0,
          },
          {
            label: 'Máquinas em Alerta',
            value: counts.alerta,
            Icon:  Warning,
            color: 'var(--kpi-danger)',
            delay: 80,
          },
          {
            label: 'Máquinas Offline',
            value: counts.offline,
            Icon:  WifiX,
            color: 'var(--kpi-off)',
            delay: 160,
          },
          {
            label: 'Eficiência Média',
            value: `${avgEfficiency}%`,
            Icon:  Gauge,
            color: 'var(--accent)',
            delay: 240,
          },
        ].map(({ label, value, Icon, color, delay }) => (
          <div
            key={label}
            className={styles.statCard}
            style={{ animationDelay: `${delay}ms` }}
          >
            <div
              className={styles.statIconWrap}
              style={{
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                color,
              }}
            >
              <Icon size={20} weight="bold" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. Alertas críticos + Distribuição ── */}
      <section className={styles.section}>
        <SectionHeader
          icon={Warning}
          iconColor="var(--danger)"
          title="Alertas Críticos"
          sub={`${criticals.length} máquinas afetadas`}
        />
        <div className={styles.twoCol}>
          {/* Lista de alertas */}
          <div className={styles.card}>
            {criticals.length === 0 ? (
              <div className={styles.empty}>
                <CheckCircle size={36} weight="bold" color="var(--accent)" />
                <span>Nenhum alerta ativo no momento.</span>
              </div>
            ) : (
              <ul className={styles.alertList}>
                {criticals.slice(0, 6).map((m) => (
                  <li key={m.id} className={styles.alertItem}>
                    <span className={styles.alertItemIcon}>
                      <Warning size={15} weight="bold" />
                    </span>
                    <div className={styles.alertItemBody}>
                      <div className={styles.alertItemName}>{m.codigo}</div>
                      <div className={styles.alertItemMeta}>
                        {m.local} · {formatDateTime(m.ultimaAtualizacao)}
                      </div>
                      <div className={styles.alertTags}>
                        {m.alertas.map((a) => (
                          <span key={a} className={styles.alertTag}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Donut de distribuição */}
          <div className={styles.card}>
            {alertData.length === 0 ? (
              <div className={styles.empty}>
                <ChartDonut size={32} color="var(--muted)" weight="bold" />
                <span>Sem dados de alertas para exibir.</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={alertData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {alertData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<GenericTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.donutLegend}>
                  {alertData.map((item, i) => (
                    <div key={item.name} className={styles.legendRow}>
                      <span
                        className={styles.legendDot}
                        style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      <span className={styles.legendName}>{item.name}</span>
                      <span className={styles.legendVal}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. Ranking de Criticidade ── */}
      <section className={styles.section}>
        <SectionHeader
          icon={ChartBar}
          iconColor="var(--info)"
          title="Ranking de Criticidade"
          sub="Clique nos cabeçalhos para ordenar"
        />
        <div className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Máquina</th>
                  <th>Local</th>
                  <th>Status</th>
                  <th
                    className={`${styles.sortable} ${sortKey === 'alertas' ? styles.sortActive : ''}`}
                    onClick={() => handleSort('alertas')}
                  >
                    Alertas <SortIcon k="alertas" />
                  </th>
                  <th
                    className={`${styles.sortable} ${sortKey === 'avgRpm' ? styles.sortActive : ''}`}
                    onClick={() => handleSort('avgRpm')}
                  >
                    RPM últ. <SortIcon k="avgRpm" />
                  </th>
                  <th
                    className={`${styles.sortable} ${sortKey === 'avgTemperatura' ? styles.sortActive : ''}`}
                    onClick={() => handleSort('avgTemperatura')}
                  >
                    Temp °C <SortIcon k="avgTemperatura" />
                  </th>
                  <th
                    className={`${styles.sortable} ${sortKey === 'avgPotencia' ? styles.sortActive : ''}`}
                    onClick={() => handleSort('avgPotencia')}
                  >
                    Potência <SortIcon k="avgPotencia" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {averagesData.map((m, i) => {
                  const { rpm, temperatura, potencia } = getLatestSensorData(m);
                  const alertCount = m.alertas?.length ?? 0;
                  const isTop = alertCount > 0 && i < 3;
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className={`${styles.rankBadge} ${isTop ? styles.rankBadgeTop : ''}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                        {m.codigo}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {m.local}
                      </td>
                      <td>
                        <StatusPill status={m.status} />
                      </td>
                      <td>
                        <span
                          className={`${styles.alertCountBadge} ${
                            alertCount > 0 ? styles.hasAlerts : styles.noAlerts
                          }`}
                        >
                          {alertCount > 0
                            ? <Warning size={11} weight="bold" />
                            : <CheckCircle size={11} weight="bold" />}
                          {alertCount}
                        </span>
                      </td>
                      <td className={styles.metricCell}>
                        {rpm.toLocaleString('pt-BR')}
                      </td>
                      <td
                        className={`${styles.metricCell} ${
                          temperatura > 75
                            ? styles.metricCellDanger
                            : temperatura > 60
                            ? styles.metricCellWarn
                            : ''
                        }`}
                      >
                        {temperatura}°C
                      </td>
                      <td className={styles.metricCell}>
                        {potencia.toLocaleString('pt-BR')} W
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 5. Médias por Máquina + Sem Comunicação ── */}
      <div className={styles.twoCol}>
        {/* Tabela de médias */}
        <section className={styles.section}>
          <SectionHeader
            icon={Gauge}
            iconColor="var(--accent)"
            title="Médias por Máquina"
            sub="Calculadas sobre todas as leituras"
          />
          <div className={styles.card}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Máquina</th>
                    <th>RPM médio</th>
                    <th>Pot. média</th>
                    <th>Temp. média</th>
                    <th>Leituras</th>
                  </tr>
                </thead>
                <tbody>
                  {averagesData.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '0.8rem' }}>
                        {m.codigo}
                      </td>
                      <td className={styles.metricCell}>
                        {m.avgRpm.toLocaleString('pt-BR')}
                      </td>
                      <td className={styles.metricCell}>
                        {m.avgPotencia.toLocaleString('pt-BR')} W
                      </td>
                      <td
                        className={`${styles.metricCell} ${
                          m.avgTemperatura > 75
                            ? styles.metricCellDanger
                            : m.avgTemperatura > 60
                            ? styles.metricCellWarn
                            : m.avgTemperatura < 40
                            ? styles.metricCellOk
                            : ''
                        }`}
                      >
                        {m.avgTemperatura}°C
                      </td>
                      <td
                        className={styles.metricCell}
                        style={{ color: 'var(--muted)', fontSize: '0.75rem' }}
                      >
                        {m.readings}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Máquinas sem comunicação recente */}
        <section className={styles.section}>
          <SectionHeader
            icon={WifiX}
            iconColor="var(--warning)"
            title="Sem Comunicação Recente"
            sub={`threshold: 60 min · ${noComm.length} máquina${noComm.length !== 1 ? 's' : ''}`}
          />
          <div className={styles.card}>
            {noComm.length === 0 ? (
              <div className={styles.empty}>
                <CheckCircle size={32} weight="bold" color="var(--accent)" />
                <span>Todas as máquinas comunicaram recentemente.</span>
              </div>
            ) : (
              <ul className={styles.noCommList}>
                {noComm.map((m) => (
                  <li key={m.id} className={styles.noCommItem}>
                    <span className={styles.noCommDot} />
                    <span className={styles.noCommName}>{m.codigo}</span>
                    <span className={styles.noCommLocal}>{m.local}</span>
                    <span className={styles.noCommTime}>
                      {formatMinutesAgo(m.minutesAgo)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* ── 6. Status por Local ── */}
      <section className={styles.section}>
        <SectionHeader
          icon={MapPin}
          iconColor="var(--info)"
          title="Histórico de Status por Local"
          sub={`${statusByLocal.length} setor${statusByLocal.length !== 1 ? 'es' : ''}`}
        />
        <div className={styles.card}>
          {statusByLocal.length === 0 ? (
            <div className={styles.empty}>
              <span>Sem dados de localização disponíveis.</span>
            </div>
          ) : (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={statusByLocal}
                  margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                  barSize={32}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="local"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<GenericTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      paddingTop: 12,
                    }}
                  />
                  <Bar
                    dataKey="alerta"
                    name="Em Alerta"
                    stackId="a"
                    fill={STATUS_BAR_COLORS.alerta}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="atencao"
                    name="Em Atenção"
                    stackId="a"
                    fill={STATUS_BAR_COLORS.atencao}
                  />
                  <Bar
                    dataKey="offline"
                    name="Offline"
                    stackId="a"
                    fill={STATUS_BAR_COLORS.offline}
                  />
                  <Bar
                    dataKey="operando"
                    name="Operando"
                    stackId="a"
                    fill={STATUS_BAR_COLORS.operando}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* ── 7. Dispersão RPM × Temperatura ── */}
      <section className={styles.section}>
        <SectionHeader
          icon={ChartDonut}
          iconColor="var(--accent)"
          title="Dispersão RPM × Temperatura"
          sub="Tamanho do ponto proporcional ao número de alertas"
        />
        <div className={styles.card}>
          {scatterData.length === 0 ? (
            <div className={styles.empty}>
              <span>Sem dados de sensores para exibir.</span>
            </div>
          ) : (
            <>
              <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-subtle)"
                    />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="RPM"
                      label={{
                        value: 'RPM',
                        position: 'insideBottom',
                        offset: -4,
                        fill: 'var(--muted)',
                        fontSize: 11,
                      }}
                      tick={{ fill: 'var(--muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Temperatura"
                      label={{
                        value: '°C',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 10,
                        fill: 'var(--muted)',
                        fontSize: 11,
                      }}
                      tick={{ fill: 'var(--muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ZAxis
                      type="number"
                      dataKey="z"
                      range={[50, 300]}
                      name="Alertas"
                    />
                    <RechartsTooltip content={<ScatterTooltip />} />
                    <Scatter
                      name="Máquinas"
                      data={scatterData}
                      fill="var(--accent)"
                      fillOpacity={0.75}
                      stroke="var(--accent)"
                      strokeWidth={1}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className={styles.scatterNote}>
                Pontos maiores indicam mais alertas ativos · Valores da última leitura disponível
              </p>
            </>
          )}
        </div>
      </section>

    </main>
  );
}