// In-memory store - simula una base de datos
// En producción, reemplazar con PostgreSQL, MongoDB, etc.

import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'

const hashedPass = bcrypt.hashSync('demo1234', 10)

export const db = {
  users: [
    {
      id: 'demo-user-001',
      name: 'Demo Estudiante',
      email: 'demo@studymind.edu',
      password: hashedPass,
      avatar: null,
      initials: 'DS',
      career: 'Ingeniería de Sistemas',
      semester: '4to Semestre',
      university: 'Universidad Nacional',
      bio: 'Estudiante apasionado por la tecnología y el aprendizaje continuo.',
      googleId: null,
      provider: 'local',
      createdAt: new Date().toISOString(),
    }
  ],
  subjects: [],
  tasks: [],
  evaluations: [],
}

export const findUserById = (id) => db.users.find(u => u.id === id)
export const findUserByEmail = (email) => db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
export const findUserByGoogleId = (googleId) => db.users.find(u => u.googleId === googleId)
export const createUser = (data) => {
  const user = { id: uuid(), createdAt: new Date().toISOString(), provider: 'local', googleId: null, ...data }
  db.users.push(user)
  return user
}
export const updateUser = (id, data) => {
  const idx = db.users.findIndex(u => u.id === id)
  if (idx === -1) return null
  db.users[idx] = { ...db.users[idx], ...data, id }
  return db.users[idx]
}

// Helpers for owned resources
export const getUserSubjects = (userId) => db.subjects.filter(s => s.userId === userId)
export const getUserTasks = (userId) => db.tasks.filter(t => t.userId === userId)
export const getUserEvaluations = (userId) => db.evaluations.filter(e => e.userId === userId)
