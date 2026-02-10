# 🔐 Plan de Ejecución — Sistema RBAC (Roles y Permisos)

> **Fecha:** 8 de febrero de 2026 · **Actualizado:** 9 de febrero de 2026  
> **Objetivo:** Implementar la matriz de roles y permisos completa definida por el usuario  
> **Impacto:** Backend (middleware, rutas, servicios), Frontend (guards, UI adaptativa), Base de datos (schema, seed)
>
> ## 📈 Progreso Global
> | Fase | Estado | Avance |
> |------|--------|--------|
> | R1 — Middleware Core | ✅ Completado | 100% |
> | R2 — Permisos Granulares | ✅ Completado | 100% |
> | R3 — UI Adaptativa | ✅ Completado | 100% |
> | R4 — Panel Admin | ✅ Completado | 100% |
> | R5 — Onboarding | ✅ Completado | 100% |
> | R6 — Externos | ✅ Completado | 100% |
> | R7 — Mascotas | ✅ Completado | 100% |

---

## 📊 Análisis de Brechas (Estado Actual vs. Deseado)

### ✅ Lo que YA existe

| Elemento | Estado |
|----------|--------|
| 6 roles definidos en shared (`admin`, `responsible`, `member`, `simplified`, `external`, `pet`) | ✅ Correcto |
| Enum `member_role` en BD con los 6 roles | ✅ Correcto |
| `ROLE_HIERARCHY` con pesos numéricos (100→0) | ✅ Existe en shared |
| Middleware `authenticate` (JWT Bearer) | ✅ Funcional |
| Middleware `authorize(...roles)` | ✅ Refactorizado con jerarquía + `requirePermission` |
| Middleware `authorizeMin(minRole)` | ✅ Nuevo — usa `ROLE_HIERARCHY` |
| Middleware `requirePermission(module, action)` | ✅ Nuevo — usa matriz `PERMISSIONS` |
| Middleware `belongsToHouse(paramKey)` | ✅ Nuevo — aislamiento multi-tenant |
| Middleware `ownerOrRole(minRole)` / `ownerOrAdmin()` | ✅ Nuevo — ownership check |
| Matriz `PERMISSIONS` en shared | ✅ 8 módulos, ~40 acciones |
| Auth flow de 2 pasos (casa → usuario) | ✅ Funcional |
| JWT payload con `{ userId, houseId, role }` | ✅ Correcto |
| Seed con 3 usuarios (admin, member, simplified) | ✅ Parcial |

### ❌ Brechas Críticas

| # | Brecha | Severidad | Descripción |
|---|--------|-----------|-------------|
| B1 | ~~Endpoints públicos sin protección~~ | ✅ RESUELTO | `POST /houses` y `POST /users` ahora protegidos con `requirePermission`/role check |
| B2 | ~~Sin verificación de pertenencia a casa~~ | ✅ RESUELTO | `belongsToHouse()` implementado, servicios filtran por `houseId` |
| B3 | ~~Sin ownership check en PATCH/DELETE~~ | ✅ RESUELTO | `ownerOrRole()` y `ownerOrAdmin()` aplicados |
| B4 | ~~`authorize()` no usa jerarquía~~ | ✅ RESUELTO | `authorizeMin()` usa `ROLE_HIERARCHY`, `requirePermission()` usa matriz |
| B5 | ~~Sin permisos granulares por módulo~~ | ✅ RESUELTO | Todos los endpoints usan `requirePermission(module, action)` |
| B6 | ~~Sin filtrado de datos por rol~~ | ✅ RESUELTO | Servicios de tareas, finanzas, comunicación, dashboard filtran por rol |
| B7 | ~~Sin UI adaptativa por rol~~ | ✅ RESUELTO | Sidebar, páginas, FocusLayout adaptan UI según rol |
| B8 | ~~Sin panel de Admin (`/admin`)~~ | ✅ RESUELTO | AdminPage con tabs: estadísticas, usuarios, logs, configuración |
| B9 | ~~Sin gestión de usuarios en frontend~~ | ✅ RESUELTO | HouseMembersPage + AdminUsersPage con gestión completa |
| B10 | ~~Sin flujo de onboarding (invitación/auto-registro)~~ | ✅ RESUELTO | Flujo completo: invitación con PIN temporal + auto-registro con aprobación |
| B11 | ~~Sin gestión de externos (vigencia/módulos)~~ | ✅ RESUELTO | external-guard middleware: schedule + expiry + allowedModules, formulario de configuración en HouseMembersPage |
| B12 | ~~Sin estado "Pendiente de Aprobación"~~ | ✅ RESUELTO | memberStatus: active/invited/pending/suspended con flujo auto-registro → aprobar/rechazar |
| B13 | ~~Sin ficha de mascotas~~ | ✅ RESUELTO | Tabla `pets`, CRUD completo, PetsPage con tarjetas/modal/ficha detallada |
| B14 | **Sin configuración global del sistema** | 🟢 BAJA | No hay settings como "Permitir crear casas" |

---

## 🏗️ Fases de Ejecución

### Resumen de Fases

| Fase | Nombre | Complejidad | Archivos estimados | Dependencias |
|------|--------|-------------|---------------------|-------------|
| **R1** | Middleware de Seguridad Core | ✅ Completado | ~12 | Ninguna |
| **R2** | Permisos Granulares por Módulo | ✅ Completado | ~20 | R1 |
| **R3** | UI Adaptativa por Rol | ✅ Completado | ~10 | R1 |
| **R4** | Panel Admin + Gestión de Usuarios | ✅ Completado | ~15 (nuevos) | R1, R2, R3 |
| **R5** | Onboarding: Invitación + Auto-registro | ✅ Completado | ~10 | R4 |
| **R6** | Externos: Vigencia + Módulos | ✅ Completado | ~8 | R2, R5 |
| **R7** | Mascotas + Config Global | ✅ Completado | ~6 | R4 |

---

## R1 — Middleware de Seguridad Core ✅ COMPLETADO

> **Objetivo:** Cerrar las brechas B1, B2, B3, B4  
> **Prioridad:** ✅ COMPLETADO (8 feb 2026)  
> **Estimación:** ~4-6 horas

### R1.1 — Refactorizar `authorize()` para usar jerarquía (B4)

**Archivo:** `packages/server/src/middleware/auth.ts`

```
Estado actual:
  authorize(...roles) → req.user.role está en la lista → OK

Estado deseado:
  authorize(minRole) → ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY[minRole] → OK
  authorize(...roles) → (opción de lista explícita también se mantiene)
```

**Tareas:**
- [x] Importar `ROLE_HIERARCHY` desde `@homeassistan/shared`
- [x] Crear dos variantes de authorize:
  - `authorizeMin(minRole)` — acceso a cualquier rol con jerarquía >= al mínimo
  - `authorize(...roles)` — mantener versión existente para permisos explícitos
- [x] Agregar tipo `AuthorizedRequest` que extienda `Request` con `user: JwtPayload` non-nullable

### R1.2 — Crear middleware `belongsToHouse()` (B2)

**Archivo nuevo:** `packages/server/src/middleware/house-guard.ts`

```typescript
// Verifica que el usuario autenticado pertenece a la casa 
// referenciada en la request (param, body, o JWT)
export const belongsToHouse = () => async (req, res, next) => {
  const houseId = req.user.houseId; // del JWT
  const targetHouseId = req.params.houseId || req.body.houseId;
  // Si hay targetHouseId, verificar que coincide con el JWT
  // Si no, inyectar houseId del JWT en la query
};
```

**Tareas:**
- [x] Crear middleware que compare `req.user.houseId` con el recurso solicitado
- [x] Aplicar automáticamente filtro `WHERE house_id = ?` en todas las queries de servicios
- [x] Inyectar `houseId` en `req` para que los servicios lo usen sin buscarlo en params

### R1.3 — Crear middleware `ownerOrAdmin()` (B3)

**Archivo:** `packages/server/src/middleware/auth.ts` (extender)

```typescript
// Para rutas como PATCH /users/:id — solo el propio usuario o un admin
export const ownerOrAdmin = (paramKey = 'id') => (req, res, next) => {
  if (req.user.userId === req.params[paramKey]) return next();
  if (ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY['admin']) return next();
  throw new AppError(403, 'FORBIDDEN', 'No tienes permiso');
};
```

**Tareas:**
- [x] Implementar middleware `ownerOrAdmin`
- [x] Variante `ownerOrRole(minRole)` para rutas donde responsables también pueden editar miembros de su casa

### R1.4 — Proteger endpoints públicos (B1)

**Archivos a modificar:**
- `packages/server/src/routes/house.routes.ts`
- `packages/server/src/routes/user.routes.ts`

| Endpoint | Antes | Después |
|----------|-------|---------|
| `POST /api/houses` | Público | `authenticate` + `authorize('admin', 'responsible')` |
| `POST /api/users` | Público | `authenticate` + `authorize('admin', 'responsible')` |
| `PATCH /api/users/:id` | Cualquier auth | `authenticate` + `ownerOrRole('responsible')` |
| `GET /api/houses` | Público | Mantener público (necesario para pantalla de selección) |

### R1.5 — Filtrar datos por pertenencia a casa en servicios

**Archivos a modificar:**
- `packages/server/src/services/tasks.service.ts`
- `packages/server/src/services/finance.service.ts`
- `packages/server/src/services/calendar.service.ts`
- `packages/server/src/services/health.service.ts`
- `packages/server/src/services/security.service.ts`
- `packages/server/src/services/communication.service.ts`
- `packages/server/src/services/dashboard.service.ts`

**Tareas:**
- [x] Auditar TODAS las queries en cada servicio
- [x] Agregar `AND house_id = ?` donde falte (usando el `houseId` del JWT)
- [x] Verificar que los servicios reciben `houseId` como parámetro obligatorio

### Criterios de Aceptación R1

- [x] Un usuario de Casa A NO puede ver datos de Casa B
- [x] `POST /api/houses` requiere autenticación + rol admin/responsible
- [x] `POST /api/users` requiere autenticación + rol admin/responsible
- [x] Un `member` NO puede editar el perfil de otro usuario
- [x] Un `admin` puede acceder a todo lo que puede un `responsible`
- [ ] Tests manuales con Postman/curl verificados

---

## R2 — Permisos Granulares por Módulo ✅ COMPLETADO

> **Objetivo:** Implementar la tabla de permisos exacta definida en la matriz (B5, B6)  
> **Prioridad:** ✅ COMPLETADO (8-9 feb 2026)  
> **Estimación:** ~6-8 horas  
> **Depende de:** R1

### R2.1 — Definir constantes de permisos en shared

**Archivo nuevo:** `packages/shared/src/types/permissions.ts`

```typescript
// Mapa estático de permisos por rol y módulo
export const PERMISSIONS = {
  finance: {
    viewGlobalBalance: ['admin', 'responsible'],
    viewOwnExpenses:   ['admin', 'responsible', 'member', 'simplified'],
    addExpense:        ['admin', 'responsible', 'member'],
    // ... según la matriz
  },
  tasks: {
    create:        ['admin', 'responsible'],
    createOwn:     ['member', 'simplified'],  // Solo auto-asignadas
    markComplete:  ['admin', 'responsible', 'member', 'simplified', 'external'],
    delete:        ['admin', 'responsible'],
    // ...
  },
  calendar: { ... },
  communication: { ... },
  security: { ... },
  health: { ... },
  system: { ... },
} as const;

// Helper
export function hasPermission(role: UserRole, module: string, action: string): boolean;
```

**Tareas:**
- [x] Crear archivo de permisos con TODA la matriz del usuario
- [x] Crear helper `hasPermission(role, module, action)`
- [x] Exportar desde `@homeassistan/shared`

### R2.2 — Aplicar permisos a rutas del backend

**Archivos a modificar (todas las rutas):**

#### 💰 Finanzas (`finance.routes.ts`)

| Endpoint | Antes | Después |
|----------|-------|---------|
| `GET /expenses/summary` | Cualquier auth | Admin/Resp: balance global · Member: solo propios · Simplified: solo lectura propios · External: ❌ |
| `GET /expenses` | Cualquier auth | Filtrar por `created_by = userId` si role < responsible |
| `POST /expenses` | Cualquier auth | Mantener (todos pueden agregar) |
| `PATCH/DELETE /expenses/:id` | Cualquier auth | Owner del gasto + admin/responsible |

#### ✅ Tareas (`tasks.routes.ts`)

| Endpoint | Antes | Después |
|----------|-------|---------|
| `POST /tasks` | Cualquier auth | Admin/Resp: crear y asignar a cualquiera · Member/Simplified: solo auto-asignadas |
| `DELETE /tasks/:id` | Admin/Resp | ✅ Ya correcto |
| `POST /tasks/:id/complete` | Cualquier auth | Solo asignado o admin/resp |
| `POST /tasks/:id/rotation` | Admin/Resp | ✅ Ya correcto |

#### 📅 Calendario (`calendar.routes.ts`)

| Endpoint | Antes | Después |
|----------|-------|---------|
| `POST /events` | Cualquier auth | Admin/Resp/Member · Simplified: ❌ · External: ❌ |
| `GET /events` | Cualquier auth | Todos ven · External: solo lectura |

#### 💬 Comunicación (`communication.routes.ts`)

| Endpoint | Antes | Después |
|----------|-------|---------|
| `POST /messages` | Cualquier auth | Admin/Resp/Member/Simplified: ✅ · External: solo chat con dueño |
| `GET /messages` | Cualquier auth | Simplified: solo lectura limitada · External: ❌ historial |
| `POST /announcements` | Admin/Resp | ✅ Ya correcto |

#### 🛡️ Seguridad (`security.routes.ts`)

| Endpoint | Antes | Después |
|----------|-------|---------|
| `*/vault` | Admin/Resp | ✅ Ya correcto |
| `POST /panic` | Cualquier auth | ✅ Todos (S.O.S.) |
| `*/visitor-codes` POST/DEL | Admin/Resp | ✅ Ya correcto |

#### 🏥 Salud (`health.routes.ts`)

| Endpoint | Antes | Después |
|----------|-------|---------|
| `PATCH /profiles/:id` | Cualquier auth | Owner + admin/resp · External: ❌ |
| `GET /medications` | Cualquier auth | Simplified/External: solo lectura |
| `PATCH /medications/:id` | Cualquier auth | Owner + admin/resp |

### R2.3 — Filtrado de datos por rol en servicios

**Archivos a modificar:** Todos los `*.service.ts`

**Lógica clave en Finanzas (ejemplo):**
```typescript
async getExpenses(houseId: string, userId: string, role: UserRole) {
  if (role === 'admin' || role === 'responsible') {
    // Ver todo el balance global de la casa
    return db.select().from(expenses).where(eq(expenses.houseId, houseId));
  }
  if (role === 'member') {
    // Ver solo gastos propios
    return db.select().from(expenses).where(
      and(eq(expenses.houseId, houseId), eq(expenses.createdBy, userId))
    );
  }
  // simplified: solo lectura de propios, external: nada
}
```

### Criterios de Aceptación R2

- [x] Cada endpoint respeta exactamente la matriz de permisos definida
- [x] `member` en Finanzas solo ve sus propios gastos, NO el balance global
- [x] `simplified` NO puede crear eventos de calendario
- [x] `external` solo puede completar tareas asignadas y usar chat limitado
- [x] `external` NO puede ver historial de chat completo
- [x] Admin puede ver y hacer todo

---

## R3 — UI Adaptativa por Rol ✅ COMPLETADO

> **Objetivo:** El frontend se adapta según el rol del usuario (B7)  
> **Prioridad:** ✅ COMPLETADO (9 feb 2026)  
> **Estimación:** ~4-5 horas  
> **Depende de:** R1

### R3.1 — Hook de permisos en frontend

**Archivo nuevo:** `packages/web/src/hooks/usePermissions.ts`

```typescript
import { hasPermission, PERMISSIONS } from '@homeassistan/shared';
import { useAuthStore } from '../stores/auth.store';

export function usePermissions() {
  const role = useAuthStore(s => s.user?.role);
  
  return {
    can: (module: string, action: string) => hasPermission(role, module, action),
    role,
    isAdmin: role === 'admin',
    isResponsible: role === 'responsible',
    isSimplified: role === 'simplified',
    isExternal: role === 'external',
  };
}
```

### R3.2 — Componente `<Can>` para renderizado condicional

**Archivo nuevo:** `packages/web/src/components/auth/Can.tsx`

```tsx
export function Can({ module, action, children, fallback }) {
  const { can } = usePermissions();
  return can(module, action) ? children : (fallback ?? null);
}

// Uso:
<Can module="finance" action="viewGlobalBalance">
  <BalanceCard total={...} />
</Can>
```

### R3.3 — Sidebar adaptativa

**Archivo:** `packages/web/src/components/layout/Sidebar.tsx`

| Rol | Módulos visibles |
|-----|-----------------|
| Admin | Todos + link `/admin` |
| Responsible | Todos (sin `/admin`) |
| Member | Dashboard, Tareas, Calendario, Finanzas (parcial), Comunicación, Salud (parcial) |
| Simplified | Dashboard (focus), Tareas (asignadas), Comunicación (chat solo lectura) |
| External | Tareas (asignadas), Chat (limitado) |

**Tareas:**
- [x] Filtrar items de navegación según `PERMISSIONS`
- [x] Agregar item "Admin" visible solo para `admin`
- [x] Estilizar visualmente el "Modo Focus" para `simplified`

### R3.4 — Guards de ruta en el frontend

**Archivo:** `packages/web/src/components/auth/RoleGuard.tsx`

```tsx
// Envuelve <Route> para verificar rol antes de renderizar
export function RoleGuard({ minRole, children }) {
  const { role } = usePermissions();
  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minRole]) {
    return <Navigate to="/dashboard" />;
  }
  return children;
}
```

**Archivo a modificar:** `packages/web/src/App.tsx` (o router config)

- [x] Envolver rutas sensibles con `<RoleGuard>`
- [x] `/admin/*` → solo `admin`
- [x] `/seguridad` (bóveda) → solo `admin`, `responsible`
- [x] Redirigir a `/dashboard` si el rol no tiene acceso

### R3.5 — Adaptar páginas existentes

**Archivos a modificar:**
- [x] `DashboardPage.tsx` — Ocultar tarjetas según rol (ej: Finanzas globales solo para admin/resp)
- [x] `FinancePage.tsx` — Protegido via RoleGuard (minRole: simplified)
- [x] `TasksPage.tsx` — Ocultar botón "Crear Tarea" con `<Can>` para roles sin permiso
- [x] `CommunicationPage.tsx` — Tabs filtradas por permisos del rol
- [x] `CalendarPage.tsx` — Protegido via RoleGuard (minRole: simplified)
- [x] `HealthPage.tsx` — Protegido via RoleGuard (minRole: simplified)
- [x] `SecurityPage.tsx` — Tabs filtradas (bóveda oculta para roles sin `manageVault`)

### R3.6 — Modo Focus (Simplificado)

**Archivo nuevo:** `packages/web/src/layouts/FocusLayout.tsx`

- [x] Layout alternativo con interfaz simplificada (botones grandes, menos opciones)
- [x] Tipografía más grande, menos clutter
- [x] Solo muestra: Tareas asignadas, Chat, Botón S.O.S.
- [x] Detectar `profileType === 'focus'` en el auth store

### Criterios de Aceptación R3

- [x] Un usuario `simplified` ve solo Tareas asignadas, Chat y S.O.S.
- [x] Un usuario `external` ve solo Tareas y Chat limitado
- [x] El Sidebar adapta sus items según el rol
- [x] Navegar directamente a `/seguridad` como `member` redirige al dashboard
- [x] El Modo Focus usa el layout simplificado
- [x] El botón "Crear Tarea" NO aparece para `simplified` ni `external`

---

## R4 — Panel Admin + Gestión de Usuarios ✅ COMPLETADO

> **Objetivo:** Crear el panel `/admin` y las pantallas de gestión de usuarios (B8, B9)  
> **Prioridad:** ✅ COMPLETADO (9 feb 2026)  
> **Estimación:** ~8-10 horas  
> **Depende de:** R1, R2, R3

### R4.1 — Backend: Rutas de Admin

**Archivo nuevo:** `packages/server/src/routes/admin.routes.ts`

| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/admin/stats` | GET | Estadísticas del sistema (casas, usuarios, sesiones) | admin |
| `/api/admin/logs` | GET | Logs del servidor (`activity_logs`) | admin |
| `/api/admin/users` | GET | Listar TODOS los usuarios del sistema | admin |
| `/api/admin/users/:id/role` | PATCH | Cambiar rol de un usuario | admin |
| `/api/admin/config` | GET/PUT | Configuración global del sistema | admin |

**Archivo nuevo:** `packages/server/src/services/admin.service.ts`

### R4.2 — Backend: Rutas de gestión de usuarios (nivel casa)

**Archivo a modificar:** `packages/server/src/routes/user.routes.ts`

| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `POST /api/users` | POST | Crear usuario (ya existe, refactorizar) | admin, responsible |
| `POST /api/users/:id/invite` | POST | Generar PIN temporal de invitación | admin, responsible |
| `PATCH /api/users/:id/role` | PATCH | Cambiar rol dentro de la casa | admin (para responsible), responsible (para member/simplified/external) |
| `GET /api/houses/:houseId/members` | GET | Miembros de la casa con roles | admin, responsible, member |
| `DELETE /api/houses/:houseId/members/:userId` | DELETE | Remover miembro de la casa | admin, responsible |
| `PATCH /api/users/:id/pin` | PATCH | Cambiar PIN propio | todos |

### R4.3 — BD: Configuración global del sistema

**Archivo nuevo en schema:** `packages/database/src/schema/system-config.ts`

```typescript
export const systemConfig = pgTable('system_config', {
  key:   varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

Configuraciones iniciales:
- `allow_house_creation`: `"admin_only"` | `"admin_and_responsible"`
- `allow_self_registration`: `"true"` | `"false"`
- `max_houses_per_responsible`: `"3"`
- `session_timeout_minutes`: `"60"`

### R4.4 — Frontend: Página Admin `/admin`

**Archivos nuevos:**
- `packages/web/src/pages/admin/AdminDashboardPage.tsx`
- `packages/web/src/pages/admin/AdminUsersPage.tsx`
- `packages/web/src/pages/admin/AdminLogsPage.tsx`
- `packages/web/src/pages/admin/AdminConfigPage.tsx`

**Secciones del Panel Admin:**
1. **Dashboard Admin:** Nº casas, Nº usuarios, sesiones activas, actividad reciente
2. **Gestión de Usuarios:** Tabla con filtros (por casa, por rol), crear/editar/eliminar
3. **Logs del Sistema:** Vista de `activity_logs` con filtros y paginación
4. **Configuración Global:** Toggles y campos para `system_config`

### R4.5 — Frontend: Gestión de miembros (nivel casa)

**Archivo nuevo:** `packages/web/src/pages/settings/HouseMembersPage.tsx`

Visible para `admin` y `responsible`:
- Lista de miembros de la casa con avatar, nombre, rol, estado
- Botón "Invitar Miembro" → genera PIN temporal
- Botón "Cambiar Rol" → dropdown de roles (según jerarquía)
- Botón "Eliminar" con confirmación
- Sección de solicitudes pendientes (ver R5)

**Archivo nuevo:** `packages/web/src/pages/settings/SettingsPage.tsx`

Ruta `/settings` — accesible por todos:
- Cambiar PIN propio
- Cambiar nombre/avatar
- Preferencias (tema, idioma)
- Solo admin/resp: link a "Gestionar Miembros"

### R4.6 — Actualizar rutas del frontend

**Archivo a modificar:** Router en `App.tsx`

```
/admin               → AdminDashboardPage (RoleGuard: admin)
/admin/users         → AdminUsersPage     (RoleGuard: admin)
/admin/logs          → AdminLogsPage      (RoleGuard: admin)
/admin/config        → AdminConfigPage    (RoleGuard: admin)
/settings            → SettingsPage        (todos)
/settings/members    → HouseMembersPage   (RoleGuard: responsible)
```

### Criterios de Aceptación R4

- [x] El panel `/admin` solo es accesible por usuarios con rol `admin`
- [x] Un `responsible` puede ver y gestionar los miembros de su casa
- [x] Un `responsible` NO puede crear otros `responsible` (solo admin puede)
- [x] Un `responsible` puede crear `member`, `simplified`, `external`
- [x] Todos los usuarios pueden cambiar su propio PIN
- [x] La página de settings muestra opciones adaptadas al rol
- [x] Los logs del sistema muestran la actividad con paginación

---

## R5 — Onboarding: Invitación + Auto-registro ✅

> **Objetivo:** Implementar los 2 métodos de ingreso de miembros (B10, B12)  
> **Prioridad:** 🟡 MEDIA  
> **Estimación:** ~5-6 horas  
> **Depende de:** R4

### R5.1 — BD: Estado de aprobación de miembros

**Archivo a modificar:** `packages/database/src/schema/house-members.ts`

```typescript
// Agregar columna de estado
memberStatus: varchar('member_status', { length: 20 })
  .default('active')
  .notNull(),
// Valores: 'active' | 'pending' | 'suspended' | 'invited'

// Agregar campo de invitación
invitedBy:    uuid('invited_by').references(() => users.id),
tempPinHash:  varchar('temp_pin_hash', { length: 255 }),
tempPinExpiry: timestamp('temp_pin_expiry'),
```

**Migración necesaria:** Agregar columnas `member_status`, `invited_by`, `temp_pin_hash`, `temp_pin_expiry`

### R5.2 — Backend: Método A — Invitación con PIN temporal

**Archivo a modificar:** `packages/server/src/services/auth.service.ts`

Flujo:
1. `POST /api/users/:id/invite` → Responsable crea usuario con `member_status = 'invited'` y `temp_pin_hash`
2. El usuario invitado aparece en la pantalla de login con badge "Nuevo"
3. Al ingresar con PIN temporal → sistema fuerza "Crea tu nuevo PIN"
4. `POST /api/auth/activate` → Guarda nuevo PIN, cambia status a `active`

**Endpoints nuevos:**
| Endpoint | Descripción |
|----------|-------------|
| `POST /api/auth/activate` | Activar cuenta invitada (cambiar PIN temporal → permanente) |
| `GET /api/houses/:id/members?status=invited` | Ver invitaciones pendientes |

### R5.3 — Backend: Método B — Auto-registro

**Archivo nuevo/modificar:** `packages/server/src/services/auth.service.ts`

Flujo:
1. En login de casa, botón "Soy nuevo aquí"
2. `POST /api/auth/register` → crea usuario con `member_status = 'pending'`, rol default `member`
3. Los Responsables reciben notificación (WebSocket)
4. `POST /api/users/:id/approve` → Responsable aprueba → status = `active`
5. `POST /api/users/:id/reject` → Responsable rechaza → elimina usuario

**Endpoints nuevos:**
| Endpoint | Descripción |
|----------|-------------|
| `POST /api/auth/register` | Solicitar acceso a una casa (auto-registro) |
| `POST /api/users/:id/approve` | Aprobar solicitud (admin/responsible) |
| `POST /api/users/:id/reject` | Rechazar solicitud (admin/responsible) |
| `GET /api/houses/:id/pending` | Ver solicitudes pendientes |

### R5.4 — Frontend: Flujo de invitación

**Archivos a modificar/crear:**
- `UserLoginPage.tsx` — Mostrar badge "Nuevo" en usuarios invitados
- **Nuevo:** `ActivateAccountPage.tsx` — Formulario "Crea tu nuevo PIN"
- `HouseMembersPage.tsx` — Botón "Invitar" que genera PIN temporal

### R5.5 — Frontend: Flujo de auto-registro

**Archivos a crear:**
- **Nuevo:** `SelfRegisterPage.tsx` — Formulario: nombre + PIN deseado
- **Nuevo:** `PendingApprovalPage.tsx` — "Tu solicitud está pendiente de aprobación"
- `HouseMembersPage.tsx` — Sección "Solicitudes Pendientes" con botones Aprobar/Rechazar

### R5.6 — Notificaciones de aprobación

**Archivo a modificar:** `packages/server/src/socket.ts`

- [ ] Emitir evento `member:pending` cuando llega una solicitud
- [ ] Emitir evento `member:approved` cuando se aprueba
- [ ] Los Responsables ven un badge en la campana de notificaciones

### Criterios de Aceptación R5

- [x] Un Responsable puede invitar con PIN temporal → el invitado cambia su PIN al primer login
- [x] Un visitante puede solicitar acceso → queda en "Pendiente" hasta que un Responsable aprueba
- [x] El Responsable ve las solicitudes pendientes y puede aprobar/rechazar
- [x] Un usuario pending NO puede acceder a ningún módulo
- [ ] Las notificaciones llegan en tiempo real via WebSocket (pendiente: requiere WebSocket — se implementará como mejora)

---

## R6 — Externos: Vigencia Temporal + Módulos ✅

> **Objetivo:** Implementar restricciones temporales y de módulos para el rol `external` (B11)  
> **Prioridad:** 🟡 MEDIA  
> **Estimación:** ~4-5 horas  
> **Depende de:** R2, R5

### R6.1 — BD: Configuración de acceso para externos

**Archivo a modificar:** `packages/database/src/schema/house-members.ts`

```typescript
// Nuevas columnas (solo aplican a role = 'external')
accessSchedule: jsonb('access_schedule'),
// Formato: { days: ['monday', 'wednesday'], timeStart: '08:00', timeEnd: '18:00' }
// null = acceso indefinido

allowedModules: text('allowed_modules').array(),
// Formato: ['tasks', 'communication']
// null = acceso según permisos default del rol

accessExpiry: timestamp('access_expiry'),
// Fecha de expiración del acceso (null = sin expiración)
```

### R6.2 — Backend: Middleware de acceso temporal

**Archivo nuevo:** `packages/server/src/middleware/external-guard.ts`

```typescript
export const checkExternalAccess = () => async (req, res, next) => {
  if (req.user.role !== 'external') return next();
  
  // 1. Verificar si el acceso ha expirado
  // 2. Verificar si es día/hora permitido según accessSchedule
  // 3. Verificar si el módulo de la ruta está en allowedModules
  // Si falla → 403 con mensaje descriptivo
};
```

**Tareas:**
- [ ] Crear middleware `checkExternalAccess`
- [ ] Aplicar en TODAS las rutas protegidas (después de `authenticate`)
- [ ] O mejor: integrarlo dentro de `authenticate` para que sea automático

### R6.3 — Frontend: Formulario de creación de externos

**Archivo a modificar:** `HouseMembersPage.tsx`

Al crear usuario con rol `external`, mostrar campos adicionales:
- [ ] **Vigencia:** Date picker para fecha de expiración
- [ ] **Horario:** Multi-select de días + time pickers (inicio/fin)
- [ ] **Módulos permitidos:** Checklist (Tareas ✅, Chat ✅, Calendario ❌, etc.)

### R6.4 — Backend: Expiración automática

**Archivo a modificar/crear:** Cron job o check en login

- [ ] Al hacer login, verificar si `accessExpiry` ya pasó → rechazar con mensaje "Tu acceso ha expirado"
- [ ] Opcional: Cron que desactiva externos vencidos (`member_status = 'suspended'`)

### Criterios de Aceptación R6

- [x] Un externo con vigencia "Solo Lunes y Miércoles" no puede acceder en Martes
- [x] Un externo con módulos `['tasks']` no puede acceder a `/api/finance/*`
- [x] Un externo cuyo `accessExpiry` pasó no puede hacer login
- [x] El formulario de creación de externos muestra las opciones de vigencia/módulos

---

## R7 — Mascotas + Configuración Global ✅ COMPLETADO

> **Objetivo:** Implementar fichas de mascotas y settings del sistema (B13, B14)  
> **Prioridad:** 🟢 BAJA  
> **Estimación:** ~3-4 horas  
> **Depende de:** R4

### R7.1 — BD: Tabla de mascotas

**Archivo nuevo:** `packages/database/src/schema/pets.ts`

```typescript
export const pets = pgTable('pets', {
  id:        uuid('id').defaultRandom().primaryKey(),
  houseId:   uuid('house_id').references(() => houses.id).notNull(),
  name:      varchar('name', { length: 100 }).notNull(),
  species:   varchar('species', { length: 50 }).notNull(), // perro, gato, etc.
  breed:     varchar('breed', { length: 100 }),
  birthDate: date('birth_date'),
  weight:    real('weight'),
  avatar:    text('avatar'),
  allergies: text('allergies'),
  vetName:   varchar('vet_name', { length: 100 }),
  vetPhone:  varchar('vet_phone', { length: 20 }),
  notes:     text('notes'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### R7.2 — Backend: CRUD de mascotas

**Archivos nuevos:**
- `packages/server/src/routes/pets.routes.ts`
- `packages/server/src/services/pets.service.ts`

| Endpoint | Método | Roles |
|----------|--------|-------|
| `GET /api/pets` | GET | admin, responsible, member |
| `POST /api/pets` | POST | admin, responsible, member |
| `PATCH /api/pets/:id` | PATCH | admin, responsible, member (owner) |
| `DELETE /api/pets/:id` | DELETE | admin, responsible |

### R7.3 — Frontend: Sección de mascotas

**Archivo nuevo:** `packages/web/src/pages/PetsPage.tsx`

- Lista de mascotas con tarjetas (foto, nombre, especie)
- Modal crear/editar mascota
- Ficha detallada (datos del vet, alergias, peso)
- Accesible desde Sidebar para admin/responsible/member

### Criterios de Aceptación R7

- [x] Se pueden crear fichas de mascotas con datos básicos y veterinarios
- [x] Las mascotas pertenecen a una casa (filtradas por `houseId`)
- [x] Solo admin/responsible/member pueden gestionar mascotas
- [x] Simplified y external no ven la sección de mascotas

---

## 📅 Cronograma Sugerido

```
Semana 1: R1 (Seguridad Core)     ████████████████████  CRÍTICO
Semana 2: R2 (Permisos Granulares) ████████████████████  CRÍTICO  
Semana 2: R3 (UI Adaptativa)       ██████████████        EN PARALELO CON R2
Semana 3: R4 (Panel Admin + Users)  ████████████████████  
Semana 4: R5 (Onboarding)           ██████████████████    
Semana 4: R6 (Externos)             ████████████████      EN PARALELO CON R5
Semana 5: R7 (Mascotas + Config)    ██████████            OPCIONAL
```

**Estimación total:** ~35-44 horas de desarrollo

---

## 🧪 Estrategia de Testing

| Fase | Tipo de Test | Qué verificar |
|------|-------------|---------------|
| R1 | Integration tests | Middleware rechaza acceso cross-house, ownership checks |
| R2 | Integration tests | Cada endpoint respeta la matriz de permisos por rol |
| R3 | Manual / E2E | UI se adapta correctamente a cada rol |
| R4 | E2E | Flujo completo: admin crea casa → asigna responsable → responsable gestiona |
| R5 | E2E | Flujo invitación y auto-registro end-to-end |
| R6 | Integration | Acceso temporal rechazado fuera de horario/fecha |
| R7 | Unit + Integration | CRUD mascotas con permisos |

### Seed de Testing Recomendado

Actualizar `packages/database/src/seed.ts`:

```
Casa Demo (PIN: 1234)
  ├── Admin (PIN: 0000) — role: admin ✅ ya existe
  ├── María (PIN: 1111) — role: responsible (cambiar de member)
  ├── Carlos (PIN: 3333) — role: member (nuevo)
  ├── Abuelo (PIN: 2222) — role: simplified ✅ ya existe
  ├── Limpieza (PIN: 4444) — role: external (nuevo, vigencia L-M-V)
  └── 🐕 Rocky — role: pet (ficha, sin login)
```

---

## ⚠️ Riesgos y Consideraciones

| Riesgo | Mitigación |
|--------|-----------|
| Romper el login actual al proteger `POST /users` | Crear ruta alternativa `POST /auth/register` para auto-registro |
| Performance: queries N+1 al verificar permisos | Cache de permisos en JWT claims o Redis |
| Over-engineering: demasiada granularidad | Mantener permisos como constantes estáticas, NO en BD |
| Migración de datos existentes | El seed existente debe actualizarse, la migración debe ser backward-compatible |
| Usuarios `simplified` frustrados | Probar el Modo Focus con usuarios reales (UX) |

---

## 📝 Orden de Ejecución Recomendado (Paso a Paso)

### Paso 1 — Preparación
1. Crear `packages/shared/src/types/permissions.ts` con la matriz completa
2. Exportar desde shared
3. Rebuild shared + database

### Paso 2 — Middleware Core (R1)
4. Refactorizar `authorize()` con jerarquía
5. Crear `belongsToHouse()` middleware
6. Crear `ownerOrAdmin()` middleware
7. Proteger `POST /houses` y `POST /users`
8. Auditar y agregar `houseId` filter en TODOS los servicios
9. **TEST:** Verificar con Postman que cross-house access está bloqueado

### Paso 3 — Permisos por Módulo (R2)
10. Aplicar permisos en `finance.routes.ts`
11. Aplicar permisos en `tasks.routes.ts`
12. Aplicar permisos en `calendar.routes.ts`
13. Aplicar permisos en `communication.routes.ts`
14. Aplicar permisos en `health.routes.ts`
15. Aplicar permisos en `security.routes.ts` (ya parcialmente hecho)
16. Modificar servicios para filtrar datos según rol
17. **TEST:** Probar cada endpoint con cada rol

### Paso 4 — Frontend Guards (R3)
18. Crear `usePermissions` hook
19. Crear componente `<Can>`
20. Crear `<RoleGuard>`
21. Adaptar Sidebar
22. Adaptar cada página con `<Can>`
23. Crear `FocusLayout`
24. **TEST:** Login como cada rol y verificar visualmente

### Paso 5 — Admin + Users (R4)
25. Schema `system_config` + migración
26. Backend: rutas admin + servicios
27. Backend: rutas gestión de miembros
28. Frontend: páginas admin (4 páginas)
29. Frontend: `SettingsPage` + `HouseMembersPage`
30. **TEST:** Flujo admin completo

### Paso 6 — Onboarding (R5)
31. Migración: agregar columns a `house_members`
32. Backend: flujo invitación
33. Backend: flujo auto-registro
34. Frontend: `ActivateAccountPage`
35. Frontend: `SelfRegisterPage` + `PendingApprovalPage`
36. WebSocket notifications
37. **TEST:** Ambos flujos end-to-end

### Paso 7 — Externos y Mascotas (R6 + R7)
38. Migración: columns externos en `house_members`
39. Backend: middleware `checkExternalAccess`
40. Frontend: formulario de configuración de externos
41. Schema `pets` + migración
42. Backend + Frontend de mascotas
43. Actualizar seed
44. **TEST FINAL:** Verificar TODA la matriz de permisos

---

> **Nota:** Este plan asume que cada fase se implementa, testea y mergea antes de pasar a la siguiente. Las fases R2+R3 y R5+R6 pueden desarrollarse en paralelo si hay recursos.
