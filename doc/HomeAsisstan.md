# **📄 Documento de Definición del Proyecto: HomeAsisstan**

**Versión:** 1.0

**Tipo:** Aplicación Multi-plataforma (Móvil/Tablet/Web) Local, sin necesidad de acceso a internet. Solamente en la LAN de hogar. Sin acesso externo.

**Concepto:** Sistema Operativo Integral para la Gestión del Hogar.

## **1\. Visión del Producto**

Una plataforma centralizada que digitaliza y simplifica la convivencia. Permite gestionar tareas, finanzas, comunicación, salud y seguridad de un hogar desde un único punto de acceso, ofreciendo interfaces adaptables según el perfil técnico y cognitivo de cada usuario.

---

## **2\. Arquitectura de Acceso y Navegación**

El sistema utiliza un modelo de **doble autenticación contextual**:

### **A. Nivel Hogar (Acceso Compartido)**

* **Entrada:** Selección de la "Casa" \+ PIN General (o QR de invitación).  
* **Interfaz:** "Dashboard Público". Muestra información que concierne a todos los habitantes (calendario común, lista de compras, avisos generales).  
* **Dispositivo ideal:** Una tablet en la cocina o el móvil de cualquier miembro.

### **B. Nivel Personal (Acceso Privado)**

* **Entrada:** Selección del "Usuario" dentro de la casa \+ PIN Personal (o biometría).  
* **Interfaz:** "Dashboard Privado". Muestra finanzas personales, tareas asignadas específicamente, recordatorios médicos y chats privados.  
* **Seguridad:** Los datos privados están encriptados; un usuario no puede ver el panel privado de otro (salvo permisos de Admin).

---

## **3\. Módulos Funcionales (Las "Tarjetas")**

### **🟦 1\. Comunicación y Novedades (Hub Social)**

Centraliza la interacción interna.

* **Muro de la Casa:** Tablón de anuncios (ej. "Viene el plomero el martes", "Se cortó internet").  
* **Chat Interno:** Mensajería integrada (Texto/Voz).  
* **Botón de Pánico (Ping):** Notificación push de alta prioridad a todos los miembros ("¡Bajen a comer\!", "Reunión familiar").

### **🟥 2\. Seguridad y Emergencias**

Gestión de crisis y control de acceso.

* **Botón S.O.S.:** Configurable (Policía, Emergencias Médicas, Contacto de Confianza).  
* **Bóveda de Accesos:** Almacén seguro para claves de WiFi, códigos de alarma, llave de paso del agua/gas.  
* **Gestión de Visitas:** Generación de códigos temporales para el Rol Externo.

### **🟢 3\. Gestión de Tareas y Mantenimiento**

Organización operativa del hogar.

* **Asignación de Tareas:** Simples (sacar basura) o complejas (limpieza profunda).  
* **Rotación Automática:** "Le toca a Juan lavar los platos esta semana".  
* **Sistema de Recompensas (Gamificación):** Puntos por tareas completadas (ideal para familias con hijos o roommates).

### **🟣 4\. Salud y Bienestar (Personalizable)**

Módulo adaptable según la necesidad (fitness vs. cuidados).

* **Perfil Clínico:** Grupo sanguíneo, alergias, seguros médicos.  
* **Gestión de Medicamentos:** Recordatorios de tomas y control de stock (aviso cuando queda poco).  
* **Rutinas:** Hidratación, ejercicio, meditación.

### **🟡 5\. Calendario y Eventos**

Sincronización de agendas.

* **Eventos Comunes:** Cumpleaños, visitas, vacaciones.  
* **Integración:** Sincronización con Google Calendar / Outlook (unidireccional o bidireccional).

### **💰 6\. Finanzas y Compras**

Gestión del hogar.

* **Egresos: Compras de hogar, alimentos, exct**  
* **Lista de Articulos del Hogar, limpieza, comida, otros.**  
* **Lista de Compras Inteligente:** "Falta leche" (se puede marcar y quien vaya al súper lo ve).

---

## **4\. Matriz de Roles y Permisos**

El sistema se adapta a la jerarquía del hogar mediante roles estrictos:

| Rol | Descripción | Permisos Clave | Caso de Uso |
| :---- | :---- | :---- | :---- |
| **Administrador (Admin)** | Creador de la casa. | Control total. Crea/borra usuarios, ve logs, gestiona suscripción. | Padre/Madre, Casero, Roommate líder. |
| **Responsable (Dueño)** | Miembro con autoridad. | Gestiona finanzas, asigna tareas, edita calendario. | Pareja, Co-propietario. |
| **Miembro (Estándar)** | Habitante regular. | Ve tareas propias, calendario, chat. Finanzas limitadas (solo ver o añadir gastos propios). | Hijos adolescentes, Roommates. |
| **Simplificado (Mayor/Niño)** | Usuario con interfaz adaptada. | Acceso solo a "Mis Tareas" y "Llamar". Interfaz de botones gigantes. | Adultos mayores, niños pequeños. |
| **Externo (Invitado)** | No reside en la casa. | Acceso temporal y limitado a módulos específicos (ej. solo Tareas y Chat). | Cuidador, paseador, servicio de limpieza. |
| **Mascota** | Perfil pasivo. | Gestión de fichas (vacunas, vet). No tiene login. | Perro, Gato. |

---

## **5\. Experiencia de Usuario (UX): Modos de Visualización**

Para resolver el problema de la complejidad tecnológica, la app ofrece dos modos de renderizado de la interfaz:

### **A. Modo "Power User" (Completo)**

* **Diseño:** Denso, con gráficas, listas detalladas y menús de configuración.  
* **Público:** Admins, Responsables, usuarios tech-savvy.

### **B. Modo "Focus" (Simplificado)**

* **Diseño:** Minimalista. Botones de gran tamaño (Cards), alto contraste, tipografía grande.  
* **Funcionalidad:** Solo muestra las 3 acciones más probables del momento (ej. "Ver medicina", "Llamar a hijo", "Ver fotos").  
* **Público:** Roles Simplificados o momentos de prisa (modo coche).

---

## **6\. Especificaciones Técnicas**

* **Frontend:** React Native Vite  
* **Backend:** Node.js   
* **Base de Datos:**  
  * *Relacional:* PostgreSQL (para usuarios, finanzas y relaciones complejas).  
  * *NoSQL:* (para chat en tiempo real y notificaciones).  
* **Seguridad:** Hashing de PINs (bcrypt), Tokenización de sesiones (JWT), Encriptación de datos sensibles en reposo.