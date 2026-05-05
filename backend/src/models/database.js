// Base de Datos — StudyMind

import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'

let pool = null
let usarPostgres = false

// Inicialización — intenta conectar a PostgreSQL si hay DATABASE_URL
export async function initDatabase() {
  const urlBD = process.env.DATABASE_URL

  if (urlBD) {
    try {
      const { default: pg } = await import('pg')
      const { Pool } = pg
      pool = new Pool({
        connectionString: urlBD,
        // SSL requerido en la mayoría de proveedores en la nube
        ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
      })
      // Verificar conexión antes de continuar
      await pool.query('SELECT 1')
      usarPostgres = true
      console.log('✅ Conectado a PostgreSQL')
      await crearTablas()
    } catch (err) {
      console.warn('⚠️  No se pudo conectar a PostgreSQL, usando memoria:', err.message)
      console.warn('   Configura DATABASE_URL en backend/.env para persistencia real')
      usarPostgres = false
    }
  } else {
    console.log('ℹ️  Sin DATABASE_URL — almacenamiento en memoria (datos se pierden al reiniciar)')
    console.log('   Para persistencia, agrega DATABASE_URL en backend/.env')
  }
}

// Creación de tablas en PostgreSQL
async function crearTablas() {
  await pool.query(`
    -- Tabla de usuarios registrados
    CREATE TABLE IF NOT EXISTS users (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name         VARCHAR(255) NOT NULL,
      email        VARCHAR(255) UNIQUE NOT NULL,
      password     VARCHAR(255),              -- null si el registro fue por Google
      avatar       TEXT,
      initials     VARCHAR(10),
      career       VARCHAR(255),
      semester     VARCHAR(100),
      university   VARCHAR(255),
      bio          TEXT,
      google_id    VARCHAR(255),
      provider     VARCHAR(50) DEFAULT 'local',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    -- Tabla de materias por usuario
    CREATE TABLE IF NOT EXISTS subjects (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         VARCHAR(255) NOT NULL,
      code         VARCHAR(50),
      credits      INTEGER DEFAULT 3,
      color        VARCHAR(20) DEFAULT '#5b4cf5',
      professor    VARCHAR(255),
      difficulty   VARCHAR(20) DEFAULT 'medium',
      schedule     JSONB DEFAULT '[]',        -- arreglo de {day, startTime, endTime}
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    -- Tabla de tareas por usuario
    CREATE TABLE IF NOT EXISTS tasks (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
      title            VARCHAR(500) NOT NULL,
      description      TEXT,
      type             VARCHAR(50) DEFAULT 'assignment',
      priority         VARCHAR(20) DEFAULT 'medium',
      due_date         TIMESTAMPTZ NOT NULL,
      estimated_hours  DECIMAL(5,2) DEFAULT 2,
      completed        BOOLEAN DEFAULT FALSE,
      notes            TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    -- Tabla de evaluaciones por usuario
    -- Incluye campos extendidos para análisis futuro con IA:
    -- descripción libre, temas específicos, materiales usados,
    -- estado de la evaluación, calificación y retroalimentación.
    CREATE TABLE IF NOT EXISTS evaluations (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id             UUID REFERENCES subjects(id) ON DELETE SET NULL,
      title                  VARCHAR(500) NOT NULL,
      type                   VARCHAR(50) DEFAULT 'exam',  -- exam, quiz, midterm, final, oral, lab, project, workshop, homework
      date                   TIMESTAMPTZ NOT NULL,
      weight                 DECIMAL(5,2) DEFAULT 20,     -- porcentaje de la nota final
      estimated_study_hours  DECIMAL(5,2) DEFAULT 5,
      difficulty             VARCHAR(20),                 -- easy, medium, hard, very_hard (percibida por el estudiante)
      location               VARCHAR(255),                -- aula o sala donde se presenta
      description            TEXT,                        -- descripción libre del formato y alcance
      topics                 JSONB DEFAULT '[]',          -- arreglo de temas evaluados
      study_materials        JSONB DEFAULT '[]',          -- arreglo de materiales usados para prepararse
      status                 VARCHAR(30) DEFAULT 'pending', -- pending, studying, done, passed, failed
      score                  DECIMAL(6,2),                -- calificación obtenida (null si no se ha presentado)
      max_score              DECIMAL(6,2) DEFAULT 100,    -- nota máxima posible
      notes                  TEXT,                        -- notas personales post-evaluación
      feedback               TEXT,                        -- retroalimentación del profesor
      created_at             TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tablas de StudyMind creadas/verificadas')
}

// ─────────────────────────────────────────────────────────────────
// Almacén en memoria — respaldo cuando no hay PostgreSQL
// Incluye un usuario demo para probar sin registrarse
// ─────────────────────────────────────────────────────────────────
const contrasenaDemo = bcrypt.hashSync('demo1234', 10)

const almacen = {
  usuarios: [{
    id: 'demo-user-001',
    name: 'Demo Estudiante',
    email: 'demo@studymind.edu',
    password: contrasenaDemo,
    avatar: null,
    initials: 'DS',
    career: 'Ingeniería de Sistemas',
    semester: '4to Semestre',
    university: 'Universidad Nacional',
    bio: 'Estudiante apasionado por la tecnología y el aprendizaje continuo.',
    googleId: null,
    provider: 'local',
    createdAt: new Date().toISOString(),
  }],
  materias: [],
  tareas: [],
  evaluaciones: [],
}

// ─────────────────────────────────────────────────────────────────
// Operaciones de Usuarios
// ─────────────────────────────────────────────────────────────────

// Busca un usuario por su ID
export async function findUserById(id) {
  if (usarPostgres) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id])
    return rows[0] ? pgUsuarioAJs(rows[0]) : null
  }
  return almacen.usuarios.find(u => u.id === id) || null
}

// Busca un usuario por correo (insensible a mayúsculas)
export async function findUserByEmail(email) {
  if (usarPostgres) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email])
    return rows[0] ? pgUsuarioAJs(rows[0]) : null
  }
  return almacen.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Busca un usuario por su ID de Google (autenticación OAuth)
export async function findUserByGoogleId(googleId) {
  if (usarPostgres) {
    const { rows } = await pool.query('SELECT * FROM users WHERE google_id=$1', [googleId])
    return rows[0] ? pgUsuarioAJs(rows[0]) : null
  }
  return almacen.usuarios.find(u => u.googleId === googleId) || null
}

// Crea un nuevo usuario en la base de datos
export async function createUser(datos) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, password, avatar, initials, career, semester, university, bio, google_id, provider)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        uuid(), datos.name, datos.email, datos.password || null,
        datos.avatar || null, datos.initials || null,
        datos.career || null, datos.semester || null,
        datos.university || null, datos.bio || null,
        datos.googleId || null, datos.provider || 'local',
      ]
    )
    return pgUsuarioAJs(rows[0])
  }
  const usuario = { id: uuid(), createdAt: new Date().toISOString(), provider: 'local', googleId: null, ...datos }
  almacen.usuarios.push(usuario)
  return usuario
}

// Actualiza los datos del perfil de un usuario existente
export async function updateUser(id, datos) {
  if (usarPostgres) {
    const campos = Object.entries({
      name: datos.name, avatar: datos.avatar, initials: datos.initials,
      career: datos.career, semester: datos.semester,
      university: datos.university, bio: datos.bio,
    }).filter(([, v]) => v !== undefined)
    if (!campos.length) return findUserById(id)
    const setClause = campos.map(([k], i) => `${aSnakeCase(k)}=$${i + 2}`).join(', ')
    const valores = campos.map(([, v]) => v)
    const { rows } = await pool.query(
      `UPDATE users SET ${setClause} WHERE id=$1 RETURNING *`,
      [id, ...valores]
    )
    return rows[0] ? pgUsuarioAJs(rows[0]) : null
  }
  const idx = almacen.usuarios.findIndex(u => u.id === id)
  if (idx === -1) return null
  almacen.usuarios[idx] = { ...almacen.usuarios[idx], ...datos, id }
  return almacen.usuarios[idx]
}

// ─────────────────────────────────────────────────────────────────
// Operaciones de Materias
// ─────────────────────────────────────────────────────────────────

// Obtiene todas las materias de un usuario
export async function getUserSubjects(userId) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      'SELECT * FROM subjects WHERE user_id=$1 ORDER BY created_at',
      [userId]
    )
    return rows.map(pgMateriaAJs)
  }
  return almacen.materias.filter(s => s.userId === userId)
}

// Crea una nueva materia para un usuario
export async function createSubject(userId, datos) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      `INSERT INTO subjects (user_id, name, code, credits, color, professor, difficulty, schedule)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        userId, datos.name, datos.code || '',
        datos.credits || 3, datos.color || '#5b4cf5',
        datos.professor || '', datos.difficulty || 'medium',
        JSON.stringify(datos.schedule || []),
      ]
    )
    return pgMateriaAJs(rows[0])
  }
  const materia = { id: uuid(), userId, createdAt: new Date().toISOString(), ...datos }
  almacen.materias.push(materia)
  return materia
}

// Actualiza una materia existente (solo el propietario puede hacerlo)
export async function updateSubject(id, userId, datos) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      `UPDATE subjects
         SET name=$3, code=$4, credits=$5, color=$6, professor=$7, difficulty=$8, schedule=$9
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [
        id, userId, datos.name, datos.code, datos.credits,
        datos.color, datos.professor, datos.difficulty,
        JSON.stringify(datos.schedule || []),
      ]
    )
    return rows[0] ? pgMateriaAJs(rows[0]) : null
  }
  const idx = almacen.materias.findIndex(s => s.id === id && s.userId === userId)
  if (idx === -1) return null
  almacen.materias[idx] = { ...almacen.materias[idx], ...datos, id, userId }
  return almacen.materias[idx]
}

// Elimina una materia y en cascada sus tareas y evaluaciones relacionadas
export async function deleteSubject(id, userId) {
  if (usarPostgres) {
    await pool.query('DELETE FROM subjects WHERE id=$1 AND user_id=$2', [id, userId])
    return true
  }
  almacen.materias = almacen.materias.filter(s => !(s.id === id && s.userId === userId))
  return true
}

// ─────────────────────────────────────────────────────────────────
// Operaciones de Tareas
// ─────────────────────────────────────────────────────────────────

// Obtiene todas las tareas de un usuario ordenadas por fecha de entrega
export async function getUserTasks(userId) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE user_id=$1 ORDER BY due_date',
      [userId]
    )
    return rows.map(pgTareaAJs)
  }
  return almacen.tareas.filter(t => t.userId === userId)
}

// Crea una nueva tarea
export async function createTask(userId, datos) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      `INSERT INTO tasks (user_id, subject_id, title, description, type, priority, due_date, estimated_hours, completed, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        userId, datos.subjectId || null,
        datos.title, datos.description || '',
        datos.type || 'assignment', datos.priority || 'medium',
        datos.dueDate, datos.estimatedHours || 2,
        datos.completed || false, datos.notes || '',
      ]
    )
    return pgTareaAJs(rows[0])
  }
  const tarea = { id: uuid(), userId, createdAt: new Date().toISOString(), ...datos }
  almacen.tareas.push(tarea)
  return tarea
}

// Actualiza una tarea existente (solo el propietario puede hacerlo)
export async function updateTask(id, userId, datos) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      `UPDATE tasks
         SET title=$3, description=$4, type=$5, priority=$6,
             due_date=$7, estimated_hours=$8, completed=$9, notes=$10, subject_id=$11
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [
        id, userId, datos.title, datos.description, datos.type,
        datos.priority, datos.dueDate, datos.estimatedHours,
        datos.completed, datos.notes, datos.subjectId || null,
      ]
    )
    return rows[0] ? pgTareaAJs(rows[0]) : null
  }
  const idx = almacen.tareas.findIndex(t => t.id === id && t.userId === userId)
  if (idx === -1) return null
  almacen.tareas[idx] = { ...almacen.tareas[idx], ...datos, id, userId }
  return almacen.tareas[idx]
}

// Elimina una tarea
export async function deleteTask(id, userId) {
  if (usarPostgres) {
    await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2', [id, userId])
    return true
  }
  almacen.tareas = almacen.tareas.filter(t => !(t.id === id && t.userId === userId))
  return true
}

// ─────────────────────────────────────────────────────────────────
// Operaciones de Evaluaciones
// Incluye todos los campos extendidos para análisis con IA futuro:
// descripción, temas, materiales, estado, calificación y feedback.
// ─────────────────────────────────────────────────────────────────

// Obtiene todas las evaluaciones de un usuario ordenadas por fecha
export async function getUserEvaluations(userId) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      'SELECT * FROM evaluations WHERE user_id=$1 ORDER BY date',
      [userId]
    )
    return rows.map(pgEvalAJs)
  }
  return almacen.evaluaciones.filter(e => e.userId === userId)
}

// Crea una nueva evaluación con todos sus campos descriptivos
export async function createEvaluation(userId, datos) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      `INSERT INTO evaluations (
         user_id, subject_id, title, type, date, weight,
         estimated_study_hours, difficulty, location, description,
         topics, study_materials, status, score, max_score, notes, feedback
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [
        userId,
        datos.subjectId || null,
        datos.title,
        datos.type || 'exam',
        datos.date,
        datos.weight || 20,
        datos.estimatedStudyHours || 5,
        datos.difficulty || null,
        datos.location || null,
        datos.description || null,
        JSON.stringify(datos.topics || []),
        JSON.stringify(datos.studyMaterials || []),
        datos.status || 'pending',
        datos.score != null ? datos.score : null,
        datos.maxScore || 100,
        datos.notes || null,
        datos.feedback || null,
      ]
    )
    return pgEvalAJs(rows[0])
  }
  const evaluacion = { id: uuid(), userId, createdAt: new Date().toISOString(), ...datos }
  almacen.evaluaciones.push(evaluacion)
  return evaluacion
}

// Actualiza una evaluación existente, incluyendo resultado y retroalimentación
export async function updateEvaluation(id, userId, datos) {
  if (usarPostgres) {
    const { rows } = await pool.query(
      `UPDATE evaluations
         SET title=$3, type=$4, date=$5, weight=$6,
             estimated_study_hours=$7, difficulty=$8, location=$9, description=$10,
             topics=$11, study_materials=$12, status=$13, score=$14,
             max_score=$15, notes=$16, feedback=$17, subject_id=$18
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [
        id, userId,
        datos.title, datos.type, datos.date, datos.weight,
        datos.estimatedStudyHours, datos.difficulty || null,
        datos.location || null, datos.description || null,
        JSON.stringify(datos.topics || []),
        JSON.stringify(datos.studyMaterials || []),
        datos.status || 'pending',
        datos.score != null ? datos.score : null,
        datos.maxScore || 100,
        datos.notes || null,
        datos.feedback || null,
        datos.subjectId || null,
      ]
    )
    return rows[0] ? pgEvalAJs(rows[0]) : null
  }
  const idx = almacen.evaluaciones.findIndex(e => e.id === id && e.userId === userId)
  if (idx === -1) return null
  almacen.evaluaciones[idx] = { ...almacen.evaluaciones[idx], ...datos, id, userId }
  return almacen.evaluaciones[idx]
}

// Elimina una evaluación
export async function deleteEvaluation(id, userId) {
  if (usarPostgres) {
    await pool.query('DELETE FROM evaluations WHERE id=$1 AND user_id=$2', [id, userId])
    return true
  }
  almacen.evaluaciones = almacen.evaluaciones.filter(e => !(e.id === id && e.userId === userId))
  return true
}

// ─────────────────────────────────────────────────────────────────
// Funciones auxiliares — convierten filas snake_case de PG a camelCase
// ─────────────────────────────────────────────────────────────────

// Convierte fila de usuarios de PostgreSQL a objeto JS
function pgUsuarioAJs(r) {
  return {
    id: r.id, name: r.name, email: r.email, password: r.password,
    avatar: r.avatar, initials: r.initials, career: r.career,
    semester: r.semester, university: r.university, bio: r.bio,
    googleId: r.google_id, provider: r.provider, createdAt: r.created_at,
  }
}

// Convierte fila de materias de PostgreSQL a objeto JS
function pgMateriaAJs(r) {
  return {
    id: r.id, userId: r.user_id, name: r.name, code: r.code,
    credits: r.credits, color: r.color, professor: r.professor,
    difficulty: r.difficulty, schedule: r.schedule || [],
    createdAt: r.created_at,
  }
}

// Convierte fila de tareas de PostgreSQL a objeto JS
function pgTareaAJs(r) {
  return {
    id: r.id, userId: r.user_id, subjectId: r.subject_id,
    title: r.title, description: r.description, type: r.type,
    priority: r.priority, dueDate: r.due_date,
    estimatedHours: r.estimated_hours, completed: r.completed,
    notes: r.notes, createdAt: r.created_at,
  }
}

// Convierte fila de evaluaciones de PostgreSQL a objeto JS
// Incluye todos los campos extendidos para análisis con IA
function pgEvalAJs(r) {
  return {
    id: r.id,
    userId: r.user_id,
    subjectId: r.subject_id,
    title: r.title,
    type: r.type,
    date: r.date,
    weight: r.weight,
    estimatedStudyHours: r.estimated_study_hours,
    difficulty: r.difficulty,
    location: r.location,
    description: r.description,
    topics: r.topics || [],
    studyMaterials: r.study_materials || [],
    status: r.status || 'pending',
    score: r.score,
    maxScore: r.max_score,
    notes: r.notes,
    feedback: r.feedback,
    createdAt: r.created_at,
  }
}

// Convierte camelCase a snake_case para construir queries dinámicos
function aSnakeCase(str) {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
}
