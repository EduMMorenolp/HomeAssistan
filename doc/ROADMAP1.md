# 🗺️ ROADMAP — HomeAsisstan

> **Última actualización:** 8 de febrero de 2026  
> **Estado general:** Fases 0-8 ✅ · Fase 9 ✅ · Fase 10 ✅

---

## Leyenda

| Icono | Significado |
|-------|-------------|
| ✅ | Completado |
| 🔧 | En progreso |
| ⬜ | Pendiente |

---

## FASE 0 — Setup Inicial

| Estado | Tarea |
|--------|-------|
| ✅ | Monorepo pnpm workspaces (`packages/shared`, `database`, `server`, `web`) |
| ✅ | Configurar Vite + React 19 + TypeScript |
| ✅ | Configurar Node + Express 5 + TypeScript |
| ✅ | Setup Drizzle ORM + PostgreSQL (local) |
| ✅ | Docker Compose (Postgres + Redis) |
| ✅ | Variables de entorno (`.env` + `.env.example`) |
| ✅ | Scripts base (`dev`, `build`, `db:push`, `db:seed`, etc.) |
| ✅ | TailwindCSS 4 configurado |
| ✅ | Compilación limpia de los 4 paquetes |
| ✅ | Setup ESLint + Prettier |

---

## FASE 1 — Core: Autenticación y Gestión de Casas

### Base de Datos

| Estado | Tabla | Descripción |
|--------|-------|-------------|
| ✅ | `houses` | id, name, address, pin_hash, timestamps |
| ✅ | `users` | id, name, email, avatar, personal_pin_hash, profile_type |
| ✅ | `house_members` | PK compuesta (house_id + user_id), role (enum 6 roles), nickname |
| ✅ | `sessions` | id, user_id, house_id, refresh_token, is_revoked, expires_at |
| ✅ | Migración inicial (`0000_init.sql`) aplicada |
| ✅ | Seed con datos de prueba (Casa Demo + 3 usuarios) |

### Backend (API)

| Estado | Endpoint | Descripción |
|--------|----------|-------------|
| ✅ | `POST /api/auth/house/select` | Seleccionar casa con PIN general |
| ✅ | `POST /api/auth/user/login` | Login usuario con PIN personal |
| ✅ | `POST /api/auth/refresh` | Renovar JWT (con rotación de refresh) |
| ✅ | `POST /api/auth/logout` | Cerrar sesión (revocar refresh token) |
| ✅ | `GET /api/houses` | Listar casas (público) |
| ✅ | `GET /api/houses/:id` | Detalle de casa (auth) |
| ✅ | `POST /api/houses` | Crear casa |
| ✅ | `PATCH /api/houses/:id` | Actualizar casa (admin) |
| ✅ | `DELETE /api/houses/:id` | Eliminar casa (admin) |
| ✅ | `POST /api/users` | Crear usuario + asignar a casa |
| ✅ | `GET /api/users/me` | Perfil propio (auth) |
| ✅ | `GET /api/users/:id` | Usuario por ID (auth) |
| ✅ | `PATCH /api/users/:id` | Actualizar perfil (auth) |
| ✅ | `DELETE /api/users/:id` | Eliminar usuario (admin) |
| ✅ | `GET /api/health` | Health check |

### Middleware

| Estado | Middleware | Descripción |
|--------|-----------|-------------|
| ✅ | `authenticate` | Verificación de JWT Bearer token |
| ✅ | `authorize(...roles)` | Permisos por rol |
| ✅ | `validate(schema)` | Validación de body con Zod |
| ✅ | `errorHandler` | Manejo centralizado de errores (`AppError`) |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Pantalla de selección de casa (lista + PIN) |
| ✅ | Pantalla de login de usuario (grid miembros + PIN) |
| ✅ | Auth store (Zustand + persist) — house, user, tokens |
| ✅ | API client Axios con interceptor auto-refresh |
| ✅ | `ProtectedRoute` component |
| ✅ | Layout base: `AuthLayout` + `AppLayout` |
| ✅ | Sidebar con navegación de módulos |
| ✅ | TopBar con búsqueda, notificaciones, avatar |
| ✅ | Diseño responsive completo (mobile-first) |
| ✅ | Sidebar overlay en mobile con backdrop |

---

## FASE 2 — Dashboard y Sistema de Roles

### Base de Datos

| Estado | Tabla |
|--------|-------|
| ✅ | `user_preferences` — Configuración UI por usuario |
| ✅ | `activity_logs` — Auditoría de acciones |

### Backend

| Estado | Feature |
|--------|---------|
| ✅ | `GET /api/dashboard/public` — Info compartida de la casa |
| ✅ | `GET /api/dashboard/private/:userId` — Info personal |
| ✅ | Sistema de permisos granular (RBAC avanzado) |
| ✅ | Logs de actividad |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Dashboard público (vista de casa) — *estructura base con placeholders* |
| ✅ | Dashboard privado (vista personal) |
| ✅ | Tarjetas modulares con datos reales |
| ✅ | Sistema de temas (claro/oscuro) |
| ✅ | Modo "Power User" vs "Focus" |
| ✅ | Navegación adaptativa por rol |

---

## FASE 3 — Módulo de Comunicación

### Base de Datos

| Estado | Tabla |
|--------|-------|
| ✅ | `announcements` — Muro de la casa |
| ✅ | `messages` — Chat interno |
| ✅ | `notifications` — Notificaciones push |
| ✅ | `panic_pings` — Botón de pánico |

### Backend

| Estado | Feature |
|--------|---------|
| ✅ | WebSocket setup (Socket.IO) — *configurado join/leave rooms, sin lógica de negocio* |
| ✅ | CRUD de anuncios |
| ✅ | Chat en tiempo real |
| ✅ | Sistema de notificaciones |
| ✅ | Botón de pánico (broadcast) |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Muro de anuncios con CRUD |
| ✅ | Chat en tiempo real |
| ✅ | Sistema de notificaciones (toast/banner) |
| ✅ | Botón de pánico con confirmación |
| ✅ | Indicadores de usuarios online |

---

## FASE 4 — Módulo de Tareas

### Base de Datos

| Estado | Tabla |
|--------|-------|
| ✅ | `tasks` — Tareas |
| ✅ | `task_assignments` — Asignaciones |
| ✅ | `task_rotations` — Configuración de rotaciones |
| ✅ | `task_completions` — Historial de completado |
| ✅ | `gamification` — Puntos y recompensas |

### Backend

| Estado | Feature |
|--------|---------|
| ✅ | CRUD de tareas |
| ✅ | Sistema de asignación (manual/automático) |
| ✅ | Motor de rotación automática |
| ✅ | API de gamificación (puntos, rankings) |
| ✅ | Notificaciones de tareas pendientes |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Lista de tareas (vista por usuario) |
| ✅ | Crear/editar tareas |
| ✅ | Marcar tareas como completadas |
| ✅ | Configurar rotaciones |
| ✅ | Dashboard de gamificación |
| ✅ | Historial de tareas |

---

## FASE 5 — Módulo de Calendario

### Base de Datos

| Estado | Tabla |
|--------|-------|
| ✅ | `events` — Eventos del hogar |
| ✅ | `event_attendees` — Participantes |

### Backend

| Estado | Feature |
|--------|---------|
| ✅ | CRUD de eventos |
| ✅ | Gestión de asistentes |
| ✅ | Sincronización (Google Calendar) |
| ✅ | Recordatorios automáticos |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Vista de calendario (mes/semana/día) |
| ✅ | Crear/editar eventos |
| ✅ | Invitar miembros a eventos |
| ✅ | Filtros por tipo de evento |

---

## FASE 6 — Módulo de Finanzas

### Base de Datos

| Estado | Tabla |
|--------|-------|
| ✅ | `expenses` — Gastos |
| ✅ | `shopping_list` — Lista de compras |
| ✅ | `household_items` — Inventario del hogar |

### Backend

| Estado | Feature |
|--------|---------|
| ✅ | CRUD de gastos |
| ✅ | Reportes (por mes/categoría) |
| ✅ | CRUD de lista de compras |
| ✅ | Inventario de artículos del hogar |
| ✅ | Permisos de visibilidad por rol |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Registro de gastos |
| ✅ | Dashboard de finanzas |
| ✅ | Lista de compras compartida |
| ✅ | Gestión de inventario |
| ✅ | Gráficas de gastos |

---

## FASE 7 — Módulo de Salud

### Base de Datos

| Estado | Tabla |
|--------|-------|
| ✅ | `health_profiles` — Perfiles clínicos (encriptado) |
| ✅ | `medications` — Medicamentos |
| ✅ | `medication_logs` — Tomas registradas |
| ✅ | `health_routines` — Rutinas |

### Backend

| Estado | Feature |
|--------|---------|
| ✅ | CRUD de perfiles de salud |
| ✅ | Gestión de medicamentos |
| ✅ | Recordatorios de medicación |
| ✅ | CRUD de rutinas |
| ✅ | Alertas de stock bajo |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Formulario de perfil clínico |
| ✅ | Gestión de medicamentos |
| ✅ | Recordatorios visuales |
| ✅ | Tracker de rutinas |
| ✅ | Dashboard de salud |

---

## FASE 8 — Módulo de Seguridad

### Base de Datos

| Estado | Tabla |
|--------|-------|
| ✅ | `emergency_contacts` — Contactos de emergencia |
| ✅ | `secure_vault` — Bóveda de accesos (AES-256) |
| ✅ | `visitor_codes` — Códigos temporales |
| ✅ | `access_logs` — Logs de acceso |

### Backend

| Estado | Feature |
|--------|---------|
| ✅ | Gestión de contactos de emergencia |
| ✅ | Bóveda encriptada |
| ✅ | Generación de códigos temporales |
| ✅ | Sistema de logs de acceso |
| ✅ | Botón S.O.S. (notificación externa) |

### Frontend

| Estado | Feature |
|--------|---------|
| ✅ | Configuración de emergencias |
| ✅ | Bóveda de contraseñas/códigos |
| ✅ | Generador de códigos para invitados |
| ✅ | Botón S.O.S. prominente |
| ✅ | Visor de logs de acceso (admin) |

---

## FASE 9 — Optimización y Accesibilidad

| Estado | Feature |
|--------|---------|
| ✅ | Modo "Focus" (UI simplificada para perfiles focus) |
| ✅ | Accesibilidad completa (ARIA, navegación por teclado) |
| ✅ | PWA (Progressive Web App + Service Worker) |
| ✅ | Lazy loading de módulos (code splitting) |
| ✅ | Compresión de assets |
| ✅ | Tests unitarios (Vitest) |
| ✅ | Tests de integración (API) |
| ✅ | Tests E2E (Playwright) |

---

## FASE 10 — Deployment y Documentación

| Estado | Feature |
|--------|---------|
| ✅ | Dockerfile optimizado (multi-stage) |
| ✅ | Docker Compose para producción |
| ✅ | Scripts de backup automático |
| ✅ | Configuración de red LAN |
| ✅ | README.md del proyecto |
| ✅ | API documentation (Json Postman) |
| ✅ | Manual de usuario |
| ✅ | Guía de administrador |

---

## 📊 Progreso Global

```
Fase 0  █████████████████████  100%
Fase 1  █████████████████████  100%
Fase 2  █████████████████████  100%
Fase 3  █████████████████████  100%
Fase 4  █████████████████████  100%
Fase 5  █████████████████████  100%
Fase 6  █████████████████████  100%
Fase 7  █████████████████████  100%
Fase 8  █████████████████████  100%
Fase 9  ████████████████████░  90%   (tests pendientes)
Fase 10 ████████████████████░  90%   (backup/LAN pendiente)
```

**MVP (Fases 1-4):** 100% completado  
**Proyecto total:** ~95% completado  

---

## 🏗️ Stack Actual

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite | 19 / 6.4 |
| Estilos | TailwindCSS | 4 |
| Estado | Zustand + TanStack Query | 5 / 5 |
| Routing | React Router | 7 |
| Backend | Express | 5 |
| ORM | Drizzle ORM | 0.38 |
| BD | PostgreSQL | 15+ (local) |
| Auth | JWT + bcryptjs | — |
| Realtime | Socket.IO | 4.8 |
| Validación | Zod | 3.24 |
| Monorepo | pnpm workspaces | 10.29 |
| Lenguaje | TypeScript | 5.9 |
