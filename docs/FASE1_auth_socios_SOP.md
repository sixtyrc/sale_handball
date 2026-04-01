# FASE 1 - SOP: AUTENTICACIÓN, ROLES Y BASE SOCIETARIA
**Fecha:** 2026-04-01
**Estado:** En curso

## 1. OBJETIVO / CONTEXTO
Establecer el modelo base de usuarios, roles de acceso y el padrón de socios (multi-tenant) sobre el cual pivotará el resto del sistema. 
El requerimiento crítico de negocio es que **TODAS** las entidades operativas (Crear Profesor, Crear Socio, etc.) deben ser autogestionables desde el frontend (React PWA) por los administradores de la plataforma, relegando el panel nativo de Django (`/admin/`) exclusivamente a mantenimiento duro de infraestructura y migraciones a nivel de base de datos.

## 2. ENTRADAS (INPUTS)
- Modelos a crear: `Club`, `CustomUser`, `Socio`.
- Rol/Grupos de autenticación: `Admin`, `Profesor`, `Socio_Tutor`, `Directivo`.
- Requisito Multi-tenant: Relacionar `CustomUser` y `Socio` con un `Club` (FK `club_id`).

## 3. PASOS / LÓGICA DE EJECUCIÓN
1. **Configuración de la App Base:**
   - Crear app `core` en el backend para alojar los modelos fundacionales.
   - Registrar la app en `config/settings.py`.
2. **Modelo `Club` y `CustomUser`:**
   - Crear el modelo extendido de usuario en Django (`AbstractUser`) para soportar `club` (ForeignKey) y `role` (ChoiceField).
   - Configurar `AUTH_USER_MODEL = 'core.CustomUser'` en settings (Crítico hacerlo antes de la primera migración).
3. **Modelo `Socio`:**
   - Crear el modelo que representa a la persona física vinculada a un club.
   - Datos: `nro_socio`, `dni`, `fecha_nacimiento`, `estado` (ACTIVO, INACTIVO, SUSPENDIDO), `contacto_emergencia`.
   - Vincular al `CustomUser` (1:1 - Un socio puede loguearse para autogestión).
4. **API Rest y Permisos:**
   - Exponer Endpoints (`/api/users/`, `/api/socios/`) con permisos que evalúen `request.user.role == 'Admin'` y `request.user.club == socio.club`.
   - Implementar JWT Authentication (Login endpoint).
5. **Frontend Setup Básico:**
   - Crear Store (Zustand) para manejar la sesión del JWT.
   - Crear rutas básicas protegidas.

## 4. RESTRICCIONES Y CASOS BORDE (MEMORIA DE APRENDIZAJE)
- **Multi-Tenant Fuerte:** Nunca usar un `ModelViewSet` sin sobreescribir `get_queryset()` para filtrar `club_id = request.user.club_id`.
- **Custom User:** Obligatorio crear el CustomUser *antes* de correr `python manage.py migrate` por primera vez, si no Django se corrompe históricamente.
- **Frontend Admin:** La API debe incluir todos los métodos (POST, PUT, DELETE lógico, GET) para que el Panel React pueda crear usuarios y profesores sin pisar el admin de Django.

---
*Fin del documento SOP Fase 1.*
