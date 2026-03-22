/**
 * src/components/FilterBar/FilterBar.jsx
 * Barra de filtros: busca por texto + filtro por local.
 */
import React from 'react';
import styles from './FilterBar.module.css';

export default function FilterBar({ search, onSearch, local, onLocal, locations, total, filtered }) {
  return (
    <div className={styles.bar}>
      {/* Busca textual */}
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar máquina…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Buscar máquina"
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => onSearch('')} aria-label="Limpar busca">
            ×
          </button>
        )}
      </div>

      {/* Filtro por local */}
      <div className={styles.selectWrap}>
        <svg className={styles.selectIcon} width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 1a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
        </svg>
        <select
          className={styles.select}
          value={local}
          onChange={(e) => onLocal(e.target.value)}
          aria-label="Filtrar por local"
        >
          <option value="">Todos os locais</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Contador */}
      <span className={styles.counter}>
        {filtered === total
          ? `${total} máquinas`
          : `${filtered} de ${total} máquinas`}
      </span>
    </div>
  );
}
