# FASE 0 - SOP: FUNDACIÓN E INFRAESTRUCTURA
**Fecha:** 2026-04-01
**Estado:** En curso

## 1. OBJETIVO / CONTEXTO
Dejar el esqueleto inicial listo y funcional de ambos proyectos (backend y frontend) conectados a la base de datos PostgreSQL en el entorno local (SIN DOCKER), para que todas las fases siguientes puedan empezar apoyadas en una buena estructura. 

## 2. ENTRADAS (INPUTS)
- Base de datos PostgreSQL: `localhost:5432`, user: `postgres`, DB: `salesianosDB`
- Credenciales SMTP Resend configuradas en `.env` (Puerto 465, SSL)
- Credenciales MercadoPago Test configuradas en `.env`

## 3. PASOS / EJECUCIÓN
1. **Crear Base de Datos**: Inicializar base `salesianosDB` en PostgreSQL local.
2. **Setup Backend Python**:
   - Crear virtualenv `venv`.
   - Crear archivo `requirements.txt` base (Django, DjangoRestFramework, SimpleJWT, Psycopg2, etc).
   - Crear `.env` con las variables puestas a disposición.
   - Iniciar proyecto Django en carpeta `backend`.
3. **Setup Frontend React**:
   - Inicializar con Vite (`npm create vite@latest frontend -- --template react`)
   - Instalar dependencias base (`axios`, `zustand`, `react-router-dom`).
4. **Verificación**: Backend respondiendo en un puerto (ej. 8000), DB conectada y migraciones iniciales pasadas.

## 4. RESTRICCIONES Y CASOS BORDE (MEMORIA DE APRENDIZAJE)
- **NO USAR DOCKER**: El despliegue de desarrollo es 100% nativo.
- **COSTOS ACTIVOS**: El proyecto es 100% free en su desarrollo. Se validó Resend (free tier SMTP) y MercadoPago.
- **Mailing Setup**: Si el user `resend` en SMTP da problemas, validar si hace falta configuración TLS en vez de SSL. El usuario especificó SSL=True, TLS=False. Lo implementamos tal cual.
- **Psycopg2**: Si ocurre error instalando `psycopg2` en entorno local Windows, probar instalando el binario precompilado `psycopg2-binary`.

---
*Fin del documento SOP Fase 0.*
