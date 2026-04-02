# Directiva de Arquitectura Frontend y Resiliencia
*Fecha de última actualización: 01 de Abril de 2026 - 19:54 hs*

## Objetivo Operativo
Mantener una arquitectura frontend robusta, ininterrumpible y fuertemente tipada en lógica (Vite + React + Tailwind), previniendo los bloqueos conocidos ("pantallas blancas") durante la navegación y el renderizado, garantizando la persistencia del entorno de la PWA.

## 1. Patrón Anti-Crashes (Error Boundaries)
*Contexto:* Si un módulo crashea por un defecto de renderizado o importación errónea (como ocurrió con la librería `lucide-react`), previene el "Error de Pantalla Blanca" (caída total de React).
* **Obligatoriedad:** Toda la aplicación, y progresivamente los sub-módulos críticos (como el POS de Cantina), DEBEN estar envueltos en un componente `<ErrorBoundary>`.
* **Fallback:** Si hay un error, el Error Boundary DEBE capturarlo, enviar el error a un servicio de telemetría (o console.error) y mostrar una interfaz de gracia con un botón para reiniciar (`window.location.reload()`).

## 2. Patrón de Ruteo y Carga (Code Splitting)
*Contexto:* Minimizar la carga inicial y reducir el impacto radial de un fallo.
* **Obligatoriedad:** El archivo principal de ruteo (`App.jsx`) DEBE emplear `React.lazy()` y `<Suspense>` para todas las rutas que representan las Páginas principales (`SociosPage`, `LocalesPage`, etc.).
* **Regla:** Ningún módulo de página pesada debe ser cargado de manera síncrona en el root del árbol de componentes.

## 3. Trampas y Restricciones Conocidas (Casos Borde)
* **Crash `lucide-react`:** Evitar importaciones nombradas en masa de la librería de iconos si esos íconos no existen. Verificar meticulosamente cada ícono importado.
* **Pérdida de Sesión Local (Backend Down):** Si Axios (en `api.js`) recibe un ERR_CONNECTION_REFUSED, la UI debe retener el estado visible temporalmente y notificar visualmente en el interceptor, sin forzar redirecciones erráticas que generen loops de red.
## 4. Estilos y Compilación PostCSS
*Contexto:* Si la interfaz carga clases HTML correctamente pero todo se ve en blanco y negro, aplastado o sin CSS, probablemente no se procesó Tailwind.
* **Solución de la Pifia Visual:** `postcss.config.js` DEBE existir a nivel de raíz del frontend. Si este archivo se pierde, Vite asume que no hay postprocesamiento CSS, ignorando por completo todas las utilidades de Tailwind.
* **Peligro Boilerplate:** Remover siempre la regla `place-items: center` del estilo nativo `body` en `index.css` que inserta Vite por defecto, porque aplastará por completo todo el DOM de Tailwind hacia el centro perdiendo el anclaje `top-left`.

---
*Fin de la política de resiliencia del frontend. Cualquier módulo nuevo debe apegarse a estas medidas.*

## Registro de Ejecución (Logs)
- **01/04/2026 19:53 hs:** Creación de SOP.
- **01/04/2026 19:54 hs:** (FASE 2) Implementación exitosa de `ErrorBoundary` en `main.jsx` para prevenir crashes globales.
- **01/04/2026 19:55 hs:** (FASE 3) Implementación de _Code Splitting_ (Lazy Loading y Suspense) en `App.jsx` para independizar los módulos en chunks separados y acelerar el tiempo de carga.
- **01/04/2026 19:56 hs:** (FASE 4) Revisión de sanidad de todos los módulos (`Socios`, `Locales`, `Finanzas`, `Config`, `Deportes`) completada sin errores de dependencias perdidas.
- **01/04/2026 19:57 hs:** (FASE 5) Verificación de Frontend. Vite dev server estable y sirviendo componentes lazy load.
- **01/04/2026 19:59 hs:** (FASE 6) Resolución de "Error de Espanto visual" (CSS Roto). Se detectó que faltaba compilar Tailwind por la carencia repentina de `postcss.config.js`. Se limpió el layout default del template de Vite en `index.css` que comprimía los divs en el centro horizontal. Re-evaluación del rendering completada.
- **01/04/2026 20:07 hs:** (FASE 7) Reparación de flujo de Autenticación. Se detectó que `LoginPage.jsx` carecía de lógica de redirección (`useNavigate`) tras éxito. Se inició el backend Django (puerto 8000) y se verificó el Dashboard con datos reales (stats). Conexión Front-Back restablecida y verificada visualmente.
- **01/04/2026 20:09 hs:** (FASE 8) Branding y Debugging de Configuración. Integración del escudo oficial en el login con efecto de brillo. Se reparó el crash `TypeError: Illegal constructor` en `ConfigPage.jsx` causado por la falta del import `Lock` de `lucide-react`. La página de Configuración ya es funcional y premium.
- **01/04/2026 20:13 hs:** (FASE 9) Arquitectura Dinámica y Multi-tenant. Se eliminó la palabra "SaaS" de toda la interfaz. El escudo y el nombre del club en el Footer y Login ahora son **100% dinámicos**, tomándose de la configuración del backend (`ClubConfig`). Se añadió el campo `subdominio` al modelo `Club` para soportar la identificación pública de branding antes del login.
- **01/04/2026 20:21 hs:** (FASE 10) Auditoría de Interactividad y Plan de Reconstrucción. Se detectaron múltiples "placeholders" (botones sin lógica) y errores de referencia (`Trophy` no definido). Se elaboró un Plan Maestro.
- **01/04/2026 20:44 hs:** (FASE 11) Implementación CRUDs y Reactividad Completada. 
    *   **Locales:** Se importó el ícono `Trophy` reparando el crash.
    *   **Eventos:** Se creó `EventosPage` y se anexó al Router para evitar redirecciones al login.
    *   **Modales:** Se generó `Modal.jsx` reutilizable como base.
    *   **Socios:** Creación de `SocioFormModal.jsx` y vinculación a POST `/socios/`.
    *   **Finanzas:** Implementación de `CobroModal.jsx` y `GeneradorCuotasModal.jsx` para ingreso/egreso de dinero en Cuentas Corrientes. Se repararon errores de JSX (duplicidad de tags).
    *   **Deportes:** Implementación de `CategoriaFormModal.jsx` y vinculación al botón "Nueva Categoría", reparando imports borrados accidentalmente (`Plus`, `Users`, `AthleteCard`, `Activity`).
    *   **Configuración:** Activación del botón "Guardar Cambios" con un manejador visual (`handleSave`).
    *   **Resultado:** Todos los módulos principales dejaron de ser maquetas funcionales visuales y se tornaron operativas contra la API.

---

## 🛑 Restricciones / Casos Borde (Knowledge Base)

**Nota: No hacer migraciones con concatenadores complejos en Windows Powershell (`&&`), porque causa el error de base de datos de schema no actualizado (`1: SELECT "core_club"."subdominio" ... no existe`). En su lugar, hacer la migración paso por paso o usar separadores compatibles (`;`).**

**Nota: No dejar `fields = '__all__'` en los ModelSerializers si existen campos de auto-asignación por viewsets (como `club=self.request.user.club`), porque causa el error `400 Bad Request` al recibir POST desde el frontend que ignora ese UUID. En su lugar, declarar rigurosamente `read_only_fields = ['club']` en el serializer.**

**Nota: No enviar datos irrelevantes o Enums truncados (`M`) en formularios frontend hacia DRF (Django REST Framework), porque causa el error `400 Bad Request` por validación estricta de Modelos. En su lugar, mapear exactamente el frontend a los nombres completos del esquema de base de datos (`MASCULINO`, `FEMENINO`, `MIXTO`) y omitir inputs que no existan en el Serializer (ej: `edad_minima`).**
