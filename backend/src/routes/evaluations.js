// ─────────────────────────────────────────────────────────────────
// Rutas de Evaluaciones — CRUD protegido por JWT
//
// Las evaluaciones incluyen campos extendidos para análisis futuro
// con IA: descripción, temas, materiales, estado, calificación y
// retroalimentación del profesor.
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express'
import { getUserEvaluations, createEvaluation, updateEvaluation, deleteEvaluation } from '../models/database.js'

const router = Router()

// GET /evaluations — Listar todas las evaluaciones del usuario
router.get('/', async (req, res) => {
  try {
    res.json(await getUserEvaluations(req.userId))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /evaluations — Registrar una nueva evaluación con campos completos
router.post('/', async (req, res) => {
  try {
    res.status(201).json(await createEvaluation(req.userId, req.body))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /evaluations/:id — Actualizar evaluación (incluyendo resultado y feedback)
router.put('/:id', async (req, res) => {
  try {
    const evaluacion = await updateEvaluation(req.params.id, req.userId, req.body)
    if (!evaluacion) return res.status(404).json({ error: 'Evaluación no encontrada' })
    res.json(evaluacion)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /evaluations/:id — Eliminar una evaluación
router.delete('/:id', async (req, res) => {
  try {
    await deleteEvaluation(req.params.id, req.userId)
    res.json({ mensaje: 'Evaluación eliminada correctamente' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
