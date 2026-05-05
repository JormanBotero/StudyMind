// ─────────────────────────────────────────────────────────────────
// Servidor Principal de StudyMind
// Configura Express, CORS, rutas y arranca la API.
// La base de datos se inicializa antes de abrir el puerto.
// ─────────────────────────────────────────────────────────────────
import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

// Cargar variables de entorno desde backend/.env
config()

import { initDatabase } from './models/database.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import subjectsRoutes from './routes/subjects.js'
import tasksRoutes from './routes/tasks.js'
import evaluationsRoutes from './routes/evaluations.js'
import { authenticateToken } from './middleware/auth.js'

const app = express()
const PUERTO = process.env.PORT || 3001

// Permitir peticiones del frontend (configurable por variable de entorno)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// ── Rutas públicas (sin autenticación) ──────────────────────────
app.use('/api/auth', authRoutes)

// ── Rutas privadas (requieren token JWT válido) ──────────────────
app.use('/api/users',       authenticateToken, usersRoutes)
app.use('/api/subjects',    authenticateToken, subjectsRoutes)
app.use('/api/tasks',       authenticateToken, tasksRoutes)
app.use('/api/evaluations', authenticateToken, evaluationsRoutes)

// ── Endpoint de salud — útil para monitoreo y despliegue ─────────
app.get('/api/health', (req, res) => {
  res.json({
    estado: 'ok',
    timestamp: new Date().toISOString(),
    baseDeDatos: process.env.DATABASE_URL ? 'postgresql' : 'memoria',
  })
})

// ── Manejo de rutas no encontradas ───────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// ── Manejo de errores no capturados ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// ── Iniciar base de datos y luego el servidor ─────────────────────
initDatabase().then(() => {
  app.listen(PUERTO, () => {
    console.log(`🚀 StudyMind API en http://localhost:${PUERTO}`)
    console.log(`📊 Almacenamiento: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Memoria RAM (sin persistencia)'}`)
    console.log(`🌐 CORS permitido para: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  })
})
