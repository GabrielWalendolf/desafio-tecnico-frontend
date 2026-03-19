/**
 * src/components/MachineCard/MachineCard.jsx
 * Card de máquina individual para o grid do dashboard.
 * Exibe nome, local, status colorido, RPM, potência e temperatura.
 */
import React from 'react';
import { getStatusClass, getLatestSensorData, formatDateTime } from '../../utils/machine';
import styles from './MachineCard.module.css';

/* Ícones SVG simples inline para leveza */
function IconRPM() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 8L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  );
}
function IconPower() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v5M5.3 4.1A5 5 0 1 0 10.7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconTemp() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 9V4a1 1 0 0 0-2 0v5a3 3 0 1 0 2 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

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
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path d="M8 1a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
        </svg>
        {machine.local}
      </div>

      {/* Sensor metrics */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricIcon}><IconRPM /></span>
          <span className={styles.metricVal}>{rpm.toLocaleString('pt-BR')}</span>
          <span className={styles.metricUnit}>RPM</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricIcon}><IconPower /></span>
          <span className={styles.metricVal}>{potencia.toLocaleString('pt-BR')}</span>
          <span className={styles.metricUnit}>W</span>
        </div>
        <div className={`${styles.metric} ${tempClass}`}>
          <span className={styles.metricIcon}><IconTemp /></span>
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
