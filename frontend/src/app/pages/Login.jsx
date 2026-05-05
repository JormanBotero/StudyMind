// ─────────────────────────────────────────────────────────────────
// Página de Login — autenticación de usuario
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { GraduationCap, Eye, EyeOff, Moon, Sun, ArrowRight } from 'lucide-react'
import { Btn, Input, Alert, Divider } from '../components/ui.jsx'

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const googleBtnRef = useRef(null)
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogle })
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: isDark ? 'filled_black' : 'outline', size: 'large', width: '100%', text: 'signin_with', shape: 'rectangular',
      })
    }
  }, [GOOGLE_CLIENT_ID, isDark])

  const handleGoogle = async (res) => {
    setError(''); setLoading(true)
    try { await loginWithGoogle(res.credential) } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form.email, form.password) } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
      {/* Subtle background accent */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)' }} />
      </div>

      <button onClick={toggleTheme} style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', boxShadow: 'var(--sh-sm)' }}>
        {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
      </button>

      <div className="appear" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        {/* Logo mark */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-md)' }}>
            <GraduationCap size={18} color="white" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.015em', lineHeight: 1.2 }}>StudyMind</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>Sistema Académico</p>
          </div>
        </div>

        {/* Card */}
        <div className="surface" style={{ padding: '1.75rem', borderRadius: 'var(--r-xl)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Iniciar sesión</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Ingresa tus credenciales para acceder</p>

          {/* Demo hint */}
          <button onClick={() => setForm({ email: 'demo@studymind.edu', password: 'demo1234' })}
            style={{ width: '100%', padding: '0.6rem 0.875rem', background: 'var(--accent-soft)', border: '1px solid var(--accent)33', borderRadius: 'var(--r-md)', cursor: 'pointer', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', transition: 'opacity 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <span>Acceso de demostración</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', opacity: 0.7 }}>demo1234</span>
          </button>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Input label="Correo electrónico" type="email" required placeholder="correo@universidad.edu"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />

            <div style={{ position: 'relative' }}>
              <Input label="Contraseña" type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: '0.75rem', bottom: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '1px' }}>
                {showPass ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
              </button>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <Btn type="submit" loading={loading} icon={ArrowRight} style={{ width: '100%', height: '38px', marginTop: '0.25rem' }}>
              Iniciar sesión
            </Btn>
          </form>

          {GOOGLE_CLIENT_ID ? (
            <><Divider label="o" /><div ref={googleBtnRef} style={{ width: '100%', marginTop: '0.25rem' }} /></>
          ) : (
            <><Divider label="o" />
            <div style={{ padding: '0.625rem 0.875rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Configura <code style={{ fontFamily: 'var(--font-mono)' }}>VITE_GOOGLE_CLIENT_ID</code> para habilitar Google
            </div></>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Sin cuenta — <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
