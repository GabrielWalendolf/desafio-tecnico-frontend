/**
 * src/components/AlertPanel/AlertPanel.jsx
 * Painel lateral com alertas críticos + donut chart de distribuição.
 */
import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { countAlerts, getStatusColor, formatDateTime } from '../../utils/machine';
import styles from './AlertPanel.module.css';

const DONUT_COLORS = [
  'var(--danger)',
  'var(--warning)',
  'var(--accent)',
  'var(--info)',
  '#a371f7',
  '#ffa657',
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{payload[0].name}</span>
      <span className={styles.tooltipValue}>{payload[0].value}</span>
    </div>
  );
};

export default function AlertPanel({ machines }) {
  const alertData  = countAlerts(machines);
  const criticals  = machines
    .filter((m) => m.alertas?.length > 0)
    .sort((a, b) => b.alertas.length - a.alertas.length)
    .slice(0, 5);

  const hasAlerts = alertData.length > 0;

  return (
    <aside className={styles.panel}>
      {/* Alertas críticos */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.dot} />
          Alertas Críticos
        </h2>
        {criticals.length === 0 ? (
          <p className={styles.empty}>Nenhum alerta ativo.</p>
        ) : (
          <ul className={styles.alertList}>
            {criticals.map((m) => (
              <li key={m.id} className={styles.alertItem}>
                <div className={styles.alertMachine}>
                  <span className={styles.alertName}>{m.codigo}</span>
                  <span className={styles.alertLocal}>{m.local}</span>
                </div>
                <div className={styles.alertTags}>
                  {m.alertas.map((a) => (
                    <span key={a} className={styles.alertTag}>{a}</span>
                  ))}
                </div>
                <span className={styles.alertTime}>
                  {formatDateTime(m.ultimaAtualizacao)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Donut chart */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.dot} />
          Distribuição de Alertas
        </h2>
        {!hasAlerts ? (
          <p className={styles.empty}>Sem alertas para exibir.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={alertData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {alertData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {alertData.map((item, i) => (
                <div key={item.name} className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className={styles.legendName}>{item.name}</span>
                  <span className={styles.legendVal}>{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Previsão de manutenção (estático / placeholder) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.dot} />
          Próximas Manutenções
        </h2>
        <ul className={styles.maintList}>
          {machines.slice(0, 3).map((m) => (
            <li key={m.id} className={styles.maintItem}>
              <span className={styles.maintName}>{m.codigo}</span>
              <span className={styles.maintDate}>Agendada</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
