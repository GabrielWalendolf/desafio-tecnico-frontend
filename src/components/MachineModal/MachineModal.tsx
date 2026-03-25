/**
 * src/components/MachineModal/MachineModal.tsx
 * Modal de detalhes da máquina com 4 abas:
 * Resumo | Histórico | Estatísticas | Alertas & Sensores
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  X, MapPin, IdentificationCard, Clock, Gauge,
  Lightning, Thermometer, CheckCircle, Warning,
  Robot, PencilSimple, FloppyDisk, ArrowCounterClockwise,
} from '@phosphor-icons/react';
import {
  getLatestSensorData,
  getStatusClass,
  calcEfficiency,
  formatDateTime,
} from '../../utils/machine';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { Machine, UpdateMachinePayload, ConfirmField } from '../../types';
import styles from './MachineModal.module.css';

/* ── Keywords (mesma lógica do MachineCard) ── */
const TEMP_KEYWORDS  = ['temp', 'temperatura', 'thermal', 'superaquec'];
const POWER_KEYWORDS = ['potência', 'potencia', 'power', 'pico de potência', 'alerta de potência', 'energia'];
const RPM_KEYWORDS   = ['rpm', 'velocidade', 'vibração', 'vibração alta', 'rotação'];

function alertsMatch(alertas: string[], keywords: string[]): boolean {
  return alertas.some((a) =>
    keywords.some((kw) => a.toLowerCase().includes(kw))
  );
}

/* ── Placeholder de imagem ── */
function MachinePlaceholderImage({ name }: { name: string }): React.ReactElement {
  return (
    <div className={styles.imagePlaceholder}>
      <Robot size={48} weight="bold" />
      <span>{name}</span>
    </div>
  );
}

/* ── Custom Tooltip do gráfico ── */
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.chartTooltipRow}>
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className={styles.chartTooltipVal}>
            {p.value?.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
}

type TabLabel    = 'Resumo' | 'Histórico' | 'Estatísticas' | 'Alertas & Sensores';
type RangeLabel  = '24h' | '7 dias' | '30 dias';
/** Série selecionada para exibição isolada no gráfico */
type SerieLabel  = 'RPM' | 'Potência' | 'Temp °C';
type SaveStatus  = 'success' | 'error' | null;

const TABS:   TabLabel[]   = ['Resumo', 'Histórico', 'Estatísticas', 'Alertas & Sensores'];
const RANGES: RangeLabel[] = ['24h', '7 dias', '30 dias'];
const SERIES: SerieLabel[] = ['RPM', 'Potência', 'Temp °C'];

/* Cor e gradiente de cada série */
const SERIE_CONFIG: Record<SerieLabel, { stroke: string; fill: string; gradientId: string }> = {
  'RPM':      { stroke: 'var(--accent)', fill: 'url(#gRPM)',  gradientId: 'gRPM'  },
  'Potência': { stroke: 'var(--info)',   fill: 'url(#gPow)',  gradientId: 'gPow'  },
  'Temp °C':  { stroke: 'var(--danger)', fill: 'url(#gTemp)', gradientId: 'gTemp' },
};

/* Título dinâmico exibido acima do gráfico */
const SERIE_TITLE: Record<SerieLabel, string> = {
  'RPM':      'RPM ao longo do tempo',
  'Potência': 'Potência (W) ao longo do tempo',
  'Temp °C':  'Temperatura (°C) ao longo do tempo',
};

const FIELD_LABELS: Record<string, string> = {
  nome:      'Nome',
  descricao: 'Descrição',
  local:     'Local',
};

interface EditForm {
  nome: string;
  descricao: string;
  local: string;
}

interface ChartDataPoint {
  /** Rótulo exibido no eixo X: "dd/MM HH:mm" */
  time: string;
  /** Timestamp numérico usado para ordenação */
  ts: number;
  RPM: number;
  Potência: number;
  'Temp °C': number;
}

interface MachineModalProps {
  machine: Machine;
  onClose: () => void;
  onUpdate: (id: number | string, payload: UpdateMachinePayload) => Promise<unknown>;
}

export default function MachineModal({
  machine,
  onClose,
  onUpdate,
}: MachineModalProps): React.ReactElement {
  const [activeTab, setActiveTab]     = useState<TabLabel>('Resumo');
  const [range, setRange]             = useState<RangeLabel>('24h');
  /** Série atualmente selecionada para exibição individual */
  const [activeSerie, setActiveSerie] = useState<SerieLabel>('RPM');
  const [editMode, setEditMode]       = useState<boolean>(false);
  const [form, setForm]               = useState<EditForm>({ nome: '', descricao: '', local: '' });
  const [saving, setSaving]           = useState<boolean>(false);
  const [saveStatus, setSaveStatus]   = useState<SaveStatus>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const overlayRef                    = useRef<HTMLDivElement>(null);

  const { rpm, potencia, temperatura } = getLatestSensorData(machine);
  const eff       = calcEfficiency(machine);
  const statusCls = getStatusClass(machine.status);

  const alertas       = machine.alertas || [];
  const hasTempAlert  = alertsMatch(alertas, TEMP_KEYWORDS);
  const hasPowerAlert = alertsMatch(alertas, POWER_KEYWORDS);
  const hasRpmAlert   = alertsMatch(alertas, RPM_KEYWORDS);

  /* Inicializa form */
  useEffect(() => {
    setForm({
      nome:      machine.nome      || machine.codigo || '',
      descricao: machine.descricao || '',
      local:     machine.local     || '',
    });
    setSaveStatus(null);
    setEditMode(false);
    setActiveTab('Resumo');
  }, [machine]);

  /* Fecha com ESC */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showConfirm) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, showConfirm]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current && !showConfirm) onClose();
  };

  /**
   * Prepara os pontos do gráfico.
   * - Filtra pelo intervalo selecionado
   * - Ordena do mais antigo ao mais recente (esquerda → direita)
   * - Formata o rótulo do eixo X como "dd/MM HH:mm" para incluir a data completa
   */
  const chartData = useCallback((): ChartDataPoint[] => {
    const dados = machine?.dados || [];
    if (dados.length === 0) return [];

    const now = Date.now();
    const cutoff =
      range === '24h'    ? now - 86_400_000 :
      range === '7 dias' ? now - 604_800_000 :
                           now - 2_592_000_000;

    return dados
      .filter((d) => new Date(d.timestamp).getTime() >= cutoff)
      /* Ordena do registro mais antigo para o mais recente */
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((d) => {
        const date = new Date(d.timestamp);
        /* Formata como "HH:mm" — os dados são do mesmo dia */
        const label = date.toLocaleTimeString('pt-BR', {
          hour:   '2-digit',
          minute: '2-digit',
        });
        return {
          time:      label,
          ts:        date.getTime(),
          RPM:       d.rpm,
          Potência:  d.potencia,
          'Temp °C': d.temperatura,
        };
      });
  }, [machine, range]);

  const handleSaveRequest = () => setShowConfirm(true);

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSaving(true);
    setSaveStatus(null);
    try {
      await onUpdate(machine.id, form);
      setSaveStatus('success');
      setEditMode(false);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConfirm = () => setShowConfirm(false);

  const confirmFields: ConfirmField[] = Object.entries(form).map(([key, value]) => ({
    label: FIELD_LABELS[key] ?? key,
    value,
  }));

  const data = chartData();
  const serieConfig = SERIE_CONFIG[activeSerie];

  return (
    <>
      <div
        className={styles.overlay}
        ref={overlayRef}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${machine.codigo}`}
      >
        <div className={styles.modal}>

          {/* ── Header ── */}
          <div className={styles.modalHeader}>
            <div className={styles.machineInfo}>
              <MachinePlaceholderImage name={machine.codigo} />
              <div className={styles.machineText}>
                <div className={styles.machineTitle}>
                  <h2 className={styles.machineName}>{machine.codigo}</h2>
                  <div className={styles.statusWithLabel}>
                    <span className={styles.statusInlineLabel}>Status:</span>
                    <span className={`${styles.badge} ${styles[statusCls.replace('status--', 'badge') as keyof typeof styles]}`}>
                      {machine.status}
                    </span>
                  </div>
                </div>
                <div className={styles.machineMeta}>
                  <span>
                    <MapPin size={11} weight="bold" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {machine.local}
                  </span>
                  <span>
                    <IdentificationCard size={11} weight="bold" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    ID #{machine.id}
                  </span>
                  <span>
                    <Clock size={11} weight="bold" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {formatDateTime(machine.ultimaAtualizacao)}
                  </span>
                </div>

                <div className={styles.quickKpis}>
                  <div className={`${styles.kpi} ${hasRpmAlert ? styles.kpiDanger : ''}`}>
                    <span className={styles.kpiInlineLabel}>
                      <Gauge size={11} weight="bold" /> RPM
                    </span>
                    <span className={styles.kpiVal}>{rpm.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className={`${styles.kpi} ${hasPowerAlert ? styles.kpiWarn : ''}`}>
                    <span className={styles.kpiInlineLabel}>
                      <Lightning size={11} weight="bold" /> Watts
                    </span>
                    <span className={styles.kpiVal}>{potencia.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className={`${styles.kpi} ${hasTempAlert ? styles.kpiDanger : ''}`}>
                    <span className={styles.kpiInlineLabel}>
                      <Thermometer size={11} weight="bold" /> Temp
                    </span>
                    <span className={styles.kpiVal}>{temperatura}°C</span>
                  </div>
                </div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* ── Abas ── */}
          <div className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t}
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Conteúdo ── */}
          <div className={styles.tabContent}>

            {/* RESUMO */}
            {activeTab === 'Resumo' && (
              <div className={styles.tabPane}>
                <div className={styles.summaryGrid}>
                  {/* Eficiência */}
                  <div className={styles.summaryCard}>
                    <h3 className={styles.summaryTitle}>Tempo por Estado</h3>
                    <div className={styles.effBar}>
                      <div style={{ flex: eff.operando, background: 'var(--accent)' }}   title={`Operando ${eff.operando}%`} />
                      <div style={{ flex: eff.atencao,  background: 'var(--warning)' }}  title={`Atenção ${eff.atencao}%`} />
                      <div style={{ flex: eff.alerta,   background: 'var(--danger)' }}   title={`Alerta ${eff.alerta}%`} />
                    </div>
                    <div className={styles.effLegend}>
                      <span><span style={{ background: 'var(--accent)' }} />Operando {eff.operando}%</span>
                      <span><span style={{ background: 'var(--warning)' }} />Atenção {eff.atencao}%</span>
                      <span><span style={{ background: 'var(--danger)' }} />Alerta {eff.alerta}%</span>
                    </div>
                  </div>

                  {/* Metadados editáveis */}
                  <div className={styles.summaryCard}>
                    <div className={styles.editHeader}>
                      <h3 className={styles.summaryTitle}>Informações</h3>
                      {!editMode && (
                        <button className={styles.editBtn} onClick={() => setEditMode(true)}>
                          <PencilSimple size={12} weight="bold" />
                          Editar
                        </button>
                      )}
                    </div>

                    {!editMode ? (
                      <dl className={styles.metaList}>
                        <dt>Nome</dt>      <dd>{form.nome      || '—'}</dd>
                        <dt>Descrição</dt> <dd>{form.descricao || '—'}</dd>
                        <dt>Local</dt>     <dd>{form.local     || '—'}</dd>
                      </dl>
                    ) : (
                      <div className={styles.editForm}>
                        {(['nome', 'descricao', 'local'] as const).map((field) => (
                          <div key={field} className={styles.formGroup}>
                            <label className={styles.formLabel}>{FIELD_LABELS[field]}</label>
                            <input
                              className={styles.formInput}
                              value={form[field]}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, [field]: e.target.value }))
                              }
                              disabled={saving}
                            />
                          </div>
                        ))}

                        <div className={styles.formActions}>
                          <button
                            className={styles.cancelBtn}
                            onClick={() => { setEditMode(false); setSaveStatus(null); }}
                            disabled={saving}
                          >
                            <ArrowCounterClockwise size={13} weight="bold" />
                            Cancelar
                          </button>
                          <button
                            className={styles.saveBtn}
                            onClick={handleSaveRequest}
                            disabled={saving}
                          >
                            <FloppyDisk size={13} weight="bold" />
                            {saving ? 'Salvando…' : 'Salvar'}
                          </button>
                        </div>

                        {saveStatus === 'error' && (
                          <div className={styles.alertError}>
                            <Warning size={13} weight="bold" /> Falha ao atualizar. Tente novamente.
                          </div>
                        )}
                      </div>
                    )}

                    {saveStatus === 'success' && !editMode && (
                      <div className={styles.alertSuccess}>
                        <CheckCircle size={13} weight="bold" /> Atualizado com sucesso!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HISTÓRICO */}
            {activeTab === 'Histórico' && (
              <div className={styles.tabPane}>
                <div className={styles.chartHeader}>
                  {/* Título dinâmico baseado na série selecionada */}
                  <h3 className={styles.chartTitle}>
                    {SERIE_TITLE[activeSerie]}
                  </h3>

                  {/* Controles: seletor de série + seletor de intervalo */}
                  <div className={styles.chartControls}>
                    {/* Botões de série */}
                    <div className={styles.serieSelector}>
                      {SERIES.map((s) => (
                        <button
                          key={s}
                          className={`${styles.serieBtn} ${activeSerie === s ? styles.serieBtnActive : ''}`}
                          style={
                            activeSerie === s
                              ? ({
                                  '--serie-color': SERIE_CONFIG[s].stroke,
                                  '--serie-color-dim': `color-mix(in srgb, ${SERIE_CONFIG[s].stroke} 15%, transparent)`,
                                } as React.CSSProperties)
                              : undefined
                          }
                          onClick={() => setActiveSerie(s)}
                          aria-pressed={activeSerie === s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Divisor visual */}
                    <span className={styles.controlsDivider} />

                    {/* Botões de intervalo */}
                    <div className={styles.rangeSelector}>
                      {RANGES.map((r) => (
                        <button
                          key={r}
                          className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ''}`}
                          onClick={() => setRange(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {data.length === 0 ? (
                  <div className={styles.noData}>Sem dados para o período selecionado.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gRPM"  x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gPow"  x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--info)"   stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--info)"   stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--danger)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: 'var(--muted)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        /**
                         * Distribui uniformemente até MAX_TICKS labels no eixo X.
                         * interval=0 mostra todos; interval=N pula N pontos entre cada tick.
                         * Math.max(0, ...) garante que nunca seja negativo com poucos pontos.
                         */
                        interval={Math.max(0, Math.floor(data.length / 6) - 1)}
                      />
                      <YAxis
                        tick={{ fill: 'var(--muted)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)', paddingTop: 8 }}
                      />
                      {/* Renderiza apenas a série selecionada */}
                      <Area
                        type="monotone"
                        dataKey={activeSerie}
                        stroke={serieConfig.stroke}
                        fill={serieConfig.fill}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* ESTATÍSTICAS */}
            {activeTab === 'Estatísticas' && (
              <div className={styles.tabPane}>
                <h3 className={styles.statsSectionTitle}>Média de Métricas</h3>
                <div className={styles.statsGrid}>
                  {[
                    {
                      label: 'Velocidade Média',
                      val:   rpm.toLocaleString('pt-BR'),
                      unit:  'RPM',
                      color: hasRpmAlert ? 'var(--danger)' : 'var(--text-bright)',
                    },
                    {
                      label: 'Potência Média',
                      val:   potencia.toLocaleString('pt-BR'),
                      unit:  'W',
                      color: hasPowerAlert ? 'var(--warning)' : 'var(--info)',
                    },
                    {
                      label: 'Temperatura Média',
                      val:   `${temperatura}`,
                      unit:  '°C',
                      color: hasTempAlert ? 'var(--danger)' : 'var(--text-bright)',
                    },
                    {
                      label: 'Eficiência Geral',
                      val:   `${eff.eficiencia}`,
                      unit:  '%',
                      color: 'var(--accent)',
                    },
                    {
                      label: 'Leituras Coletadas',
                      val:   (machine.dados?.length || 0).toString(),
                      unit:  'pts',
                      color: 'var(--text-bright)',
                    },
                    {
                      label: 'Alertas Ativos',
                      val:   (machine.alertas?.length || 0).toString(),
                      unit:  '',
                      color: machine.alertas?.length ? 'var(--danger)' : 'var(--accent)',
                    },
                  ].map((s) => (
                    <div key={s.label} className={styles.statCard}>
                      <span className={styles.statLabel}>{s.label}</span>
                      <span className={styles.statVal} style={{ color: s.color }}>
                        {s.val}<span className={styles.statUnit}> {s.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ALERTAS & SENSORES */}
            {activeTab === 'Alertas & Sensores' && (
              <div className={styles.tabPane}>
                {machine.alertas?.length === 0 ? (
                  <div className={styles.noAlerts}>
                    <CheckCircle size={40} weight="bold" color="var(--accent)" />
                    <p>Nenhum alerta ativo para esta máquina.</p>
                  </div>
                ) : (
                  <div className={styles.alertGrid}>
                    {machine.alertas.map((a) => (
                      <div key={a} className={styles.alertCard}>
                        <span className={styles.alertIcon}><Warning size={18} weight="bold" /></span>
                        <div>
                          <p className={styles.alertTitle}>{a}</p>
                          <p className={styles.alertDesc}>
                            Detecção: {formatDateTime(machine.ultimaAtualizacao)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h4 className={styles.sensorsTitle}>Última Leitura de Sensores</h4>
                <div className={styles.sensorGrid}>
                  {[
                    { label: 'RPM',        icon: Gauge,       val: rpm.toLocaleString('pt-BR'), unit: 'RPM', ok: !hasRpmAlert },
                    { label: 'Potência',   icon: Lightning,   val: potencia.toLocaleString('pt-BR'), unit: 'W', ok: !hasPowerAlert },
                    { label: 'Temperatura', icon: Thermometer, val: `${temperatura}°C`, unit: '', ok: !hasTempAlert },
                  ].map((s) => (
                    <div key={s.label} className={styles.sensorRow}>
                      <span className={styles.sensorIcon}><s.icon size={15} weight="bold" /></span>
                      <span className={styles.sensorLabel}>{s.label}</span>
                      <span className={`${styles.sensorVal} ${!s.ok ? styles.sensorDanger : ''}`}>
                        {s.val} {s.unit}
                      </span>
                      <span className={`${styles.sensorStatus} ${s.ok ? styles.sensorOk : styles.sensorBad}`}>
                        {s.ok ? 'OK' : 'ALERTA'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          fields={confirmFields}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}
    </>
  );
}