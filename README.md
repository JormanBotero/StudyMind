# StudyMind — Sistema Académico

## ✨ Novedades en 

- **Sidebar vertical con efectos hover**: cada ítem tiene color propio y reacciona al pasar el mouse
- **Páginas sin espacios vacíos**: layouts de full-width con grid responsivo
- **Materias detalladas**: haz clic en una materia para ver resumen, tareas, evaluaciones y horario
- **Backend con base de datos real**: soporte para PostgreSQL (Supabase, Neon, Railway, etc.)

---

## 🚀 Cómo correr el proyecto

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run dev
```

---

## 🗄️ Configurar base de datos (opcional)

Sin `DATABASE_URL`, el sistema usa **memoria RAM** (los datos se pierden al reiniciar).

Para persistencia, agrega al `backend/.env`:

```
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_bd
```

### Proveedores gratuitos recomendados

| Proveedor | URL | Nota |
|-----------|-----|------|
| **Supabase** | supabase.com | 500 MB gratis, fácil |
| **Neon** | neon.tech | Serverless, se pausa automáticamente |
| **Railway** | railway.app | $5/mes de crédito gratis |

### Pasos con Supabase (recomendado):
1. Crea cuenta en [supabase.com](https://supabase.com)
2. Nuevo proyecto → copia la **Connection string (Transaction Pooler)**
3. Pégala en `backend/.env` como `DATABASE_URL`
4. El sistema crea las tablas automáticamente al iniciar

---

## 🏗️ Estructura del proyecto

```
studymind_/
├── frontend/
│   └── src/
│       └── app/
│           ├── components/
│           │   ├── Layout.jsx      ← Sidebar vertical con hover
│           │   └── ui.jsx
│           └── pages/
│               ├── Dashboard.jsx
│               ├── Subjects.jsx    ← Tarjetas clickeables
│               ├── SubjectDetail.jsx  ← ¡NUEVO! Detalle con tareas
│               ├── Tasks.jsx
│               ├── Schedule.jsx
│               └── Analytics.jsx
└── backend/
    └── src/
        ├── models/
        │   └── database.js   ← Adaptador memoria/PostgreSQL
        └── routes/
            ├── auth.js
            ├── subjects.js
            ├── tasks.js
            └── evaluations.js
```

---

## 🔑 Credenciales demo

- **Email**: `demo@studymind.edu`
- **Contraseña**: `demo1234`
