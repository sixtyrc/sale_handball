# SOP: CORRECCIÓN DE PUERTO API Y DIRECCIONAMIENTO MULTI-ENTORNO
**Fecha:** 2026-04-04 09:12
**Estado:** COMPLETADO ✅

## 1. OBJETIVO
Corregir el error de conexión (`ERR_CONNECTION_REFUSED`) y dinamizar la identificación del entorno (DEV/TEST) y versionado automático.

## 2. DIAGNÓSTICO
- El backend está en puerto 8002.
- El frontend estaba hardcodeado a 8000.
- El entorno mostraba "DEV" incluso en el servidor de test.

## 3. SOLUCIÓN IMPLEMENTADA
1.  **Dinamización de API URL**: `api.js` y `authStore.js` usan lógica `window.location.hostname === 'localhost' ? ... : ...`.
2.  **Versioning Automático**: Implementado `define` en `vite.config.js` (`__APP_VERSION__`) que genera un tag de versión por timestamp en cada build.
3.  **Detección de Entorno**: El badge del footer ahora muestra **DEV** si es local y **TEST** si es el servidor remoto (`ctsoft.com.ar`).
4.  **Configuración de Proxy**: Se corrigió el puerto del proxy en `vite.config.js` de 8000 a 8002.
5.  **Limpieza Masiva**: Script `fix_frontend_urls.py` eliminó todos los `localhost:8000` hardcodeados en los componentes `.jsx`.

## 4. TAREAS
1.  Actualizar `frontend/src/services/api.js` para usar URL dinámica.
2.  Actualizar `frontend/src/store/authStore.js` para usar URL dinámica.
3.  Reemplazar todas las ocurrencias de `http://localhost:8000` hardcodeadas en el resto de los componentes.
4.  Verificar `.env` del root para asegurar que las variables de Vite estén disponibles (Vite requiere prefijo `VITE_`).

## 5. RESTRICCIONES / MEMORIA DE APRENDIZAJE
- **Puerto 8002**: Único puerto válido para el backend de este proyecto.
- **Caddy Proxy**: En producción, Caddy maneja el SSL y redirige `/api/*` a `127.0.0.1:8002`. Por lo tanto, el frontend debe usar rutas relativas en producción.
- **Hardcoding**: Prohibido hardcodear URLs con puerto en archivos `.js/.jsx`.
