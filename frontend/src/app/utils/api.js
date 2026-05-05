// ─────────────────────────────────────────────────────────────────
// Cliente HTTP para la API de StudyMind
// Maneja autenticación con JWT y errores de red automáticamente.
// Si el backend no está disponible, las páginas caen al modo offline.
// ─────────────────────────────────────────────────────────────────

// URL base de la API — se puede sobreescribir con la variable de entorno VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Recupera el token de sesión guardado en localStorage
const obtenerToken = () => localStorage.getItem('studymind_token')

// Función genérica para hacer peticiones autenticadas a la API
async function peticion(ruta, opciones = {}) {
  const token = obtenerToken()
  const cabeceras = {
    'Content-Type': 'application/json',
    // Adjuntar token si el usuario está autenticado
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opciones.headers,
  }

  const res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers: cabeceras })
  const datos = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(datos.error || `Error ${res.status}`)
  }
  return datos
}

// ─────────────────────────────────────────────────────────────────
// Métodos disponibles para interactuar con el backend
// ─────────────────────────────────────────────────────────────────
export const api = {
  // Autenticación
  login:      (cuerpo)      => peticion('/auth/login',    { method: 'POST', body: JSON.stringify(cuerpo) }),
  register:   (cuerpo)      => peticion('/auth/register', { method: 'POST', body: JSON.stringify(cuerpo) }),
  googleAuth: (credencial)  => peticion('/auth/google',   { method: 'POST', body: JSON.stringify({ credential: credencial }) }),

  // Perfil del usuario
  getMe:          ()       => peticion('/users/me'),
  updateMe:       (cuerpo) => peticion('/users/me',          { method: 'PATCH',  body: JSON.stringify(cuerpo) }),
  changePassword: (cuerpo) => peticion('/users/me/password', { method: 'PATCH',  body: JSON.stringify(cuerpo) }),

  // Materias
  getSubjects:    ()          => peticion('/subjects'),
  createSubject:  (cuerpo)    => peticion('/subjects',       { method: 'POST', body: JSON.stringify(cuerpo) }),
  updateSubject:  (id, cuerpo) => peticion(`/subjects/${id}`, { method: 'PUT',  body: JSON.stringify(cuerpo) }),
  deleteSubject:  (id)        => peticion(`/subjects/${id}`,  { method: 'DELETE' }),

  // Tareas
  getTasks:    ()          => peticion('/tasks'),
  createTask:  (cuerpo)    => peticion('/tasks',       { method: 'POST', body: JSON.stringify(cuerpo) }),
  updateTask:  (id, cuerpo) => peticion(`/tasks/${id}`, { method: 'PUT',  body: JSON.stringify(cuerpo) }),
  deleteTask:  (id)        => peticion(`/tasks/${id}`,  { method: 'DELETE' }),

  // Evaluaciones (incluye campos extendidos para análisis con IA)
  getEvaluations:    ()          => peticion('/evaluations'),
  createEvaluation:  (cuerpo)    => peticion('/evaluations',       { method: 'POST', body: JSON.stringify(cuerpo) }),
  updateEvaluation:  (id, cuerpo) => peticion(`/evaluations/${id}`, { method: 'PUT',  body: JSON.stringify(cuerpo) }),
  deleteEvaluation:  (id)        => peticion(`/evaluations/${id}`,  { method: 'DELETE' }),
}
