// ─────────────────────────────────────────────────────────────────
// Página de Register — autenticación de usuario
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { GraduationCap, Eye, EyeOff, Moon, Sun, ArrowRight } from 'lucide-react'
import { Btn, Input, Select, Alert, Divider } from '../components/ui.jsx'

const CAREERS = ['Ingeniería de Sistemas','Ingeniería Civil','Medicina','Derecho','Administración de Empresas','Psicología','Arquitectura','Contaduría','Enfermería','Comunicación Social','Otra']
const SEMESTERS = Array.from({length:10},(_,i)=>`${i+1}${i===0?'er':'o'} Semestre`)

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', career:'', semester:'', university:'' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const googleBtnRef = useRef(null)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogle })
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, { theme: isDark ? 'filled_black' : 'outline', size: 'large', width: '100%', text: 'signup_with', shape: 'rectangular' })
    }
  }, [GOOGLE_CLIENT_ID, isDark])

  const handleGoogle = async res => {
    setError(''); setLoading(true)
    try { await loginWithGoogle(res.credential) } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    setLoading(true)
    try { await register({ name:form.name, email:form.email, password:form.password, career:form.career, semester:form.semester, university:form.university }) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-15%', left:'-8%', width:'450px', height:'450px', borderRadius:'50%', background:'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)' }} />
      </div>

      <button onClick={toggleTheme} style={{ position:'fixed', top:'1.25rem', right:'1.25rem', zIndex:10, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', boxShadow:'var(--sh-sm)' }}>
        {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
      </button>

      <div className="appear" style={{ width:'100%', maxWidth:'460px', position:'relative', zIndex:1, paddingBlock:'1rem' }}>
        <div style={{ marginBottom:'1.75rem', display:'flex', alignItems:'center', gap:'0.625rem' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-md)' }}>
            <GraduationCap size={18} color="white" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.015em', lineHeight:1.2 }}>StudyMind</p>
            <p style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.02em' }}>Sistema Académico</p>
          </div>
        </div>

        <div className="surface" style={{ padding:'1.75rem', borderRadius:'var(--r-xl)' }}>
          <h1 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.02em', marginBottom:'4px' }}>Crear cuenta</h1>
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1.5rem' }}>Completa tus datos para comenzar</p>

          {GOOGLE_CLIENT_ID && (
            <><div ref={googleBtnRef} style={{ width:'100%', marginBottom:'1rem' }} /><Divider label="o con correo" /></>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem', marginTop: GOOGLE_CLIENT_ID ? '0.75rem' : 0 }}>
            <Input label="Nombre completo" required placeholder="Juan García" value={form.name} onChange={set('name')} />
            <Input label="Correo electrónico" type="email" required placeholder="correo@universidad.edu" value={form.email} onChange={set('email')} />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <Select label="Carrera" value={form.career} onChange={set('career')}>
                <option value="">Seleccionar</option>
                {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Semestre" value={form.semester} onChange={set('semester')}>
                <option value="">Seleccionar</option>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>

            <Input label="Universidad (opcional)" placeholder="Nombre de tu institución" value={form.university} onChange={set('university')} />

            <div style={{ position:'relative' }}>
              <Input label="Contraseña" type={showPass?'text':'password'} required placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} style={{ paddingRight:'2.5rem' }} />
              <button type="button" onClick={() => setShowPass(p=>!p)} style={{ position:'absolute', right:'0.75rem', bottom:'10px', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'1px' }}>
                {showPass ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
              </button>
            </div>

            <Input label="Confirmar contraseña" type="password" required placeholder="Repite la contraseña" value={form.confirm} onChange={set('confirm')} />

            {error && <Alert type="error">{error}</Alert>}

            <Btn type="submit" loading={loading} icon={ArrowRight} style={{ width:'100%', height:'38px', marginTop:'0.25rem' }}>
              Crear cuenta
            </Btn>
          </form>

          <p style={{ textAlign:'center', marginTop:'1.25rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>
            Ya tienes cuenta — <Link to="/login" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
