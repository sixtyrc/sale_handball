# SOP: REDISEÑO CARNET VIRTUAL PREMIUM
**Fecha:** 2026-04-03
**Estado:** PLANIFICACIÓN

## 1. OBJETIVO
Rediseñar el Carnet Virtual para que cumpla con las expectativas del usuario: formato horizontal (tipo DNI argentino / Tarjeta de crédito), visualización correcta de la marca del club and lógica de validez clara y funcional.

## 2. MODIFICACIONES BACKEND (`backend/core/models.py`)
- **Lógica de Validez:**
    - Si el socio tiene 100% beca -> "VIGENCIA: VITALICIO".
    - Si el último pago fue hace menos de 95 días (margen de gracia) -> "VIGENTE HASTA: [FECHA]".
    - Si no hay pagos o el último fue hace > 95 días -> "RENOVAR VALIDEZ (MOROSO)".
    - Manejar excepciones de importación circular usando `apps.get_model`.

## 3. MODIFICACIONES FRONTEND
### Integración de Datos del Club (`SociosPage.jsx`)
- Al cargar la página, obtener la configuración del club (endpoint `/api/v1/club/`).
- Pasar el objeto `club` al componente `CarnetVirtual`.

### Rediseño Visual (`CarnetVirtual.jsx`)
- **Formato:** Horizontal (relación de aspecto aproximada de tarjeta de crédito 5.5 x 8.5).
- **Elementos:**
    - Lado Izquierdo: Foto del socio, Nro de Socio.
    - Lado Derecho (Superior): Logo del Club y Nombre.
    - Lado Derecho (Centro): Apellidos y Nombres (Destacados).
    - Lado Derecho (Inferior): DNI, Grupo Sanguíneo.
    - Fondo: QR superpuesto sutilmente o en una esquina clara.
    - Indicador de Validez: Badge destacado (Verde para Vigente, Rojo para Vencido/Pendiente).

## 4. APRENDIZAJES Y RESTRICCIONES
- **Circular Imports:** En Django, no importar modelos de otras apps al nivel de módulo si hay dependencias mutuas. Usar importaciones dentro de los métodos o `apps.get_model`.
- **Aesthetics:** Usar gradientes, sombras suaves (shadow-xl), y fuentes modernas. Evitar el "look" básico.
