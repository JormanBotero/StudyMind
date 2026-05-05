// ─────────────────────────────────────────────────────────────────
// Rutas de Materias — CRUD protegido por JWT
// El middleware de autenticación inyecta req.userId en cada petición.
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express'
import { getUserSubjects, createSubject, updateSubject, deleteSubject } from '../models/database.js'

const router = Router()

// GET /subjects — Listar todas las materias del usuario autenticado
router.get('/', async (req, res) => {
  try {
    res.json(await getUserSubjects(req.userId))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /subjects — Crear una nueva materia
router.post('/', async (req, res) => {
  try {
    res.status(201).json(await createSubject(req.userId, req.body))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /subjects/:id — Actualizar una materia existente
router.put('/:id', async (req, res) => {
  try {
    const materia = await updateSubject(req.params.id, req.userId, req.body)
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' })
    res.json(materia)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /subjects/:id — Eliminar una materia
router.delete('/:id', async (req, res) => {
  try {
    await deleteSubject(req.params.id, req.userId)
    res.json({ mensaje: 'Materia eliminada correctamente' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
