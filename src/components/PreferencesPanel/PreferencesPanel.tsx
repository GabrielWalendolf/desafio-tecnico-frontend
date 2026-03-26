/**
 * src/components/PreferencesPanel/PreferencesPanel.tsx
 */
import React, { useEffect, useRef, ReactNode } from 'react';
import {
  X, Sun, Moon, Monitor, PaintBrush, Globe, Info,
} from '@phosphor-icons/react';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeValue } from '../../types';
import styles from './PreferencesPanel.module.css';

// ── Versão lida automaticamente ─────────────────────────────────
// Em desenvolvimento: usa REACT_APP_VERSION ou fallback para package.json
// Em produção (CI):   injetada pelo job deploy-production como REACT_APP_VERSION
const APP_VERSION = require('../../../package.json').version;

interface SettingRowProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: ReactNode;
}

function SettingRow({ icon: Icon, label, description, children }: SettingRowProps): React.ReactElement {
  return (
    <div className={styles.settingRow}>
      <div className={styles.settingIcon}>
        <Icon size={16} weight="bold" />
      </div>
      <div className={styles.settingInfo}>
        <span className={styles.settingLabel}>{label}</span>
        {description && <span className={styles.settingDesc}>{description}</span>}
      </div>
      <div className={styles.settingControl}>{children}</div>
    </div>
  );
}

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  Icon: React.ElementType;
}

function ThemeSelector(): React.ReactElement {
  const { theme, setTheme } = useTheme();

  const options: ThemeOption[] = [
    { value: 'light',  label: 'Claro',   Icon: Sun },
    { value: 'dark',   label: 'Escuro',  Icon: Moon },
    { value: 'system', label: 'Sistema', Icon: Monitor },
  ];

  const handleSelect = (value: 'light' | 'dark' | 'system') => {
    if (value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(value as ThemeValue);
    }
  };

  return (
    <div className={styles.themeSelector}>
      {options.map(({ value, label, Icon }) => {
        const isActive = value !== 'system' && theme === value;
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

interface PreferencesPanelProps {
  onClose: () => void;
}

export default function PreferencesPanel({ onClose }: PreferencesPanelProps): React.ReactElement {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Preferências"
        tabIndex={-1}
      >
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
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar preferências">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionDot} />
              Aparência
            </h3>
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

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionDot} />
              Dados & Região
            </h3>
            <div className={styles.settingsList}>
              <SettingRow icon={Globe} label="Idioma" description="Português (Brasil)">
                <span className={styles.settingBadge}>PT-BR</span>
              </SettingRow>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionDot} />
              Sobre
            </h3>
            <div className={styles.aboutCard}>
              <div className={styles.aboutRow}>
                <Info size={13} weight="bold" />
                <span className={styles.aboutLabel}>Versão</span>
                {/* Atualizado automaticamente pelo CI a cada deploy */}
                <span className={styles.aboutVal}>v{APP_VERSION}</span>
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