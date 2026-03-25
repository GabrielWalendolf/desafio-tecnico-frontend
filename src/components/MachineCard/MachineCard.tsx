/**
 * src/components/MachineCard/MachineCard.tsx
 */
import React from 'react';
import {
  Gauge,
  Lightning,
  Thermometer,
  MapPin,
} from '@phosphor-icons/react';
import { getStatusClass, getLatestSensorData, formatDateTime } from '../../utils/machine';
import { getStatusCategory } from '../../constants/statusMap';
import { getAlertColor } from '../../constants/alertColors';
import { Machine } from '../../types';
import styles from './MachineCard.module.css';

const TEMP_KEYWORDS  = ['temp', 'temperatura', 'thermal', 'superaquec'];
const POWER_KEYWORDS = ['potência', 'potencia', 'power', 'pico de potência', 'alerta de potência', 'energia'];
const RPM_KEYWORDS   = ['rpm', 'velocidade', 'vibração', 'vibração alta', 'rotação'];

function alertsMatch(alertas: string[], keywords: string[]): boolean {
  return alertas.some((a) =>
    keywords.some((kw) => a.toLowerCase().includes(kw))
  );
}

const STATUS_HOVER_COLOR: Record<string, string> = {
  operando: 'var(--kpi-ok)',
  alerta:   'var(--kpi-danger)',
  atencao:  'var(--kpi-warn)',
  offline:  'var(--kpi-off)',
};

/** Estilo inline das badges de status — mesmo padrão das badges de alerta */
const STATUS_BADGE_CONFIG: Record<string, { color: string; bg: string; borderTop: string }> = {
  operando: {
    color:     '#3fb950',
    bg:        'rgba(63,185,80,0.12)',
    borderTop: 'rgba(63,185,80,0.22)',
  },
  alerta: {
    color:     '#f85149',
    bg:        'rgba(248,81,73,0.12)',
    borderTop: 'rgba(248,81,73,0.22)',
  },
  atencao: {
    color:     '#d29922',
    bg:        'rgba(210,153,34,0.12)',
    borderTop: 'rgba(210,153,34,0.22)',
  },
  offline: {
    color:     '#768390',
    bg:        'rgba(118,131,144,0.12)',
    borderTop: 'rgba(118,131,144,0.22)',
  },
};

interface MachineCardProps {
  machine: Machine;
  onClick: (machine: Machine) => void;
}

export default function MachineCard({ machine, onClick }: MachineCardProps): React.ReactElement {
  const { rpm, potencia, temperatura } = getLatestSensorData(machine);
  const statusClass = getStatusClass(machine.status);
  const alertas     = machine.alertas || [];

  const tempClass  = alertsMatch(alertas, TEMP_KEYWORDS)  ? styles.metricDanger : '';
  const powerClass = alertsMatch(alertas, POWER_KEYWORDS) ? styles.metricWarn   : '';
  const rpmClass   = alertsMatch(alertas, RPM_KEYWORDS)   ? styles.metricWarn   : '';

  const category   = getStatusCategory(machine.status);
  const hoverColor = STATUS_HOVER_COLOR[category] ?? 'var(--accent)';

  const badgeCfg = STATUS_BADGE_CONFIG[category] ?? STATUS_BADGE_CONFIG.offline;

  return (
    <article
      className={`${styles.card} fade-up`}
      style={{ '--hover-color': hoverColor } as React.CSSProperties}
      onClick={() => onClick(machine)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(machine)}
      aria-label={`Ver detalhes de ${machine.codigo}`}
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={`${styles.statusDot} ${styles[statusClass.replace('status--', 'dot') as keyof typeof styles]}`} />
          <h3 className={styles.name}>{machine.codigo}</h3>
        </div>
        <div className={styles.location}>
          <MapPin size={12} weight="bold" />
          {machine.local}
        </div>
      </div>

      <div className={styles.statusRow}>
        <span className={styles.statusLabel}>Status:</span>
        <span
          className={styles.badge}
          style={{
            color:      badgeCfg.color,
            background: badgeCfg.bg,
            border:     'none',
            borderTop:  `1px solid ${badgeCfg.borderTop}`,
          }}
        >
          {machine.status}
        </span>
      </div>

      <div className={styles.metrics}>
        <div className={`${styles.metric} ${rpmClass}`}>
          <span className={styles.metricIcon}><Gauge size={13} weight="bold" /></span>
          <span className={styles.metricVal}>{rpm.toLocaleString('pt-BR')}</span>
          <span className={styles.metricUnit}>RPM</span>
        </div>
        <div className={`${styles.metric} ${powerClass}`}>
          <span className={styles.metricIcon}><Lightning size={13} weight="bold" /></span>
          <span className={styles.metricVal}>{potencia.toLocaleString('pt-BR')}</span>
          <span className={styles.metricUnit}>W</span>
        </div>
        <div className={`${styles.metric} ${tempClass}`}>
          <span className={styles.metricIcon}><Thermometer size={13} weight="bold" /></span>
          <span className={styles.metricVal}>{temperatura}</span>
          <span className={styles.metricUnit}>°C</span>
        </div>
      </div>

      <div className={styles.alertsSection}>
        <span className={styles.alertsLabel}>Alertas:</span>
        <div className={styles.alerts}>
          {alertas.length === 0 ? (
            <span className={styles.noAlerts}>Nenhum</span>
          ) : (
            alertas.map((a) => {
              const cfg = getAlertColor(a);
              return (
                <span
                  key={a}
                  className={styles.alertTag}
                  style={{
                    color:          cfg.color,
                    background:     cfg.bg,
                    border:         'none',
                    borderTop:      `1px solid ${cfg.borderTop}`,
                  }}
                >
                  {a}
                </span>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <span>Atualizado: {formatDateTime(machine.ultimaAtualizacao)}</span>
      </div>
    </article>
  );
}