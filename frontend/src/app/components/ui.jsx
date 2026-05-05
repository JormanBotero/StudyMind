// ─────────────────────────────────────────────────────────────────
// Biblioteca de componentes reutilizables de StudyMind
// Todos los componentes usan variables CSS del tema para
// adaptarse automáticamente al modo claro/oscuro.
// ─────────────────────────────────────────────────────────────────
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'

// Estilos base compartidos para campos de formulario
const estiloBaseInput = {
  width: '100%', height: '36px', padding: '0 0.875rem',
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', fontSize: '0.875rem', color: 'var(--text-primary)',
  fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
}

// ── Botón principal ───────────────────────────────────────────────
// Variantes: primary | secondary | ghost | danger | success
export function Btn({ children, variant = 'primary', size = 'md', loading = false, icon: Icon, style: xStyle, ...props }) {
  const padding  = { sm: '0 0.75rem', md: '0 1rem',    lg: '0 1.25rem' }
  const fuente   = { sm: '0.78rem',   md: '0.83rem',   lg: '0.88rem'   }
  const altura   = { sm: '30px',      md: '34px',      lg: '38px'      }

  // Paleta de colores por variante
  const variantes = {
    primary:   { background: 'var(--accent)',       color: '#fff',                  border: '1px solid var(--accent)' },
    secondary: { background: 'var(--bg-surface)',   color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent',         color: 'var(--text-secondary)', border: '1px solid transparent'   },
    danger:    { background: 'var(--danger-soft)',  color: 'var(--danger)',          border: '1px solid transparent'   },
    success:   { background: 'var(--success-soft)', color: 'var(--success)',         border: '1px solid transparent'   },
  }

  const deshabilitado = loading || props.disabled

  return (
    <button {...props} disabled={deshabilitado}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.4rem', padding: padding[size], height: altura[size],
        borderRadius: 'var(--r-md)', fontFamily: 'inherit', fontSize: fuente[size],
        fontWeight: 600, cursor: deshabilitado ? 'not-allowed' : 'pointer',
        opacity: deshabilitado && !loading ? 0.45 : 1,
        transition: 'opacity 0.12s, background 0.12s',
        whiteSpace: 'nowrap', letterSpacing: '0.01em',
        ...variantes[variant], ...xStyle,
      }}
      onMouseEnter={e => { if (!deshabilitado) e.currentTarget.style.opacity = '0.82' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {loading ? <span className="spinner" /> : Icon ? <Icon size={14} strokeWidth={2.2} /> : null}
      {children}
    </button>
  )
}

// ── Campo de texto ────────────────────────────────────────────────
export function Input({ label, error, hint, style: xStyle, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
          {label}
        </label>
      )}
      <input {...props}
        style={{ ...estiloBaseInput, borderColor: error ? 'var(--danger)' : 'var(--border)', ...xStyle }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'}
      />
      {error && <p style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

// ── Lista desplegable ─────────────────────────────────────────────
export function Select({ label, children, error, style: xStyle, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
          {label}
        </label>
      )}
      <select {...props}
        style={{ ...estiloBaseInput, cursor: 'pointer', ...xStyle }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      >
        {children}
      </select>
    </div>
  )
}

// ── Área de texto multilínea ──────────────────────────────────────
export function Textarea({ label, error, style: xStyle, rows = 3, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
          {label}
        </label>
      )}
      <textarea {...props} rows={rows}
        style={{
          ...estiloBaseInput, height: 'auto',
          padding: '0.625rem 0.875rem', resize: 'vertical', lineHeight: 1.55,
          borderColor: error ? 'var(--danger)' : 'var(--border)', ...xStyle,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

// ── Modal (ventana emergente centrada) ────────────────────────────
// Cierra al hacer clic fuera del contenido o en la X
export function Modal({ title, subtitle, onClose, children, maxWidth = '540px' }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease both',
      }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', width: '100%', maxWidth,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--sh-xl)', animation: 'modalIn 0.18s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        {/* Cabecera del modal */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
            {subtitle && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
        {/* Contenido desplazable */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Alerta informativa ────────────────────────────────────────────
// Tipos: error | success | warning | info
export function Alert({ type = 'error', children }) {
  const tipos = {
    error:   { fondo: 'var(--danger-soft)',  color: 'var(--danger)',  Ic: AlertTriangle },
    success: { fondo: 'var(--success-soft)', color: 'var(--success)', Ic: CheckCircle  },
    warning: { fondo: 'var(--warning-soft)', color: 'var(--warning)', Ic: AlertCircle  },
    info:    { fondo: 'var(--info-soft)',    color: 'var(--info)',    Ic: Info         },
  }
  const { fondo, color, Ic } = tipos[type] || tipos.error
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.875rem', background: fondo, border: `1px solid ${color}33`, borderRadius: 'var(--r-md)', color, fontSize: '0.82rem', fontWeight: 500 }}>
      <Ic size={14} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  )
}

// ── Avatar del usuario ────────────────────────────────────────────
// Muestra la foto si existe, o las iniciales como fallback
export function Avatar({ src, initials, size = 36, radius = 10 }) {
  if (src) return (
    <img src={src} alt="avatar" width={size} height={size}
      style={{ borderRadius: radius, objectFit: 'cover', flexShrink: 0, display: 'block' }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: 'var(--accent-soft)', border: '1px solid var(--accent)33',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--accent)', fontWeight: 700, fontSize: size * 0.34,
      flexShrink: 0, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)',
    }}>
      {initials || '?'}
    </div>
  )
}

// ── Tarjeta de estadística ────────────────────────────────────────
// Muestra un ícono, etiqueta, valor numérico y subtexto opcional
export function StatCard({ icon: Icon, label, value, sub, color, className = '' }) {
  return (
    <div className={`surface ${className}`} style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: 'var(--r-md)',
        background: `${color}14`, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={17} color={color} strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="label" style={{ marginBottom: '1px' }}>{label}</p>
        <p style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>{value}</p>
        {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Estado vacío ──────────────────────────────────────────────────
// Se muestra cuando una sección no tiene contenido todavía
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      {Icon && (
        <div style={{
          width: '42px', height: '42px', borderRadius: 'var(--r-lg)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem',
        }}>
          <Icon size={18} color="var(--text-muted)" strokeWidth={1.5} />
        </div>
      )}
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</p>
      {description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '260px' }}>{description}</p>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  )
}

// ── Separador visual ──────────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <hr className="divider" />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <hr className="divider" style={{ flex: 1 }} />
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <hr className="divider" style={{ flex: 1 }} />
    </div>
  )
}

// ── Botón de ícono pequeño ────────────────────────────────────────
// Usado para acciones secundarias como editar o eliminar
export function IconBtn({ icon: Icon, onClick, variant = 'ghost', title, size = 28 }) {
  const variantes = {
    ghost:  { fondo: 'transparent',         hFondo: 'var(--bg-elevated)', color: 'var(--text-muted)' },
    accent: { fondo: 'var(--accent-soft)',  hFondo: 'var(--accent-soft)', color: 'var(--accent)'     },
    danger: { fondo: 'var(--danger-soft)',  hFondo: 'var(--danger-soft)', color: 'var(--danger)'     },
  }
  const s = variantes[variant]
  return (
    <button onClick={onClick} title={title}
      style={{ width: size, height: size, borderRadius: 'var(--r-sm)', background: s.fondo, border: '1px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, transition: 'background 0.1s', flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.background = s.hFondo}
      onMouseLeave={e => e.currentTarget.style.background = s.fondo}>
      <Icon size={13} strokeWidth={2.2} />
    </button>
  )
}

// ── Etiqueta / chip de categoría ──────────────────────────────────
// Pequeño elemento inline para mostrar estados, tipos o categorías
export function Badge({ children, color = 'var(--accent)', bg, style: xStyle }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 8px', borderRadius: 'var(--r-xs)',
      fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.02em',
      color, background: bg || `${color}18`,
      border: `1px solid ${color}22`,
      whiteSpace: 'nowrap', ...xStyle,
    }}>
      {children}
    </span>
  )
}
