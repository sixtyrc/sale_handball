# 🏆 PLAN MAESTRO – SaaS CLUB HANDBALL
**Versión:** 1.7  
**Fecha:** 2026-04-01  
**Estado:** ACTIVO – Memoria de credenciales habilitada  

---

## 📐 ARQUITECTURA GENERAL

```
saas-handball/
├── backend/                  # Django + DRF
│   ├── config/               # Settings, URLs raíz, wsgi/asgi
│   ├── apps/
│   │   ├── tenants/          # Multi-tenant (Club)
│   │   ├── users/            # Auth + Roles
│   │   ├── socios/           # Jugadores, Tutores
│   │   ├── financiero/       # Cuenta corriente, movimientos
│   │   ├── pagos/            # Pagos, recibos PDF
│   │   ├── deportivo/        # Posiciones, stats handball
│   │   ├── partidos/         # Fixtures, partidos, estadísticas
│   │   ├── medico/           # Ficha médica, seguro
│   │   ├── profesores/       # Staff técnico
│   │   └── auditoria/        # Log de cambios
│   ├── shared/               # Mixins, permisos, utils comunes
│   └── requirements.txt
├── frontend/                 # React (Vite) + PWA
│   ├── src/
│   │   ├── modules/          # 1:1 con apps del backend
│   │   ├── shared/           # Design system, componentes base
│   │   ├── hooks/            # Custom hooks
│   │   └── store/            # Estado global (Zustand)
│   └── public/
│       └── manifest.json     # PWA
├── docs/                     # Directivas SOP por módulo
└── scripts/                  # Automatizaciones Python
```

### Stack Definitivo

| Capa | Tecnología | Costo | Justificación |
|------|-----------|-------|---------------|
| Backend | Django 5.x + DRF | ✅ Free | ORM potente, Admin para backoffice |
| Auth | SimpleJWT | ✅ Free | JWT stateless, roles por claim |
| Multi-tenant | `club_id` en modelos (opción A) | ✅ Free | Simple, sin librerías externas |
| DB | PostgreSQL (local ya instalado) | ✅ Free | JSONB para auditoria, confiabilidad |
| PDF | WeasyPrint | ✅ Free | HTML-to-PDF, fácil branding con logo |
| Frontend | React 18 + Vite | ✅ Free | Rápido, PWA friendly |
| Estado | Zustand | ✅ Free | Liviano, mobile friendly |
| HTTP | Axios + React Query | ✅ Free | Cache, retry, loading states |
| PWA | Vite PWA Plugin | ✅ Free | Service worker, instalable |
| Entorno local | Python + PostgreSQL (ya instalados) | ✅ Free | Sin Docker, directo en el sistema |
| Deploy futuro | Nginx + Gunicorn (VPS propio) | ✅ Free | Solo se paga el servidor, no el software |

---

## 💰 POLÍTICA DE COSTOS – 100% FREE
> **REGLA GLOBAL:** Todo componente, librería, servicio o API utilizada en este proyecto DEBE ser gratuita.

| Necesidad | Opción Free (USAR) | Opción de pago (EVITAR) |
|-----------|-------------------|------------------------|
| PDF generation | WeasyPrint / ReportLab | PDFShift, DocRaptor |
| Email transaccional | Resend SMTP (Free Tier) | SendGrid (pago), Mailgun |
| Pagos y QR | Mercado Pago (API Oficial) | Servicios integradores costosos |
| Storage de archivos | Local filesystem / S3 MinIO self-hosted | AWS S3, Cloudinary |
| Push notifications | Web Push Protocol (VAPID, libre) | Firebase (tiene límites), OneSignal |
| QR de pago | Generado localmente con `qrcode` lib | Servicios de pago externos |
| Mapas (si se necesitan) | OpenStreetMap / Leaflet | Google Maps |
| Íconos | Lucide React / Heroicons | Icomoon Pro |
| Fuentes | Google Fonts (free) | Adobe Fonts |
| Autenticación social | django-allauth (open source) | Auth0, Okta |
| CI/CD | GitHub Actions (free tier) | CircleCI pro |

### Protocolo ante tecnología con costo
Si en algún punto **no hay alternativa gratuita viable**, el Agente DEBE:
1. **Informar explícitamente** al usuario: `⚠️ ALERTA DE COSTO: [tecnología] tiene costo porque [razón]`
2. **Presentar alternativas** ordenadas de menor a mayor costo
3. **Esperar aprobación** antes de proceder
4. **Documentar la decisión** en la directiva SOP correspondiente

---

## 🗺️ FASES DEL PROYECTO

---

## FASE 0 – FUNDACIÓN E INFRAESTRUCTURA
**Duración estimada:** 2-3 días  
**Pre-requisito:** Ninguno (Python y PostgreSQL ya instalados en el equipo)  
**Objetivo:** Esqueleto técnico listo para que todas las fases siguientes puedan construirse sin fricciones.

> ⚠️ **ENTORNO LOCAL SIN DOCKER** – Python y PostgreSQL ya en funcionamiento local.

### Estrategia Git y Entornos (Obligatorio)
- **`prod` (`main`)**: Código de producción estable.
- **`test`**: Entorno de validación / UAT.
- **`dev`**: Rama principal de desarrollo donde operará el Agente (esta es la rama DEFAULT de trabajo).
- **Control de Versiones**: Se debe inyectar de manera automatizada usando las variables `.env` qué versión es (ej: v1.0.0) y en qué entorno está corriendo el sistema para que se refleje de manera visible en el Login / Nav del frontend.

### Entregables
- [x] Repositorio Git inicializado con las 3 ramas (`main`, `dev`, `test`).
- [ ] UI de React debe evidenciar Entorno y Versión mediante `import.meta.env`.
- [ ] Structure of project folders and Virtualenv in `d:/Proyectos/Salesianos/`.
- [ ] **Credential Storage Policy**: All system credentials (DB, Admin, Emails, APIKeys) must be documented in `user_pass/user_pass.md`. This folder is EXCLUDED from git for security.
- [ ] Django configurado con:
  - Multi-tenant via `club_id` en cada modelo
  - Settings separados: `base.py`, `dev.py`, `prod.py`
  - JWT auth configurado (`djangorestframework-simplejwt`)
  - CORS configurado para React (`django-cors-headers`)
- [ ] `requirements.txt` base generado
- [ ] Conexión a PostgreSQL local verificada (usuario provee credenciales)
- [ ] Migraciones iniciales aplicadas
- [ ] React (Vite) + PWA plugin instalado en `frontend/`
- [ ] Design system base: colores, tipografía, componentes móviles
- [ ] `.env.example` documentado (sin secretos, solo estructura)
- [ ] `package.json` base con dependencias core

### Decisión Arquitectónica Clave: Estrategia Multi-Tenant
> **Opción A (ELEGIDA):** `club_id` (FK) en cada modelo + middleware que lo inyecta automáticamente desde el JWT.  
> Motivo: más simple, sin librerías externas, sin overhead de schemas.

### Criterios de Aceptación
- `python manage.py runserver` corre sin errores
- `GET /api/health/` devuelve `200 OK`
- Login básico con JWT funciona y devuelve token
- `npm run dev` en frontend levanta sin errores

---

## FASE 1 – SOCIOS Y AUTENTICACIÓN
**Duración estimada:** 5-7 días  
**Pre-requisito:** Fase 0 completa  
**Módulos:** `users/`, `socios/`, `tenants/`

### Qué se construye
1. **Tenant/Club:** Entidad raíz. Todo pertenece a un club.
2. **Usuarios y Roles:** Admin, Administrativo, Profesor, Socio/Tutor
3. **Socios:** Jugadores + Socios familiares + Tutores (obligatorio para menores)

### Modelo de Datos (preview)
```
Club → tiene muchos User
Club → tiene muchos Socio
Socio → puede tener Tutor (FK a otro Socio, obligatorio si es menor)
User → tiene un Rol + pertenece a un Club
```

### SOP a crear
- `docs/FASE1_socios_usuarios_SOP.md`

### Entregables
- [ ] Modelo `Club` con branding (logo, colores) y datos básicos
- [ ] Modelo `User` extendido con rol y tenant
- [ ] Modelo `Socio` con validación tutor para menores
- [ ] Categorías deportivas configurables por club
- [ ] API CRUD `/api/socios/` con filtros y paginación
- [ ] Frontend: Listado de socios (mobile-first), formulario alta
- [ ] Validación: menor sin tutor → error 400

### Criterios de Aceptación
- Admin puede crear socios desde mobile
- Menor sin tutor no se puede guardar
- Datos aislados por club (multi-tenant verificado)

---

## FASE 2 – CUENTA CORRIENTE (CORE FINANCIERO)
**Duración estimada:** 7-10 días  
**Pre-requisito:** Fase 1 completa  
**Módulos:** `financiero/`  
**⚠️ MÓDULO CRÍTICO – Base de toda la lógica de cobros**

### Qué se construye
El sistema contable por socio. Todo el dinero del club pasa por aquí.

### Reglas de Negocio (INMUTABLES)
1. **Ningún movimiento puede eliminarse** – solo compensarse con otro
2. **Saldo = suma de todos los movimientos** (nunca campo directo mutable)
3. **Tipos:** CUOTA | PAGO | MORA | ARBITRAJE | TERCER_TIEMPO | SEGURO | AJUSTE
4. **Signo:** Débito = negativo (deuda), Crédito = positivo (a favor)
5. **Saldo Inicial / Arrastre:** Capacidad de cargar deuda histórica al iniciar el uso del sistema.

### Modelo de Datos (preview)
```
CuentaCorriente (1:1 con Socio)
  └── MovimientoCuenta (append-only, NUNCA se borra)
        ├── tipo (CUOTA / PAGO / MORA / etc.)
        ├── monto (Decimal, positivo o negativo según signo)
        ├── fecha
        ├── descripcion
        ├── created_by (User)
        └── anulado_por (FK a otro Movimiento con tipo AJUSTE)
```

### SOP a crear
- `docs/FASE2_cuenta_corriente_SOP.md`

### Entregables
- [ ] Modelos `CuentaCorriente` y `MovimientoCuenta`
- [ ] Signal Django: auto-crear cuenta al crear socio
- [ ] `GET /api/socios/{id}/cuenta-corriente/` → saldo + historial
- [ ] `POST /api/movimientos/` → crear movimiento (sin DELETE endpoint)
- [ ] Endpoint/Script de Migración para registrar **Saldo Inicial** de socios.
- [ ] Servicio de generación masiva de cuotas mensuales
- [ ] Frontend: Vista de deuda (mobile), historial paginado
- [ ] Acción rápida: botón VER DEUDA visible desde listado

### Criterios de Aceptación
- Saldo siempre consistente (calculado, no almacenado)
- 0 endpoints DELETE en movimientos
- Vista mobile muestra saldo y últimos 10 movimientos

---

## FASE 3 – PAGOS Y RECIBOS PDF
**Duración estimada:** 5-7 días  
**Pre-requisito:** Fase 2 completa  
**Módulos:** `pagos/`

### Qué se construye
Flujo completo: recibir pago → registrar movimiento → generar PDF.

### Flujo Principal
```
Administrativo selecciona socio
  → Ve deuda actual
  → Ingresa monto + forma de pago
  → Sistema crea Movimiento tipo PAGO (atómico)
  → Sistema genera Recibo PDF con logo del club
  → PDF disponible para descargar / compartir por WhatsApp
```

### Formas de Pago
- Efectivo
- Transferencia bancaria
- QR / Online (Mercado Pago API oficial)
- Manual (registrado, sin confirmación digital)

### Modelo de Datos (preview)
```
Pago
  ├── socio (FK)
  ├── monto (Decimal)
  ├── forma_pago (EFECTIVO | TRANSFERENCIA | QR | MANUAL)
  ├── movimiento (FK → MovimientoCuenta, 1:1)
  └── recibo (FK → Recibo, 1:1)

Recibo
  ├── numero (auto-incremental POR CLUB, no global)
  ├── fecha
  ├── pdf_url (path en storage)
  └── club (FK → tenant)
```

### SOP a crear
- `docs/FASE3_pagos_recibos_SOP.md`

### Entregables
- [ ] Modelos `Pago` y `Recibo`
- [ ] Generador PDF con WeasyPrint (logo + datos del club + socio)
- [ ] Numeración automática por club (secuencia por tenant)
- [ ] `POST /api/pagos/` → crea pago + movimiento + recibo atómicamente
- [ ] `GET /api/recibos/{id}/pdf/` → descarga PDF
- [ ] Frontend: Flujo cobro mobile (máx 3 pasos), botón COBRAR CUOTA
- [ ] Acción rápida: REGISTRAR PAGO desde home

### Criterios de Aceptación
- Pago + movimiento + recibo se crean o NINGUNO (transacción atómica)
- PDF incluye logo, datos del club y del socio
- Numeración no se repite nunca en el mismo club

---

## FASE 4 – CONFIGURACIÓN MULTI-TENANT Y BRANDING
**Duración estimada:** 3-5 días  
**Pre-requisito:** Fases 1-3 completas  
**Módulos:** `tenants/` (ampliación)

### Qué se construye
Panel de configuración por club. Cada club personaliza su instancia.

### Configuraciones Disponibles

| Categoría | Campos |
|-----------|--------|
| Branding | Logo, color primario, color secundario, modo dark/light |
| Datos del club | Nombre, dirección, teléfono, email |
| Financiero | Valor cuota base, % mora, día de vencimiento |
| Deportivo | Categorías habilitadas (sub-8, sub-10, sub-12...) |
| Conceptos y Temporadas | Creación de conceptos cobrables versionados (arbitral, seguro) por ciclo/temporada |

### Patrón de Branding Dinámico
```javascript
// Frontend carga config del club al iniciar sesión
// CSS variables se setean dinámicamente por JS
document.documentElement.style.setProperty('--color-primary', club.color_primario)
document.documentElement.style.setProperty('--color-secondary', club.color_secundario)
```

### SOP a crear
- `docs/FASE4_multitenant_branding_SOP.md`

### Entregables
- [ ] Modelo `ClubConfig` extendiendo `Club`
- [ ] `GET/PUT /api/club/config/` (solo Admin del club)
- [ ] Upload de logo con validación (PNG/JPG, max 2MB)
- [ ] Modelo `Temporada` y `ConceptoCobrable` (versionado de precios y aranceles)
- [ ] Frontend: Panel de configuración del club con preview live
- [ ] Branding dinámico aplicado en toda la app
- [ ] Generación de cuotas masiva usando config y conceptos vigentes de la temporada

### Criterios de Aceptación
- Cambiar colores/logo se refleja inmediatamente sin reload
- Club A no puede ver ni modificar config de Club B

---

## FASE 5 – MÓDULOS DEPORTIVOS
**Duración estimada:** 8-12 días  
**Pre-requisito:** Fase 1 completa  
**Módulos:** `profesores/`, `medico/`, `deportivo/`, `partidos/`  
**Nota:** Puede desarrollarse parcialmente en paralelo a Fases 3-4

### 5A – PROFESORES
- Modelo `Profesor` (datos personales, rol: ENTRENADOR | PREPARADOR_FISICO)
- Asignación a una o más categorías
- Permisos específicos: ver jugadores de SU categoría, cargar stats, asistencia
- API y pantallas mobile

### 5B – DOCUMENTACIÓN DIGITAL Y FICHA MÉDICA
- Modelo `DocumentoDigital` y `FichaMedica` (1:1 con Socio)
- Tipos de doc: DNI, Autorización tutor, Consentimiento imagen, Apto físico.
- Campos: `apto_fisico` (bool), `fecha_vencimiento`, `observaciones`, `archivo_pdf`
- Alertas visuales:
  - 🔴 **VENCIDO** → más de 0 días pasada la fecha
  - 🟡 **PRÓXIMO A VENCER** → dentro de 30 días
  - 🟢 **VIGENTE** → más de 30 días restantes

### 5C – SEGURO DEPORTIVO
- Modelo `SeguroDeportivo` (1:1 con Socio)
- Campos: `numero_poliza`, `compañia`, `fecha_vencimiento`, `estado`
- Estado calculado automáticamente según fecha
- Genera movimiento tipo SEGURO en cuenta corriente al activar

### 5D – PERFIL DEPORTIVO HANDBALL
- Modelo `PerfilDeportivo` (1:1 con Socio)
- Posición principal y secundaria: ARQUERO | EXTREMO_IZQ | EXTREMO_DER | LATERAL_IZQ | LATERAL_DER | CENTRAL | PIVOT
- Campos: `mano_habil` (Der/Izq/Ambi), `altura_cm`, `peso_kg`, `categoria`

### 5E – PARTIDOS Y ESTADÍSTICAS
- Modelos: `Partido`, `EstadisticaJugador`
- Stats por jugador/partido: goles, asistencias, exclusiones_2min, tarjetas_amarillas, tarjetas_rojas, penales_ejecutados, penales_convertidos
- Carga rápida de stats desde mobile por Profesor

### 5F – FIXTURES Y TORNEOS
- Modelos: `Torneo`, `FechaFecha`, `EquipoRival`
- Calendario de partidos con resultado final
- Vista pública del fixture (sin autenticación)

### SOPs a crear
- `docs/FASE5A_profesores_SOP.md`
- `docs/FASE5B_medico_seguro_SOP.md`
- `docs/FASE5C_deportivo_handball_SOP.md`
- `docs/FASE5D_partidos_fixtures_SOP.md`

### Criterios de Aceptación
- Profesor solo ve jugadores de SU categoría
- Ficha médica vencida muestra badge rojo visible
- Carga de stats: máx 3 toques desde home del profesor

---

## FASE 6 – AUDITORÍA, SEGURIDAD Y TABLEROS (DASHBOARDS)
**Duración estimada:** 4-6 días  
**Pre-requisito:** Todas las fases anteriores  
**Módulos:** `auditoria/`, `reportes/`

### Qué se construye
Trazabilidad completa de acciones y Dashboards analíticos para la Comisión Directiva.

### Dashboards Directivos:
- **Mora y Societario:** Deuda total/vencida, top deudores, activos vs inactivos.
- **Riesgo Operativo:** Jugadores sin seguro, sin apto médico o sin autorización.
- **Deportivo:** Habilitados vs inhabilitados, estadísticas generales.

### Qué se registra

| Campo | Descripción |
|-------|-------------|
| `usuario` | FK al User que realizó la acción |
| `accion` | CREATE / UPDATE / LOGIN / EXPORT / ANULAR |
| `entidad` | Nombre del modelo afectado |
| `entidad_id` | ID del registro afectado |
| `datos_antes` | JSON snapshot antes del cambio |
| `datos_despues` | JSON snapshot después del cambio |
| `ip` | IP del cliente |
| `timestamp` | Fecha y hora exacta (UTC) |
| `club` | FK al tenant |

### Implementación
- Mixin `AuditableMixin` para serializers DRF
- Modelo `AuditLog` (solo INSERT, sin UPDATE/DELETE)
- `GET /api/auditoria/` y endpoints de datos para gráficos de dashboards
- Panel de auditoría en frontend con filtros
- Rol `Dirigente / Comisión`: Acceso de solo lectura a todos los tableros.

### SOP a crear
- `docs/FASE6_auditoria_SOP.md`

### Criterios de Aceptación
- Cualquier cobro registra quién, cuándo y desde qué IP
- Admin puede filtrar logs por rango de fechas y tipo de acción
- AuditLog no tiene endpoints PUT/DELETE

---

## FASE 7 – PWA POLISH Y OPTIMIZACIÓN MOBILE
**Duración estimada:** 3-5 días  
**Pre-requisito:** Todas las fases anteriores  
**Objetivo:** El sistema se siente como app nativa desde el celular

### Qué se implementa
- [ ] `manifest.json` completo (íconos, splash screen, nombre por club)
- [ ] Service Worker: cache offline de páginas críticas
- [ ] Push notifications: alertas ficha médica vencida, pagos pendientes
- [ ] Prompt "Agregar a pantalla de inicio"
- [ ] Lazy loading por módulo (code splitting)
- [ ] Lighthouse score ≥ 90 en mobile
- [ ] Home personalizado por rol:

| Rol | Acciones rápidas en Home |
|-----|--------------------------|
| Admin / Administrativo | COBRAR CUOTA · VER DEUDORES · REGISTRAR PAGO |
| Profesor | VER MIS JUGADORES · CARGAR STATS · ASISTENCIA |
| Socio / Tutor | MI DEUDA · MIS RECIBOS · FICHA MÉDICA |

---

## FASE 8 – ENTREGABLES DOCUMENTALES Y MANUAL DE USUARIO
**Duración estimada:** 2-3 días  
**Pre-requisito:** Proyecto completamente estabilizado (Fase 7 completada).  
**Objetivo:** Consolidar la documentación para la entrega institucional y la capacitación de los roles del club.

### Entregables
- [ ] Manual de Usuario: Capítulo "Administradores" (Configuración, cuotas, tableros).
- [ ] Manual de Usuario: Capítulo "Secretaría/Tesorería" (Mora, altas/bajas, caja, cobros, reportes).
- [ ] Manual de Usuario: Capítulo "Profesores" (Planillas de partido, asistencia, fichas médicas).
- [ ] Manual de Usuario: Capítulo "Socios y Tutores" (Portal de autogestión y pagos).
- [ ] Documentación Técnica: API Reference y arquitectura para futuros desarrolladores.

### SOP a crear
- `docs/FASE7_pwa_mobile_SOP.md`

### Criterios de Aceptación
- App instalable en Android e iOS desde el navegador
- Modo offline: lectura de últimos datos cacheados
- Todas las acciones principales en ≤ 3 toques desde home

---

## 📊 RESUMEN EJECUTIVO DE FASES

| Fase | Nombre | Días Est. | Prioridad | Dependencias |
|------|--------|-----------|-----------|-------------|
| 0 | Fundación e Infraestructura | 3-5 | 🔴 Crítica | Ninguna |
| 1 | Socios y Autenticación | 5-7 | 🔴 Crítica | Fase 0 |
| 2 | Cuenta Corriente (Core) | 7-10 | 🔴 Crítica | Fase 1 |
| 3 | Pagos y Recibos PDF | 5-7 | 🔴 Crítica | Fase 2 |
| 4 | Config Multi-Tenant y Branding | 3-5 | 🟠 Alta | Fases 1-3 |
| 5 | Módulos Deportivos (A-F) | 8-12 | 🟡 Media | Fase 1 |
| 6 | Auditoría y Seguridad | 3-5 | 🟠 Alta | Todas |
| 7 | PWA Polish Mobile | 3-5 | 🟠 Alta | Todas |
| 8 | Manual de Usuario | 2-3 | 🟢 Baja | Todas |

**Total estimado: 39 – 59 días de desarrollo**

---

## ⚠️ REGLAS CRÍTICAS (No negociables)

1. **NO** generar código sin SOP aprobado de la fase correspondiente
2. **NO** permitir eliminar movimientos financieros bajo ninguna circunstancia
3. **TODO** modelo debe tener `club` (FK) – multi-tenant sin excepción
4. **TODO** debe funcionar en mobile (viewport 375px mínimo)
5. **NO** mezclar lógica de negocio en vistas/serializers → usar Services
6. **Transacciones atómicas** obligatorias en cualquier operación financiera
7. **SIN DOCKER** – Entorno local con Python + PostgreSQL ya instalados
8. **100% FREE** – Toda tecnología debe ser gratuita. Si hay costo inevitable: informar, comparar alternativas y esperar aprobación explícita del usuario
9. **BITÁCORA DE PROGRESO** – Siempre mantener actualizado el Checklist de Progreso Diario al final de este documento con fecha, hora e ítem completado.

---

## 🚦 PRÓXIMOS PASOS (Inmediatos)

1. ✅ **Plan aprobado** con ajustes v1.1
2. ▶️ Iniciar **Fase 0**: crear estructura del proyecto en `d:/Proyectos/Salesianos/`
   - Usuario proveerá credenciales de PostgreSQL cuando se inicialice la DB
3. Crear SOP detallado de **Fase 1** antes de escribir código
4. Desarrollar módulo por módulo en orden de prioridad

---

## 📝 CHECKLIST DE PROGRESO DIARIO (BITÁCORA)

> **REGLA:** Antes de terminar la sesión o al arrancar el día siguiente, esta sección DEBE consultarse y actualizarse con: `[ ]` o `[x]` + Fecha/Hora local + Tarea realizada/Próximo paso explícito.

### FASE 1: AUTENTICACIÓN, ROLES Y BASE SOCIETARIA
- [x] **2026-04-01 12:30hs:** Modelos `Club`, `CustomUser` (con `role` y `club_id`) y `Socio` creados y migrados a `salesianosdb`.
- [x] **2026-04-01 12:32hs:** API JWT: Login endpoint, `SocioViewSet` y `ClubViewSet` con filtro multi-tenant automático.
- [x] **2026-04-01 12:20hs:** Frontend Login premium (glassmorphism, indicador de entorno DEV/PROD y versión).
- [x] **2026-04-01 12:33hs:** Backend live en `http://localhost:8000` — Frontend live en `http://localhost:5174`.
- [x] **2026-04-01 12:38hs:** Commit `feat(fase1)` pusheado a rama `dev` en GitHub.

### FASE 2: CUENTA CORRIENTE Y SISTEMA FINANCIERO
- [x] **2026-04-01 12:46hs:** SOP Fase 2 creado (`docs/FASE2_finanzas_SOP.md`).
- [x] **2026-04-01 12:50hs:** App `finanzas` creada. Modelos `CuentaCorriente` e `MovimientoFinanciero` migrados.
- [x] **2026-04-01 12:50hs:** Signal auto-crea `CuentaCorriente` al crear un `Socio`.
- [x] **2026-04-01 12:50hs:** APIs: cuenta por socio, registrar movimiento, cuotas masivas, saldo inicial histórico.
- [x] **2026-04-01 12:50hs:** Commit `feat(fase2)` pusheado a rama `dev` en GitHub.

### FASE 3: MÓDULO DEPORTIVO Y PERFILES
- [x] **2026-04-01 12:51hs:** SOP Fase 3 redactado y guardado en `docs/FASE3_deportes_SOP.md`.
- [x] **2026-04-01 12:53hs:** Modelos `Categoria`, `PerfilDeportivo` y `DocumentoDigital` creados (con manejo de medios en local).
- [x] **2026-04-01 12:53hs:** Funciones decoradas `@property` para chequeo en tiempo real de apto médico y habilitación.
- [x] **2026-04-01 12:55hs:** API viewsets conectados bajo `/api/v1/deportes/` con filtro IsFromClub.
- [x] **2026-04-01 13:00hs:** Commit `feat(fase3)` pusheado a la rama `dev`.

### FASE 4: ADMINISTRACIÓN Y CONFIGURACIÓN EXTENDIDA
- [x] **2026-04-01 13:04hs:** SOP Fase 4 redactado (`docs/FASE4_admin_config_SOP.md`).
- [x] **2026-04-01 13:05hs:** App `admin_club` creada con modelos `ClubConfig`, `Temporada` y `ConceptoCobrable`.
- [x] **2026-04-01 13:05hs:** Signal pre_save para garantizar que solo exista una temporada ACTIVA a la vez.
- [x] **2026-04-01 13:06hs:** Endpoint PÚBLICO para Branding multi-tenant (para la PWA Frontend).
- [x] **2026-04-01 13:08hs:** Commit `feat(fase4)` pusheado a rama `dev`.
- [ ] **PRÓXIMO PASO: Iniciar Fase 5 – Eventos, Partidos y Asistencia**: Módulo interactivo para profesores.

---

*Documento generado por el Agente de Desarrollo Autónomo – 2026-04-01*  
*Actualizado v1.6 – Estrategia Git y Versionamiento visible agregado.*  
*Próxima actualización: Al completar inicialización.*
