// ─────────────────────────────────────────────────────────────────
// Análisis — Estadísticas y visualizaciones del semestre
// NO duplica listas de tareas o evaluaciones (esas viven en sus páginas)
// Se enfoca en tendencias, distribuciones y métricas agregadas.
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { api } from '../utils/api.js'
import { defaultSubjects, defaultTasks, defaultEvaluations, localGet } from '../utils/storage.js'
import { differenceInDays, startOfWeek, addWeeks, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, Target, Clock, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react'
import { StatCard } from '../components/ui.jsx'

const COLORS = ['#7265f8', '#0ea47a', '#d97706', '#ec4899', '#3b82f6', '#a78bfa']

export function Analytics() {
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [evaluations, setEvaluations] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, e] = await Promise.all([api.getSubjects(), api.getTasks(), api.getEvaluations()])
        setSubjects(s)
        setTasks(t.map(x => ({ ...x, dueDate: new Date(x.dueDate) })))
        setEvaluations(e.map(x => ({ ...x, date: new Date(x.date) })))
      } catch {
        setSubjects(localGet('subjects', defaultSubjects))
        setTasks(localGet('tasks', defaultTasks()).map(x => ({ ...x, dueDate: new Date(x.dueDate) })))
        setEvaluations(localGet('evaluations', defaultEvaluations()).map(x => ({ ...x, date: new Date(x.date) })))
      }
    }
    load()
  }, [])

  const now = new Date()
  const done = tasks.filter(t => t.completed)
  const pending = tasks.filter(t => !t.completed)
  const overdue = pending.filter(t => t.dueDate < now)
  const rate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
  const totalStudyH = evaluations.reduce((a, e) => a + (e.estimatedStudyHours || 0), 0)

  // Carga por semana (próximas 6 semanas)
  const weeklyData = Array.from({ length: 6 }, (_, i) => {
    const ws = startOfWeek(addWeeks(now, i), { weekStartsOn: 1 })
    const we = addWeeks(ws, 1)
    const label = i === 0 ? 'Esta sem.' : i === 1 ? 'Próx. sem.' : format(ws, 'd MMM', { locale: es })
    const tareas = tasks.filter(t => !t.completed && t.dueDate >= ws && t.dueDate < we).length
    const evals = evaluations.filter(e => e.date >= ws && e.date < we).length
    return { semana: label, tareas, evaluaciones: evals }
  })

  // Tareas por materia
  const tasksBySubject = subjects.map(s => ({
    name: s.code || s.name.slice(0, 8),
    completadas: tasks.filter(t => t.subjectId === s.id && t.completed).length,
    pendientes: tasks.filter(t => t.subjectId === s.id && !t.completed).length,
    color: s.color,
  })).filter(s => (s.completadas + s.pendientes) > 0)

  // Distribución de prioridades
  const prioData = [
    { name: 'Alta', value: pending.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Media', value: pending.filter(t => t.priority === 'medium').length, color: '#d97706' },
    { name: 'Baja', value: pending.filter(t => t.priority === 'low').length, color: '#0ea47a' },
  ].filter(p => p.value > 0)

  // Peso promedio ponderado por materia
  const evalBySubject = subjects.map(s => {
    const evs = evaluations.filter(e => e.subjectId === s.id)
    const pesoTotal = evs.reduce((a, e) => a + (e.weight || 0), 0)
    const scored = evs.filter(e => e.score != null)
    const promedio = scored.length ? scored.reduce((a, e) => a + (e.score / e.maxScore) * 100, 0) / scored.length : null
    return { name: s.code || s.name.slice(0, 8), pesoTotal, promedio, evals: evs.length }
  }).filter(s => s.evals > 0)

  const ChartCard = ({ title, subtitle, children }) => (
    <div className="surface" style={{ padding: '1.25rem 1.5rem' }}>
      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</p>
      {subtitle && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{subtitle}</p>}
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stats resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
        <StatCard icon={CheckCircle2} label="Completadas" value={done.length} sub={`${rate}% del total`} color="var(--success)" />
        <StatCard icon={Clock} label="Pendientes" value={pending.length} sub={overdue.length > 0 ? `${overdue.length} vencidas` : 'Sin vencer'} color="var(--warning)" />
        <StatCard icon={Target} label="Evaluaciones" value={evaluations.length} sub={`${totalStudyH}h estudio`} color="var(--accent)" />
        <StatCard icon={BookOpen} label="Materias" value={subjects.length} sub={`${subjects.reduce((a, s) => a + (s.credits || 0), 0)} créditos`} color="var(--accent-dim)" />
      </div>

      {/* Carga semanal */}
      <ChartCard title="Carga por Semana" subtitle="Actividades y evaluaciones en las próximas 6 semanas">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} barSize={14} barGap={4}>
            <XAxis dataKey="semana" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' }} />
            <Bar dataKey="tareas" name="Tareas" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="evaluaciones" name="Evaluaciones" fill="var(--danger)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Grid: tareas por materia + distribución prioridades */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Tareas por materia */}
        {tasksBySubject.length > 0 && (
          <ChartCard title="Tareas por Materia" subtitle="Completadas vs pendientes">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tasksBySubject} layout="vertical" barSize={10} barGap={3}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' }} />
                <Bar dataKey="completadas" name="Completadas" fill="var(--success)" radius={[0, 4, 4, 0]} stackId="a" />
                <Bar dataKey="pendientes" name="Pendientes" fill="var(--warning)" radius={[0, 4, 4, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Distribución prioridades */}
        {prioData.length > 0 && (
          <ChartCard title="Prioridad de Pendientes" subtitle="Distribución de tareas sin completar">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={prioData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                  {prioData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Peso de evaluaciones por materia */}
      {evalBySubject.length > 0 && (
        <ChartCard title="Peso Acumulado de Evaluaciones" subtitle="Porcentaje total de nota por materia (puede superar 100% si hay compensaciones)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
            {evalBySubject.map((s, i) => {
              const sub = subjects.find(x => x.code === s.name || x.name.slice(0, 8) === s.name)
              return (
                <div key={i} style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${sub?.color || COLORS[i % COLORS.length]}` }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{sub?.name || s.name}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: sub?.color || 'var(--accent)', lineHeight: 1 }}>{s.pesoTotal}%</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {s.evals} eval{s.evals !== 1 ? 's' : ''} · {s.promedio != null ? `Promedio: ${s.promedio.toFixed(1)}` : 'Sin calificar'}
                  </p>
                </div>
              )
            })}
          </div>
        </ChartCard>
      )}

      {/* Resumen tabular por materia */}
      <div className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Resumen por Materia</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['Materia', 'Créditos', 'Dificultad', 'Tareas Comp.', 'Evaluaciones', 'Carga IA'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => {
                const tDone = tasks.filter(t => t.subjectId === s.id && t.completed).length
                const tTotal = tasks.filter(t => t.subjectId === s.id).length
                const se = evaluations.filter(e => e.subjectId === s.id).length
                const seNext = evaluations.filter(e => e.subjectId === s.id && e.date >= now).length
                const diffCfg = { low: 'Fácil', medium: 'Moderado', high: 'Difícil' }
                const carga = tasks.filter(t => t.subjectId === s.id && !t.completed).length + seNext * 2
                const cargaColor = carga >= 5 ? 'var(--danger)' : carga >= 3 ? 'var(--warning)' : 'var(--success)'
                const cargaLabel = carga >= 5 ? '🔴 Alta' : carga >= 3 ? '🟡 Media' : '🟢 Baja'
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{s.name}</span>
                      </div>
                    </td>
                    <td>{s.credits}</td>
                    <td><span style={{ color: diffCfg[s.difficulty] === 'Difícil' ? 'var(--danger)' : diffCfg[s.difficulty] === 'Moderado' ? 'var(--warning)' : 'var(--success)', fontWeight: 600, fontSize: '0.78rem' }}>{diffCfg[s.difficulty] || '—'}</span></td>
                    <td>{tDone}/{tTotal}</td>
                    <td>{se} ({seNext} próx.)</td>
                    <td><span style={{ color: cargaColor, fontWeight: 600, fontSize: '0.78rem' }}>{cargaLabel}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
