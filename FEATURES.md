# 💡 FEATURES — Sugerencias de mejora para HomeAsisstan

> Ideas priorizadas para futuras iteraciones del proyecto.  
> Organizadas por impacto (🔴 alto · 🟡 medio · 🟢 bajo) y esfuerzo estimado.

---

## 🔴 Alto impacto

### 1. Notificaciones Push reales (Web Push API)
- Registrar Service Worker con `pushManager.subscribe()`
- Backend envía push via web-push (VAPID keys)
- Notificaciones de: medicamentos, tareas vencidas, alertas SOS, eventos próximos
- **Esfuerzo:** ~2 días · **Depende de:** Fase 9 (PWA)

### 2. Modo Offline con Service Worker
- Cachear shell de la app y assets estáticos con Workbox
- Cola de acciones offline (crear tarea, registrar gasto) que se sincroniza al reconectar
- Indicador visual de estado de conexión
- **Esfuerzo:** ~3 días

### 3. Sistema de recetas y planificación de comidas
- Módulo nuevo: `meals` con tablas `recipes`, `meal_plans`, `meal_plan_items`
- Planificador semanal drag & drop
- Generación automática de lista de compras desde el plan de la semana
- Integración con inventario (descuento automático de ingredientes)
- **Esfuerzo:** ~4 días

### 4. Dashboard personalizable (widgets drag & drop)
- Cada usuario elige qué tarjetas ver y en qué orden
- Usar `react-grid-layout` o similar
- Guardar layout en `user_preferences.dashboardLayout` (ya existe el campo)
- Widgets: clima, próximos eventos, tareas pendientes, gastos del mes, medicamentos
- **Esfuerzo:** ~2 días

### 5. Integración con Google Calendar
- OAuth2 flow para vincular cuenta de Google
- Sincronización bidireccional de eventos
- Importar eventos existentes al calendario del hogar
- **Esfuerzo:** ~3 días

---

## 🟡 Impacto medio

### 6. Sistema de archivos compartidos
- Subida de documentos (recibos, facturas, certificados médicos, contratos)
- Almacenamiento en disco local o S3-compatible (MinIO)
- Visor de PDF/imagen integrado
- Vincular archivos a gastos, perfiles de salud, bóveda
- **Esfuerzo:** ~3 días

### 7. Historial y gráficas avanzadas de finanzas
- Gráficas de tendencia mensual (línea temporal)
- Comparativa mes a mes
- Presupuesto mensual por categoría con alertas al exceder
- Exportar a CSV/Excel
- **Esfuerzo:** ~2 días

### 8. Sistema de recompensas y logros (gamificación extendida)
- Logros desbloqueables: "Primera tarea", "Racha de 7 días", "100 puntos en una semana"
- Badges visuales en el perfil del usuario
- Tabla `achievements` + `user_achievements`
- Notificación al desbloquear un logro
- **Esfuerzo:** ~2 días

### 9. Multi-idioma (i18n)
- Extraer todos los strings a archivos de traducción (JSON)
- Usar `react-i18next` o similar
- Idiomas iniciales: Español, Inglés
- Selector de idioma en preferencias del usuario
- **Esfuerzo:** ~3 días

### 10. Chat mejorado con hilos y reacciones
- Responder a mensajes específicos (threads)
- Reacciones con emoji (👍❤️😂)
- Indicador "escribiendo..." via WebSocket
- Preview de enlaces (Open Graph)
- Búsqueda en historial de chat
- **Esfuerzo:** ~3 días

### 11. Gestión de mascotas
- Perfiles de mascotas (nombre, raza, peso, foto, veterinario)
- Calendario de vacunas y desparasitaciones
- Recordatorios de alimentación
- Historial de visitas al veterinario
- Integración con el rol `pet` ya existente
- **Esfuerzo:** ~2 días

### 12. Control de consumo energético
- Registro mensual de facturas (luz, agua, gas, internet)
- Gráficas de consumo histórico
- Alertas si el consumo supera la media
- Tips de ahorro basados en el patrón de consumo
- **Esfuerzo:** ~2 días

---

## 🟢 Impacto bajo / Nice to have

### 13. Tema personalizable por usuario
- No solo claro/oscuro sino paleta de colores configurable
- Temas predefinidos: "Ocean", "Forest", "Sunset", "Minimal"
- CSS variables dinámicas
- **Esfuerzo:** ~1 día

### 14. Widgets de clima
- Integración con OpenWeatherMap API (gratuita)
- Widget en dashboard con temperatura actual y pronóstico
- Alertas de clima extremo (opcional)
- **Esfuerzo:** ~0.5 días

### 15. Notas rápidas / Post-its virtuales
- Notas adhesivas en el dashboard (estilo Sticky Notes)
- Colores, posición libre, edición inline
- Tabla `notes` simple (userId, houseId, content, color, position)
- **Esfuerzo:** ~1 día

### 16. Modo invitado con código temporal
- Los `visitor_codes` ya existen en seguridad
- Crear una vista pública limitada accesible con el código
- El invitado puede ver: WiFi, instrucciones de la casa, contactos de emergencia
- Sin necesidad de crear cuenta
- **Esfuerzo:** ~1.5 días

### 17. Registro de mantenimiento del hogar
- Electrodomésticos y sistemas (caldera, AC, lavadora...)
- Fecha de compra, garantía, último mantenimiento
- Recordatorios de revisión periódica
- Historial de reparaciones con costo
- **Esfuerzo:** ~2 días

### 18. Exportar/Importar datos
- Exportar toda la data de la casa a JSON/ZIP (backup manual)
- Importar desde backup para migrar a otro servidor
- Exportar gastos a CSV, eventos a ICS
- **Esfuerzo:** ~1.5 días

### 19. Tests automatizados
- Unit tests con Vitest para servicios backend
- Integration tests para rutas API (supertest)
- Component tests para páginas React (Testing Library)
- E2E con Playwright (flujo login → crear tarea → completar)
- **Esfuerzo:** ~4 días

### 20. Logs y monitoreo
- Integrar winston o pino para logging estructurado
- Health check endpoint ampliado (DB status, uptime, memory)
- Métricas básicas: requests/s, latencia, errores
- Panel de admin con vista de logs en tiempo real
- **Esfuerzo:** ~2 días

---

## 🚀 Ideas a largo plazo

| Idea | Descripción |
|------|-------------|
| **App nativa** | Wrapper con Capacitor/Tauri para instalar como app nativa en Android/iOS/desktop |
| **Asistente de voz** | Integración con Web Speech API: "Añade leche a la lista de compras" |
| **IA doméstica** | Sugerencias automáticas basadas en patrones (horarios de tareas, previsión de gastos, recetas según inventario) |
| **Multi-casa** | Un usuario puede pertenecer a varias casas y cambiar entre ellas |
| **Marketplace de plugins** | Sistema de plugins para que la comunidad añada módulos personalizados |
| **NFC/QR para invitados** | Generar QR con código de visitante, escanear para acceder a vista de invitado |
| **Integración IoT** | Conectar con dispositivos smart home (luces, termostato) via MQTT o Home Assistant API |
| **Modo tableta/kiosko** | Vista diseñada para tablet montada en la cocina/entrada con info relevante siempre visible |

---

## 📋 Prioridad sugerida para próximo sprint

1. **Notificaciones Push** — Impacto inmediato en UX
2. **Dashboard personalizable** — Ya existe la infraestructura
3. **Tests automatizados** — Estabilidad del proyecto
4. **Modo Offline** — PWA completa
5. **Gestión de mascotas** — El rol `pet` ya existe sin usar
