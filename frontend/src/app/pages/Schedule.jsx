// ─────────────────────────────────────────────────────────────────
// Página de Horario — vista semanal, próximos eventos y evaluaciones
// Las evaluaciones se registran con descripción, temas, estado y
// resultado para que la IA pueda analizarlas en el futuro.
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { api } from '../utils/api.js'
import { defaultSubjects, defaultTasks, defaultEvaluations, localGet, localSet } from '../utils/storage.js'
import { format, addDays, startOfWeek, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar, Clock, AlertCircle, Plus, Trash2, Edit2,
  BookOpen, ChevronDown, ChevronUp, Sparkles, Target,
  CheckCircle2, XCircle, FileText
} from 'lucide-react'
import { Btn, Input, Select, Textarea, Modal, EmptyState, Badge, StatCard } from '../components/ui.jsx'

// Días de la semana y horas del horario
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HORAS = Array.from({ length: 14 }, (_, i) => i + 7)

// Tipos de evaluación disponibles
const TIPOS_EVAL = {
  exam:        'Examen',
  quiz:        'Quiz',
  midterm:     'Parcial',
  final:       'Final',
  oral:        'Oral',
  lab:         'Laboratorio',
  project:     'Proyecto',
  workshop:    'Taller',
  homework:    'Tarea evaluada',
}

// Estados posibles de una evaluación
const ESTADOS_EVAL = {
  pending:   { label: 'Pendiente',   color: 'var(--text-muted)' },
  studying:  { label: 'Estudiando',  color: 'var(--warning)'    },
  done:      { label: 'Presentada',  color: 'var(--accent)'     },
  passed:    { label: 'Aprobada',    color: 'var(--success)'    },
  failed:    { label: 'Reprobada',   color: 'var(--danger)'     },
}

// Convierte "HH:MM" a minutos totales (para posicionar en la grilla)
function tiempoAMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// ─────────────────────────────────────────────────────────────────
// Formulario completo para crear/editar evaluaciones
// Incluye todos los campos descriptivos para análisis futuro con IA
// ─────────────────────────────────────────────────────────────────
function FormEvaluacion({ evaluacion, materias, onGuardar, onCerrar }) {
  const hoyStr = new Date().toISOString().split('T')[0]

  // Estado inicial del formulario — vacío o precargado si es edición
  const [form, setForm] = useState(evaluacion ? {
    ...evaluacion,
    date: new Date(evaluacion.date).toISOString().split('T')[0],
    topics: Array.isArray(evaluacion.topics) ? evaluacion.topics.join(', ') : (evaluacion.topics || ''),
    studyMaterials: Array.isArray(evaluacion.studyMaterials) ? evaluacion.studyMaterials.join(', ') : (evaluacion.studyMaterials || ''),
  } : {
    title: '',
    subjectId: materias[0]?.id || '',
    date: hoyStr,
    type: 'exam',
    weight: 20,
    estimatedStudyHours: 5,
    topics: '',
    description: '',
    studyMaterials: '',
    location: '',
    status: 'pending',
    score: '',
    maxScore: 100,
    notes: '',
    feedback: '',
    difficulty: '',
  })

  const [guardando, setGuardando] = useState(false)
  const [seccionAbierta, setSeccionAbierta] = useState('basico') // 'basico' | 'preparacion' | 'resultado'

  // Actualiza un campo del formulario
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    await onGuardar({
      ...form,
      id: form.id || Date.now().toString(),
      date: new Date(form.date).toISOString(),
      weight: Number(form.weight) || 0,
      estimatedStudyHours: Number(form.estimatedStudyHours) || 0,
      score: form.score !== '' ? Number(form.score) : null,
      maxScore: Number(form.maxScore) || 100,
      // Convertir textos separados por coma a arreglos
      topics: form.topics.split(',').map(t => t.trim()).filter(Boolean),
      studyMaterials: form.studyMaterials.split(',').map(t => t.trim()).filter(Boolean),
    })
    setGuardando(false)
  }

  // Determina si mostrar la sección de resultado (solo si ya fue presentada)
  const mostrarResultado = ['done', 'passed', 'failed'].includes(form.status)

  return (
    <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Sección 1: Información básica ── */}
      <SeccionPlegable
        id="basico"
        titulo="Información básica"
        icono={FileText}
        abierta={seccionAbierta === 'basico'}
        onToggle={() => setSeccionAbierta(s => s === 'basico' ? null : 'basico')}
      >
        <Input label="Título de la evaluación" required value={form.title} onChange={set('title')} placeholder="Ej. Parcial 1 – Cálculo Diferencial" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Select label="Materia" value={form.subjectId} onChange={set('subjectId')}>
            {materias.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Tipo de evaluación" value={form.type} onChange={set('type')}>
            {Object.entries(TIPOS_EVAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <Input label="Fecha" type="date" required value={form.date} onChange={set('date')} />
          <Input label="Peso en nota (%)" type="number" min="0" max="100" value={form.weight} onChange={set('weight')} />
          <Input label="Lugar / Aula" value={form.location} onChange={set('location')} placeholder="Ej. Sala 203" />
        </div>
        {/* Estado actual de la evaluación */}
        <Select label="Estado" value={form.status} onChange={set('status')}>
          {Object.entries(ESTADOS_EVAL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        {/* Descripción libre — útil para análisis IA */}
        <Textarea
          label="Descripción general"
          value={form.description}
          onChange={set('description')}
          rows={3}
          placeholder="¿Qué abarca esta evaluación? ¿Qué formato tiene? ¿Es escrita, oral, grupal? Describe todo lo relevante..."
        />
      </SeccionPlegable>

      {/* ── Sección 2: Preparación ── */}
      <SeccionPlegable
        id="preparacion"
        titulo="Preparación y estudio"
        icono={BookOpen}
        abierta={seccionAbierta === 'preparacion'}
        onToggle={() => setSeccionAbierta(s => s === 'preparacion' ? null : 'preparacion')}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            label="Horas de estudio estimadas"
            type="number" min="0" step="0.5"
            value={form.estimatedStudyHours}
            onChange={set('estimatedStudyHours')}
          />
          <Select label="Dificultad percibida" value={form.difficulty} onChange={set('difficulty')}>
            <option value="">Sin calificar</option>
            <option value="easy">Fácil</option>
            <option value="medium">Moderada</option>
            <option value="hard">Difícil</option>
            <option value="very_hard">Muy difícil</option>
          </Select>
        </div>
        {/* Temas del examen — se usan para análisis de áreas débiles con IA */}
        <Input
          label="Temas evaluados (separados por coma)"
          value={form.topics}
          onChange={set('topics')}
          placeholder="Derivadas, Regla de la cadena, Máximos y mínimos, Integrales..."
        />
        {/* Materiales de estudio registrados para trazabilidad */}
        <Input
          label="Materiales de estudio (separados por coma)"
          value={form.studyMaterials}
          onChange={set('studyMaterials')}
          placeholder="Libro cap. 3, Apuntes clase, Videos YouTube, Ejercicios resueltos..."
        />
      </SeccionPlegable>

      {/* ── Sección 3: Resultado (visible solo si ya fue presentada) ── */}
      <SeccionPlegable
        id="resultado"
        titulo="Resultado y retroalimentación"
        icono={Target}
        abierta={seccionAbierta === 'resultado'}
        onToggle={() => setSeccionAbierta(s => s === 'resultado' ? null : 'resultado')}
        badge={mostrarResultado ? undefined : 'Disponible al presentar'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            label="Calificación obtenida"
            type="number" min="0" step="0.1"
            value={form.score ?? ''}
            onChange={set('score')}
            placeholder="Ej. 78"
            disabled={!mostrarResultado}
          />
          <Input
            label="Nota máxima posible"
            type="number" min="1"
            value={form.maxScore}
            onChange={set('maxScore')}
            disabled={!mostrarResultado}
          />
        </div>
        {/* Notas personales post-evaluación — clave para análisis de patrones */}
        <Textarea
          label="Notas personales"
          value={form.notes}
          onChange={set('notes')}
          rows={3}
          placeholder="¿Cómo te fue? ¿Qué temas te fallaron? ¿Cómo fue el tiempo? Escribe libremente..."
          disabled={!mostrarResultado}
        />
        {/* Retroalimentación del profesor — muy útil para la IA */}
        <Textarea
          label="Retroalimentación del profesor"
          value={form.feedback}
          onChange={set('feedback')}
          rows={2}
          placeholder="Comentarios, correcciones o sugerencias que el profesor dio después de la evaluación..."
          disabled={!mostrarResultado}
        />
        {!mostrarResultado && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)' }}>
            ✦ Cambia el estado a "Presentada", "Aprobada" o "Reprobada" para habilitar esta sección
          </p>
        )}
      </SeccionPlegable>

      {/* Aviso de uso futuro por IA */}
      <div style={{
        display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
        background: 'var(--accent-soft)', borderRadius: 'var(--r-md)',
        padding: '0.75rem 1rem', margin: '1rem 0 0.5rem',
        border: '1px solid var(--accent-soft)',
      }}>
        <Sparkles size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--accent)', lineHeight: 1.5 }}>
          <strong>Para análisis con IA:</strong> Cuanto más detallada sea la descripción, los temas y la retroalimentación, mejor podrá la IA identificar tus patrones de estudio y áreas de mejora.
        </p>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <Btn type="button" variant="secondary" onClick={onCerrar}>Cancelar</Btn>
        <Btn type="submit" loading={guardando}>Guardar evaluación</Btn>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────
// Componente auxiliar: sección plegable dentro del formulario
// ─────────────────────────────────────────────────────────────────
function SeccionPlegable({ id, titulo, icono: Icono, abierta, onToggle, badge, children }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Cabecera de la sección — clic para abrir/cerrar */}
      <button type="button" onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.875rem 0', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: abierta ? 'var(--accent-soft)' : 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s', flexShrink: 0,
        }}>
          <Icono size={14} color={abierta ? 'var(--accent)' : 'var(--text-muted)'} />
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: abierta ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
          {titulo}
        </span>
        {badge && (
          <span style={{ fontSize: '0.65rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 7px', borderRadius: '99px', fontWeight: 600 }}>
            {badge}
          </span>
        )}
        {abierta ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
      </button>

      {/* Contenido expandido */}
      {abierta && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingBottom: '1.25rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Página principal de Horario
// ─────────────────────────────────────────────────────────────────
export function Schedule() {
  const [materias, setMaterias] = useState([])
  const [tareas, setTareas] = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])
  const [modal, setModal] = useState(null)
  const [tabActiva, setTabActiva] = useState('timetable')
  const [filtroEstado, setFiltroEstado] = useState('all')

  const hoy = new Date()
  const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 })
  const fechasDias = DIAS.map((_, i) => addDays(inicioSemana, i))

  // Cargar datos desde la API o desde localStorage como respaldo
  useEffect(() => {
    const cargar = async () => {
      try {
        const [s, t, e] = await Promise.all([api.getSubjects(), api.getTasks(), api.getEvaluations()])
        setMaterias(s)
        setTareas(t.map(x => ({ ...x, dueDate: new Date(x.dueDate) })))
        setEvaluaciones(e.map(x => ({ ...x, date: new Date(x.date) })))
      } catch {
        // Respaldo local si el backend no responde
        setMaterias(localGet('subjects', defaultSubjects))
        setTareas(localGet('tasks', defaultTasks()).map(x => ({ ...x, dueDate: new Date(x.dueDate) })))
        setEvaluaciones(localGet('evaluations', defaultEvaluations()).map(x => ({ ...x, date: new Date(x.date) })))
      }
    }
    cargar()
  }, [])

  // Guarda evaluaciones tanto en el estado como en localStorage
  const persistirEvals = (actualizadas) => {
    setEvaluaciones(actualizadas)
    localSet('evaluations', actualizadas)
  }

  const handleGuardarEval = async (ev) => {
    try {
      let actualizadas
      if (ev.id && evaluaciones.find(e => e.id === ev.id)) {
        // Actualizar evaluación existente
        const guardada = await api.updateEvaluation(ev.id, ev).catch(() => ev)
        actualizadas = evaluaciones.map(e => e.id === guardada.id ? { ...guardada, date: new Date(guardada.date) } : e)
      } else {
        // Crear nueva evaluación
        const guardada = await api.createEvaluation(ev).catch(() => ev)
        actualizadas = [...evaluaciones, { ...guardada, date: new Date(guardada.date) }]
      }
      persistirEvals(actualizadas)
    } catch { }
    setModal(null)
  }

  const handleEliminarEval = async (id) => {
    persistirEvals(evaluaciones.filter(e => e.id !== id))
    try { await api.deleteEvaluation(id) } catch { }
  }

  // Obtiene las clases de una materia para un día específico
  const getClasesDia = (dia) => {
    const resultado = []
    materias.forEach(mat => {
      ;(mat.schedule || []).forEach(sch => {
        if (sch.day === dia) resultado.push({ mat, ...sch })
      })
    })
    return resultado.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  // Próximos eventos combinados (tareas + evaluaciones) ordenados por fecha
  const eventosProximos = [
    ...tareas.filter(t => !t.completed).map(t => ({ tipo: 'tarea', fecha: t.dueDate, titulo: t.title, materiaId: t.subjectId })),
    ...evaluaciones.map(e => ({ tipo: 'eval', fecha: e.date, titulo: e.title, materiaId: e.subjectId, peso: e.weight, tipoEval: e.type, estado: e.status })),
  ].filter(e => e.fecha >= hoy).sort((a, b) => a.fecha - b.fecha).slice(0, 12)

  // Evaluaciones filtradas por estado
  const evalsOrdenadas = [...evaluaciones]
    .filter(e => filtroEstado === 'all' || e.status === filtroEstado)
    .sort((a, b) => a.date - b.date)

  // Estadísticas de evaluaciones
  const totalEvals = evaluaciones.length
  const aprobadas = evaluaciones.filter(e => e.status === 'passed').length
  const reprobadas = evaluaciones.filter(e => e.status === 'failed').length
  const pendientes = evaluaciones.filter(e => ['pending', 'studying'].includes(e.status)).length
  const promedioNota = evaluaciones.filter(e => e.score != null).length > 0
    ? (evaluaciones.filter(e => e.score != null).reduce((a, e) => a + (e.score / e.maxScore) * 100, 0) / evaluaciones.filter(e => e.score != null).length).toFixed(1)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Encabezado ── */}
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Horario Académico</h1>
          <p className="page-sub">Semana del {format(inicioSemana, "d 'de' MMMM", { locale: es })}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {format(hoy, "EEEE d 'de' MMMM", { locale: es })}
          </div>
          {tabActiva === 'evaluations' && (
            <Btn icon={Plus} onClick={() => setModal('new')} size="sm">Nueva evaluación</Btn>
          )}
        </div>
      </div>

      {/* ── Pestañas ── */}
      <div className="page-enter" style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '3px', gap: '2px', width: 'fit-content', flexWrap: 'wrap' }}>
        {[['timetable', 'Horario de Clases', Calendar], ['events', 'Próximos Eventos', AlertCircle], ['evaluations', 'Evaluaciones', Target]].map(([v, l, Ic]) => (
          <button key={v} onClick={() => setTabActiva(v)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--r-sm)', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
              background: tabActiva === v ? 'var(--bg-surface)' : 'transparent',
              color: tabActiva === v ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: tabActiva === v ? 'var(--sh-sm)' : 'none',
              transition: 'all 0.18s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
            }}>
            <Ic size={13} strokeWidth={tabActiva === v ? 2.3 : 1.8} />
            {l}
          </button>
        ))}
      </div>

      {/* ── Pestaña: Horario semanal ── */}
      {tabActiva === 'timetable' && (
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--accent)" />
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Vista Semanal</p>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Los bloques provienen del horario configurado en cada materia
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '700px' }}>
              {/* Cabecera con días */}
              <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <div />
                {DIAS.map((dia, i) => {
                  const fecha = fechasDias[i]
                  const esHoy = fecha.toDateString() === hoy.toDateString()
                  return (
                    <div key={dia} style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: esHoy ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dia.slice(0, 3)}</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: esHoy ? 'var(--accent)' : 'var(--text-primary)' }}>{format(fecha, 'd')}</p>
                      {esHoy && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', margin: '2px auto 0' }} />}
                    </div>
                  )
                })}
              </div>
              {/* Filas de horas */}
              {HORAS.map(hora => (
                <div key={hora} style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)', borderBottom: '1px solid var(--border)', minHeight: '52px' }}>
                  <div style={{ padding: '0.5rem 0.5rem 0 0', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{hora}:00</span>
                  </div>
                  {DIAS.map(dia => {
                    const clases = getClasesDia(dia).filter(c => Math.floor(tiempoAMin(c.startTime) / 60) === hora)
                    return (
                      <div key={dia} style={{ borderLeft: '1px solid var(--border)', padding: '3px' }}>
                        {clases.map((cls, i) => {
                          const dur = tiempoAMin(cls.endTime) - tiempoAMin(cls.startTime)
                          return (
                            <div key={i} style={{
                              background: cls.mat.color, borderRadius: '7px', padding: '4px 7px',
                              marginBottom: '2px', height: `${Math.max((dur / 60) * 52 - 6, 30)}px`,
                              overflow: 'hidden', cursor: 'default',
                            }}>
                              <p style={{ fontSize: '0.63rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{cls.mat.code}</p>
                              <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.85)' }}>{cls.startTime}–{cls.endTime}</p>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Pestaña: Próximos eventos ── */}
      {tabActiva === 'events' && (
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Próximos Eventos</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>Tareas y evaluaciones ordenadas por fecha más cercana</p>
          </div>
          {eventosProximos.length === 0 ? (
            <EmptyState icon={Calendar} title="Sin eventos próximos" description="No hay tareas ni evaluaciones pendientes en los próximos días." />
          ) : (
            <div style={{ padding: '0.75rem' }}>
              {eventosProximos.map((ev, i) => {
                const mat = materias.find(s => s.id === ev.materiaId)
                const dias = differenceInDays(ev.fecha, hoy)
                const esEval = ev.tipo === 'eval'
                const colorUrgencia = dias <= 3 ? 'var(--danger)' : dias <= 7 ? 'var(--warning)' : 'var(--success)'
                const estadoEval = ESTADOS_EVAL[ev.estado]
                return (
                  <div key={i}
                    style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 0.875rem', borderRadius: 'var(--r-md)', transition: 'background 0.15s', borderBottom: i < eventosProximos.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: esEval ? 'var(--danger-soft)' : 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {esEval ? <AlertCircle size={17} color="var(--danger)" /> : <Calendar size={17} color="var(--accent)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.titulo}</p>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '2px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {mat && <Badge color={mat.color}>{mat.code}</Badge>}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{esEval ? (TIPOS_EVAL[ev.tipoEval] || 'Evaluación') : 'Tarea'}</span>
                        {esEval && ev.peso && <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>{ev.peso}% nota</span>}
                        {esEval && estadoEval && <Badge color={estadoEval.color}>{estadoEval.label}</Badge>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colorUrgencia }}>
                        {dias === 0 ? '¡Hoy!' : dias === 1 ? 'Mañana' : `${dias}d`}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{format(ev.fecha, "d MMM", { locale: es })}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Pestaña: Evaluaciones ── */}
      {tabActiva === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Estadísticas rápidas */}
          {totalEvals > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <StatCard icon={Target} label="Total" value={totalEvals} color="var(--accent)" />
              <StatCard icon={CheckCircle2} label="Aprobadas" value={aprobadas} color="var(--success)" />
              <StatCard icon={XCircle} label="Reprobadas" value={reprobadas} color="var(--danger)" />
              <StatCard icon={Clock} label="Pendientes" value={pendientes} color="var(--warning)" />
              {promedioNota && <StatCard icon={Sparkles} label="Promedio" value={`${promedioNota}%`} color="var(--accent)" />}
            </div>
          )}

          {/* Filtro por estado */}
          {totalEvals > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filtrar:</span>
              {[['all', 'Todas'], ...Object.entries(ESTADOS_EVAL).map(([k, v]) => [k, v.label])].map(([k, l]) => (
                <button key={k} onClick={() => setFiltroEstado(k)}
                  style={{
                    padding: '3px 10px', borderRadius: '99px', border: '1px solid',
                    borderColor: filtroEstado === k ? 'var(--accent)' : 'var(--border)',
                    background: filtroEstado === k ? 'var(--accent-soft)' : 'transparent',
                    color: filtroEstado === k ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Lista de evaluaciones */}
          {evalsOrdenadas.length === 0 ? (
            <div className="surface">
              <EmptyState
                icon={AlertCircle}
                title={filtroEstado === 'all' ? 'Sin evaluaciones registradas' : `Sin evaluaciones "${ESTADOS_EVAL[filtroEstado]?.label}"`}
                description="Registra tus parciales, exámenes, quizzes y cualquier evaluación de tu semestre."
                action={<Btn icon={Plus} onClick={() => setModal('new')}>Registrar evaluación</Btn>}
              />
            </div>
          ) : evalsOrdenadas.map((ev, i) => {
            const mat = materias.find(s => s.id === ev.subjectId)
            const dias = differenceInDays(ev.date, hoy)
            const pasada = dias < 0
            const colorUrgencia = pasada ? 'var(--text-muted)' : dias <= 3 ? 'var(--danger)' : dias <= 7 ? 'var(--warning)' : 'var(--success)'
            const estado = ESTADOS_EVAL[ev.status] || ESTADOS_EVAL.pending
            const tienePuntuacion = ev.score != null
            const porcentaje = tienePuntuacion ? ((ev.score / ev.maxScore) * 100).toFixed(1) : null

            return (
              <div key={ev.id} className={`surface fade-up d${Math.min(i + 1, 6)}`}
                style={{
                  padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  borderLeft: `3px solid ${mat?.color || 'var(--accent)'}`,
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Fila superior: título + botones */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{ev.title}</p>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {mat && <Badge color={mat.color}>{mat.code}</Badge>}
                        <Badge color="var(--accent)">{TIPOS_EVAL[ev.type] || ev.type}</Badge>
                        <Badge color={estado.color}>{estado.label}</Badge>
                        <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>{ev.weight}% nota</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => setModal(ev)}
                        style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleEliminarEval(ev.id)}
                        style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Descripción breve si existe */}
                  {ev.description && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                      {ev.description.length > 120 ? ev.description.slice(0, 120) + '...' : ev.description}
                    </p>
                  )}

                  {/* Temas */}
                  {ev.topics?.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      {ev.topics.map(t => <Badge key={t} color="var(--text-muted)">{t}</Badge>)}
                    </div>
                  )}

                  {/* Datos de preparación */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {ev.estimatedStudyHours > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {ev.estimatedStudyHours}h estudio
                      </span>
                    )}
                    {ev.location && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {ev.location}</span>
                    )}
                    {/* Resultado si ya se presentó */}
                    {tienePuntuacion && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: Number(porcentaje) >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                        Nota: {ev.score}/{ev.maxScore} ({porcentaje}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Fecha a la derecha */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colorUrgencia }}>
                    {pasada ? `Hace ${-dias}d` : dias === 0 ? '¡Hoy!' : dias === 1 ? 'Mañana' : `${dias}d`}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{format(ev.date, "d 'de' MMM", { locale: es })}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal de formulario ── */}
      {modal && (
        <Modal
          title={modal === 'new' ? 'Registrar Evaluación' : 'Editar Evaluación'}
          subtitle="Completa la información — más detalles = mejor análisis futuro con IA"
          onClose={() => setModal(null)}
          maxWidth="580px"
        >
          <FormEvaluacion
            evaluacion={modal !== 'new' ? modal : null}
            materias={materias}
            onGuardar={handleGuardarEval}
            onCerrar={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
