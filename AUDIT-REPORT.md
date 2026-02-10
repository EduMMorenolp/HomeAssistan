# 🔍 Informe de Auditoría — HomeAssistan

> **Fecha:** 9 de febrero de 2026  
> **Alcance:** 12 páginas frontend, 12 servicios backend, 12 routers, 30 tablas DB, 4 middleware  
> **Estado general:** Sistema funcional con RBAC completo (R1-R7). Brechas concentradas en UX y funcionalidad de edición.

---

## 📊 Resumen Ejecutivo

| Categoría | Total | Completas | Parciales | Pendientes |
|-----------|:-----:|:---------:|:---------:|:----------:|
| Tablas DB | 30 | 30 | 0 | 0 |
| Servicios backend | 12 | 12 | 0 | 0 |
| Rutas backend | 12 | 12 | 0 | 0 |
| Páginas frontend | 14 | 5 | 9 | 0 |
| Middleware RBAC | 4 | 4 | 0 | 0 |

**Estimación total para cerrar brechas: ~18-22 horas**

---

## 🔴 ALTA PRIORIDAD — Funcionalidad rota o ausente visible

### A1. Admin Panel — Sin acciones de crear

**Ubicación:** `packages/web/src/pages/admin/AdminPage.tsx`

El panel de administración solo **muestra datos** (lectura) pero no permite operaciones de escritura. Falta:

- [ ] **Botón "Crear Casa"** — el endpoint `POST /api/houses` existe y funciona, pero no hay formulario ni botón en la UI
- [ ] **Botón "Crear Usuario"** — el endpoint `POST /api/users` existe, pero no hay formulario en el tab de Usuarios
- [ ] **Botón "Eliminar Usuario"** — en la tabla solo aparece "cambiar rol" y "revocar sesión"
- [ ] **Botón "Eliminar Casa"** — el endpoint `DELETE /api/houses/:id` existe, sin acción en UI

**Esfuerzo estimado:** ~1h

---

### A2. Dashboard — Notificaciones hardcoded a `0`

**Ubicación:** `packages/server/src/services/dashboard.service.ts` (línea ~73)

```typescript
// ACTUAL — siempre devuelve 0
unreadNotifications: 0
```

Nunca consulta la tabla `notifications`. La tarjeta "Notificaciones" del dashboard siempre muestra un guión o cero.

**Fix:** Hacer query real a la tabla `notifications` filtrando por `isRead = false` y `userId`.

**Esfuerzo estimado:** ~15min

---

### A3. Dashboard — Contenido muy pobre

**Ubicación:** `packages/web/src/pages/DashboardPage.tsx` (~167 líneas)

Actualmente solo muestra: 3 tarjetas numéricas (casas, usuarios, sesiones) + grid de módulos.

Falta:
- [ ] Sección de **actividad reciente** (últimas tareas completadas, mensajes nuevos)
- [ ] Widget de **próximos eventos** del calendario
- [ ] **Alertas pendientes** (stock bajo en inventario, medicamentos por tomar)
- [ ] **Acciones rápidas** (crear tarea, nuevo gasto, nueva nota)
- [ ] Enlace directo a notificaciones sin leer

**Esfuerzo estimado:** ~2-3h

---

### A4. SettingsPage — No refresca el store tras cambiar nombre

**Ubicación:** `packages/web/src/pages/settings/SettingsPage.tsx`

Cuando el usuario cambia su nombre, el toast "Guardado" aparece pero el **nombre viejo permanece en el Sidebar/TopBar** porque no se llama `useAuthStore.getState().setUser(...)` después de la mutación exitosa.

**Esfuerzo estimado:** ~10min

---

### A5. FocusLayout — S.O.S. no abre pestaña de pánico

**Ubicación:**
- `packages/web/src/layouts/FocusLayout.tsx` — envía `state: { panic: true }`
- `packages/web/src/pages/CommunicationPage.tsx` — **nunca lee** ese state

El botón S.O.S. en el layout simplificado navega a `/comunicacion` pero la CommunicationPage no detecta el state para abrir automáticamente la pestaña de pánico.

**Fix:** En CommunicationPage, leer `location.state?.panic` y setear el tab a `"panic"` al montar.

**Esfuerzo estimado:** ~15min

---

## 🟡 MEDIA PRIORIDAD — Funcionalidad incompleta

### M1. Falta EDICIÓN en casi todos los módulos

El patrón se repite: se puede **Crear** y **Eliminar**, pero no **Editar**.

| Módulo | Backend soporta | Frontend permite | Estado |
|--------|:---------------:|:----------------:|--------|
| Gastos (expenses) | ✅ `PATCH` | ❌ | Sin modal de edición |
| Items de compra | ❌ | ❌ | Ni backend ni frontend |
| Inventario | ✅ `PATCH` | ❌ | `// TODO` en código |
| Eventos calendario | ✅ `PUT` | ❌ | Sin modal de edición |
| Medicamentos | ✅ `PATCH` | ❌ | Sin modal de edición |
| Rutinas de salud | ❌ | ❌ | Ni backend ni frontend |
| Contactos emergencia | ✅ `PATCH` | ❌ | Sin modal de edición |
| Entradas bóveda | ✅ `PATCH` | ❌ | Sin modal de edición |
| Códigos visitante | ❌ | ❌ | Solo generar/eliminar |
| Anuncios | ✅ `PUT` | ❌ | Sin modal de edición |
| Mensajes chat | ❌ | ❌ | Campo `isEdited` en DB sin usar |

**Esfuerzo estimado:** ~4-6h (modales reutilizables)

---

### M2. UserLoginPage pierde estado al recargar

**Ubicación:** `packages/web/src/pages/auth/UserLoginPage.tsx`

La página depende de `location.state.members`. Si el usuario **recarga el navegador** en `/auth/login`, el array de miembros desaparece y queda pantalla vacía.

**Fix:** Guardar `houseId` en sessionStorage y re-fetch los miembros si `location.state` está vacío.

**Esfuerzo estimado:** ~30min

---

### M3. HouseSelectPage — Sin página de "Crear Casa"

**Ubicación:** `packages/web/src/pages/auth/HouseSelectPage.tsx`

El botón "Crear nueva casa" navega a `/auth/house/create` que **no existe como ruta** en `App.tsx`. Falta:

- [ ] Crear `CreateHousePage.tsx` con formulario (nombre, PIN, dirección)
- [ ] Registrar ruta en `App.tsx`

**Esfuerzo estimado:** ~1h

---

### M4. Calendario — Filtrado por fechas no implementado

**Ubicación:** `packages/server/src/services/calendar.service.ts`

El servicio acepta parámetros `from`/`to` (con prefijo `_` indicando que son placeholder) pero **nunca los aplica al query**. Devuelve siempre TODOS los eventos de la casa.

**Esfuerzo estimado:** ~30min

---

### M5. Sin paginación en múltiples módulos

Las siguientes listas cargan **todos los registros de golpe**:

| Módulo | Endpoint | Riesgo |
|--------|----------|--------|
| Tareas | `GET /tasks` | Alto con muchas tareas |
| Gastos | `GET /finance/expenses` | Alto con historial largo |
| Mensajes chat | `GET /communication/messages` | Alto con conversación larga |
| Notificaciones | `GET /communication/notifications` | Medio |
| Logs de seguridad | `GET /security/access-logs` | Medio |

Solo los logs de admin (`GET /admin/logs`) tienen paginación implementada.

**Esfuerzo estimado:** ~2h

---

### M6. RBAC inconsistente en botones frontend

Algunas páginas aplican permisos RBAC en los botones de acción, otras no:

| Página | ¿Usa RBAC en botones? |
|--------|-----------------------|
| TasksPage | ✅ Usa `<Can>` |
| CommunicationPage | ✅ Filtra tabs por rol |
| SecurityPage | ✅ Filtra tabs por rol |
| PetsPage | ✅ Usa `can()` |
| **FinancePage** | ❌ Todos ven los mismos botones |
| **CalendarPage** | ❌ Todos ven los mismos botones |
| **HealthPage** | ❌ Todos ven los mismos botones |

Un `member` y un `admin` ven exactamente los mismos botones en Finanzas, Calendario y Salud.

**Esfuerzo estimado:** ~1h

---

### M7. Chat sin WebSocket

**Ubicación:** `packages/web/src/pages/CommunicationPage.tsx`

Los mensajes del chat usan polling cada 5 segundos (`refetchInterval: 5000`) en vez de Socket.io. Genera tráfico innecesario y retraso de hasta 5s en la entrega de mensajes.

**Esfuerzo estimado:** ~2-3h

---

## 🟢 BAJA PRIORIDAD — Mejoras de UX y completitud

### B1. Sidebar sin badges de contadores
No hay indicadores de tareas pendientes, notificaciones sin leer, etc. en los items del menú lateral.

### B2. Sin cambio de avatar
SettingsPage no permite cambiar la foto de perfil/avatar del usuario.

### B3. Sin toggle de tema (dark/light)
No hay switch de tema accesible para el usuario; depende de las preferencias del sistema operativo.

### B4. Sin "¿Olvidaste tu PIN?"
No hay mecanismo de recuperación de PIN. Si un usuario olvida su PIN, necesita que un admin lo resetee manualmente (y esa funcionalidad tampoco existe en el admin).

### B5. Códigos de visitante sin ruta de validación
`security.service.useVisitorCode()` existe en el backend pero **no tiene endpoint HTTP expuesto**. No se puede validar un código desde una pantalla pública.

### B6. Pets routes usa `authorize()` en vez de `requirePermission()`
Inconsistencia de estilo: las rutas de mascotas usan roles explícitos mientras el resto del sistema usa el mecanismo granular.

### B7. Eventos multi-día no se renderizan correctamente
CalendarPage solo compara `startDate` con la fecha seleccionada; un evento de 3 días solo aparece el primer día del calendario.

### B8. Chat sin distinción visual propio/ajeno
Los mensajes del chat no se alinean izquierda/derecha según el autor. Todos tienen el mismo estilo visual.

### B9. Anuncios — Sin pin/unpin
El icono de pin aparece pero no hay acción para fijar/desfijar anuncios.

### B10. Sin eliminación de mensajes individuales del chat
El campo `isEdited` existe en la tabla `messages` pero no hay funcionalidad de editar ni eliminar mensajes.

### B11. Sin historial de tomas de medicamentos
El botón "Registrar toma" existe y crea un log, pero no hay vista para consultar el historial de tomas pasadas.

### B12. Rutinas de salud — Sin "completar hoy"
No hay mecanismo para marcar una rutina como completada en el día actual (tracking diario).

### B13. Sin configuración de notificaciones
No hay preferencias de qué tipo de notificaciones recibir (push, email, en-app).

### B14. Sin configuración de la casa desde Settings
No hay opciones para cambiar nombre de la casa, dirección, PIN de la casa, etc. desde la página de ajustes.

---

## 📈 Priorización sugerida

### Sprint 1 — Fixes críticos (~3h)
| # | Acción | Esfuerzo |
|---|--------|----------|
| A1 | Agregar botones Crear/Eliminar en AdminPage | ~1h |
| A2 | Fix `unreadNotifications` hardcoded | ~15min |
| A4 | Actualizar store tras cambios en Settings | ~10min |
| A5 | Conectar S.O.S. → tab de pánico | ~15min |
| M2 | Fix pérdida de estado en UserLoginPage | ~30min |
| M3 | Crear página CreateHousePage | ~1h |

### Sprint 2 — Funcionalidad de edición (~5h)
| # | Acción | Esfuerzo |
|---|--------|----------|
| M1 | Modales de edición (gastos, eventos, medicamentos, contactos, bóveda, anuncios) | ~4-6h |
| M4 | Implementar filtrado por fechas en calendario | ~30min |

### Sprint 3 — Robustez (~4h)
| # | Acción | Esfuerzo |
|---|--------|----------|
| A3 | Dashboard enriquecido con widgets | ~2-3h |
| M6 | RBAC en botones de Finance/Calendar/Health | ~1h |
| M5 | Paginación en listas largas | ~2h |

### Sprint 4 — Mejoras UX (~6h)
| # | Acción | Esfuerzo |
|---|--------|----------|
| M7 | Migrar chat de polling a WebSocket | ~2-3h |
| B1 | Badges en Sidebar | ~1h |
| B2-B3 | Avatar + toggle de tema | ~2h |
| B8 | Distinción visual mensajes propios/ajenos | ~30min |

---

## 🏗️ Arquitectura — Estado actual

```
packages/
├── shared/          ✅ Tipos, roles, permisos (PERMISSIONS matrix)
├── database/        ✅ 30 tablas Drizzle, seed con 5 usuarios
├── server/          ✅ 12 servicios, 12 routers, 4 middleware
└── web/             ⚠️ 14 páginas (5 completas, 9 parciales)
    ├── auth/        ✅ HouseSelect, UserLogin, Activate, Register, Pending
    ├── admin/       ⚠️ Solo lectura, falta escritura
    ├── settings/    ⚠️ Settings (no refresca store), Members (completo)
    └── modules/     ⚠️ CRUD incompleto (falta edición en 8 módulos)
```
