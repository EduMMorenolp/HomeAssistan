# 🚀 Plan de Implementación - HomeAsisstan

**Versión:** 1.0  
**Fecha:** Febrero 2026

## Stack Tecnológico Confirmado

### Frontend
- **Framework:** React + Vite
- **Lenguaje:** TypeScript
- **UI Library:** Radix UI / shadcn/ui
- **State Management:** Zustand / React Query
- **Routing:** React Router v6
- **Formularios:** React Hook Form + Zod
- **Estilos:** TailwindCSS

### Backend
- **Runtime:** Node.js 20+ LTS
- **Framework:** Express.js / Fastify
- **Lenguaje:** TypeScript
- **ORM:** Drizzle ORM
- **Autenticación:** JWT + bcrypt
- **Validación:** Zod

### Base de Datos
- **Principal:** PostgreSQL 15+
- **Cache/Realtime:** Redis (opcional para chat)
- **Migraciones:** Drizzle Kit

### Infraestructura
- **Containerización:** Docker + Docker Compose
- **Comunicación:** REST API + WebSockets (Socket.io)
- **Deployment:** Local (LAN only)

---

## 📋 Fases de Implementación

### **FASE 0: Setup Inicial (Semana 1)**

#### 0.1 Estructura del Proyecto
```
homeassistan/
├── packages/
│   ├── web/              # Frontend Vite + React
│   ├── server/           # Backend Node + Express
│   ├── database/         # Drizzle schemas y migrations
│   └── shared/           # Types compartidos
├── docker-compose.yml
├── package.json          # Monorepo root
└── README.md
```

#### 0.2 Tareas
- [ ] Inicializar monorepo (pnpm/npm workspaces o Turborepo)
- [ ] Configurar Vite + React + TypeScript
- [ ] Configurar Node + Express + TypeScript
- [ ] Setup Drizzle ORM + PostgreSQL
- [ ] Configurar Docker Compose (Postgres + Redis)
- [ ] Setup ESLint + Prettier
- [ ] Configurar variables de entorno (.env.example)

#### 0.3 Scripts Base
```json
{
  "dev": "concurrently \"pnpm dev:web\" \"pnpm dev:server\"",
  "dev:web": "pnpm --filter web dev",
  "dev:server": "pnpm --filter server dev",
  "db:push": "pnpm --filter database db:push",
  "db:studio": "pnpm --filter database db:studio"
}
```

---

### **FASE 1: Core - Autenticación y Gestión de Casas (Semanas 2-3)**

#### 1.1 Base de Datos (Drizzle Schema)
**Prioridad:** 🔴 CRÍTICA

```typescript
// Tablas principales:
- houses          // Casas
- users           // Usuarios
- house_members   // Relación users-houses (con rol)
- sessions        // Sesiones JWT
```

**Campos clave:**
- `houses`: id, name, pin_hash, created_at
- `users`: id, name, email, personal_pin_hash, profile_type
- `house_members`: house_id, user_id, role, permissions

#### 1.2 Backend Features
- [ ] API: POST /auth/house/select (seleccionar casa + PIN general)
- [ ] API: POST /auth/user/login (login usuario + PIN personal)
- [ ] API: POST /auth/refresh (renovar JWT)
- [ ] Middleware de autenticación (verify JWT)
- [ ] Middleware de permisos por rol
- [ ] CRUD de casas (solo admin)
- [ ] CRUD de usuarios y miembros

#### 1.3 Frontend Features
- [ ] Pantalla de selección de casa
- [ ] Pantalla de login de usuario
- [ ] Context de autenticación (user, house, role)
- [ ] ProtectedRoute component
- [ ] Layout base con navegación

---

### **FASE 2: Dashboard y Sistema de Roles (Semanas 4-5)**

#### 2.1 Base de Datos
```typescript
- user_preferences  // Configuración UI por usuario
- activity_logs     // Auditoría de acciones
```

#### 2.2 Backend Features
- [ ] API: GET /dashboard/public (info compartida de la casa)
- [ ] API: GET /dashboard/private/:userId (info personal)
- [ ] Sistema de permisos granular (RBAC)
- [ ] Logs de actividad

#### 2.3 Frontend Features
- [ ] Dashboard público (vista de casa)
- [ ] Dashboard privado (vista personal)
- [ ] Componente de tarjetas modulares
- [ ] Sistema de temas (claro/oscuro)
- [ ] Modo "Power User" vs "Focus"
- [ ] Navegación adaptativa por rol

---

### **FASE 3: Módulo de Comunicación (Semanas 6-7)**

#### 3.1 Base de Datos
```typescript
- announcements     // Muro de la casa
- messages          // Chat interno
- notifications     // Notificaciones push
- panic_pings       // Botón de pánico
```

#### 3.2 Backend Features
- [ ] WebSocket setup (Socket.io)
- [ ] API: CRUD de anuncios
- [ ] Sistema de chat en tiempo real
- [ ] Sistema de notificaciones
- [ ] Botón de pánico (broadcast a todos los miembros)

#### 3.3 Frontend Features
- [ ] Muro de anuncios con CRUD
- [ ] Chat en tiempo real (UI simple)
- [ ] Sistema de notificaciones (toast/banner)
- [ ] Botón de pánico con confirmación
- [ ] Indicadores de usuarios online

---

### **FASE 4: Módulo de Tareas (Semanas 8-9)**

#### 4.1 Base de Datos
```typescript
- tasks             // Tareas
- task_assignments  // Asignaciones
- task_rotations    // Configuración de rotaciones
- task_completions  // Historial de completado
- gamification      // Puntos y recompensas
```

#### 4.2 Backend Features
- [ ] CRUD de tareas
- [ ] Sistema de asignación (manual/automático)
- [ ] Motor de rotación automática
- [ ] API de gamificación (puntos, rankings)
- [ ] Notificaciones de tareas pendientes

#### 4.3 Frontend Features
- [ ] Lista de tareas (vista por usuario)
- [ ] Crear/editar tareas
- [ ] Marcar tareas como completadas
- [ ] Configurar rotaciones
- [ ] Dashboard de gamificación
- [ ] Historial de tareas

---

### **FASE 5: Módulo de Calendario (Semana 10)**

#### 5.1 Base de Datos
```typescript
- events            // Eventos del hogar
- event_attendees   // Participantes
```

#### 5.2 Backend Features
- [ ] CRUD de eventos
- [ ] Gestión de asistentes
- [ ] API de sincronización (Google Calendar)
- [ ] Recordatorios automáticos

#### 5.3 Frontend Features
- [ ] Vista de calendario (mes/semana/día)
- [ ] Crear/editar eventos
- [ ] Invitar miembros a eventos
- [ ] Filtros por tipo de evento

---

### **FASE 6: Módulo de Finanzas (Semanas 11-12)**

#### 6.1 Base de Datos
```typescript
- expenses          // Gastos
- shopping_list     // Lista de compras
- household_items   // Inventario del hogar
```

#### 6.2 Backend Features
- [ ] CRUD de gastos
- [ ] Reportes de gastos (por mes/categoría)
- [ ] CRUD de lista de compras
- [ ] Inventario de artículos del hogar
- [ ] Permisos de visibilidad por rol

#### 6.3 Frontend Features
- [ ] Registro de gastos
- [ ] Dashboard de finanzas
- [ ] Lista de compras compartida
- [ ] Gestión de inventario
- [ ] Gráficas de gastos

---

### **FASE 7: Módulo de Salud (Semanas 13-14)**

#### 7.1 Base de Datos
```typescript
- health_profiles   // Perfiles clínicos
- medications       // Medicamentos
- medication_logs   // Tomas registradas
- health_routines   // Rutinas (ejercicio, hidratación)
```

#### 7.2 Backend Features
- [ ] CRUD de perfiles de salud (encriptado)
- [ ] Gestión de medicamentos
- [ ] Sistema de recordatorios de medicación
- [ ] CRUD de rutinas
- [ ] Alertas de stock bajo

#### 7.3 Frontend Features
- [ ] Formulario de perfil clínico
- [ ] Gestión de medicamentos
- [ ] Recordatorios visuales
- [ ] Tracker de rutinas
- [ ] Dashboard de salud

---

### **FASE 8: Módulo de Seguridad (Semanas 15-16)**

#### 8.1 Base de Datos
```typescript
- emergency_contacts // Contactos de emergencia
- secure_vault       // Bóveda de accesos (encriptado)
- visitor_codes      // Códigos temporales
- access_logs        // Logs de acceso
```

#### 8.2 Backend Features
- [ ] Gestión de contactos de emergencia
- [ ] Bóveda encriptada (AES-256)
- [ ] Generación de códigos temporales
- [ ] Sistema de logs de acceso
- [ ] Botón S.O.S. (notificación externa)

#### 8.3 Frontend Features
- [ ] Configuración de emergencias
- [ ] Bóveda de contraseñas/códigos
- [ ] Generador de códigos para invitados
- [ ] Botón S.O.S. prominente
- [ ] Visor de logs de acceso (admin)

---

### **FASE 9: Optimización y Accesibilidad (Semanas 17-18)**

#### 9.1 Tareas
- [ ] Implementar modo "Focus" (UI simplificada)
- [ ] Accesibilidad (ARIA, navegación por teclado)
- [ ] Optimización de rendimiento
- [ ] PWA (Progressive Web App)
- [ ] Lazy loading de módulos
- [ ] Compresión de assets
- [ ] Setup de cache (Service Worker)

#### 9.2 Testing
- [ ] Tests unitarios (Vitest)
- [ ] Tests de integración (API)
- [ ] Tests E2E (Playwright)
- [ ] Tests de carga

---

### **FASE 10: Deployment y Documentación (Semanas 19-20)**

#### 10.1 Deployment
- [ ] Dockerfile optimizado (multi-stage)
- [ ] Docker Compose para producción
- [ ] Scripts de backup automático
- [ ] Configuración de red LAN
- [ ] Guía de instalación

#### 10.2 Documentación
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Manual de usuario
- [ ] Guía de administrador
- [ ] Troubleshooting guide
- [ ] Changelog

---

## 🎯 Priorización de Features (MVP)

### Must Have (Fase 1-4)
1. ✅ Autenticación doble nivel
2. ✅ Gestión de roles
3. ✅ Dashboard público/privado
4. ✅ Comunicación básica (muro + chat)
5. ✅ Tareas básicas

### Should Have (Fase 5-7)
6. Calendario
7. Finanzas
8. Salud

### Nice to Have (Fase 8-10)
9. Seguridad avanzada
10. Gamificación completa
11. Integraciones externas

---

## 📊 Métricas de Éxito

- ⚡ Tiempo de carga inicial < 2s
- 📱 Responsive design (mobile-first)
- 🔒 100% de datos sensibles encriptados
- 🌐 Funciona sin internet (solo LAN)
- ♿ WCAG 2.1 AA compliance
- 🧪 >80% code coverage

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
pnpm dev                    # Inicia todo el proyecto
pnpm db:push                # Sincroniza schema con DB
pnpm db:studio              # Abre Drizzle Studio
pnpm db:seed                # Datos de prueba

# Producción
docker-compose up -d        # Levanta servicios
pnpm build                  # Build de producción
pnpm start                  # Inicia en producción

# Testing
pnpm test                   # Tests unitarios
pnpm test:e2e               # Tests end-to-end
pnpm lint                   # Linting
```

---

## 📅 Timeline Estimado

**Total:** ~20 semanas (~5 meses)

- **MVP (Fases 1-4):** 9 semanas
- **Features completas (Fases 5-8):** 16 semanas
- **Producción (Fases 9-10):** 20 semanas

---

## 🚨 Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Complejidad de WebSockets | Media | Alto | Usar Socket.io (abstracción probada) |
| Encriptación de datos | Media | Crítico | Usar bcrypt + crypto nativo de Node |
| Rendimiento en móviles | Alta | Medio | Lazy loading + code splitting |
| Sincronización de estado | Media | Alto | React Query + Zustand |
| Deployment LAN | Baja | Alto | Docker + documentación detallada |

---

## 📚 Próximos Pasos

1. [ ] Revisar y aprobar este plan
2. [ ] Configurar repositorio Git
3. [ ] Iniciar Fase 0 (setup inicial)
4. [ ] Crear primer sprint (2 semanas)
5. [ ] Establecer flujo de trabajo (Git Flow)
