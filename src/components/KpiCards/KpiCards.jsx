/**
 * src/components/KpiCards/KpiCards.jsx
 *
 * 4 cards KPI em linha:
 *  - Ícone Lucide temático por status
 *  - Valor absoluto + porcentagem do total
 *  - Barra de progresso proporcional
 *  - Mini tendência (↑ ↓ →) comparando com snapshot anterior
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Eye,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import styles from './KpiCards.module.css';

/* ── Configuração de cada card ─────────────────────────────────── */
const CARDS = [
  {
    key:       'operando',
    label:     'Operando',
    sublabel:  'Funcionando normalmente',
    Icon:      CheckCircle2,
    colorVar:  '--kpi-ok',
    bgVar:     '--kpi-ok-bg',
    borderVar: '--kpi-ok-border',
  },
  {
    key:       'alerta',
    label:     'Em Alerta',
    sublabel:  'Requer atenção imediata',
    Icon:      AlertTriangle,
    colorVar:  '--kpi-danger',
    bgVar:     '--kpi-danger-bg',
    borderVar: '--kpi-danger-border',
  },
  {
    key:       'atencao',
    label:     'Em Atenção',
    sublabel:  'Monitoramento necessário',
    Icon:      Eye,
    colorVar:  '--kpi-warn',
    bgVar:     '--kpi-warn-bg',
    borderVar: '--kpi-warn-border',
  },
  {
    key:       'offline',
    label:     'Offline',
    sublabel:  'Sem comunicação',
    Icon:      WifiOff,
    colorVar:  '--kpi-off',
    bgVar:     '--kpi-off-bg',
    borderVar: '--kpi-off-border',
  },
];

/* ── Componente de tendência ───────────────────────────────────── */
function Trend({ current, previous }) {
  if (previous === null || previous === undefined) return null;

  const diff = current - previous;

  if (diff === 0) {
    return (
      <span className={`${styles.trend} ${styles.trendNeutral}`}>
        <Minus size={11} strokeWidth={2.5} />
        <span>Estável</span>
      </span>
    );
  }

  const isUp = diff > 0;
  return (
    <span className={`${styles.trend} ${isUp ? styles.trendUp : styles.trendDown}`}>
      {isUp
        ? <TrendingUp  size={11} strokeWidth={2.5} />
        : <TrendingDown size={11} strokeWidth={2.5} />}
      <span>{isUp ? '+' : ''}{diff} vs anterior</span>
    </span>
  );
}

/* ── Card individual ───────────────────────────────────────────── */
function KpiCard({ config, value, total, previousValue, index }) {
  const { label, sublabel, Icon, colorVar, bgVar, borderVar } = config;
  const pct     = total > 0 ? Math.round((value / total) * 100) : 0;

  /* Anima o número de 0 até o valor real */
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start     = 0;
    const end       = value;
    const duration  = 600;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <article
      className={styles.card}
      style={{
        '--color':  `var(${colorVar})`,
        '--bg':     `var(${bgVar})`,
        '--border-c': `var(${borderVar})`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Barra de acento lateral */}
      <div className={styles.accentBar} />

      {/* Linha superior: ícone + tendência */}
      <div className={styles.top}>
        <div className={styles.iconWrap}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <Trend current={value} previous={previousValue} />
      </div>

      {/* Valor principal */}
      <div className={styles.valueRow}>
        <span className={styles.value}>{displayed}</span>
        <span className={styles.pct}>{pct}%</span>
      </div>

      {/* Label + sublabel */}
      <div className={styles.labels}>
        <span className={styles.label}>{label}</span>
        <span className={styles.sublabel}>{sublabel}</span>
      </div>

      {/* Barra de progresso */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </article>
  );
}

/* ── Export principal ──────────────────────────────────────────── */
export default function KpiCards({ counts, total, previousCounts }) {
  return (
    <div className={styles.grid}>
      {CARDS.map((card, i) => (
        <KpiCard
          key={card.key}
          config={card}
          value={counts[card.key] ?? 0}
          total={total}
          previousValue={previousCounts?.[card.key]}
          index={i}
        />
      ))}
    </div>
  );
}