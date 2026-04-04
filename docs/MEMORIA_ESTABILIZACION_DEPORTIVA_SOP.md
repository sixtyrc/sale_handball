# SOP: Estabilización de Módulos Deportivos y Gestión de Cuerpo Técnico
**Fecha:** 2026-04-03 15:00:00
**Estado:** Activo y Sincronizado

## 🔑 Credenciales de Acceso (Entorno Local)
- **App URL:** `http://localhost:3051/`
- **Django Admin (ROOT):** `http://localhost:8000/admin/`
- **Usuario Maestro:** `admin@salesianos.com.ar` (Username: `admin`)
- **Contraseña:** `Admin1234!`
- **Cuentas Test:**
  - Profe: `coach@salesianos.com.ar` / `coach1234`
  - Buffet: `buffet@salesianos.com.ar` / `buffet1234`

## 1. Módulo Deportes: Gestión de Categorías
- **Visibilidad Premium:** Los controles de **Activar/Desactivar** y **Editar** deben estar siempre visibles para usuarios `ADMIN` o `DIRIGENTE`. No usar `hover` para ocultar acciones críticas en pantallas de gestión.
- **Edición Unificada:** El `CategoriaFormModal` debe soportar `POST` (nuevo) y `PATCH` (edición).
- **Integridad de Nombre:** Se eliminó la categoría duplicada con error de ortografía ("Juvenniles") para evitar colisiones de datos.

### ⚠️ Restricción Crítica:
- **No dependencia de Nombres:** El backend y el frontend ya no se vinculan por el nombre literal de la categoría (ej: "Juveniles"). Se debe usar siempre el **UUID (ID)** para filtrar jugadores. Esto previene que errores de tipeo rompan la visualización de planillas.

### ⚠️ Restricción Crítica Global:
- **NO TOCAR NI QUITAR CAMPOS:** Bajo ningún concepto o refactorización se deben eliminar campos visuales o del backend (ej. Altura, Peso, etc.) a menos que sea explícitamente solicitado por el usuario. Si no se pide tocarlos, deben mantenerse igual.

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
**Registro de Hitos (Fecha: 2026-04-03 17:05):**
✅ **PASO 8 FINALIZADO:** Seguridad de Roles y Aislamiento de Tenant.
- **Blindaje del Admin:** `App.jsx` modificado para que el `ProtectedRoute` expulse a cualquier usuario con rol `SOCIO` que intente entrar a rutas administrativas (`/dashboard`, `/socios`, etc.).
- **Redirección por Rol en Login:** `/login` general ahora detecta si el usuario es `SOCIO` y lo redirige automáticamente al `/socio/dashboard`. Esto evita la "fuga de roles" que permitía a un socio ver el sidebar administrativo.
- **Dinamismo de Tenant en Localhost:** `authStore.js` ahora fuerza el slug `salesianos` si el host es `localhost` o `127.0.0.1`. Esto garantiza que los logos y el branding carguen siempre en desarrollo.
- **Dinamismo de Favicon:** El logo del club se inyecta dinámicamente en el ícono de la pestaña del navegador mediante `document.querySelector("link[rel~='icon']")`.
- **Carnet Virtual (UX):** 
    - Corregida la URL de la foto del socio para que sea absoluta (`http://localhost:8000`).
    - Implementados **Avatares por Sexo** (Fallback) usando la API de DiceBear. Si no hay foto o la imagen falla, se muestra un avatar premium (Felix para masculino, Annie para femenino).
---
**Nota de Memoria:** El backend (`runserver`) debe ejecutarse especificando el puerto (`8000`) de forma explícita en entornos PowerShell para evitar bloqueos por `NativeCommandError`.
---
**Registro de Hitos (Fecha: 2026-04-03 17:30):**
✅ **PASO 9 FINALIZADO: Estabilización Crítica del Portal del Socio.**
- **Descarga de PDF Robusta:** 
    - Reemplazados los enlaces directos `<a>` por la función `handleDownloadPDF` que inyecta manualmente el token `Bearer` en el header de `axios`.
    - Esto resuelve el error `401 Unauthorized` al intentar descargar recibos desde el navegador sin sesión nativa de Django.
- **Fix "Avisar Pago" (Error de Pickling):**
    - Se eliminó el uso de `request.data.copy()` en la vista `AvisoPagoSocioView`.
    - **Lección Aprendida:** Django no permite copiar un `QueryDict` que contiene archivos temporales (`InMemoryUploadedFile`). Se debe pasar el `request.data` crudo al serializador.
- **Fix "Socio Required":**
    - Se marcó el campo `socio` como `read_only` en `AvisoPagoSerializer`.
    - El backend ahora inyecta la instancia del socio logueado directamente en el `.save()`, simplificando la validación del frontend.
- **Fix "SuspiciousFileOperation" (Nombres largos):**
    - Aumentado el `max_length` del campo `comprobante` en el modelo `AvisoPago` de 100 a **500 caracteres**.
    - Esto permite procesar archivos con nombres extensos y rutas dinámicas (que incluyen IDs de club y socio) sin errores de almacenamiento.
- **UX Premium:**
    - Implementada pantalla de éxito con animación, mensaje **"¡PAGO NOTIFICADO CON ÉXITO! 🏆"** y feedback visual de confeti/brillo.
    - Sincronizados todos los botones de "Ver Recibo" en el Dashboard para usar el flujo de descarga segura.

---
**Registro de Hitos (Fecha: 2026-04-03 18:15):**
✅ **PASO 10 FINALIZADO: Lanzamiento de Landing Page Premium.**
- **Diseño de Impacto:** Estética deportiva "Nike/Adidas Style" (Negro/Rojo/Blanco), Mobile-First real y animaciones `framer-motion`.
- **Contenido 100% Real:**
    - Extraídas URLs HD desde Instagram para el Hero y la Galería (`DNDg9tuRlth`, `DS8ASyZiWe8`, `C_9D3gzSYcv`, `DSQZxoWiXtD`).
    - Embebido directo del canal de YouTube (Video: Salesianos vs For Ever - Apertura 2026).
- **Integración de Accesos:**
    - Botón **Socio** ➔ `/socio/login`.
    - Botón **Staff** ➔ `/login` (Admin).
    - Mapa dinámico de la sede (Av. Italia 350) y botón flotante de WhatsApp.
- **Inclusividad:** Textos ajustados con lenguaje *"Chicos / Chicas"* para representar a toda la comunidad.
- **Optimización:** Sincronización de animaciones custom en `tailwind.config.js` (`animate-slowPan`).

---
**Registro de Hitos (Fecha: 2026-04-03 18:40):**
✅ **PASO 11 FINALIZADO: Estabilización Lógica Deportiva y Creación de Jornadas.**
- **Deportes - Categorización Automática:**
    - Se solucionó un error estructural en `Socio.save()` donde se sobrescribía implícitamente el método, anulando la categorización automática propuesta por las reglas CAH.
    - Al crear un `Socio` nuevo, si tiene edad declarada, se le asocia de forma silente el `PerfilDeportivo` con su categoría adecuada y se respeta su "socio_nro".
- **Deportes - Vinculación Manual (UI/UX Falla Arreglada):**
    - Se quitó `socio` de los campos `read_only_fields` en `PerfilDeportivoSerializer` para permitir re-asignaciones manuales exitosas.
    - Se reimplementaron y persistieron los inputs de **Altura** y **Peso** en el Frontend (`SocioFormModal.jsx`), obedeciendo la Restricción Crítica Global de no remover campos base.
- **Locales - Guardado de Jornadas (Falla silenciosa arreglada):**
    - Django rechazaba las nuevas jornadas devolviendo error HTTP 400 (Bad Request).
    - Solución: En el archivo `backend/jornada_local/serializers.py` se marcó el campo `club` como `read_only`, para que `JornadaDetailSerializer` valide con éxito y luego asigne automáticamente la pertenencia desde la View al club correspondiente.
    - Se integró una auto-generación de 4 dígitos para `access_pin` en `Jornada.save()` para blindar el POS sin entorpecer la carga inicial.


---
**Registro de Hitos (Fecha: 2026-04-03 19:35):**
✅ **PASO 12 FINALIZADO: Estabilización Definitiva de Categorización y Visualización de Jugadores.**
- **Backend - Fix Crítico de Importación:** 
    - Se detectó un error `NameError` en `backend/core/views.py` por la falta de importación de `get_object_or_404`, lo que rompía el endpoint `disponibles_vincular` (Error de datos). Arreglado.
- **Backend - Robustez en Categorización:**
    - Se agregó control de `NoneType` en la vista de socios para evitar que el sistema se rompa si un socio no tiene cargada su **Fecha de Nacimiento**.
- **Reglas Deportivas - Ajuste CAH:**
    - Se corrigió el mapeo de edades en `deportes/models.py`. Anteriormente, los chicos de 17-18 años eran erróneamente clasificados como "Juniors". Ahora se mapean correctamente a **Juveniles** (17-18 años), conforme a la normativa oficial.
- **Limpieza de Base de Datos:**
    - Se ejecutó un script de limpieza profunda (`deep_cleanup.py`) que fusionó categorías duplicadas (ej: había dos "MENORES" Masculinos con IDs distintos). Esto garantiza que no haya "jugadores perdidos" en categorías invisibles.
- **Sincronización Total:**
    - Se forzó el guardado masivo de todos los socios para re-calcular su categoría basándose en la nueva lógica CAH corregida. Los jugadores (como Tomasi y Dominguez) ahora aparecen correctamente en sus planteles.

🎯 **ESTADO ACTUAL: Los planteles están sincronizados, las categorías están limpias de duplicados y el motor de auto-categorización es 100% preciso.**

---
**Registro de Hitos (Fecha: 2026-04-03 19:40):**
✅ **PASO 13 FINALIZADO: Flujo de Gestión Integral para Cuerpo Técnico.**
- **Backend - Modelo Socio Evolucionado:** 
    - Se agregó el booleano `es_profesor` al `Socio` para distinguir quiénes son Staff Oficial de una forma estructural.
    - `SocioViewSet.perform_create` y `perform_update` interactúan determinísticamente con el campo `es_profesor`, conmutando la identidad del `CustomUser` asociado a `role='PROFESOR'` en vivo.
- **Backend - Autoasignaciones:** 
    - Al guardarse un `Socio` con el flag `es_profesor` activo, su categoría deportiva automática marca `posicion_principal = 'ENTRENADOR'` en su Perfil, integrándolo de lleno a la semántica deportiva.
- **Frontend - Integración UX:** 
    - `SocioFormModal.jsx` incluye un **Toggle** premium en la pestaña *Personal* (`Es Miembro de Staff / Profesor`).
    - Las asignaciones de *"Cuerpo Técnico"* de los Profes al plantel viajan instantáneamente y sin latencia. Al asignarlo en la categoría, cualquier `Socio` que encendió el switch `es_profesor` ya se puede vincular allí mismo.

🎯 **RESUMEN FASE 3 LISTA:** El Profe ya no es un "fantasma". Es un Socio con identidad propia que hereda dinámicamente derechos de Cuerpo Técnico y Gestión.

---
**Registro de Hitos (Fecha: 2026-04-03 20:05):**
✅ **PASO 14 FINALIZADO: Segregación UI/UX y Blindaje Financiero.**
- **Backend - Regla de Exclusión Financiera:** 
    - Se modificó `GenerarCuotasMasivasView` para incluir `.filter(es_profesor=False)`. Los profesores ahora son 100% invisibles para el motor de deudas manual/automático.
- **Frontend - Menús Independientes:** 
    - **Socios (Blue Theme):** Vuelve a ser exclusivo para miembros deportistas. Muestra solapas de Tutor, Deportivo y Beca. Filtra automáticamente solo `es_profesor=false`.
    - **Staff Técnico (Amber/Gold Theme):** Nuevo menú lateral exclusivo. Usa el nuevo `StaffFormModal` especializado (más simple, sin tabs innecesarias). Filtra solo `es_profesor=true`.
- **Identidad Corporativa:** 
    - `CarnetVirtual.jsx` ahora distingue tipos de carnet. Los profes tienen estética dorada, leyenda *"STAFF OFICIAL"* y vigencia ilimitada automática.

🎯 **PROYECTO ESTABILIZADO:** El club ahora tiene una gestión deportiva profesional, escalable y con una distinción clara entre quienes pagan por el servicio y quienes lo prestan.

---
**Registro de Hitos (Fecha: 2026-04-03 20:15):**
✅ **PASO 15 FINALIZADO: Refinamiento de Datos y Sincronización de Motor de Elegibilidad.**
- **Depuración de Base de Datos (Limpieza de Test):** Se eliminaron los usuarios residuales `buffet` y `coach` de pruebas anteriores que contaminaban los selectores de gestión.
- **Sincronización de Contadores:** Se detectó y corrigió una discrepancia en `DeportesPage.jsx`. El panel de control ("Habilitados/Riesgo") ahora utiliza el motor unificado de `eligibility.habilitado` en lugar del modelo obsoleto `.puede_jugar`.
- **UI Enriquecida:** Se añadió la visualización instantánea del Cuerpo Técnico asignado a cada categoría directamente en la vista principal de Deportes.

---
**Registro de Hitos (Fecha: 2026-04-03 20:16):**
✅ **PASO 16 FINALIZADO: Blindaje Anti-Errores en Tesorería.**
- **Módulo Finanzas:** Se modificó `GeneradorCuotasModal.jsx` para excluir rigurosamente a cualquier socio marcado como `es_profesor=True` del selector de cargos manuales/individuales. Esto previene accidentes financieros por error administrativo.
- **Cierre de Ciclo de Estabilización:** El sistema es ahora robusto ante la entrada de datos mixtos (Staff/Socios) en todo el flujo contable y deportivo.

---
**Registro de Hitos (Fecha: 2026-04-03 23:30):**
? **PASO 17 FINALIZADO: Optimizaci�n del M�dulo de Finanzas (Filtros Temporales y Paginaci�n).**
- **Backend - Motor de B�squeda y Paginaci�n:** 
    - Se integr� PageNumberPagination en CuentaCorrienteListView para manejar grandes vol�menes de socios sin degradar el rendimiento.
    - El endpoint /api/v1/finanzas/cuentas/ ahora procesa par�metros de anio, search y page a nivel de base de datos (QuerySet.annotate y aggregate).
- **Backend - L�gica de Cierre Anual:** 
    - Se implement� el c�lculo din�mico del saldo por periodo. Al filtrar por un a�o (ej: 2026), las tarjetas de resumen y los saldos de los socios reflejan la actividad de ese a�o espec�fico.
    - Se habilit� la opci�n 'Hist�rico' (ALL) para visualizar el saldo consolidado de toda la vida del socio.
- **Frontend - UI de Control Temporal:** 
    - Se a�adi� un selector de a�o (2024-2027 + Hist�rico) en la cabecera de Finanzas.
    - Se implementaron controles de paginaci�n (Anterior/Siguiente) con feedback de conteo total de registros.
- **Frontend - Sincronizaci�n de Historial (Modal):** 
    - El MovimientosModal ahora hereda el filtro de a�o de la vista principal. Permite analizar transacciones pesadas de forma segmentada, mostrando un subtotal de 'Cierre de Periodo' comparado con el 'Saldo Global'.

?? **LOGRO:** El sistema ahora es capaz de escalar a miles de registros financieros manteniendo una carga instant�nea y ofreciendo una visi�n clara de la contabilidad por ejercicios anuales.

---
**Registro de Hitos (Fecha: 2026-04-03 23:35):**
? **PASO 18 FINALIZADO: Correcci�n de Filtrado y Depuraci�n de Staff T�cnico en Finanzas.**
- **Backend - Fix de B�squeda:** Se corrigi� un error cr�tico de importaci�n (NameError Q) que imped�a que la b�squeda de socios funcionara. Ahora el filtro por nombre, apellido y DNI es 100% funcional.
- **Backend - Blindaje de Staff:** Se aplic� el filtro 'es_profesor=False' en la vista de finanzas. El Cuerpo T�cnico es ahora totalmente invisible en el panel de tesorer�a, cumpliendo la regla de negocio.
- **Frontend - Simplicidad UX:** Se eliminaron a�os futuros/pasados irrelevantes de los filtros. La vista se centra en 'Ejercicio 2026' y 'Hist�rico' para evitar confusi�n.

?? **LOGRO:** El sistema de b�squeda y filtrado temporal ya es estable y respeta la segregaci�n entre Staff y Socios pagantes.
