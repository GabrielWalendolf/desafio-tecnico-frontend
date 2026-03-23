/**
 * src/components/Navbar/Navbar.tsx
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Pulse, ArrowClockwise, Bell, Gear, CaretDown,
  Cpu, SquaresFour, ChartBar, List, X,
  User, SignOut, ShieldCheck, Question,
} from '@phosphor-icons/react';
import PreferencesPanel from '../PreferencesPanel/PreferencesPanel';
import styles from './Navbar.module.css';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, active, onClick }: NavItemProps): React.ReactElement {
  return (
    <button
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={16} weight="bold" />
      <span>{label}</span>
    </button>
  );
}

interface NavbarProps {
  onRefresh: () => void;
  loading: boolean;
  lastFetch: Date | null;
  alertCount?: number;
}

export default function Navbar({
  onRefresh,
  loading,
  lastFetch,
  alertCount = 0,
}: NavbarProps): React.ReactElement {
  const [activeNav, setActiveNav]   = useState<string>('Dashboard');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [bellOpen, setBellOpen]     = useState<boolean>(false);
  const [userOpen, setUserOpen]     = useState<boolean>(false);
  const [prefsOpen, setPrefsOpen]   = useState<boolean>(false);
  const userRef                     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenPrefs = () => {
    setUserOpen(false);
    setPrefsOpen(true);
  };

  const navItems = [
    { label: 'Dashboard',     icon: SquaresFour },
    { label: 'Relatórios',    icon: ChartBar },
    { label: 'Configurações', icon: Gear },
  ];

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.topAccent} />
        <div className={styles.inner}>
          <div className={styles.brand}>
            <div className={styles.logoIcon}>
              <Cpu size={18} weight="bold" />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoEco}>ECO</span>
              <span className={styles.logoPlus}>+</span>
              <span className={styles.logoTagline}>Industrial Monitor</span>
            </div>
          </div>

          <div className={styles.divider} />

          <nav className={styles.nav} aria-label="Navegação principal">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={activeNav === item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  if (item.label === 'Configurações') handleOpenPrefs();
                }}
              />
            ))}
          </nav>

          <div className={styles.actions}>
            {lastFetch && (
              <span className={styles.lastUpdate}>
                <Pulse size={11} weight="bold" />
                {lastFetch.toLocaleTimeString('pt-BR', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </span>
            )}

            <button
              className={styles.refreshBtn}
              onClick={onRefresh}
              disabled={loading}
              title="Recarregar dados"
              aria-label="Atualizar dados"
            >
              <ArrowClockwise
                size={14}
                weight="bold"
                className={loading ? styles.spinning : ''}
              />
              <span>{loading ? 'Carregando…' : 'Atualizar'}</span>
            </button>

            <div className={styles.bellWrap}>
              <button
                className={`${styles.iconBtn} ${bellOpen ? styles.iconBtnActive : ''}`}
                onClick={() => setBellOpen((o) => !o)}
                aria-label={`Notificações${alertCount > 0 ? ` (${alertCount} alertas)` : ''}`}
              >
                <Bell size={16} weight="bold" />
                {alertCount > 0 && (
                  <span className={styles.badge}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className={styles.bellDropdown}>
                  <div className={styles.dropdownHeader}>
                    <span>Notificações</span>
                    {alertCount > 0 && (
                      <span className={styles.dropdownCount}>{alertCount} alertas</span>
                    )}
                  </div>
                  {alertCount === 0 ? (
                    <div className={styles.dropdownEmpty}>
                      <Pulse size={24} weight="bold" />
                      <span>Sistema operando normalmente</span>
                    </div>
                  ) : (
                    <div className={styles.dropdownMsg}>
                      <span className={styles.dropdownAlert}>
                        {alertCount} máquina{alertCount !== 1 ? 's' : ''} com alertas ativos
                      </span>
                      <span className={styles.dropdownSub}>Verifique os cards no dashboard</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.userWrap} ref={userRef}>
              <button
                className={`${styles.userBtn} ${userOpen ? styles.userBtnActive : ''}`}
                onClick={() => setUserOpen((o) => !o)}
                aria-label="Menu do usuário"
                aria-expanded={userOpen}
              >
                <div className={styles.avatar}>OP</div>
                <span className={styles.userName}>Operador</span>
                <CaretDown
                  size={13}
                  weight="bold"
                  className={`${styles.chevron} ${userOpen ? styles.chevronOpen : ''}`}
                />
              </button>

              {userOpen && (
                <div className={styles.userDropdown} role="menu">
                  <div className={styles.userDropdownHeader}>
                    <div className={styles.userDropdownAvatar}>OP</div>
                    <div>
                      <p className={styles.userDropdownName}>Operador</p>
                      <p className={styles.userDropdownRole}>operador@ecoplus.com</p>
                    </div>
                  </div>
                  <div className={styles.userDropdownDivider} />
                  <button className={styles.userDropdownItem} role="menuitem">
                    <User size={14} weight="bold" /><span>Meu Perfil</span>
                  </button>
                  <button className={styles.userDropdownItem} role="menuitem">
                    <ShieldCheck size={14} weight="bold" /><span>Permissões</span>
                  </button>
                  <button
                    className={`${styles.userDropdownItem} ${styles.userDropdownItemPrefs}`}
                    role="menuitem"
                    onClick={handleOpenPrefs}
                  >
                    <Gear size={14} weight="bold" /><span>Preferências</span>
                  </button>
                  <button className={styles.userDropdownItem} role="menuitem">
                    <Question size={14} weight="bold" /><span>Ajuda & Suporte</span>
                  </button>
                  <div className={styles.userDropdownDivider} />
                  <button className={`${styles.userDropdownItem} ${styles.userDropdownLogout}`} role="menuitem">
                    <SignOut size={14} weight="bold" /><span>Sair</span>
                  </button>
                </div>
              )}
            </div>

            <button
              className={`${styles.iconBtn} ${styles.mobileMenu}`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu mobile"
            >
              {mobileOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className={styles.mobileNav}>
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={activeNav === item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  setMobileOpen(false);
                  if (item.label === 'Configurações') handleOpenPrefs();
                }}
              />
            ))}
          </nav>
        )}
      </header>

      {prefsOpen && <PreferencesPanel onClose={() => setPrefsOpen(false)} />}
    </>
  );
}
