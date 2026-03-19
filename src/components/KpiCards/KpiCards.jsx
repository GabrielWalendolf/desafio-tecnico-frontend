/**
 * src/components/KpiCards/KpiCards.jsx
 * Quatro cards de resumo no topo do dashboard:
 * Operando | Em Alerta | Em Atenção | Offline
 */
import React from 'react';
import styles from './KpiCards.module.css';

const CARDS = [
  {
    key:   'operando',
    label: 'Operando',
    icon:  '▶',
    cls:   styles.ok,
  },
  {
    key:   'alerta',
    label: 'Em Alerta',
    icon:  '⚠',
    cls:   styles.danger,
  },
  {
    key:   'atencao',
    label: 'Em Atenção',
    icon:  '◉',
    cls:   styles.warn,
  },
  {
    key:   'offline',
    label: 'Offline',
    icon:  '■',
    cls:   styles.off,
  },
];

export default function KpiCards({ counts, total }) {
  return (
    <div className={styles.grid}>
      {CARDS.map((c, i) => (
        <div
          key={c.key}
          className={`${styles.card} fade-up`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={`${styles.iconWrap} ${c.cls}`}>
            <span className={styles.icon}>{c.icon}</span>
          </div>
          <div className={styles.body}>
            <span className={styles.value}>{counts[c.key] ?? 0}</span>
            <span className={styles.label}>{c.label}</span>
            {total > 0 && (
              <span className={styles.pct}>
                {Math.round(((counts[c.key] ?? 0) / total) * 100)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
