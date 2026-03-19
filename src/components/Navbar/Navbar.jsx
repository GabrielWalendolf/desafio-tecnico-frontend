/**
 * src/components/Navbar/Navbar.jsx
 * Barra de navegação superior com logo ECO+ e botão de refresh.
 */
import React from 'react';
import styles from './Navbar.module.css';

export default function Navbar({ onRefresh, loading, lastFetch }) {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.logo}>ECO<span className={styles.plus}>+</span></span>
        <span className={styles.tagline}>Industrial Monitor</span>
      </div>

      <nav className={styles.nav}>
        <span className={styles.navItem + ' ' + styles.navActive}>Dashboard</span>
        <span className={styles.navItem}>Relatórios</span>
        <span className={styles.navItem}>Configurações</span>
      </nav>

      <div className={styles.actions}>
        {lastFetch && (
          <span className={styles.lastUpdate}>
            Atualizado às {lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={loading}
          title="Recarregar dados"
        >
          <svg
            className={loading ? styles.spinning : ''}
            width="16" height="16" viewBox="0 0 16 16" fill="none"
          >
            <path
              d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.05-3.35L10 6.5h5V1.5l-1.35.85z"
              fill="currentColor"
            />
          </svg>
          Atualizar
        </button>
      </div>
    </header>
  );
}
