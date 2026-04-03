# GIT_SOP - Protocolo de Gestión de Repositorio
**Fecha y Hora:** 2026-04-03 11:45:00
**Estado:** Activo

## Objetivo
Mantener un historial de cambios limpio, descriptivo y asegurar que las versiones en `dev` y `main` sean estables.

## Flujo de Trabajo (Git Flow)
1. **Rama `dev`**: Rama principal de desarrollo. Todos los cambios nuevos deben integrarse aquí primero.
2. **Rama `main`**: Rama de producción (estable).
3. **Commits**: Deben ser atómicos y con mensajes descriptivos en español o inglés siguiendo el formato de Conventional Commits si es posible.

## Procedimiento de Commit
1. **Sincronización**: Antes de committear, hacer `git pull origin dev` para evitar conflictos.
2. **Estado**: Ejecutar `git status` para revisar archivos modificados.
3. **Adición**: `git add .` para incluir cambios (revisar archivos ignorados).
4. **Resguardo de Memoria**: Si el commit resuelve un BUG o agrega una funcionalidad crítica, la Directiva en `docs/` DEBE estar actualizada antes del commit.
5. **Mensaje**: 
   - Formato: `tipo: descripción corta`
   - Ejemplo: `feat: implementación carnet virtual y lógica de elegibilidad`

## Restricciones / Casos Borde
- **¡CUIDADO!**: Nunca hacer commit de archivos `.env` o archivos con credenciales.
- **¡CUIDADO!**: Si hay migraciones de base de datos pendientes (archivos en `migrations/`), asegurarse de que estén incluidas.
- **¡CUIDADO!**: No committear archivos temporales de `scripts/` si son de un solo uso, a menos que sean herramientas deterministas requeridas para el flujo.

## Última Operación
- **Fecha y Hora:** 2026-04-03 11:47:00
- **Tarea**: Commit y Push a rama `dev` (GitHub).
- **Mensaje utilizado**: `feat: carnet virtual, mejoras en finanzas y nuevas directivas de fase 10`
- **Estado**: Éxito (hash 1ed9ba2..df10eb2).
