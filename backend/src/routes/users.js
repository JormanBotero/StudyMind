// ─────────────────────────────────────────────────────────────────
// Rutas del Perfil de Usuario — protegidas por JWT
// Permite al usuario autenticado ver y actualizar su perfil,
// así como cambiar su contraseña de forma segura.
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { findUserById, updateUser } from '../models/database.js'

const router = Router()

// Elimina la contraseña antes de enviar datos al frontend
const sinContrasena = (u) => { const { password, ...seguro } = u; return seguro }

// GET /api/users/me — Obtener perfil del usuario autenticado
router.get('/me', async (req, res) => {
  try {
    const usuario = await findUserById(req.userId)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(sinContrasena(usuario))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/users/me — Actualizar datos del perfil
router.patch('/me', async (req, res) => {
  try {
    const { name, career, semester, university, bio, avatar } = req.body
    const usuario = await findUserById(req.userId)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    // Recalcular iniciales si cambia el nombre
    const iniciales = name
      ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
      : usuario.initials

    const actualizado = await updateUser(req.userId, {
      name:       name       ?? usuario.name,
      career:     career     ?? usuario.career,
      semester:   semester   ?? usuario.semester,
      university: university ?? usuario.university,
      bio:        bio        ?? usuario.bio,
      avatar:     avatar     ?? usuario.avatar,
      initials:   iniciales,
    })

    res.json(sinContrasena(actualizado))
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar perfil' })
  }
})

// PATCH /api/users/me/password — Cambiar contraseña
router.patch('/me/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const usuario = await findUserById(req.userId)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    // Las cuentas de Google no tienen contraseña local
    if (usuario.provider === 'google') {
      return res.status(400).json({ error: 'Las cuentas de Google no tienen contraseña local' })
    }

    // Verificar contraseña actual antes de permitir el cambio
    const coincide = await bcrypt.compare(currentPassword, usuario.password)
    if (!coincide) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })
    }

    // Hashear y guardar la nueva contraseña
    const hash = await bcrypt.hash(newPassword, 10)
    await updateUser(req.userId, { password: hash })

    res.json({ mensaje: 'Contraseña actualizada correctamente' })
  } catch {
    res.status(500).json({ error: 'Error al cambiar contraseña' })
  }
})

export default router
