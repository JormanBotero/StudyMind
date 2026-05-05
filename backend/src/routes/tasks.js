// ─────────────────────────────────────────────────────────────────
// Rutas de Tareas — CRUD protegido por JWT
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express'
import { getUserTasks, createTask, updateTask, deleteTask } from '../models/database.js'

const router = Router()

// GET /tasks — Listar todas las tareas del usuario
router.get('/', async (req, res) => {
  try {
    res.json(await getUserTasks(req.userId))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /tasks — Crear una nueva tarea
router.post('/', async (req, res) => {
  try {
    res.status(201).json(await createTask(req.userId, req.body))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /tasks/:id — Actualizar una tarea (incluyendo marcar como completada)
router.put('/:id', async (req, res) => {
  try {
    const tarea = await updateTask(req.params.id, req.userId, req.body)
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' })
    res.json(tarea)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /tasks/:id — Eliminar una tarea
router.delete('/:id', async (req, res) => {
  try {
    await deleteTask(req.params.id, req.userId)
    res.json({ mensaje: 'Tarea eliminada correctamente' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
