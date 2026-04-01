# FASE 4 - SOP: ADMINISTRACIÓN Y CONFIGURACIÓN EXTENDIDA
**Fecha:** 2026-04-01  
**Estado:** En curso

## 1. OBJETIVO / CONTEXTO
Desarrollar la capa de configuración de cada club (Multi-tenant). Esto incluye el Setup Dinámico del Branding (logotipo, colores), las políticas de cobranza (% mora, día de vencimiento) y el fundamental sistema de Temporadas y Conceptos Cobrables (Aranceles, Seguro, Arbitraje versionado por año).

## 2. MODELOS A CREAR (app: `admin_club`)

### `ClubConfig` (1:1 con Club del core)
- **Branding**: `logo` (ImageField), `color_primario` (HexCode, default #2563eb), `color_secundario`.
- **Reglas Financieras**: `dia_vencimiento_cuota` (1 al 28), `porcentaje_mora` (Decimal), `dias_gracia` (int).

### `Temporada`
- Definición de ciclos lectivos/deportivos (Ej. 2026, Apertura 2026).
- Campos: `club` (FK), `nombre`, `fecha_inicio`, `fecha_fin`, `activa` (bool).
- *Regla*: Solo puede haber una Temporada `activa=True` por Club a la vez.

### `ConceptoCobrable`
- Valores de distintos conceptos financieros asociados a una Temporada. Permite versionar precios sin pisar el pasado.
- Campos: `temporada` (FK), `tipo` (CUOTA / SEGURO / FEDERACION / ARBITRAJE), `monto` (Decimal).

## 3. LÓGICA DE NEGOCIO Y API
- **Endpoint GET/PUT `/api/v1/admin-club/config/`**: Devuelve/Actualiza la config del club del usuario autenticado. (Solo ADMINs).
- **Public Branding Endpoint**: Un endpoint PÚBLICO (`/api/v1/admin-club/branding/{club_id}/`) que devuelva SOLO el logo y color primario, usado para pintar la pantalla de Login antes de que el usuario inicie sesión.
- **Validación Temporada Activa**: Si se crea/modifica una Temporada a `activa=True`, todas las demás de ese club pasan a `activa=False` automáticamente.

## 4. RESTRICCIONES Y CASOS BORDE (MEMORIA DE APRENDIZAJE)
- **Image Uploads**: Asegurar instalar `Pillow` en virtualenv para el campo `ImageField`.
- El endpoint público de branding es CRÍTICO para PWA multi-tenant. Si el usuario entra a `handball.com/salesianos`, el Front lee el `club_id` y llama a esta API sin token.

---
*Fin del documento SOP Fase 4.*
