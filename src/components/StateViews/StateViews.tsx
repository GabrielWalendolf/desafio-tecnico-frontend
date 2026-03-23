/**
 * src/components/StateViews/StateViews.jsx
 * Componentes reutilizáveis para estados de carregamento e erro.
 */
import React from 'react';
import styles from './StateViews.module.css';

/* ── Skeleton card para o grid ────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skLine} ${styles.skTitle}`} />
      <div className={`${styles.skLine} ${styles.skSub}`} />
      <div className={styles.skMetrics}>
        <div className={styles.skMetric} />
        <div className={styles.skMetric} />
        <div className={styles.skMetric} />
      </div>
      <div className={`${styles.skLine} ${styles.skFoot}`} />
    </div>
  );
}

export function LoadingState({ count = 9 }) {
  return (
    <div className={styles.loadingGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.errorWrap}>
      <div className={styles.errorIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--danger)" strokeWidth="1.5"/>
          <path d="M12 7v5M12 16v1" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className={styles.errorTitle}>Falha ao carregar dados</h3>
      <p className={styles.errorMsg}>{message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          ↻ Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className={styles.emptyWrap}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="14" rx="2" stroke="var(--muted)" strokeWidth="1.5"/>
        <path d="M3 10h18M8 6V4M16 6V4" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p className={styles.emptyMsg}>Nenhuma máquina encontrada.</p>
      <p className={styles.emptySub}>Tente ajustar os filtros.</p>
    </div>
  );
}
