# FASE 10 - SOP: SISTEMA DE NOTIFICACIONES PREMIUM (TOASTS)
**Fecha:** 2026-04-03 (Actualizado 14:26)
**Estado:** En Proceso de Migración

## 1. OBJETIVO / CONTEXTO
Sustituir los avisos nativos del navegador (`alert()`, `confirm()`) por un sistema de notificaciones elegante, animado y no intrusivo (Toasts). Esto eleva la percepción de calidad del software y mejora la experiencia de usuario (UX) al no bloquear el hilo principal de interacción.

## 2. ARQUITECTURA DEL SISTEMA
- **Store Central (`frontend/src/store/uiStore.js`)**: Basado en Zustand. Gestiona un array de notificaciones con ID único.
- **Hook `addToast`**: Método principal para disparar avisos desde cualquier componente.
- **Contenedor Global (`frontend/src/components/common/ToastContainer.jsx`)**: Ubicado en el `MainLayout`, escucha el store y renderiza las notificaciones con `AnimatePresence`.
- **Librería de Animación**: `framer-motion` para transiciones suaves (entrada desde derecha, salida hacia derecha).

## 3. ESTÉTICA Y TIPOS DE NOTIFICACIÓN
- **SUCCESS (Verde/Emerald)**: Para acciones confirmadas (Socio creado, Pago registrado). Icono: `CheckCircle2`.
- **ERROR (Rojo/Rose)**: Para fallos críticos o de API. Icono: `XCircle`.
- **INFO (Azul/Sky)**: Para avisos informativos o módulos en desarrollo. Icono: `Info`.
- **WARNING (Ámbar/Orange)**: Para advertencias que requieren atención pero no son errores. Icono: `AlertTriangle`.

**Estilo Visual:** Glassmorphism (fondo oscuro traslúcido, borde sutil, desenfoque de fondo, sombra suave).

## 4. REGLAS DE USO PARA DESARROLLADORES
1. **Importación**: `import { useUIStore } from '../store/uiStore';`
2. **Hook**: `const { addToast } = useUIStore();`
3. **Invocación**:
   ```javascript
   addToast({
     type: 'success', // 'success' | 'error' | 'info' | 'warning'
     title: 'Título Breve',
     message: 'Mensaje descriptivo del resultado.'
   });
   ```
4. **Duración**: El sistema auto-elimina los toasts después de 5-6 segundos (configurado en `ToastContainer`).

## 5. MIGRACIÓN (LISTA DE CONTROL)
- [x] `ConfigPage.jsx`: Migrado.
- [x] `DeportesPage.jsx`: Migrado.
- [x] `LocalesPage.jsx`: Migrado.
- [x] `EventosPage.jsx`: Migrado.
- [x] `SocioFormModal.jsx`: Migrado.
- [x] `SocioEditModal.jsx`: Migrado.
- [ ] `CobroModal.jsx`: **EN PROCESO**.
- [ ] `GeneradorCuotasModal.jsx`: Pendiente.
- [ ] `VincularSocioModal.jsx`: Pendiente.

## 6. RESTRICCIONES Y CASOS BORDE
- **No duplicar Toasts**: Evitar disparar Toasts dentro de bucles sin control.
- **Accesibilidad**: Mantener contraste suficiente en los textos sobre los fondos traslúcidos.
- **Contexto Global**: El `ToastContainer` DEBE estar en el layout principal para asegurar que las notificaciones no se corten por el `overflow: hidden` de un modal o contenedor específico.

---
*Documento creado el 03/04/2026 14:26 - Estandarización de UX Premium.*
