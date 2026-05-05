// ─────────────────────────────────────────────────────────────────
// Detalle de Materia — Tareas, Evaluaciones y Horario de una materia
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { api } from '../utils/api.js'
import { defaultSubjects, defaultTasks, defaultEvaluations, localGet, localSet } from '../utils/storage.js'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft, BookOpen, User, Award, Clock, CheckCircle2, Circle,
  AlertTriangle, Calendar, Plus, Edit2, Trash2,
  BarChart3, Target, TrendingUp, X
} from 'lucide-react'
import { Btn, Badge, EmptyState, StatCard, Modal, Input, Select, Textarea } from '../components/ui.jsx'

const diffMap = {
  low:    { label: 'Fácil',    color: 'var(--success)' },
  medium: { label: 'Moderado', color: 'var(--warning)' },
  high:   { label: 'Difícil',  color: 'var(--danger)'  },
}
const TYPE_LABELS = { exam: 'Examen', quiz: 'Quiz', final: 'Final', midterm: 'Parcial', oral: 'Oral', lab: 'Lab', project: 'Proyecto', workshop: 'Taller', homework: 'Tarea' }
const PRIORITY_CFG = {
  high:   { label: 'Alta',  color: 'var(--danger)'  },
  medium: { label: 'Media', color: 'var(--warning)' },
  low:    { label: 'Baja',  color: 'var(--success)' },
}
const EVAL_STATUS = {
  pending:  { label: 'Pendiente', color: 'var(--text-muted)' },
  studying: { label: 'Estudiando', color: 'var(--warning)' },
  done:     { label: 'Realizada', color: 'var(--info)' },
  passed:   { label: 'Aprobada', color: 'var(--success)' },
  failed:   { label: 'Reprobada', color: 'var(--danger)' },
}

// ── Formulario de Tareas ─────────────────────────────────────────
function QuickTaskForm({ task, subjectId, onSave, onClose }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState(() => task ? {
    ...task, dueDate: new Date(task.dueDate).toISOString().split('T')[0],
  } : {
    title: '', description: '', dueDate: todayStr,
    type: 'assignment', estimatedHours: 2, priority: 'medium', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, id: form.id || Date.now().toString(), subjectId, dueDate: new Date(form.dueDate).toISOString(), estimatedHours: Number(form.estimatedHours) })
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input label="Título *" value={form.title} onChange={set('title')} placeholder="Ej. Taller de derivadas" />
      <Textarea label="Descripción" value={form.description || ''} onChange={set('description')} placeholder="Detalles de la tarea..." rows={2} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Input label="Fecha límite" type="date" value={form.dueDate} onChange={set('dueDate')} />
        <Input label="Horas estimadas" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={set('estimatedHours')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Select label="Tipo" value={form.type} onChange={set('type')}>
          <option value="assignment">Tarea</option>
          <option value="reading">Lectura</option>
          <option value="project">Proyecto</option>
          <option value="lab">Laboratorio</option>
          <option value="presentation">Presentación</option>
        </Select>
        <Select label="Prioridad" value={form.priority} onChange={set('priority')}>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </Select>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn loading={saving} onClick={handleSave}>{task ? 'Guardar cambios' : 'Agregar tarea'}</Btn>
      </div>
    </div>
  )
}

// ── Formulario de Evaluaciones ───────────────────────────────────
function EvalForm({ evalData, subjectId, onSave, onClose }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState(() => evalData ? {
    ...evalData,
    date: new Date(evalData.date).toISOString().split('T')[0],
    topics: (evalData.topics || []).join(', '),
    studyMaterials: (evalData.studyMaterials || []).join(', '),
  } : {
    title: '', type: 'exam', date: todayStr, weight: 20,
    estimatedStudyHours: 5, difficulty: 'medium', location: '',
    description: '', topics: '', studyMaterials: '',
    status: 'pending', score: '', maxScore: 100, notes: '', feedback: '',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    const payload = {
      ...form,
      id: form.id || Date.now().toString(),
      subjectId,
      date: new Date(form.date).toISOString(),
      weight: Number(form.weight),
      estimatedStudyHours: Number(form.estimatedStudyHours),
      maxScore: Number(form.maxScore),
      score: form.score !== '' ? Number(form.score) : null,
      topics: form.topics ? form.topics.split(',').map(t => t.trim()).filter(Boolean) : [],
      studyMaterials: form.studyMaterials ? form.studyMaterials.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input label="Título *" value={form.title} onChange={set('title')} placeholder="Ej. Parcial 1 – Derivadas" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Select label="Tipo" value={form.type} onChange={set('type')}>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Select label="Dificultad" value={form.difficulty} onChange={set('difficulty')}>
          <option value="easy">Fácil</option>
          <option value="medium">Moderado</option>
          <option value="hard">Difícil</option>
          <option value="very_hard">Muy difícil</option>
        </Select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Input label="Fecha *" type="date" value={form.date} onChange={set('date')} />
        <Input label="Peso en nota (%)" type="number" min="1" max="100" value={form.weight} onChange={set('weight')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Input label="Horas de estudio estimadas" type="number" min="0.5" step="0.5" value={form.estimatedStudyHours} onChange={set('estimatedStudyHours')} />
        <Input label="Aula / lugar" value={form.location} onChange={set('location')} placeholder="Ej. Salón 301" />
      </div>
      <Textarea label="Descripción / formato" value={form.description} onChange={set('description')} placeholder="Qué cubre, duración, materiales permitidos..." rows={2} />
      <Input label="Temas (separados por coma)" value={form.topics} onChange={set('topics')} placeholder="Límites, Derivadas, Regla de la cadena" />
      <Input label="Materiales de estudio (separados por coma)" value={form.studyMaterials} onChange={set('studyMaterials')} placeholder="Libro Stewart, Apuntes, Khan Academy" />

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.875rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <Select label="Estado" value={form.status} onChange={set('status')}>
          {Object.entries(EVAL_STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </Select>
        <Input label="Calificación obtenida" type="number" min="0" value={form.score} onChange={set('score')} placeholder="—" />
        <Input label="Nota máxima" type="number" min="1" value={form.maxScore} onChange={set('maxScore')} />
      </div>
      <Textarea label="Notas personales" value={form.notes} onChange={set('notes')} rows={2} placeholder="Apuntes post-evaluación..." />

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn loading={saving} onClick={handleSave}>{evalData ? 'Guardar cambios' : 'Registrar evaluación'}</Btn>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────
export function SubjectDetail() {
  const { id } = useParams()
  const [subject, setSubject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [activeTab, setActiveTab] = useState('tasks')
  const [taskModal, setTaskModal] = useState(null)
  const [evalModal, setEvalModal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [subjects, allTasks, allEvals] = await Promise.all([
          api.getSubjects(), api.getTasks(), api.getEvaluations()
        ])
        const sub = subjects.find(s => s.id === id)
        setSubject(sub)
        setTasks(allTasks.filter(t => t.subjectId === id).map(t => ({ ...t, dueDate: new Date(t.dueDate) })))
        setEvaluations(allEvals.filter(e => e.subjectId === id).map(e => ({ ...e, date: new Date(e.date) })))
      } catch {
        const subjects = localGet('subjects', defaultSubjects)
        const sub = subjects.find(s => s.id === id)
        setSubject(sub)
        const allTasks = localGet('tasks', defaultTasks()).map(t => ({ ...t, dueDate: new Date(t.dueDate) }))
        const allEvals = localGet('evaluations', defaultEvaluations()).map(e => ({ ...e, date: new Date(e.date) }))
        setTasks(allTasks.filter(t => t.subjectId === id))
        setEvaluations(allEvals.filter(e => e.subjectId === id))
      }
      setLoading(false)
    }
    load()
  }, [id])

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    const updated = { ...task, completed: !task.completed }
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
    try { await api.updateTask(taskId, { completed: updated.completed }) } catch {}
    const allTasks = localGet('tasks', [])
    localSet('tasks', allTasks.map(t => t.id === taskId ? { ...t, completed: updated.completed } : t))
  }

  const handleSaveTask = async (taskData) => {
    try {
      let updated
      if (taskData.id && tasks.find(t => t.id === taskData.id)) {
        const saved = await api.updateTask(taskData.id, taskData).catch(() => taskData)
        updated = tasks.map(t => t.id === saved.id ? { ...saved, dueDate: new Date(saved.dueDate) } : t)
      } else {
        const saved = await api.createTask({ ...taskData, subjectId: id }).catch(() => ({ ...taskData, subjectId: id }))
        updated = [...tasks, { ...saved, dueDate: new Date(saved.dueDate) }]
      }
      setTasks(updated)
    } catch {}
    setTaskModal(null)
  }

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try { await api.deleteTask(taskId) } catch {}
  }

  const handleSaveEval = async (evalData) => {
    try {
      let updated
      if (evalData.id && evaluations.find(e => e.id === evalData.id)) {
        const saved = await api.updateEvaluation(evalData.id, evalData).catch(() => evalData)
        updated = evaluations.map(e => e.id === saved.id ? { ...saved, date: new Date(saved.date) } : e)
      } else {
        const saved = await api.createEvaluation({ ...evalData, subjectId: id }).catch(() => ({ ...evalData, subjectId: id }))
        updated = [...evaluations, { ...saved, date: new Date(saved.date) }]
      }
      setEvaluations(updated)
    } catch {}
    setEvalModal(null)
  }

  const deleteEval = async (evalId) => {
    setEvaluations(prev => prev.filter(e => e.id !== evalId))
    try { await api.deleteEvaluation(evalId) } catch {}
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Cargando materia...
    </div>
  )
  if (!subject) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
      <BookOpen size={40} color="var(--text-muted)" strokeWidth={1.2} />
      <p style={{ color: 'var(--text-muted)' }}>Materia no encontrada</p>
      <Link to="/subjects"><Btn variant="secondary" icon={ArrowLeft}>Volver</Btn></Link>
    </div>
  )

  const diff = diffMap[subject.difficulty] || diffMap.medium
  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)
  const completionRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
  const upcomingEvals = evaluations.filter(e => e.date >= new Date()).sort((a, b) => a.date - b.date)
  const now = new Date()

  const TABS = [
    { id: 'tasks',       label: `Tareas (${tasks.length})`,       icon: CheckCircle2 },
    { id: 'evaluations', label: `Evaluaciones (${evaluations.length})`, icon: Target   },
    { id: 'schedule',    label: 'Horario',                          icon: Calendar     },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Back */}
      <Link to="/subjects" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        <ArrowLeft size={14} /> Volver a Materias
      </Link>

      {/* Header */}
      <div className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ height: '5px', background: subject.color }} />
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '15px', flexShrink: 0, background: `${subject.color}18`, border: `2px solid ${subject.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} color={subject.color} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{subject.name}</h1>
              <Badge color={subject.color}>{subject.code}</Badge>
              <Badge color={diff.color}>{diff.label}</Badge>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {subject.professor && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={12} /> {subject.professor}
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={12} /> {subject.credits} créditos
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <TrendingUp size={12} /> {completionRate}% completado
              </span>
            </div>
          </div>
          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Btn icon={Plus} size="sm" variant="secondary" onClick={() => setEvalModal('new')}>Evaluación</Btn>
            <Btn icon={Plus} size="sm" onClick={() => setTaskModal('new')}>Nueva tarea</Btn>
          </div>
        </div>

        {/* Mini stats + progress */}
        <div style={{ padding: '0 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.625rem' }}>
            <StatCard icon={CheckCircle2} label="Completadas" value={done.length} sub={`de ${tasks.length}`} color="var(--success)" />
            <StatCard icon={Clock} label="Pendientes" value={pending.length} color="var(--warning)" />
            <StatCard icon={Target} label="Evaluaciones" value={evaluations.length} sub={`${upcomingEvals.length} próx.`} color="var(--accent)" />
          </div>
          <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completionRate}%`, background: subject.color, borderRadius: '99px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '3px', gap: '2px', width: 'fit-content' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: '0.4rem 0.875rem', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, background: activeTab === id ? 'var(--bg-surface)' : 'transparent', color: activeTab === id ? subject.color : 'var(--text-muted)', boxShadow: activeTab === id ? 'var(--sh-sm)' : 'none', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
            <Icon size={13} strokeWidth={activeTab === id ? 2.3 : 1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Tareas ── */}
      {activeTab === 'tasks' && (
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{tasks.length} tareas registradas</p>
            <Btn icon={Plus} size="sm" onClick={() => setTaskModal('new')}>Nueva tarea</Btn>
          </div>
          {tasks.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Sin tareas" description="Agrega la primera tarea para esta materia." action={<Btn icon={Plus} onClick={() => setTaskModal('new')}>Agregar tarea</Btn>} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasks.sort((a, b) => a.dueDate - b.dueDate).map(task => {
                const days = differenceInDays(task.dueDate, now)
                const overdue = !task.completed && days < 0
                const pc = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium
                return (
                  <div key={task.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: overdue ? 'var(--danger-soft)' : task.completed ? 'var(--success-soft)' : 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: overdue ? '1px solid var(--danger)22' : '1px solid transparent' }}>
                    <button onClick={() => toggleTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--success)' : 'var(--text-muted)', padding: 0, flexShrink: 0, transition: 'color 0.15s' }}>
                      {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge color={pc.color}>{pc.label}</Badge>
                        <span style={{ fontSize: '0.7rem', color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {task.completed ? '✓ Completada' : overdue ? `Vencida hace ${-days}d` : days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : format(task.dueDate, "d MMM", { locale: es })}
                        </span>
                        {task.estimatedHours && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{task.estimatedHours}h</span>}
                      </div>
                    </div>
                    <button onClick={() => setTaskModal(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'color 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'color 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Evaluaciones ── */}
      {activeTab === 'evaluations' && (
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{evaluations.length} evaluaciones registradas</p>
            <Btn icon={Plus} size="sm" onClick={() => setEvalModal('new')}>Nueva evaluación</Btn>
          </div>
          {evaluations.length === 0 ? (
            <EmptyState icon={Target} title="Sin evaluaciones" description="Registra las evaluaciones de esta materia para que la IA pueda organizarlas." action={<Btn icon={Plus} onClick={() => setEvalModal('new')}>Agregar evaluación</Btn>} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {evaluations.sort((a, b) => a.date - b.date).map(ev => {
                const days = differenceInDays(ev.date, now)
                const isPast = ev.date < now
                const st = EVAL_STATUS[ev.status] || EVAL_STATUS.pending
                const urgColor = isPast ? 'var(--text-muted)' : days <= 3 ? 'var(--danger)' : days <= 7 ? 'var(--warning)' : 'var(--success)'
                return (
                  <div key={ev.id} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', borderLeft: `4px solid ${subject.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ev.title}</p>
                          <Badge color={st.color}>{st.label}</Badge>
                          <Badge color="var(--text-muted)">{TYPE_LABELS[ev.type] || ev.type}</Badge>
                          <Badge color="var(--danger)">{ev.weight}% nota</Badge>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', color: urgColor, fontWeight: 600 }}>
                            📅 {format(ev.date, "d MMM yyyy", { locale: es })}
                            {!isPast && ` · ${days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `en ${days}d`}`}
                          </span>
                          {ev.location && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {ev.location}</span>}
                          {ev.estimatedStudyHours && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📚 ~{ev.estimatedStudyHours}h estudio</span>}
                          {ev.score != null && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>✓ {ev.score}/{ev.maxScore}</span>}
                        </div>
                        {ev.topics?.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {ev.topics.slice(0, 4).map(t => <Badge key={t} color="var(--accent)">{t}</Badge>)}
                            {ev.topics.length > 4 && <Badge color="var(--text-muted)">+{ev.topics.length - 4}</Badge>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button onClick={() => setEvalModal(ev)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'color 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => deleteEval(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'color 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {ev.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>{ev.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Horario ── */}
      {activeTab === 'schedule' && (
        <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Clases de {subject.name}</p>
          {!subject.schedule || subject.schedule.length === 0 ? (
            <EmptyState icon={Calendar} title="Sin horario configurado" description="Edita la materia para agregar el horario de clases." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {subject.schedule.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${subject.color}` }}>
                  <div style={{ width: '80px', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: subject.color }}>{s.day}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.startTime} – {s.endTime}</p>
                    {s.room && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.room}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Tarea ── */}
      {taskModal && (
        <Modal title={taskModal === 'new' ? 'Nueva Tarea' : 'Editar Tarea'} subtitle={`Para: ${subject.name}`} onClose={() => setTaskModal(null)}>
          <QuickTaskForm task={taskModal !== 'new' ? taskModal : null} subjectId={id} onSave={handleSaveTask} onClose={() => setTaskModal(null)} />
        </Modal>
      )}

      {/* ── Modal: Evaluación ── */}
      {evalModal && (
        <Modal title={evalModal === 'new' ? 'Nueva Evaluación' : 'Editar Evaluación'} subtitle={`Para: ${subject.name}`} onClose={() => setEvalModal(null)} maxWidth="600px">
          <EvalForm evalData={evalModal !== 'new' ? evalModal : null} subjectId={id} onSave={handleSaveEval} onClose={() => setEvalModal(null)} />
        </Modal>
      )}
    </div>
  )
}
