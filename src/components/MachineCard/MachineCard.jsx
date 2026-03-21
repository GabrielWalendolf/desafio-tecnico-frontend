/**
 * src/components/MachineCard/MachineCard.jsx
 * Card de máquina individual para o grid do dashboard.
 * Usa Phosphor Icons (bold) para todos os ícones visuais.
 */
import React from 'react';
import {
  Gauge,
  Lightning,
  Thermometer,
  MapPin,
} from '@phosphor-icons/react';
import { getStatusClass, getLatestSensorData, formatDateTime } from '../../utils/machine';
import styles from './MachineCard.module.css';

export default function MachineCard({ machine, onClick }) {
  const { rpm, potencia, temperatura } = getLatestSensorData(machine);
  const statusClass = getStatusClass(machine.status);

  const tempClass =
    temperatura >= 80 ? styles.tempDanger :
    temperatura >= 60 ? styles.tempWarn   : styles.tempOk;

  return (
    <article
      className={`${styles.card} fade-up`}
      onClick={() => onClick(machine)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(machine)}
      aria-label={`Ver detalhes de ${machine.codigo}`}
    >
      {/* Header ── nome + badge status */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={`${styles.statusDot} ${styles[statusClass.replace('status--', 'dot')]}`} />
          <h3 className={styles.name}>{machine.codigo}</h3>
        </div>
        <span className={`${styles.badge} ${styles[statusClass.replace('status--', 'badge')]}`}>
          {machine.status}
        </span>
      </div>

      {/* Local */}
      <div className={styles.location}>
        <MapPin size={12} weight="bold" />
        {machine.local}
      </div>

      {/* Sensor metrics */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricIcon}>
            <Gauge size={13} weight="bold" />
          </span>
          <span className={styles.metricVal}>{rpm.toLocaleString('pt-BR')}</span>
          <span className={styles.metricUnit}>RPM</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricIcon}>
            <Lightning size={13} weight="bold" />
          </span>
          <span className={styles.metricVal}>{potencia.toLocaleString('pt-BR')}</span>
          <span className={styles.metricUnit}>W</span>
        </div>
        <div className={`${styles.metric} ${tempClass}`}>
          <span className={styles.metricIcon}>
            <Thermometer size={13} weight="bold" />
          </span>
          <span className={styles.metricVal}>{temperatura}</span>
          <span className={styles.metricUnit}>°C</span>
        </div>
      </div>

      {/* Alertas */}
      {machine.alertas?.length > 0 && (
        <div className={styles.alerts}>
          {machine.alertas.map((a) => (
            <span key={a} className={styles.alertTag}>{a}</span>
          ))}
        </div>
      )}

      {/* Rodapé */}
      <div className={styles.footer}>
        <span>Atualizado: {formatDateTime(machine.ultimaAtualizacao)}</span>
      </div>
    </article>
  );
}