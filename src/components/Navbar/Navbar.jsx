/**
 * src/components/Navbar/Navbar.jsx
 * Navbar dark industrial com Lucide React.
 * Estilo: dark navbar contrastando com light cards do dashboard.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Bell,
  Settings,
  ChevronDown,
  Cpu,
  LayoutDashboard,
  BarChart2,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  Moon,
  HelpCircle,
} from 'lucide-react';
import styles from './Navbar.module.css';

/* ── Item de navegação ──────────────────────────────────────────── */
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
      <span>{label}</span>
    </button>
  );
}

export default function Navbar({ onRefresh, loading, lastFetch, alertCount = 0 }) {
  const [activeNav, setActiveNav]   = useState('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen]     = useState(false);
  const [userOpen, setUserOpen]     = useState(false);
  const userRef                     = useRef(null);

  /* Fecha dropdowns ao clicar fora */
  useEffect(() => {
    function handleClickOutside(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard',    icon: LayoutDashboard },
    { label: 'Relatórios',   icon: BarChart2 },
    { label: 'Configurações',icon: Settings },
  ];

  return (
    <header className={styles.navbar}>
      {/* ── Linha decorativa superior (glow verde) ────────── */}
      <div className={styles.topAccent} />

      <div className={styles.inner}>
        {/* ── Brand ───────────────────────────────────────── */}
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <Cpu size={18} strokeWidth={1.8} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoEco}>ECO</span>
            <span className={styles.logoPlus}>+</span>
            <span className={styles.logoTagline}>Industrial Monitor</span>
          </div>
        </div>

        {/* ── Divisor vertical ─────────────────────────────── */}
        <div className={styles.divider} />

        {/* ── Navegação (desktop) ───────────────────────────── */}
        <nav className={styles.nav} aria-label="Navegação principal">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={activeNav === item.label}
              onClick={() => setActiveNav(item.label)}
            />
          ))}
        </nav>

        {/* ── Actions ──────────────────────────────────────── */}
        <div className={styles.actions}>

          {/* Última atualização */}
          {lastFetch && (
            <span className={styles.lastUpdate}>
              <Activity size={11} />
              {lastFetch.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}

          {/* Botão refresh */}
          <button
            className={styles.refreshBtn}
            onClick={onRefresh}
            disabled={loading}
            title="Recarregar dados"
            aria-label="Atualizar dados"
          >
            <RefreshCw
              size={14}
              strokeWidth={2}
              className={loading ? styles.spinning : ''}
            />
            <span>{loading ? 'Carregando…' : 'Atualizar'}</span>
          </button>

          {/* Sino de notificações */}
          <div className={styles.bellWrap}>
            <button
              className={`${styles.iconBtn} ${bellOpen ? styles.iconBtnActive : ''}`}
              onClick={() => setBellOpen((o) => !o)}
              aria-label={`Notificações${alertCount > 0 ? ` (${alertCount} alertas)` : ''}`}
            >
              <Bell size={16} strokeWidth={1.8} />
              {alertCount > 0 && (
                <span className={styles.badge}>
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>

            {/* Dropdown de notificações */}
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
                    <Activity size={24} />
                    <span>Sistema operando normalmente</span>
                  </div>
                ) : (
                  <div className={styles.dropdownMsg}>
                    <span className={styles.dropdownAlert}>
                      {alertCount} máquina{alertCount !== 1 ? 's' : ''} com alertas ativos
                    </span>
                    <span className={styles.dropdownSub}>
                      Verifique os cards no dashboard
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar / Usuário com dropdown */}
          <div className={styles.userWrap} ref={userRef}>
            <button
              className={`${styles.userBtn} ${userOpen ? styles.userBtnActive : ''}`}
              onClick={() => setUserOpen((o) => !o)}
              aria-label="Menu do usuário"
              aria-expanded={userOpen}
            >
              <div className={styles.avatar}>OP</div>
              <span className={styles.userName}>Operador</span>
              <ChevronDown
                size={13}
                strokeWidth={2}
                className={`${styles.chevron} ${userOpen ? styles.chevronOpen : ''}`}
              />
            </button>

            {/* Dropdown do usuário */}
            {userOpen && (
              <div className={styles.userDropdown} role="menu">
                {/* Cabeçalho do perfil */}
                <div className={styles.userDropdownHeader}>
                  <div className={styles.userDropdownAvatar}>OP</div>
                  <div>
                    <p className={styles.userDropdownName}>Operador</p>
                    <p className={styles.userDropdownRole}>operador@ecoplus.com</p>
                  </div>
                </div>

                <div className={styles.userDropdownDivider} />

                {/* Itens do menu */}
                <button className={styles.userDropdownItem} role="menuitem">
                  <User size={14} strokeWidth={1.8} />
                  <span>Meu Perfil</span>
                </button>
                <button className={styles.userDropdownItem} role="menuitem">
                  <Shield size={14} strokeWidth={1.8} />
                  <span>Permissões</span>
                </button>
                <button className={styles.userDropdownItem} role="menuitem">
                  <Settings size={14} strokeWidth={1.8} />
                  <span>Preferências</span>
                </button>
                <button className={styles.userDropdownItem} role="menuitem">
                  <HelpCircle size={14} strokeWidth={1.8} />
                  <span>Ajuda & Suporte</span>
                </button>

                <div className={styles.userDropdownDivider} />

                {/* Sair */}
                <button className={`${styles.userDropdownItem} ${styles.userDropdownLogout}`} role="menuitem">
                  <LogOut size={14} strokeWidth={1.8} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>

          {/* Menu mobile */}
          <button
            className={`${styles.iconBtn} ${styles.mobileMenu}`}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu mobile"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Navegação mobile ─────────────────────────────── */}
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
              }}
            />
          ))}
        </nav>
      )}
    </header>
  );
}