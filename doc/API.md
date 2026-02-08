# HomeAsisstan — API Reference

> Base URL: `http://localhost:3001/api`
>
> Autenticación: `Authorization: Bearer <token>` en toda ruta `/api/*` (excepto auth).

---

## Auth

| Método | Ruta                    | Descripción             | Auth |
| ------ | ----------------------- | ----------------------- | ---- |
| GET    | `/auth/houses`          | Listar casas            | No   |
| POST   | `/auth/houses`          | Crear casa + admin      | No   |
| GET    | `/auth/houses/:id/users`| Usuarios de una casa    | No   |
| POST   | `/auth/login`           | Login (PIN o password)  | No   |
| POST   | `/auth/refresh`         | Renovar accessToken     | No   |
| POST   | `/auth/logout`          | Cerrar sesión           | Sí   |

---

## Dashboard

| Método | Ruta                    | Descripción                  |
| ------ | ----------------------- | ---------------------------- |
| GET    | `/dashboard/stats`      | Estadísticas del hogar       |
| GET    | `/dashboard/preferences`| Preferencias del usuario     |
| PUT    | `/dashboard/preferences`| Actualizar preferencias      |
| GET    | `/dashboard/activity`   | Log de actividad reciente    |

---

## Tasks (Tareas)

| Método | Ruta                        | Descripción               |
| ------ | --------------------------- | ------------------------- |
| GET    | `/tasks`                    | Listar tareas             |
| POST   | `/tasks`                    | Crear tarea               |
| PUT    | `/tasks/:id`                | Actualizar tarea          |
| DELETE | `/tasks/:id`                | Eliminar tarea            |
| POST   | `/tasks/:id/assign`         | Asignar usuarios          |
| POST   | `/tasks/:id/complete`       | Completar tarea           |
| POST   | `/tasks/rotate`             | Rotación automática       |
| GET    | `/tasks/gamification/rankings` | Rankings de puntos     |
| GET    | `/tasks/history`            | Historial de tareas       |
| GET    | `/tasks/statistics`         | Estadísticas              |

---

## Finance (Finanzas)

| Método | Ruta                           | Descripción                |
| ------ | ------------------------------ | -------------------------- |
| GET    | `/finance/expenses`            | Listar gastos              |
| POST   | `/finance/expenses`            | Crear gasto                |
| PUT    | `/finance/expenses/:id`        | Actualizar gasto           |
| DELETE | `/finance/expenses/:id`        | Eliminar gasto             |
| GET    | `/finance/expenses/summary`    | Resumen mensual por cat.   |
| GET    | `/finance/shopping`            | Lista de compras           |
| POST   | `/finance/shopping`            | Añadir ítem                |
| PUT    | `/finance/shopping/:id`        | Actualizar ítem            |
| PUT    | `/finance/shopping/:id/toggle` | Marcar/desmarcar comprado  |
| DELETE | `/finance/shopping/:id`        | Eliminar ítem              |
| POST   | `/finance/shopping/clear`      | Limpiar comprados          |
| GET    | `/finance/inventory`           | Inventario del hogar       |
| POST   | `/finance/inventory`           | Crear ítem inventario      |
| PUT    | `/finance/inventory/:id`       | Actualizar inventario      |
| PUT    | `/finance/inventory/:id/stock` | Ajustar stock              |
| DELETE | `/finance/inventory/:id`       | Eliminar inventario        |

---

## Communication (Comunicación)

| Método | Ruta                                  | Descripción               |
| ------ | ------------------------------------- | ------------------------- |
| GET    | `/communication/announcements`        | Listar anuncios           |
| POST   | `/communication/announcements`        | Crear anuncio *(admin)*   |
| PUT    | `/communication/announcements/:id`    | Editar anuncio *(admin)*  |
| DELETE | `/communication/announcements/:id`    | Eliminar anuncio *(admin)*|
| GET    | `/communication/messages`             | Listar mensajes del chat  |
| POST   | `/communication/messages`             | Enviar mensaje            |
| GET    | `/communication/notifications`        | Mis notificaciones        |
| GET    | `/communication/notifications/unread-count` | Count sin leer      |
| PUT    | `/communication/notifications/:id/read` | Marcar como leída       |
| PUT    | `/communication/notifications/read-all` | Marcar todas leídas     |
| GET    | `/communication/panic`                | Historial de alertas      |
| POST   | `/communication/panic`                | Disparar alerta SOS       |
| PUT    | `/communication/panic/:id/resolve`    | Resolver alerta           |

---

## Calendar (Calendario)

| Método | Ruta                     | Descripción              |
| ------ | ------------------------ | ------------------------ |
| GET    | `/calendar`              | Listar eventos           |
| POST   | `/calendar`              | Crear evento             |
| GET    | `/calendar/:id`          | Detalle de evento        |
| PUT    | `/calendar/:id`          | Actualizar evento        |
| DELETE | `/calendar/:id`          | Eliminar evento          |
| PUT    | `/calendar/:id/respond`  | Confirmar/rechazar asist.|

---

## Health (Salud)

| Método | Ruta                          | Descripción                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/health/profiles`            | Perfiles de salud          |
| PUT    | `/health/profiles`            | Crear/actualizar perfil    |
| GET    | `/health/medications`         | Listar medicamentos        |
| POST   | `/health/medications`         | Crear medicamento          |
| PUT    | `/health/medications/:id`     | Actualizar medicamento     |
| DELETE | `/health/medications/:id`     | Eliminar medicamento       |
| POST   | `/health/medications/log`     | Registrar toma             |
| GET    | `/health/medications/:id/logs`| Historial de tomas         |
| GET    | `/health/routines`            | Listar rutinas             |
| POST   | `/health/routines`            | Crear rutina               |
| DELETE | `/health/routines/:id`        | Eliminar rutina            |

---

## Security (Seguridad)

| Método | Ruta                          | Descripción                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/security/contacts`          | Contactos de emergencia    |
| POST   | `/security/contacts`          | Crear contacto             |
| PUT    | `/security/contacts/:id`      | Actualizar contacto        |
| DELETE | `/security/contacts/:id`      | Eliminar contacto          |
| GET    | `/security/vault`             | Entradas de la bóveda      |
| POST   | `/security/vault`             | Crear entrada *(admin)*    |
| PUT    | `/security/vault/:id`         | Actualizar entrada *(admin)*|
| DELETE | `/security/vault/:id`         | Eliminar entrada *(admin)* |
| GET    | `/security/visitor-codes`     | Códigos de visitante       |
| POST   | `/security/visitor-codes`     | Generar código             |
| DELETE | `/security/visitor-codes/:id` | Eliminar código            |
| GET    | `/security/access-logs`       | Logs de acceso *(admin)*   |

---

## WebSocket Events

Conexión: `io("http://localhost:3001", { auth: { token } })`

| Evento (client → server) | Payload                         | Descripción          |
| ------------------------- | ------------------------------- | -------------------- |
| `join:house`              | `houseId: string`               | Unirse a sala        |
| `chat:message`            | `{ houseId, content }`          | Enviar mensaje       |
| `panic:trigger`           | `{ houseId }`                   | Alerta SOS           |

| Evento (server → client) | Payload                         | Descripción          |
| ------------------------- | ------------------------------- | -------------------- |
| `chat:message`            | `MessageInfo`                   | Nuevo mensaje        |
| `panic:alert`             | `PanicPingInfo`                 | Alerta SOS recibida  |
| `notification:new`        | `NotificationInfo`              | Nueva notificación   |

---

## Modelos de respuesta

Todas las respuestas siguen el formato:

```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

Errores:

```json
{
  "success": false,
  "error": "Mensaje descriptivo",
  "statusCode": 400
}
```
