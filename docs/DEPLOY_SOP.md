# SOP: Guía de Despliegue y Configuración (DEPLOY)

**Estado:** En Construcción (Se actualiza con cada cambio crítico)

---

## 🚀 Consideraciones para Producción (Checklist)

### 1. Variables de Entorno (.env)
Asegurarse de que estas variables NO apunten a localhost en el servidor final.

- **FRONTEND_URL:** Debe apuntar al dominio final (ej: `https://club.ctsoft.com.ar`).
    - *Impacto:* Los correos de reseteo de contraseña enviados por Resend usan esta URL para generar los links. Actualmente en `core/views.py` está hardcodeado a `localhost:3051`.
- **DEBUG:** Cambiar obligatoriamente a `False`.
- **ALLOWED_HOSTS:** Especificar el dominio del servidor.
- **CORS_ALLOWED_ORIGINS:** Especificar el dominio del frontend.

### 2. Servicios Externos
- **RESEND:** Verificar que el `EMAIL_HOST_PASSWORD` sea un API Key válido y con permisos de envío para el dominio del club.
- **MERCADO PAGO:** Cambiar las credenciales (Public Key / Access Token) de modo Sandbox a modo Producción.

### 3. Base de Datos
- Realizar backup antes de aplicar las migraciones (`python manage.py migrate`).
- El driver de PostgreSQL debe estar instalado y el servicio corriendo.

### 4. Media y Estáticos
- Configurar el almacenamiento de archivos (ej: AWS S3 o almacenamiento local servido por Nginx) para las fotos de los socios y los comprobantes de pago.
- Ejecutar `python manage.py collectstatic`.

---

## 📝 Registro de Tareas Pendientes (Post-Sesión)
- [ ] Mover `reset_url` en `backend/core/views.py` para que use `settings.FRONTEND_URL` en lugar de string literal.
- [ ] Configurar el job de limpieza de tokens expirados.
