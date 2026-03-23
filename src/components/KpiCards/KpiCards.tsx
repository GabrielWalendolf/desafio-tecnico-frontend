/**
 * src/components/KpiCards/KpiCards.tsx
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  Warning,
  Eye,
  WifiX,
  TrendUp,
  TrendDown,
  Minus,
} from '@phosphor-icons/react';
import { StatusCounts } from '../../types';
import styles from './KpiCards.module.css';

interface CardConfig {
  key: keyof StatusCounts;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  colorVar: string;
  bgVar: string;
  borderVar: string;
}

const CARDS: CardConfig[] = [
  {
    key:       'operando',
    label:     'Operando',
    sublabel:  'Funcionando normalmente',
    Icon:      CheckCircle,
    colorVar:  '--kpi-ok',
    bgVar:     '--kpi-ok-bg',
    borderVar: '--kpi-ok-border',
  },
  {
    key:       'alerta',
    label:     'Em Alerta',
    sublabel:  'Requer atenção imediata',
    Icon:      Warning,
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
    Icon:      WifiX,
    colorVar:  '--kpi-off',
    bgVar:     '--kpi-off-bg',
    borderVar: '--kpi-off-border',
  },
];

interface TrendProps {
  current: number;
  previous: number | null | undefined;
}

function Trend({ current, previous }: TrendProps): React.ReactElement | null {
  if (previous === null || previous === undefined) return null;

  const diff = current - previous;

  if (diff === 0) {
    return (
      <span className={`${styles.trend} ${styles.trendNeutral}`}>
        <Minus size={11} weight="bold" />
        <span>Estável</span>
      </span>
    );
  }

  const isUp = diff > 0;
  return (
    <span className={`${styles.trend} ${isUp ? styles.trendUp : styles.trendDown}`}>
      {isUp
        ? <TrendUp  size={11} weight="bold" />
        : <TrendDown size={11} weight="bold" />}
      <span>{isUp ? '+' : ''}{diff}</span>
    </span>
  );
}

interface KpiCardProps {
  config: CardConfig;
  value: number;
  total: number;
  previousValue: number | undefined;
  index: number;
  isActive: boolean;
  isAnyActive: boolean;
  onClick: (key: keyof StatusCounts) => void;
}

function KpiCard({
  config,
  value,
  total,
  previousValue,
  index,
  isActive,
  isAnyActive,
  onClick,
}: KpiCardProps): React.ReactElement {
  const { label, sublabel, Icon, colorVar, bgVar, borderVar } = config;
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  const [displayed, setDisplayed] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const end       = value;
    const duration  = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(end * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  const styleVars = {
    '--color':    `var(${colorVar})`,
    '--bg':       `var(${bgVar})`,
    '--border-c': `var(${borderVar})`,
    animationDelay: `${index * 80}ms`,
  } as React.CSSProperties;

  return (
    <article
      className={`
        ${styles.card}
        ${isActive ? styles.cardActive : ''}
        ${isAnyActive && !isActive ? styles.cardDimmed : ''}
      `}
      style={styleVars}
      onClick={() => onClick(config.key)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(config.key)}
      aria-pressed={isActive}
      aria-label={`Filtrar por ${label}`}
      title={isActive ? `Clique para remover o filtro de ${label}` : `Clique para filtrar por ${label}`}
    >
      <div className={styles.accentBar} />

      {isActive && (
        <div className={styles.activeIndicator}>
          <span>Filtrado</span>
        </div>
      )}

      <div className={styles.top}>
        <div className={styles.leftGroup}>
          <div className={styles.iconWrap}>
            <Icon size={18} weight="bold" />
          </div>
          <span className={styles.pct}>{pct}%</span>
        </div>
        <Trend current={value} previous={previousValue} />
      </div>

      <div className={styles.valueCenter}>
        <span className={styles.value}>{displayed}</span>
      </div>

      <div className={styles.labels}>
        <span className={styles.label}>{label}</span>
        <span className={styles.sublabel}>{sublabel}</span>
      </div>

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

interface KpiCardsProps {
  counts: StatusCounts;
  total: number;
  previousCounts: StatusCounts | null;
  activeFilter: keyof StatusCounts | null;
  onCardClick: (key: keyof StatusCounts) => void;
}

export default function KpiCards({
  counts,
  total,
  previousCounts,
  activeFilter,
  onCardClick,
}: KpiCardsProps): React.ReactElement {
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
          isActive={activeFilter === card.key}
          isAnyActive={activeFilter !== null && activeFilter !== undefined}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
