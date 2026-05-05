// ─────────────────────────────────────────────────────────────────
// Página de Tareas — listado, filtros, creación y edición de tareas
// Las tareas se pueden filtrar por estado y ordenar por fecha de entrega.
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState, useRef } from 'react'
import { api } from '../utils/api.js'
import { defaultTasks, defaultSubjects, localGet, localSet } from '../utils/storage.js'
import { format, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus, CheckSquare, Square, Trash2, Edit2,
  ChevronRight, X, Clock, BookOpen, Flag,
  LayoutList, AlignJustify, Calendar, Search,
  AlertTriangle, Check, Circle
} from 'lucide-react'
import { Btn, Input, Select, Textarea, Modal, EmptyState, StatCard, Alert, IconBtn } from '../components/ui.jsx'

/* ── Constants ─────────────────────────────────────────── */
const TYPE_LABELS  = { assignment: 'Tarea', reading: 'Lectura', project: 'Proyecto', lab: 'Laboratorio', presentation: 'Presentación' }
const PRIORITY_CFG = {
  high:   { label: 'Alta',  color: 'var(--danger)',  chipClass: 'chip chip-danger' },
  medium: { label: 'Media', color: 'var(--warning)', chipClass: 'chip chip-warning' },
  low:    { label: 'Baja',  color: 'var(--success)', chipClass: 'chip chip-success' },
}

function normalize(t) {
  return { ...t, dueDate: t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate) }
}

function dueMeta(date, completed) {
  if (completed) return { label: 'Completada', color: 'var(--success)' }
  if (isToday(date))    return { label: 'Hoy',       color: 'var(--danger)' }
  if (isTomorrow(date)) return { label: 'Mañana',    color: 'var(--warning)' }
  const d = differenceInDays(date, new Date())
  if (d < 0)  return { label: `Vencida ${-d}d`,  color: 'var(--danger)' }
  if (d <= 3) return { label: `${d} días`,        color: 'var(--warning)' }
  return { label: format(date, "d MMM", { locale: es }), color: 'var(--text-muted)' }
}

/* ── Task Form (drawer) ─────────────────────────────────── */
function TaskDrawer({ task, subjects, onSave, onClose }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState(() => task ? {
    ...task,
    dueDate: new Date(task.dueDate).toISOString().split('T')[0],
  } : {
    title: '', description: '', subjectId: subjects[0]?.id || '',
    dueDate: todayStr, type: 'assignment', estimatedHours: 2,
    priority: 'medium', completed: false, notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const firstRef = useRef(null)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => { firstRef.current?.focus() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('El título es requerido'); return }
    setSaving(true); setError('')
    await onSave({
      ...form,
      id: form.id || Date.now().toString(),
      dueDate: new Date(form.dueDate).toISOString(),
      estimatedHours: Number(form.estimatedHours),
    })
    setSaving(false)
  }

  const isEdit = !!task

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 190, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.15s ease both' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '480px',
        background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
        zIndex: 200, display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)',
        animation: 'slideIn 0.22s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {isEdit ? 'Editar tarea' : 'Nueva tarea'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {isEdit ? 'Modifica los detalles de esta actividad' : 'Registra una nueva actividad académica'}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Título *</label>
              <input ref={firstRef} required value={form.title} onChange={set('title')} placeholder="Nombre de la actividad..."
                style={{ width: '100%', height: '40px', padding: '0 0.875rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {/* Description */}
            <Textarea label="Descripción / instrucciones" value={form.description} onChange={set('description')} rows={3} placeholder="Detalles, instrucciones del profesor, referencia de páginas..." />

            {/* Row: subject + type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Select label="Materia" value={form.subjectId} onChange={set('subjectId')}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Select label="Tipo de actividad" value={form.type} onChange={set('type')}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>

            {/* Row: date + hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input label="Fecha límite *" type="date" required value={form.dueDate} onChange={set('dueDate')} />
              <Input label="Horas estimadas" type="number" min="0.5" max="200" step="0.5" value={form.estimatedHours} onChange={set('estimatedHours')} />
            </div>

            {/* Priority — visual selector */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Prioridad</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Object.entries(PRIORITY_CFG).map(([k, cfg]) => (
                  <button key={k} type="button" onClick={() => setForm(p => ({ ...p, priority: k }))}
                    style={{ flex: 1, height: '34px', borderRadius: 'var(--r-md)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.12s', border: `1px solid ${form.priority === k ? cfg.color : 'var(--border)'}`, background: form.priority === k ? `${cfg.color}14` : 'var(--bg-surface)', color: form.priority === k ? cfg.color : 'var(--text-muted)' }}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Textarea label="Notas adicionales (opcional)" value={form.notes || ''} onChange={set('notes')} rows={2} placeholder="Apuntes rápidos, recursos, links..." />

            {/* Status (edit mode) */}
            {isEdit && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.completed ? 'Marcada como completada' : 'Pendiente de completar'}</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, completed: !p.completed }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.875rem', height: '30px', borderRadius: 'var(--r-md)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${form.completed ? 'var(--success)' : 'var(--border)'}`, background: form.completed ? 'var(--success-soft)' : 'var(--bg-surface)', color: form.completed ? 'var(--success)' : 'var(--text-secondary)', transition: 'all 0.12s' }}>
                  {form.completed ? <><Check size={12} /> Completada</> : <><Circle size={12} /> Pendiente</>}
                </button>
              </div>
            )}

            {error && <Alert type="error">{error}</Alert>}
          </div>

          {/* Footer actions */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', background: 'var(--bg-surface)' }}>
            <Btn type="button" variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" loading={saving} icon={isEdit ? Check : Plus}>
              {isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </Btn>
          </div>
        </form>
      </div>
    </>
  )
}

/* ── Task Detail Panel (right side) ─────────────────────── */
function TaskDetail({ task, subjects, onEdit, onClose, onToggle, onDelete }) {
  if (!task) return null
  const sub = subjects.find(s => s.id === task.subjectId)
  const pr = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium
  const dm = dueMeta(task.dueDate, task.completed)
  const days = differenceInDays(task.dueDate, new Date())
  const overdue = days < 0 && !task.completed

  return (
    <div style={{ width: '320px', flexShrink: 0, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Detail header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="label">Detalle</p>
        <button onClick={onClose} style={{ width: '24px', height: '24px', borderRadius: 'var(--r-sm)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {/* Status + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button onClick={() => onToggle(task.id)} style={{ marginTop: '2px', background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0, padding: 0, transition: 'color 0.12s' }}>
            {task.completed ? <CheckSquare size={20} strokeWidth={2} /> : <Square size={20} strokeWidth={1.5} />}
          </button>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.35, textDecoration: task.completed ? 'line-through' : 'none', textDecorationColor: 'var(--text-muted)' }}>
            {task.title}
          </p>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: '1.25rem' }}>
          {[
            { label: 'Materia', value: sub ? <><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: sub.color, marginRight: '6px' }} />{sub.name}</> : '—' },
            { label: 'Tipo', value: TYPE_LABELS[task.type] || task.type },
            { label: 'Prioridad', value: <span style={{ color: pr.color, fontWeight: 600 }}>{pr.label}</span> },
            { label: 'Fecha límite', value: <span style={{ color: dm.color, fontWeight: 600 }}>{format(task.dueDate, "EEEE d 'de' MMMM", { locale: es })}</span> },
            { label: 'Tiempo est.', value: `${task.estimatedHours}h` },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.875rem', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-surface)' }}>
              <p className="label" style={{ width: '90px', flexShrink: 0 }}>{row.label}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Overdue warning */}
        {overdue && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.625rem 0.875rem', background: 'var(--danger-soft)', border: '1px solid var(--danger)22', borderRadius: 'var(--r-md)', marginBottom: '1.25rem' }}>
            <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 500 }}>Vencida hace {-days} {-days === 1 ? 'día' : 'días'}</p>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="label" style={{ marginBottom: '0.5rem' }}>Descripción</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              {task.description}
            </p>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div>
            <p className="label" style={{ marginBottom: '0.5rem' }}>Notas</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              {task.notes}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <Btn variant="secondary" icon={Edit2} onClick={() => onEdit(task)} style={{ flex: 1 }} size="sm">Editar</Btn>
        <Btn variant="danger" icon={Trash2} onClick={() => onDelete(task.id)} size="sm" style={{ flex: 1 }}>Eliminar</Btn>
      </div>
    </div>
  )
}

/* ── Main Tasks Page ────────────────────────────────────── */
export function Tasks() {
  const [tasks, setTasks]       = useState([])
  const [subjects, setSubjects] = useState([])
  const [drawer, setDrawer]     = useState(null)   // null = cerrado | 'new' = crear | objeto = editar
  const [selected, setSelected] = useState(null)   // tarea seleccionada para el panel de detalle
  const [filter, setFilter]     = useState('all')  // all = todas | pending = pendientes | completed = completadas
  const [priority, setPriority] = useState('all')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [t, s] = await Promise.all([api.getTasks(), api.getSubjects()])
        setTasks(t.map(normalize)); setSubjects(s)
      } catch {
        setTasks(localGet('tasks', defaultTasks()).map(normalize))
        setSubjects(localGet('subjects', defaultSubjects))
      }
    }
    load()
  }, [])

  /* Update selected task when tasks list changes */
  useEffect(() => {
    if (selected) setSelected(prev => tasks.find(t => t.id === prev.id) || null)
  }, [tasks])

  const persist = updated => { setTasks(updated); localSet('tasks', updated) }

  const handleSave = async task => {
    try {
      let updated
      if (task.id && tasks.find(t => t.id === task.id)) {
        const saved = await api.updateTask(task.id, task).catch(() => task)
        updated = tasks.map(t => t.id === saved.id ? normalize(saved) : t)
      } else {
        const saved = await api.createTask(task).catch(() => task)
        updated = [...tasks, normalize(saved)]
      }
      persist(updated)
    } catch {}
    setDrawer(null)
  }

  const toggle = async id => {
    const task = tasks.find(t => t.id === id)
    const upd  = { ...task, completed: !task.completed }
    persist(tasks.map(t => t.id === id ? upd : t))
    try { await api.updateTask(id, { completed: upd.completed }) } catch {}
  }

  const remove = async id => {
    persist(tasks.filter(t => t.id !== id))
    if (selected?.id === id) setSelected(null)
    try { await api.deleteTask(id) } catch {}
  }

  const openEdit = task => { setDrawer(task); setSelected(null) }

  /* Filter chain */
  const filtered = tasks
    .filter(t => {
      if (filter === 'pending')   return !t.completed
      if (filter === 'completed') return t.completed
      return true
    })
    .filter(t => priority === 'all' ? true : t.priority === priority)
    .filter(t => search ? t.title.toLowerCase().includes(search.toLowerCase()) : true)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return a.dueDate - b.dueDate
    })

  const pending   = tasks.filter(t => !t.completed)
  const done      = tasks.filter(t => t.completed)
  const overdueCt = pending.filter(t => isPast(t.dueDate) && !isToday(t.dueDate)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Page header */}
      <div className="appear" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="page-title">Tareas</h1>
          <p className="page-sub">{pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {done.length} completada{done.length !== 1 ? 's' : ''}</p>
        </div>
        <Btn icon={Plus} onClick={() => { setDrawer('new'); setSelected(null) }}>Nueva tarea</Btn>
      </div>

      {/* Stats */}
      <div className="appear-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px,1fr))', gap: '0.75rem' }}>
        <StatCard icon={AlignJustify}   label="Total"       value={tasks.length}  color="var(--accent)" />
        <StatCard icon={Square}         label="Pendientes"  value={pending.length} color="var(--warning)" />
        <StatCard icon={CheckSquare}    label="Completadas" value={done.length}   color="var(--success)" />
        <StatCard icon={AlertTriangle}  label="Vencidas"    value={overdueCt}     color="var(--danger)" />
      </div>

      {/* Vencidas warning */}
      {overdueCt > 0 && (
        <div className="appear-2" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', background: 'var(--danger-soft)', border: '1px solid var(--danger)33', borderRadius: 'var(--r-md)' }}>
          <AlertTriangle size={14} color="var(--danger)" strokeWidth={2} />
          <p style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 500 }}>
            {overdueCt} tarea{overdueCt !== 1 ? 's' : ''} vencida{overdueCt !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="appear-3" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={13} strokeWidth={2} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            style={{ width: '100%', height: '34px', padding: '0 0.875rem 0 2.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '2px', gap: '1px' }}>
          {[['all','Todas'], ['pending','Pendientes'], ['completed','Completadas']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding: '0 0.875rem', height: '30px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, background: filter === v ? 'var(--bg-surface)' : 'transparent', color: filter === v ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: filter === v ? 'var(--sh-xs)' : 'none', transition: 'all 0.12s', whiteSpace: 'nowrap' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '2px', gap: '1px' }}>
          {[['all','Todas'], ['high','Alta'], ['medium','Media'], ['low','Baja']].map(([v, l]) => (
            <button key={v} onClick={() => setPriority(v)}
              style={{ padding: '0 0.75rem', height: '30px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, background: priority === v ? 'var(--bg-surface)' : 'transparent', color: priority === v ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: priority === v ? 'var(--sh-xs)' : 'none', transition: 'all 0.12s' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table + detail panel */}
      <div className="appear-4" style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--bg-surface)', boxShadow: 'var(--sh-sm)', flex: 1, minHeight: '400px' }}>

        {/* Task table */}
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {filtered.length === 0 ? (
            <EmptyState icon={AlignJustify} title="Sin tareas"
              description={search ? 'No hay coincidencias para tu búsqueda.' : 'Crea tu primera tarea para comenzar.'}
              action={!search && <Btn icon={Plus} onClick={() => setDrawer('new')} size="sm">Crear tarea</Btn>} />
          ) : (
            <table className="data-table" style={{ minWidth: '560px' }}>
              <thead>
                <tr>
                  <th style={{ width: '36px' }} />
                  <th>Tarea</th>
                  <th style={{ width: '120px' }}>Materia</th>
                  <th style={{ width: '90px' }}>Prioridad</th>
                  <th style={{ width: '110px' }}>Fecha límite</th>
                  <th style={{ width: '70px' }}>Tiempo</th>
                  <th style={{ width: '72px' }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => {
                  const sub = subjects.find(s => s.id === task.subjectId)
                  const pr  = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium
                  const dm  = dueMeta(task.dueDate, task.completed)
                  const isSelected = selected?.id === task.id
                  return (
                    <tr key={task.id}
                      onClick={() => setSelected(isSelected ? null : task)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'var(--accent-soft)' : undefined,
                        opacity: task.completed ? 0.55 : 1,
                        transition: 'background 0.1s, opacity 0.2s',
                      }}>
                      {/* Checkbox */}
                      <td onClick={e => { e.stopPropagation(); toggle(task.id) }}
                        style={{ paddingLeft: '0.875rem', paddingRight: '0.25rem', cursor: 'pointer' }}>
                        <div style={{ color: task.completed ? 'var(--success)' : 'var(--text-subtle)', transition: 'color 0.12s' }}>
                          {task.completed ? <CheckSquare size={16} strokeWidth={2} /> : <Square size={16} strokeWidth={1.5} />}
                        </div>
                      </td>

                      {/* Title + type */}
                      <td>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none', textDecorationColor: 'var(--text-muted)', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>{task.title}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{TYPE_LABELS[task.type] || task.type}</p>
                      </td>

                      {/* Subject */}
                      <td>
                        {sub ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: sub.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>{sub.code}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>—</span>}
                      </td>

                      {/* Priority */}
                      <td>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: pr.color }}>{pr.label}</span>
                      </td>

                      {/* Due date */}
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: dm.color }}>{dm.label}</span>
                      </td>

                      {/* Hours */}
                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{task.estimatedHours}h</span>
                      </td>

                      {/* Actions */}
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                          <IconBtn icon={Edit2} variant="ghost" title="Editar" onClick={() => openEdit(task)} />
                          <IconBtn icon={Trash2} variant="danger" title="Eliminar" onClick={() => remove(task.id)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <TaskDetail
            task={selected}
            subjects={subjects}
            onEdit={openEdit}
            onClose={() => setSelected(null)}
            onToggle={toggle}
            onDelete={remove}
          />
        )}
      </div>

      {/* Drawer */}
      {drawer && (
        <TaskDrawer
          task={drawer !== 'new' ? drawer : null}
          subjects={subjects}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}
