// Middleware de Autenticación JWT
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'studymind-dev-secret-change-in-production'

// Middleware que protege las rutas privadas
export const authenticateToken = (req, res, next) => {
  const encabezado = req.headers['authorization']
  const token = encabezado && encabezado.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' })
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET)
    req.userId = decodificado.userId
    next()
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado' })
  }
}

// Genera un nuevo token JWT firmado con el ID del usuario
export const generarToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )
}