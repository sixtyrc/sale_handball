# SOP Fase 9: PWA, Instalabilidad y Pulido Native-Feel

**Objetivo:** Transformar la aplicación web en una Progressive Web App (PWA) de alto rendimiento, garantizando que el sistema sea instalable en dispositivos móviles con una experiencia de uso nativa (splash screens, íconos, caché offline).

---

## 📅 Protocolo de Operación

### 1. Configuración del Manifest (Identidad del Club)
- Cada club debe tener su propio icono (maskable y rounded) definido en el manifest.
- El `theme_color` debe coincidir con el branding configurado en la Fase 4.
- `display: standalone` obligatorio para ocultar la barra del navegador.

### 2. Estrategia de Cache (Service Worker)
- **Precaching**: Archivos JS y CSS vitales para que la aplicación cargue instantáneamente.
- **Runtime Caching**: Almacenar en caché las últimas respuestas de API (Socio, Movimientos, Próximos Eventos) para lectura sin internet.

### 3. Prompt de Instalación (User Retention)
- No ser invasivo. Mostrar el prompt de "Añadir a pantalla de inicio" tras la primera interacción exitosa del usuario o tras el login.

### 4. Splash Screens (iOS y Android)
- Generar imágenes específicas para cubrir todas las resoluciones de pantalla, asegurando una transición fluida al abrir la app.

---

## 🛠️ Lógica de Implementación (Frontend)

### A. Vite Config
```javascript
import { VitePWA } from 'vite-plugin-pwa'
// ...
plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
        // config del club
    }
  })
]
```

### B. Pull to Refresh & Notch Support
- Usar variables CSS para `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`.
- Garantizar que los elementos del footer no queden debajo de la barra de navegación del iPhone.

---

## 🎨 Guía de UX 101% Perfecta (Mobile)

- **Touch Targets**: Botones con área de impacto ≥ 44px.
- **Scroll Elástico**: Habilitar el scroll inercial nativo para que se sienta fluido.
- **Transiciones de Ruta**: Usar micro-fade entre pantallas para suavizar el cambio.

---

---

## 💡 Aprendizajes y Actualizaciones (2026-04-03)

### 🔴 Problema Detectado: PWA no se activaba en desarrollo
- **Causa**: Vite PWA tiene el Service Worker desactivado por defecto en modo `dev` para evitar colisiones de caché durante la programación.
- **Solución**: Se añadió `devOptions: { enabled: true, type: 'module' }` en `vite.config.js`. Esto permite probar la instalación (A2HS) en localhost:127.0.0.1:3051.

### 🖼️ Problema Detectado: Iconos genéricos en la instalación
- **Causa**: El manifest usaba archivos estáticos `pwa-192x192.png` que no reflejaban el branding dinámico del club.
- **Solución**: Para este ecosistema SaaS, se implementó un paso de sincronización donde el logo del club (ej. `logo_club.png`) se copia a `public/logo_pwa.png` y se vincula en el `manifest`.
- **Nota**: El `short_name` del manifest debe ser conciso (ej. "Salesianos") para evitar que Android/iOS lo corten en el escritorio.

---

*Fecha última edición: 2026-04-03 11:55:00 – Documentado por Antigravity*
