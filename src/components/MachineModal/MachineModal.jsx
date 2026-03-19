/**
 * src/components/MachineModal/MachineModal.jsx
 * Modal de detalhes da máquina com 4 abas:
 * Resumo | Histórico | Estatísticas | Alertas & Sensores
 * Inclui gráfico de área (24h/7d/30d) e formulário de edição de metadados.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  getLatestSensorData,
  getStatusClass,
  calcEfficiency,
  formatDateTime,
} from '../../utils/machine';
import styles from './MachineModal.module.css';

/* ── Placeholder de imagem da máquina ─────────────────────────── */
function MachinePlaceholderImage({ name }) {
  return (
    <div className={styles.imagePlaceholder}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="4" y="20" width="56" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
        <rect x="12" y="28" width="12" height="8" rx="2" fill="currentColor" opacity=".3"/>
        <rect x="28" y="26" width="20" height="12" rx="2" fill="currentColor" opacity=".2"/>
        <circle cx="52" cy="16" r="8" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="2"/>
        <path d="M49 16h6M52 13v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="4" y="52" width="16" height="4" rx="1" fill="currentColor" opacity=".2"/>
        <rect x="44" y="52" width="16" height="4" rx="1" fill="currentColor" opacity=".2"/>
      </svg>
      <span>{name}</span>
    </div>
  );
}

/* ── Custom Tooltip do gráfico ─────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
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

/* ── Abas disponíveis ──────────────────────────────────────────── */
const TABS = ['Resumo', 'Histórico', 'Estatísticas', 'Alertas & Sensores'];
const RANGES = ['24h', '7 dias', '30 dias'];

export default function MachineModal({ machine, onClose, onUpdate }) {
  const [activeTab, setActiveTab]   = useState('Resumo');
  const [range, setRange]           = useState('24h');
  const [editMode, setEditMode]     = useState(false);
  const [form, setForm]             = useState({});
  const [saving, setSaving]         = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const overlayRef                  = useRef(null);

  const { rpm, potencia, temperatura } = getLatestSensorData(machine);
  const eff = calcEfficiency(machine);
  const statusCls = getStatusClass(machine.status);

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
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Clique no overlay fecha */
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  /* Prepara dados do gráfico a partir de machine.dados[] */
  const chartData = useCallback(() => {
    const dados = machine?.dados || [];
    if (dados.length === 0) return [];
    const now = Date.now();
    const cutoff =
      range === '24h'    ? now - 86400000 :
      range === '7 dias' ? now - 604800000 : now - 2592000000;

    return dados
      .filter((d) => new Date(d.timestamp).getTime() >= cutoff)
      .map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit',
        }),
        RPM:       d.rpm,
        Potência:  d.potencia,
        'Temp °C': d.temperatura,
      }));
  }, [machine, range]);

  /* Submit do formulário de edição */
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await onUpdate(machine.id, form);
      setSaveStatus('success');
      setEditMode(false);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const data = chartData();

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${machine.codigo}`}
    >
      <div className={styles.modal}>
        {/* ── Header do modal ───────────────────────────────── */}
        <div className={styles.modalHeader}>
          <div className={styles.machineInfo}>
            <MachinePlaceholderImage name={machine.codigo} />
            <div className={styles.machineText}>
              <div className={styles.machineTitle}>
                <h2 className={styles.machineName}>{machine.codigo}</h2>
                <span className={`${styles.badge} ${styles[statusCls.replace('status--', 'badge')]}`}>
                  {machine.status}
                </span>
              </div>
              <div className={styles.machineMeta}>
                <span>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{verticalAlign:'middle',marginRight:4}}>
                    <path d="M8 1a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
                  </svg>
                  {machine.local}
                </span>
                <span>ID #{machine.id}</span>
                <span>Atualizado: {formatDateTime(machine.ultimaAtualizacao)}</span>
              </div>
              {/* KPIs rápidos */}
              <div className={styles.quickKpis}>
                <div className={styles.kpi}>
                  <span className={styles.kpiVal}>{rpm.toLocaleString('pt-BR')}</span>
                  <span className={styles.kpiLbl}>RPM</span>
                </div>
                <div className={styles.kpi}>
                  <span className={styles.kpiVal}>{potencia.toLocaleString('pt-BR')}</span>
                  <span className={styles.kpiLbl}>Watts</span>
                </div>
                <div className={`${styles.kpi} ${temperatura >= 75 ? styles.kpiDanger : temperatura >= 55 ? styles.kpiWarn : ''}`}>
                  <span className={styles.kpiVal}>{temperatura}°C</span>
                  <span className={styles.kpiLbl}>Temp</span>
                </div>
                <div className={styles.kpi}>
                  <span className={styles.kpiVal}>{eff.eficiencia}%</span>
                  <span className={styles.kpiLbl}>Eficiência</span>
                </div>
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Abas ─────────────────────────────────────────── */}
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

        {/* ── Conteúdo das abas ────────────────────────────── */}
        <div className={styles.tabContent}>

          {/* RESUMO */}
          {activeTab === 'Resumo' && (
            <div className={styles.tabPane}>
              <div className={styles.summaryGrid}>
                {/* Eficiência */}
                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Tempo por Estado</h3>
                  <div className={styles.effBar}>
                    <div style={{ flex: eff.operando, background: 'var(--accent)' }} title={`Operando ${eff.operando}%`} />
                    <div style={{ flex: eff.atencao, background: 'var(--warning)' }} title={`Atenção ${eff.atencao}%`} />
                    <div style={{ flex: eff.alerta, background: 'var(--danger)' }} title={`Alerta ${eff.alerta}%`} />
                  </div>
                  <div className={styles.effLegend}>
                    <span><span style={{background:'var(--accent)'}} />Operando {eff.operando}%</span>
                    <span><span style={{background:'var(--warning)'}} />Atenção {eff.atencao}%</span>
                    <span><span style={{background:'var(--danger)'}} />Alerta {eff.alerta}%</span>
                  </div>
                </div>

                {/* Metadados editáveis */}
                <div className={styles.summaryCard}>
                  <div className={styles.editHeader}>
                    <h3 className={styles.summaryTitle}>Informações</h3>
                    {!editMode && (
                      <button className={styles.editBtn} onClick={() => setEditMode(true)}>
                        ✎ Editar
                      </button>
                    )}
                  </div>

                  {!editMode ? (
                    <dl className={styles.metaList}>
                      <dt>Nome</dt><dd>{form.nome || '—'}</dd>
                      <dt>Descrição</dt><dd>{form.descricao || '—'}</dd>
                      <dt>Local</dt><dd>{form.local || '—'}</dd>
                    </dl>
                  ) : (
                    <div className={styles.editForm}>
                      {['nome','descricao','local'].map((field) => (
                        <div key={field} className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                          </label>
                          <input
                            className={styles.formInput}
                            value={form[field]}
                            onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
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
                          Cancelar
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? 'Salvando…' : 'Salvar'}
                        </button>
                      </div>
                      {saveStatus === 'success' && (
                        <div className={styles.alertSuccess}>✓ Atualizado com sucesso!</div>
                      )}
                      {saveStatus === 'error' && (
                        <div className={styles.alertError}>✕ Falha ao atualizar. Tente novamente.</div>
                      )}
                    </div>
                  )}
                  {saveStatus === 'success' && !editMode && (
                    <div className={styles.alertSuccess}>✓ Atualizado com sucesso!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HISTÓRICO */}
          {activeTab === 'Histórico' && (
            <div className={styles.tabPane}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Sensores ao longo do tempo</h3>
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

              {data.length === 0 ? (
                <div className={styles.noData}>
                  Sem dados para o período selecionado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRPM"  x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--accent)"  stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent)"  stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gPow"  x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--info)"    stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--info)"    stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--danger)"  stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--danger)"  stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={false}/>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)', paddingTop: 8 }}
                    />
                    <Area type="monotone" dataKey="RPM"       stroke="var(--accent)" fill="url(#gRPM)" strokeWidth={2} dot={false}/>
                    <Area type="monotone" dataKey="Potência"  stroke="var(--info)"   fill="url(#gPow)" strokeWidth={2} dot={false}/>
                    <Area type="monotone" dataKey="Temp °C"   stroke="var(--danger)" fill="url(#gTemp)" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* ESTATÍSTICAS */}
          {activeTab === 'Estatísticas' && (
            <div className={styles.tabPane}>
              <div className={styles.statsGrid}>
                {[
                  { label: 'Velocidade Média',  val: rpm.toLocaleString('pt-BR'),       unit: 'RPM', color: 'var(--accent)' },
                  { label: 'Potência Média',     val: potencia.toLocaleString('pt-BR'),  unit: 'W',   color: 'var(--info)' },
                  { label: 'Temperatura Média',  val: `${temperatura}`,                  unit: '°C',  color: temperatura >= 75 ? 'var(--danger)' : 'var(--text-bright)' },
                  { label: 'Eficiência Geral',   val: `${eff.eficiencia}`,               unit: '%',   color: 'var(--accent)' },
                  { label: 'Leituras Coletadas', val: (machine.dados?.length || 0).toString(), unit: 'pts', color: 'var(--text-bright)' },
                  { label: 'Alertas Ativos',     val: (machine.alertas?.length || 0).toString(), unit: '',  color: machine.alertas?.length ? 'var(--danger)' : 'var(--accent)' },
                ].map((s) => (
                  <div key={s.label} className={styles.statCard}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <span className={styles.statVal} style={{ color: s.color }}>
                      {s.val}
                      <span className={styles.statUnit}> {s.unit}</span>
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
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 11V7m0 6v2" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>Nenhum alerta ativo para esta máquina.</p>
                </div>
              ) : (
                <div className={styles.alertGrid}>
                  {machine.alertas.map((a) => (
                    <div key={a} className={styles.alertCard}>
                      <span className={styles.alertIcon}>⚠</span>
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

              {/* Última leitura de sensores */}
              <h4 className={styles.sensorsTitle}>Última Leitura de Sensores</h4>
              <div className={styles.sensorGrid}>
                {[
                  { label: 'RPM',         val: rpm.toLocaleString('pt-BR'),        unit: 'RPM', ok: rpm > 0 },
                  { label: 'Potência',    val: potencia.toLocaleString('pt-BR'),   unit: 'W',   ok: potencia > 0 },
                  { label: 'Temperatura', val: `${temperatura}°C`,                 unit: '',    ok: temperatura < 80 },
                ].map((s) => (
                  <div key={s.label} className={styles.sensorRow}>
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

        </div>{/* /tabContent */}
      </div>{/* /modal */}
    </div>
  );
}
