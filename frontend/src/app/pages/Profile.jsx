// ─────────────────────────────────────────────────────────────────
// Página de Perfil — edición de datos personales y contraseña
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../utils/api.js'
import { User, Mail, BookOpen, Building2, GraduationCap, Edit3, Save, X, Lock, Shield, Camera, CheckCircle2 } from 'lucide-react'
import { Btn, Input, Select, Textarea, Alert, Avatar } from '../components/ui.jsx'

const CAREERS = ['Ingeniería de Sistemas', 'Ingeniería Civil', 'Medicina', 'Derecho', 'Administración de Empresas', 'Psicología', 'Arquitectura', 'Contaduría', 'Enfermería', 'Comunicación Social', 'Otra']
const SEMESTERS = Array.from({ length: 10 }, (_, i) => `${i + 1}${i === 0 ? 'er' : 'o'} Semestre`)

function Section({ title, description, icon: Icon, children }) {
  return (
    <div className="surface" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={19} color="var(--accent)" />
        </div>
        <div>
          <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</h3>
          {description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function Profile() {
  const { user, setUser, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', career: user?.career || '', semester: user?.semester || '', university: user?.university || '', bio: user?.bio || '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setP = (k) => (e) => setPassForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      const updated = await api.updateMe(form)
      setUser(updated)
      localStorage.setItem('studymind_user', JSON.stringify(updated))
      setSuccess('Perfil actualizado correctamente')
      setEditing(false)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleCancel = () => {
    setForm({ name: user?.name || '', career: user?.career || '', semester: user?.semester || '', university: user?.university || '', bio: user?.bio || '' })
    setEditing(false); setError('')
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setPassError(''); setPassSuccess('')
    if (passForm.newPassword !== passForm.confirmPassword) return setPassError('Las contraseñas no coinciden')
    if (passForm.newPassword.length < 6) return setPassError('Mínimo 6 caracteres')
    setPassLoading(true)
    try {
      await api.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
      setPassSuccess('Contraseña actualizada correctamente')
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPassSuccess(''), 4000)
    } catch (err) {
      setPassError(err.message)
    }
    setPassLoading(false)
  }

  // Formatear la fecha de creación de la cuenta
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-enter">
        <h1 className="page-title">Mi Perfil</h1>
        <p className="page-sub">Administra tu información personal y preferencias de cuenta</p>
      </div>

      {success && <Alert type="success">{success}</Alert>}

      {/* Profile hero */}
      <div className="appear d1 card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)', border: 'none', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', right: '60px', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '22px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '22px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 600, border: '3px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
                {user?.initials || '?'}
              </div>
            )}
            {user?.provider === 'google' && (
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                G
              </div>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'white', marginBottom: '0.25rem' }}>{user?.name}</h2>
            <p style={{ opacity: 0.85, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {user?.career && <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{user.career}</span>}
              {user?.semester && <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{user.semester}</span>}
              {user?.provider === 'google' && <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Google Account</span>}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <p style={{ opacity: 0.7, fontSize: '0.75rem', marginBottom: '2px' }}>Miembro desde</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{joinDate}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Info */}
        <Section icon={User} title="Información Personal" description="Actualiza tu nombre y datos de perfil">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Nombre completo" required value={form.name} onChange={set('name')} disabled={!editing} placeholder="Tu nombre" />

            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={15} color="var(--text-muted)" />
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CORREO ELECTRÓNICO</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user?.email}</p>
              </div>
              {user?.provider === 'google' && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'var(--info-soft)', color: 'var(--info)', fontWeight: 600 }}>Google</span>}
            </div>

            <Textarea label="Biografía" value={form.bio} onChange={set('bio')} disabled={!editing} placeholder="Cuéntanos sobre ti..." rows={3} />

            {error && <Alert type="error">{error}</Alert>}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              {editing ? (
                <>
                  <Btn type="button" variant="secondary" icon={X} onClick={handleCancel}>Cancelar</Btn>
                  <Btn type="submit" loading={loading} icon={Save}>Guardar cambios</Btn>
                </>
              ) : (
                <Btn type="button" icon={Edit3} onClick={() => setEditing(true)}>Editar perfil</Btn>
              )}
            </div>
          </form>
        </Section>

        {/* Academic Info */}
        <Section icon={GraduationCap} title="Información Académica" description="Carrera, semestre y universidad">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Select label="Carrera" value={form.career} onChange={set('career')} disabled={!editing}>
              <option value="">Sin especificar</option>
              {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Semestre actual" value={form.semester} onChange={set('semester')} disabled={!editing}>
              <option value="">Sin especificar</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Universidad" value={form.university} onChange={set('university')} disabled={!editing} placeholder="Nombre de tu institución" />

            {!editing && (
              <Btn type="button" variant="secondary" icon={Edit3} onClick={() => setEditing(true)} style={{ alignSelf: 'flex-end' }}>Editar</Btn>
            )}
            {editing && (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Btn type="button" variant="secondary" icon={X} onClick={handleCancel}>Cancelar</Btn>
                <Btn type="submit" loading={loading} icon={Save}>Guardar</Btn>
              </div>
            )}
          </form>
        </Section>
      </div>

      {/* Security */}
      {user?.provider !== 'google' && (
        <Section icon={Lock} title="Seguridad" description="Administra tu contraseña de acceso">
          <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
              <Input label="Contraseña actual" type="password" required placeholder="••••••••" value={passForm.currentPassword} onChange={setP('currentPassword')} />
              <Input label="Nueva contraseña" type="password" required placeholder="Mínimo 6 caracteres" value={passForm.newPassword} onChange={setP('newPassword')} hint="Mínimo 6 caracteres" />
              <Input label="Confirmar contraseña" type="password" required placeholder="Repite la nueva" value={passForm.confirmPassword} onChange={setP('confirmPassword')} />
            </div>
            {passError && <Alert type="error">{passError}</Alert>}
            {passSuccess && <Alert type="success">{passSuccess}</Alert>}
            <Btn type="submit" loading={passLoading} icon={Shield} style={{ alignSelf: 'flex-start' }}>Actualizar contraseña</Btn>
          </form>
        </Section>
      )}

      {user?.provider === 'google' && (
        <div className="surface" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.25rem' }}>G</div>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Cuenta de Google</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tu cuenta está vinculada a Google. La seguridad se gestiona desde tu cuenta de Google.</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '4px 12px', borderRadius: '99px', background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 700, flexShrink: 0 }}>
            Vinculada
          </span>
        </div>
      )}
    </div>
  )
}
