/**
 * src/components/PreferencesPanel/PreferencesPanel.jsx
 *
 * Painel de configurações/preferências do usuário.
 * Abre como overlay lateral (slide-in da direita).
 * Mesmo visual do Dashboard: bg-surface, bordas, tokens CSS.
 * Inclui toggle de tema dark/light como configuração principal.
 */
import React, { useEffect, useRef } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  PaintBrush,
  Bell,
  Globe,
  Info,
} from '@phosphor-icons/react';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './PreferencesPanel.module.css';

/* ── Subcomponente: linha de configuração genérica ─────────── */
function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.settingIcon}>
        <Icon size={16} weight="bold" />
      </div>
      <div className={styles.settingInfo}>
        <span className={styles.settingLabel}>{label}</span>
        {description && (
          <span className={styles.settingDesc}>{description}</span>
        )}
      </div>
      <div className={styles.settingControl}>{children}</div>
    </div>
  );
}

/* ── Toggle switch acessível ───────────────────────────────── */
function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

/* ── Seletor de tema: 3 opções (light / dark / system) ──────── */
function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light',  label: 'Claro',   Icon: Sun },
    { value: 'dark',   label: 'Escuro',  Icon: Moon },
    { value: 'system', label: 'Sistema', Icon: Monitor },
  ];

  /* "sistema" aplica preferência do SO em tempo real */
  const handleSelect = (value) => {
    if (value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(value);
    }
  };

  /* Determina qual opção está visualmente ativa */
  const activeValue = theme; /* 'light' | 'dark' */

  return (
    <div className={styles.themeSelector}>
      {options.map(({ value, label, Icon }) => {
        const isActive =
          value === 'system'
            ? false /* "system" nunca fica marcado permanentemente */
            : activeValue === value;

        return (
          <button
            key={value}
            className={`${styles.themeOption} ${isActive ? styles.themeOptionActive : ''}`}
            onClick={() => handleSelect(value)}
            aria-pressed={isActive}
            title={label}
          >
            <Icon size={15} weight="bold" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Componente principal ──────────────────────────────────── */
export default function PreferencesPanel({ onClose }) {
  const panelRef = useRef(null);

  /* Fecha com ESC */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Foca o painel ao abrir (acessibilidade) */
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <>
      {/* Overlay escurecido */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Painel lateral */}
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Preferências"
        tabIndex={-1}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <PaintBrush size={16} weight="bold" />
            </div>
            <div>
              <h2 className={styles.title}>Preferências</h2>
              <p className={styles.subtitle}>Personalize sua experiência</p>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar preferências"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* ── Conteúdo ─────────────────────────────────────── */}
        <div className={styles.content}>

          {/* Seção: Aparência */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionDot} />
              Aparência
            </h3>

            {/* Tema principal */}
            <div className={styles.themeCard}>
              <div className={styles.themeCardHeader}>
                <Moon size={14} weight="bold" />
                <span>Tema da interface</span>
              </div>
              <p className={styles.themeCardDesc}>
                Alterne entre o modo claro, escuro ou use a preferência do seu sistema operacional.
              </p>
              <ThemeSelector />
            </div>
          </section>

          {/* Seção: Notificações */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionDot} />
              Notificações
            </h3>

            <div className={styles.settingsList}>
              <SettingRow
                icon={Bell}
                label="Alertas críticos"
                description="Notificar quando uma máquina entrar em estado de alerta"
              >
                <Toggle
                  checked={true}
                  onChange={() => {}}
                  ariaLabel="Alertas críticos"
                />
              </SettingRow>

              <SettingRow
                icon={Bell}
                label="Resumo periódico"
                description="Receber resumo do status a cada hora"
              >
                <Toggle
                  checked={false}
                  onChange={() => {}}
                  ariaLabel="Resumo periódico"
                />
              </SettingRow>
            </div>
          </section>

          {/* Seção: Dados */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionDot} />
              Dados & Região
            </h3>

            <div className={styles.settingsList}>
              <SettingRow
                icon={Globe}
                label="Idioma"
                description="Português (Brasil)"
              >
                <span className={styles.settingBadge}>PT-BR</span>
              </SettingRow>
            </div>
          </section>

          {/* Seção: Sobre */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionDot} />
              Sobre
            </h3>

            <div className={styles.aboutCard}>
              <div className={styles.aboutRow}>
                <Info size={13} weight="bold" />
                <span className={styles.aboutLabel}>Versão</span>
                <span className={styles.aboutVal}>1.0.0</span>
              </div>
              <div className={styles.aboutRow}>
                <Info size={13} weight="bold" />
                <span className={styles.aboutLabel}>Ambiente</span>
                <span className={styles.aboutVal}>
                  {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
                </span>
              </div>
            </div>
          </section>

        </div>
      </aside>
    </>
  );
}