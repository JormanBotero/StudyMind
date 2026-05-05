// ─────────────────────────────────────────────────────────────────
// Rutas de Autenticación
// Maneja registro, inicio de sesión y verificación de token JWT.
// Las contraseñas se hashean con bcrypt antes de guardarse.
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { findUserByEmail, createUser, findUserById } from '../models/database.js'

const router = Router()

// Clave secreta para firmar los tokens — CAMBIAR en producción
const JWT_SECRET = process.env.JWT_SECRET

// Genera un token JWT con el ID del usuario, válido por 30 días
const generarToken = (id) => jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' })

// ── POST /auth/register — Registrar nuevo usuario ──────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, career, semester, university } = req.body

    // Validar campos obligatorios
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' })
    }

    // Verificar que el correo no esté registrado
    const existente = await findUserByEmail(email)
    if (existente) {
      return res.status(409).json({ error: 'Este correo ya está registrado' })
    }

    // Hashear la contraseña antes de guardar
    const contrasenaHash = await bcrypt.hash(password, 10)

    // Generar iniciales automáticamente a partir del nombre
    const iniciales = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

    const usuario = await createUser({
      name, email,
      password: contrasenaHash,
      initials: iniciales,
      career: career || '',
      semester: semester || '',
      university: university || '',
    })

    // No devolver la contraseña en la respuesta
    const { password: _, ...seguro } = usuario
    res.status(201).json({ token: generarToken(usuario.id), user: seguro })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── POST /auth/login — Iniciar sesión ──────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' })
    }

    // Buscar usuario por correo
    const usuario = await findUserByEmail(email)
    if (!usuario || !usuario.password) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // Comparar contraseña ingresada con el hash guardado
    const coincide = await bcrypt.compare(password, usuario.password)
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const { password: _, ...seguro } = usuario
    res.json({ token: generarToken(usuario.id), user: seguro })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── GET /auth/me — Obtener perfil con token ────────────────────────
// Verifica el token del encabezado Authorization y devuelve el perfil
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' })
    }

    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET)
    const usuario = await findUserById(userId)
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const { password: _, ...seguro } = usuario
    res.json(seguro)
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
})

export default router
