// ─────────────────────────────────────────────────────────────────
// Página de Materias — listado con tarjetas clickeables
// Al hacer clic en una tarjeta, navega al detalle de la materia.
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../utils/api.js'
import { defaultSubjects, localGet, localSet } from '../utils/storage.js'
import { Plus, Edit2, Trash2, BookOpen, User, Award, Clock, X, ChevronRight, TrendingUp } from 'lucide-react'
import { Btn, Input, Select, Modal, EmptyState, Badge, StatCard } from '../components/ui.jsx'

const COLORS = ['#5b4cf5', '#7c6ff7', '#059669', '#0284c7', '#d97706', '#dc2626', '#ec4899', '#8b5cf6', '#06b6d4', '#16a34a']
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const diffMap = {
  low: { label: 'Fácil', color: 'var(--success)' },
  medium: { label: 'Moderado', color: 'var(--warning)' },
  high: { label: 'Difícil', color: 'var(--danger)' }
}

function SubjectForm({ subject, onSave, onClose }) {
  const [form, setForm] = useState(subject || { name: '', code: '', credits: 3, color: COLORS[0], professor: '', difficulty: 'medium', schedule: [] })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addSlot = () => set('schedule', [...(form.schedule || []), { day: 'Lunes', startTime: '08:00', endTime: '10:00' }])
  const removeSlot = (i) => set('schedule', form.schedule.filter((_, idx) => idx !== i))
  const updateSlot = (i, k, v) => { const s = [...form.schedule]; s[i] = { ...s[i], [k]: v }; set('schedule', s) }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    await onSave({ ...form, id: form.id || Date.now().toString(), credits: Number(form.credits) })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input label="Nombre de la materia" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Cálculo Diferencial" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Input label="Código" required value={form.code} onChange={e => set('code', e.target.value)} placeholder="MAT-201" />
        <Input label="Créditos" type="number" min="1" max="10" required value={form.credits} onChange={e => set('credits', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Input label="Profesor(a)" value={form.professor} onChange={e => set('professor', e.target.value)} placeholder="Dr. García" />
        <Select label="Dificultad" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
          <option value="low">Fácil</option>
          <option value="medium">Moderado</option>
          <option value="high">Difícil</option>
        </Select>
      </div>
      <div>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Color identificador</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)} style={{ width: '30px', height: '30px', borderRadius: '9px', background: c, border: form.color === c ? '3px solid var(--text-primary)' : '3px solid transparent', cursor: 'pointer', transition: 'transform 0.1s', outline: 'none' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.18)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Horario de clases</p>
          <button type="button" onClick={addSlot} style={{ fontSize: '0.78rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Plus size={13} /> Agregar
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(form.schedule || []).map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <Select value={s.day} onChange={e => updateSlot(i, 'day', e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Input type="time" value={s.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} />
              <Input type="time" value={s.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} />
              <button type="button" onClick={() => removeSlot(i)} style={{ width: '36px', height: '36px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn type="submit" loading={saving}>Guardar materia</Btn>
      </div>
    </form>
  )
}

export function Subjects() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => setSubjects(localGet('subjects', defaultSubjects)))
  }, [])

  const persist = (updated) => { setSubjects(updated); localSet('subjects', updated) }

  const handleSave = async (subject) => {
    try {
      let updated
      if (subject.id && subjects.find(s => s.id === subject.id)) {
        const saved = await api.updateSubject(subject.id, subject).catch(() => subject)
        updated = subjects.map(s => s.id === saved.id ? saved : s)
      } else {
        const saved = await api.createSubject(subject).catch(() => subject)
        updated = [...subjects, saved]
      }
      persist(updated)
    } catch { }
    setModal(null)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeleting(id)
    try { await api.deleteSubject(id) } catch { }
    persist(subjects.filter(s => s.id !== id))
    setDeleting(null)
  }

  const handleEdit = (e, subject) => {
    e.stopPropagation()
    setModal(subject)
  }

  const total = subjects.length
  const credits = subjects.reduce((a, s) => a + (s.credits || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Mis Materias</h1>
          <p className="page-sub">{total} materia{total !== 1 ? 's' : ''} — {credits} créditos totales</p>
        </div>
        <Btn icon={Plus} onClick={() => setModal('new')}>Agregar Materia</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem' }}>
        <StatCard icon={BookOpen} label="Total Materias" value={total} color="var(--accent)" />
        <StatCard icon={Award} label="Créditos" value={credits} color="var(--success)" />
        <StatCard icon={TrendingUp} label="Difíciles" value={subjects.filter(s => s.difficulty === 'high').length} color="var(--danger)" />
        <StatCard icon={Clock} label="Moderadas" value={subjects.filter(s => s.difficulty === 'medium').length} color="var(--warning)" />
      </div>

      {/* Grid */}
      {subjects.length === 0 ? (
        <div className="surface" style={{ padding: '0' }}>
          <EmptyState icon={BookOpen} title="Sin materias registradas" description="Agrega tu primera materia para comenzar a organizar tu semestre."
            action={<Btn icon={Plus} onClick={() => setModal('new')}>Agregar primera materia</Btn>} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {subjects.map((s) => {
            const diff = diffMap[s.difficulty] || diffMap.medium
            return (
              <div key={s.id} onClick={() => navigate(`/subjects/${s.id}`)}
                className="surface"
                style={{ overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}25`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${s.color}50` }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '' }}>
                {/* Color bar */}
                <div style={{ height: '5px', background: s.color }} />
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</h3>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.code}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '0.5rem' }}>
                      <button onClick={e => handleEdit(e, s)} style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={e => handleDelete(e, s.id)} disabled={deleting === s.id} style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                        {deleting === s.id ? <span style={{ width: '12px', height: '12px', border: '2px solid var(--danger)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  {s.professor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>
                      <User size={13} color="var(--text-muted)" /> {s.professor}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                    <Badge color={s.color}>{s.credits} créditos</Badge>
                    <Badge color={diff.color}>{diff.label}</Badge>
                  </div>

                  {s.schedule?.length > 0 && (
                    <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Horario</p>
                      {s.schedule.map((sch, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                          <Clock size={11} color="var(--text-muted)" />
                          <span style={{ fontWeight: 600 }}>{sch.day}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{sch.startTime} – {sch.endTime}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '0.78rem', color: s.color, fontWeight: 600 }}>
                    Ver detalle <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Agregar Materia' : 'Editar Materia'} subtitle={modal === 'new' ? 'Ingresa los datos de tu nueva materia' : `Editando: ${modal.name}`} onClose={() => setModal(null)}>
          <SubjectForm subject={modal !== 'new' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
