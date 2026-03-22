/**
 * src/components/MachineCard/MachineCard.jsx
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

const TEMP_KEYWORDS  = ['temp', 'temperatura', 'thermal', 'superaquec'];
const POWER_KEYWORDS = ['potência', 'potencia', 'power', 'pico de potência', 'alerta de potência', 'energia'];
const RPM_KEYWORDS   = ['rpm', 'velocidade', 'vibração', 'vibração alta', 'rotação'];

function alertsMatch(alertas = [], keywords) {
  return alertas.some((a) =>
    keywords.some((kw) => a.toLowerCase().includes(kw))
  );
}

export default function MachineCard({ machine, onClick }) {
  const { rpm, potencia, temperatura } = getLatestSensorData(machine);
  const statusClass = getStatusClass(machine.status);
  const alertas = machine.alertas || [];

  const tempClass  = alertsMatch(alertas, TEMP_KEYWORDS)  ? styles.metricDanger : '';
  const powerClass = alertsMatch(alertas, POWER_KEYWORDS) ? styles.metricWarn   : '';
  const rpmClass   = alertsMatch(alertas, RPM_KEYWORDS)   ? styles.metricWarn   : '';

  return (
    <article
      className={`${styles.card} fade-up`}
      onClick={() => onClick(machine)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(machine)}
      aria-label={`Ver detalhes de ${machine.codigo}`}
    >
      {/* Header ── nome (esquerda) + status label+badge (direita) */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={`${styles.statusDot} ${styles[statusClass.replace('status--', 'dot')]}`} />
          <h3 className={styles.name}>{machine.codigo}</h3>
        </div>

        {/* "Status:" acima, badge abaixo — alinhados à direita */}
        <div className={styles.statusGroup}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={`${styles.badge} ${styles[statusClass.replace('status--', 'badge')]}`}>
            {machine.status}
          </span>
        </div>
      </div>

      {/* Local */}
      <div className={styles.location}>
        <MapPin size={12} weight="bold" />
        {machine.local}
      </div>

      {/* Sensor metrics */}
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

      {/* Alertas: label + tags */}
      <div className={styles.alertsSection}>
        <span className={styles.alertsLabel}>Alertas:</span>
        <div className={styles.alerts}>
          {alertas.length === 0 ? (
            <span className={styles.noAlerts}>Nenhum</span>
          ) : (
            alertas.map((a) => (
              <span key={a} className={styles.alertTag}>{a}</span>
            ))
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className={styles.footer}>
        <span>Atualizado: {formatDateTime(machine.ultimaAtualizacao)}</span>
      </div>
    </article>
  );
}