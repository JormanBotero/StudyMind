// ─────────────────────────────────────────────────────────────────
// Datos de ejemplo para cuando el backend no está disponible.
// También se usan para poblar la demo sin necesidad de registrarse.
// ─────────────────────────────────────────────────────────────────

// Materias de ejemplo con horario y dificultad configurados
export const defaultSubjects = [
  {
    id: '1', name: 'Cálculo Diferencial', code: 'MAT-201', credits: 4,
    color: '#5b4cf5', professor: 'Dr. García', difficulty: 'high',
    schedule: [
      { day: 'Lunes',     startTime: '08:00', endTime: '10:00' },
      { day: 'Miércoles', startTime: '08:00', endTime: '10:00' },
    ],
  },
  {
    id: '2', name: 'Programación Orientada a Objetos', code: 'CSC-301', credits: 3,
    color: '#059669', professor: 'Ing. Martínez', difficulty: 'medium',
    schedule: [
      { day: 'Martes',  startTime: '10:00', endTime: '12:00' },
      { day: 'Jueves',  startTime: '10:00', endTime: '12:00' },
    ],
  },
  {
    id: '3', name: 'Física II', code: 'FIS-202', credits: 4,
    color: '#d97706', professor: 'Dr. López', difficulty: 'high',
    schedule: [
      { day: 'Lunes',   startTime: '14:00', endTime: '16:00' },
      { day: 'Viernes', startTime: '10:00', endTime: '12:00' },
    ],
  },
  {
    id: '4', name: 'Comunicación Escrita', code: 'HUM-101', credits: 2,
    color: '#ec4899', professor: 'Lic. Ramírez', difficulty: 'low',
    schedule: [
      { day: 'Miércoles', startTime: '16:00', endTime: '18:00' },
    ],
  },
]

// Tareas de ejemplo con distintas prioridades y tipos
export const defaultTasks = () => {
  const hoy = new Date()
  return [
    {
      id: '1', subjectId: '1', title: 'Tarea de derivadas',
      description: 'Resolver ejercicios 1-20 del capítulo 3',
      dueDate: new Date(hoy.getTime() + 3 * 86400000).toISOString(),
      type: 'assignment', estimatedHours: 4, completed: false, priority: 'high',
    },
    {
      id: '2', subjectId: '2', title: 'Proyecto POO – Fase 1',
      description: 'Implementar clases básicas del sistema de inventario',
      dueDate: new Date(hoy.getTime() + 7 * 86400000).toISOString(),
      type: 'project', estimatedHours: 8, completed: false, priority: 'high',
    },
    {
      id: '3', subjectId: '3', title: 'Lectura: Termodinámica',
      description: 'Capítulo 5 completo y hacer resumen de 2 páginas',
      dueDate: new Date(hoy.getTime() + 2 * 86400000).toISOString(),
      type: 'reading', estimatedHours: 2, completed: false, priority: 'medium',
    },
    {
      id: '4', subjectId: '4', title: 'Ensayo argumentativo',
      description: 'Ensayo de 1000 palabras sobre ética tecnológica',
      dueDate: new Date(hoy.getTime() + 10 * 86400000).toISOString(),
      type: 'assignment', estimatedHours: 5, completed: false, priority: 'medium',
    },
  ]
}

// Evaluaciones de ejemplo con los campos extendidos para análisis IA
export const defaultEvaluations = () => {
  const hoy = new Date()
  return [
    {
      id: '1',
      subjectId: '1',
      title: 'Parcial 1 – Derivadas',
      type: 'midterm',
      date: new Date(hoy.getTime() + 14 * 86400000).toISOString(),
      weight: 30,
      estimatedStudyHours: 12,
      status: 'studying',
      difficulty: 'hard',
      location: 'Salón 301',
      description: 'Examen escrito de 2 horas. Cubre todo el capítulo 3 y 4. Se permite calculadora científica. Incluye ejercicios de demostración y aplicación.',
      topics: ['Límites', 'Derivadas básicas', 'Regla de la cadena', 'Derivadas implícitas', 'Máximos y mínimos'],
      studyMaterials: ['Libro Stewart cap. 3-4', 'Apuntes de clase', 'Videos Khan Academy', 'Ejercicios resueltos'],
      score: null,
      maxScore: 100,
      notes: '',
      feedback: '',
    },
    {
      id: '2',
      subjectId: '2',
      title: 'Quiz – Herencia y Polimorfismo',
      type: 'quiz',
      date: new Date(hoy.getTime() + 5 * 86400000).toISOString(),
      weight: 10,
      estimatedStudyHours: 3,
      status: 'pending',
      difficulty: 'medium',
      location: 'Laboratorio 2',
      description: 'Quiz práctico en computador. Se debe implementar un pequeño sistema usando herencia. Duración: 45 minutos.',
      topics: ['Herencia simple', 'Herencia múltiple', 'Polimorfismo', 'Interfaces'],
      studyMaterials: ['Diapositivas del profesor', 'Ejercicios del aula virtual'],
      score: null,
      maxScore: 100,
      notes: '',
      feedback: '',
    },
    {
      id: '3',
      subjectId: '3',
      title: 'Examen – Termodinámica',
      type: 'exam',
      date: new Date(hoy.getTime() + 12 * 86400000).toISOString(),
      weight: 25,
      estimatedStudyHours: 10,
      status: 'pending',
      difficulty: 'very_hard',
      location: 'Aula Magna',
      description: 'Examen teórico-práctico. Primera parte: preguntas conceptuales de selección múltiple (40%). Segunda parte: resolución de problemas (60%).',
      topics: ['Primera ley de la termodinámica', 'Segunda ley', 'Entropía', 'Ciclos termodinámicos', 'Procesos reversibles'],
      studyMaterials: ['Serway cap. 22-23', 'Formulario permitido', 'Talleres resueltos'],
      score: null,
      maxScore: 100,
      notes: '',
      feedback: '',
    },
  ]
}

// ─────────────────────────────────────────────────────────────────
// Helpers para persistencia local (respaldo offline)
// Prefija las claves para no colisionar con otras apps en el mismo dominio
// ─────────────────────────────────────────────────────────────────
const PREFIJO = (k) => `studymind_${k}`

// Lee un valor del localStorage o retorna el valor por defecto
export const localGet = (clave, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(PREFIJO(clave))) ?? fallback
  } catch {
    return fallback
  }
}

// Guarda un valor en localStorage de forma segura
export const localSet = (clave, valor) => {
  try {
    localStorage.setItem(PREFIJO(clave), JSON.stringify(valor))
  } catch {}
}
