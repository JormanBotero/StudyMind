// ─────────────────────────────────────────────────────────────────
// Layout principal — sidebar con íconos + labels siempre visibles
// ─────────────────────────────────────────────────────────────────
import { Outlet, Link, useLocation } from 'react-router'
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar,
  BarChart3, GraduationCap, Moon, Sun, LogOut, ChevronRight, Sparkles
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Avatar } from './ui.jsx'

const NAV = [
  { path: '/',          label: 'Dashboard', icon: LayoutDashboard, color: '#7265f8' },
  { path: '/subjects',  label: 'Materias',  icon: BookOpen,        color: '#0ea47a' },
  { path: '/tasks',     label: 'Tareas',    icon: CheckSquare,     color: '#d97706' },
  { path: '/schedule',  label: 'Horario',   icon: Calendar,        color: '#3b82f6' },
  { path: '/analytics', label: 'Análisis',  icon: BarChart3,       color: '#ec4899' },
]

const SIDEBAR_W = 200

export function Layout() {
  const loc = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex' }}>
      <style>{`
        .sidebar {
          position: fixed; top: 0; left: 0; height: 100vh;
          width: ${SIDEBAR_W}px;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          z-index: 50; display: flex; flex-direction: column; overflow: hidden;
        }
        .nav-item {
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0 10px; height: 42px; border-radius: 10px;
          margin: 1px 8px; cursor: pointer; text-decoration: none;
          transition: background 0.15s, transform 0.15s;
          white-space: nowrap; overflow: hidden; position: relative; flex-shrink: 0;
        }
        .nav-item:hover { transform: translateX(2px); }
        .nav-icon {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background 0.15s, transform 0.18s;
        }
        .nav-item:hover .nav-icon { transform: scale(1.06); }
        .nav-label { font-size: 0.82rem; font-weight: 600; letter-spacing: -0.01em; flex: 1; overflow: hidden; text-overflow: ellipsis; }
        .active-bar { position: absolute; right: 0; top: 20%; height: 60%; width: 3px; border-radius: 3px 0 0 3px; }
        .logo-wrap { height: 58px; display: flex; align-items: center; padding: 0 14px; gap: 0.65rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .logo-icon { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px var(--accent-glow); }
        .bottom-section { border-top: 1px solid var(--border); padding: 8px 0; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
        .profile-item { display: flex; align-items: center; gap: 0.65rem; padding: 6px 10px; margin: 0 8px; border-radius: 10px; cursor: pointer; overflow: hidden; white-space: nowrap; text-decoration: none; transition: background 0.15s; }
        .profile-item:hover { background: var(--bg-elevated); }
        .main-wrap { flex: 1; display: flex; flex-direction: column; min-height: 100vh; min-width: 0; margin-left: ${SIDEBAR_W}px; }
        @media(max-width: 700px) {
          .sidebar { width: 56px !important; }
          .sidebar .nav-label, .sidebar .logo-text, .sidebar .profile-text { display: none !important; }
          .main-wrap { margin-left: 56px !important; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="logo-wrap">
          <div className="logo-icon"><GraduationCap size={18} color="white" strokeWidth={2.2} /></div>
          <div className="logo-text">
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>StudyMind</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><Sparkles size={8} /> con IA</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 18px', marginBottom: '6px' }} className="nav-label">Menú</p>
          {NAV.map(({ path, label, icon: Icon, color }) => {
            const isActive = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path)
            return (
              <Link key={path} to={path} className="nav-item"
                style={{ background: isActive ? `${color}18` : 'transparent', color: isActive ? color : 'var(--text-secondary)' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.color = color } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}>
                <div className="nav-icon" style={{ background: isActive ? `${color}25` : 'var(--bg-elevated)' }}>
                  <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8} color={isActive ? color : 'var(--text-secondary)'} />
                </div>
                <span className="nav-label" style={{ color: isActive ? color : 'var(--text-secondary)' }}>{label}</span>
                {isActive && <span className="active-bar" style={{ background: color }} />}
              </Link>
            )
          })}
        </nav>

        <div className="bottom-section">
          <button onClick={toggleTheme} className="nav-item"
            style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text-muted)', width: '100%', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <div className="nav-icon" style={{ background: 'var(--bg-elevated)' }}>
              {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
            </div>
            <span className="nav-label">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>

          <Link to="/profile" className="profile-item" style={{ background: loc.pathname === '/profile' ? 'var(--bg-elevated)' : 'none' }}>
            <Avatar src={user?.avatar} initials={user?.initials} size={30} radius={9} />
            <div className="profile-text" style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.career || 'Ver perfil'}</p>
            </div>
          </Link>

          <button onClick={logout} className="nav-item"
            style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text-muted)', width: '100%', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <div className="nav-icon" style={{ background: 'var(--bg-elevated)' }}>
              <LogOut size={14} strokeWidth={1.8} />
            </div>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="main-wrap">
        <header style={{ height: '52px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 30, flexShrink: 0 }}>
          <PaginaBreadcrumb pathname={loc.pathname} />
          <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>{user?.name}</span>
            <Avatar src={user?.avatar} initials={user?.initials} size={26} radius={8} />
          </Link>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function PaginaBreadcrumb({ pathname }) {
  const segmentos = pathname.split('/').filter(Boolean)
  const base = segmentos[0]
  const etiquetas = { subjects: 'Materias', tasks: 'Tareas', schedule: 'Horario', analytics: 'Análisis', profile: 'Perfil' }
  const colores   = { subjects: '#0ea47a', tasks: '#d97706', schedule: '#3b82f6', analytics: '#ec4899', profile: '#7265f8' }
  if (!base) return <span style={{ fontSize: '0.845rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>StudyMind</span>
      <ChevronRight size={11} color="var(--text-muted)" />
      <span style={{ fontWeight: 700, color: colores[base] || 'var(--text-primary)' }}>{etiquetas[base] || base}</span>
      {segmentos[1] && (<><ChevronRight size={11} color="var(--text-muted)" /><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Detalle</span></>)}
    </div>
  )
}
