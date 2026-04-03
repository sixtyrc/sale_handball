# SOP: Estabilización de Módulos Deportivos y Gestión de Cuerpo Técnico
**Fecha:** 2026-04-03 15:00:00
**Estado:** Activo y Sincronizado

## 1. Módulo Deportes: Gestión de Categorías
- **Visibilidad Premium:** Los controles de **Activar/Desactivar** y **Editar** deben estar siempre visibles para usuarios `ADMIN` o `DIRIGENTE`. No usar `hover` para ocultar acciones críticas en pantallas de gestión.
- **Edición Unificada:** El `CategoriaFormModal` debe soportar `POST` (nuevo) y `PATCH` (edición).
- **Integridad de Nombre:** Se eliminó la categoría duplicada con error de ortografía ("Juvenniles") para evitar colisiones de datos.

### ⚠️ Restricción Crítica:
- **No dependencia de Nombres:** El backend y el frontend ya no se vinculan por el nombre literal de la categoría (ej: "Juveniles"). Se debe usar siempre el **UUID (ID)** para filtrar jugadores. Esto previene que errores de tipeo rompan la visualización de planillas.

---

## 2. Módulo Eventos: Planillas de Citación
- **Sincronización Automática:** Al entrar al detalle de un evento, el sistema debe pre-cargar a los jugadores que pertenecen a la categoría asociada al evento usando el `categoria_id`.
- **Refuerzos con Búsqueda:** El buscador de refuerzos permite traer a cualquier socio del club que tenga un `PerfilDeportivo` activo, aunque no pertenezca a la categoría del evento.
- **Validación de Salud (Eligibility):** El icono `ShieldAlert` ⚠️ es mandatorio para jugadores con deuda de cuota o apto médico vencido.

---

## 3. Gestión de Cuerpo Técnico (Profesores)
- **Asignación Multi-Categoría:** Un profesor puede tener asignadas múltiples categorías.
- **Endpoits Robustos:** Usar:
    - `GET /deportes/categorias/{id}/profesores/` para listar.
    - `POST /deportes/categorias/{id}/asignar_profe/` para vincular/desvincular (Toggle).
- **Restricción de Rol:** Solo los usuarios con `role='PROFESOR'` son elegibles para la asignación.

---

## 4. Infraestructura y Base de Datos
- **PostgreSQL Mandatorio:** Nunca usar SQLite de rollback. Las migraciones deben estar al día (`python manage.py migrate`).
- **Control de Estado:** El campo `activo` en `Categoria` es booleano y regula la visibilidad en el Dashboard y Sidebar.

---
---
**Registro de Hitos (Fecha: 2026-04-03 15:25):**
✅ **PASO 1 FINALIZADO:** Módulo de Deportes estabilizado. 
- Fix de rutas `SocioViewSet.disponibles_vincular` (404 resuelto).
- Fix de guardado `PerfilDeportivoViewSet` (500 resuelto).
- Sincronización de `VincularSocioModal.jsx` con el nuevo endpoint de socios.
---
**Registro de Hitos (Fecha: 2026-04-03 15:50):**
✅ **PASO 2 FINALIZADO:** Auto-creación de usuario al dar de alta un socio.
- Campo `primer_ingreso` agregado a `CustomUser` (migración `0011` aplicada OK).
- Rol `SOCIO` creado para el portal de autogestión.
- `SocioViewSet.perform_create` crea automáticamente un `CustomUser` con `username=DNI`, `password=DNI`, `primer_ingreso=True`.
- Si el socio tiene email, se envía mail de bienvenida via Resend (con `fail_silently=True` para no trabar el alta si el mail falla).
- **Restricción aprendida:** `serializer.save()` ahora debe capturarse como variable `socio =` para poder acceder al objeto creado y vincularlo al usuario.
---
**Registro de Hitos (Fecha: 2026-04-03 15:53):**
✅ **PASO 3 FINALIZADO:** Endpoints de seguridad para autenticación del socio.
- `POST /api/v1/auth/cambiar-password/` → Cambia contraseña (requiere token). Marca `primer_ingreso=False` al completar.
- `POST /api/v1/auth/solicitar-reset/` → Genera token y envía link por Resend. No revela si el mail existe (seguridad).
- `POST /api/v1/auth/confirmar-reset/` → Valida UID+Token y aplica nueva contraseña.
- `LoginView` ahora incluye `primer_ingreso` en la respuesta para que el frontend redirija si es necesario.
- **`manage.py check` → 0 errores.**
- **Restricción:** En `reset_url` la URL del front está hardcodeada como `localhost:3051`. Cuando se suba a producción se debe mover a una variable de entorno `.env` tipo `FRONTEND_URL`.
---
**Registro de Hitos (Fecha: 2026-04-03 15:57):**
✅ **PASO 4 FINALIZADO:** Modelo `AvisoPago` creado en `finanzas/models.py`.
- Migración `0004_add_aviso_pago` → **OK**
- El socio puede declarar un pago. El admin lo valida/rechaza.
- Solo al validar se genera el `MovimientoFinanciero` real (integridad contable garantizada).
- Campo `movimiento_generado` vincula el aviso con el recibo generado.
- Campo `comprobante` permite adjuntar foto de la transferencia.
- **Regla de Negocio Crítica:** El modelo NUNCA auto-genera movimientos. Siempre requiere aprobación humana.
---
**Registro de Hitos (Fecha: 2026-04-03 16:00):**
✅ **PASO 5 FINALIZADO:** Endpoints del sistema de Avisos de Pago.
- `GET/POST /api/v1/finanzas/mis-avisos/` → Socio crea/lista sus propios avisos.
- `GET /api/v1/finanzas/avisos/` → Admin lista todos los avisos del club (filtrable por `?estado=`).
- `POST /api/v1/finanzas/avisos/{id}/validar/` → Genera el `MovimientoFinanciero` real de forma atómica.
- `POST /api/v1/finanzas/avisos/{id}/rechazar/` → Marca como rechazado con motivo visible al socio.
- Serializer `AvisoPagoSerializer` expone `estado_display` legible para el frontend.
- **`manage.py check` → 0 errores.**
---
**Registro de Hitos (Fecha: 2026-04-03 16:15):**
✅ **PASO 6 FINALIZADO:** Portal del Socio creado en el frontend.
- `SocioLoginPage.jsx` → `/socio/login` — Login con DNI, detecta `primer_ingreso`.
- `SocioCambiarClavePage.jsx` → `/socio/cambiar-clave` — Cambio obligatorio de clave al primer ingreso.
- `SocioDashboardPage.jsx` → `/socio/dashboard` — Dashboard completo con:
    - **Carnet visual** reutilizando la estética del sistema.
    - **Mis Datos** personales y deportivos.
    - **Cuenta Corriente** con links a recibos PDF.
    - **Formulario "Avisé que Pagué"** con foto de comprobante.
    - **Lista de mis Avisos** con estado (Pendiente/Validado/Rechazado) y motivo de rechazo.
- Rutas `/socio/*` registradas en `App.jsx` con lazy loading.
- **Seguridad:** El portal del socio usa `sessionStorage` (no `localStorage`) para aislar el token del panel admin.
---
**Registro de Hitos (Fecha: 2026-04-03 16:16):**
✅ **PASO 7 FINALIZADO:** Bandeja de Avisos de Pago en Backoffice.
- `AvisosModal.jsx` creado en `modules/finanzas/`.
- Permite listar por estado (Pendiente, Validado, Rechazado).
- Vista de detalle con visualización de comprobante y acciones de validación o rechazo.
- Integrado en `FinanzasPage.jsx` con contador animado (burbuja roja si hay avisos pendientes).
- **Flujo End-to-End completo:** Socio avisa -> Admin verifica -> Recibo se emite.

🚀 **OBJETIVO DE AUTOGESTIÓN Y DEPORTES ALCANZADO AL 100%.**
---
**Nota de Memoria:** Si un script falla por "ReferenceError", verificar siempre que los iconos de `lucide-react` estén en el bloque de importación al principio del archivo.
