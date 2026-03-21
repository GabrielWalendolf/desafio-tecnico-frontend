/**
 * src/components/MachineCard/MachineCard.jsx
 * Card de máquina individual para o grid do dashboard.
 *
 * Coloração das métricas baseada nos alertas da API:
 *  - Se a máquina tiver um alerta relacionado à temperatura → temp em vermelho
 *  - Se a máquina tiver um alerta relacionado à potência    → potência em amarelo
 *  - Se a máquina tiver um alerta relacionado à velocidade  → RPM em amarelo
 *  - Sem alerta correspondente → valor em cor neutra
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

/* ── Palavras-chave que indicam qual sensor está em alerta ─────── */
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

  /* Decide a classe de cor de cada métrica com base nos alertas da API */
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
        <div className={`${styles.metric} ${rpmClass}`}>
          <span className={styles.metricIcon}>
            <Gauge size={13} weight="bold" />
          </span>
          <span className={styles.metricVal}>{rpm.toLocaleString('pt-BR')}</span>
          <span className={styles.metricUnit}>RPM</span>
        </div>
        <div className={`${styles.metric} ${powerClass}`}>
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

      {/*
        A div de alertas é SEMPRE renderizada (mesmo sem alertas),
        assim todos os cards reservam a mesma altura e o grid fica alinhado.
      */}
      <div className={styles.alerts}>
        {alertas.map((a) => (
          <span key={a} className={styles.alertTag}>{a}</span>
        ))}
      </div>

      {/* Rodapé */}
      <div className={styles.footer}>
        <span>Atualizado: {formatDateTime(machine.ultimaAtualizacao)}</span>
      </div>
    </article>
  );
}