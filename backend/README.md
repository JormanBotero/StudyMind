# StudyMind — Backend API

API REST para el Sistema de Gestión Académica StudyMind.

## Tecnologías
- **Node.js** + **Express** (sin TypeScript)
- **JWT** para autenticación
- **bcryptjs** para hashing de contraseñas
- **Google OAuth** (id_token flow)
- Almacenamiento en memoria (reemplazable por cualquier DB)

## Configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Editar .env con tus credenciales de Google OAuth

# 4. Iniciar en desarrollo
npm run dev
```

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3001) |
| `JWT_SECRET` | Clave secreta para firmar tokens |
| `JWT_EXPIRES_IN` | Duración del token (default: 7d) |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `FRONTEND_URL` | URL del frontend (CORS) |

## Endpoints

### Auth (públicos)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/google` | Login con Google |

### Usuarios (requieren Bearer token)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users/me` | Obtener perfil |
| PATCH | `/api/users/me` | Actualizar perfil |
| PATCH | `/api/users/me/password` | Cambiar contraseña |

### Materias / Tareas / Evaluaciones
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/subjects` | Listar materias |
| POST | `/api/subjects` | Crear materia |
| PUT | `/api/subjects/:id` | Actualizar materia |
| DELETE | `/api/subjects/:id` | Eliminar materia |
| *(igual para /tasks y /evaluations)* | | |

## Google OAuth — Configuración

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto → APIs & Services → Credentials
3. Crea un **OAuth 2.0 Client ID** de tipo "Web application"
4. En "Authorized JavaScript origins" agrega `http://localhost:5173`
5. Copia el **Client ID** al `.env` del backend Y al `.env` del frontend

## Producción

Reemplaza el store en memoria (`src/models/store.js`) con:
- **PostgreSQL** usando `pg` o `drizzle-orm`
- **MongoDB** usando `mongoose`
- **SQLite** usando `better-sqlite3`
