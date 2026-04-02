# FIX: Elegibilidad y Documentación Deportiva — SOP
**Fecha:** 2026-04-02 11:52 (GMT-3)  
**Estado:** 🔴 PENDIENTE  
**Prioridad:** CRÍTICA (bloquea la operativa deportiva)

---

## 🎯 Objetivo
Corregir la lógica de elegibilidad de jugadores y el sistema de documentación para que:
1. El apto médico se detecte correctamente tras cargarlo.
2. El seguro deportivo tenga su propio flujo de registro + generación de comprobante PDF.
3. Cada tipo de documento sea independiente (no un combo genérico).

---

## 🐛 Bugs Detectados

### Bug 1: Nombre de tipo inconsistente entre archivos
| Archivo | Valor usado | Valor correcto (modelo) |
|---|---|---|
| `deportes/models.py` (TIPO_DOC_CHOICES) | `APTO_FISICO` | ✅ Es la fuente de verdad |
| `deportes/models.py` (apto_medico_vigente) | `APTO_FISICO` | ✅ Correcto |
| `deportes/eligibility.py` línea 57 | `APTO_MEDICO` ❌ | Debe ser `APTO_FISICO` |
| Frontend (CargarDocumentoModal) | `APTO_FISICO` | ✅ Ya corregido |

**Impacto:** `eligibility.py` no encuentra nunca el apto porque busca un tipo que no existe.

### Bug 2: El apto se guarda como PENDIENTE pero se busca como APROBADO
- `models.py` línea 70: `estado_validacion='APROBADO'`
- Pero al crear el documento, se guarda como `'PENDIENTE'` (default del modelo).
- **Resultado:** Aunque cargues el apto, la tarjeta sigue diciendo "falta cargar".

**Decisión a tomar:**
- **Opción A (Recomendada):** Al cargar un apto médico, auto-aprobarlo (el admin es quien lo carga, no necesita validación extra).
- **Opción B:** Mantener el workflow de aprobación pero agregar un botón "Aprobar" visible.

### Bug 3: No hay flujo separado para Seguro Deportivo
- El seguro es un **PAGO** (no solo un documento).
- Debe generar un **comprobante en PDF**.
- Es independiente de la cuota mensual.
- Actualmente solo se chequea en `eligibility.py` si existe un `MovimientoFinanciero` de tipo `SEGURO`.

---

## 📋 Plan de Corrección (Orden de ejecución)

### Paso 1: Unificar nombres de tipos
**Archivo:** `backend/deportes/eligibility.py`
- Línea 57: Cambiar `tipo='APTO_MEDICO'` → `tipo='APTO_FISICO'`

### Paso 2: Auto-aprobar documentos cargados por Admin
**Archivo:** `backend/deportes/views.py`
- En `DocumentoDigitalViewSet.perform_create()`:
  - Si el usuario que sube tiene rol `ADMIN` o `DIRIGENTE`, setear `estado_validacion='APROBADO'` automáticamente.
  - Si es otro rol, dejarlo en `PENDIENTE`.

### Paso 3: Simplificar la property apto_medico_vigente
**Archivo:** `backend/deportes/models.py`
- Cambiar la property `apto_medico_vigente` para que:
  - NO exija `estado_validacion='APROBADO'` (o que acepte también PENDIENTE si fue subido por admin).
  - Alternativa: solo chequear que exista y no esté vencido.

### Paso 4: Separar el Seguro Deportivo (Fase 2)
**Concepto:** El seguro deportivo NO es un "documento" sino un **concepto cobrable** con:
- Monto fijo por temporada.
- Registro de pago (vinculado a `MovimientoFinanciero`).
- Generación de comprobante PDF al registrar el pago.

**Archivos a modificar:**
- `admin_club/models.py`: Asegurar que `ConceptoCobrable` tenga tipo `SEGURO`.
- `finanzas/`: Crear endpoint o reutilizar el existente para registrar pago de seguro.
- `frontend/`: Crear componente `SeguroDeportivoCard` separado del modal de documentos.
- `deportes/eligibility.py`: Ya chequea pagos de seguro (líneas 38-52), solo falta que el frontend permita registrarlos.

**⚠️ NOTA:** El Paso 4 es más complejo y se puede implementar después de los pasos 1-3.

---

## 🚨 Restricciones / Casos Borde
- **NUNCA** usar `APTO_MEDICO` como valor de tipo. El valor correcto es `APTO_FISICO`.
- El campo `archivo` en `DocumentoDigital` es **opcional** (migración 0004 ya aplicada).
- Solo archivos PNG, JPG o PDF están permitidos en el frontend.
- PostgreSQL es el único motor de base de datos. **NUNCA usar SQLite.**

---

## ✅ Criterio de Aceptación
1. Al cargar un apto médico con fecha de vencimiento futura → la tarjeta del jugador debe mostrar "Jugador Habilitado" (verde).
2. El seguro deportivo debe poder registrarse como pago independiente.
3. Al registrar el pago del seguro, se debe generar un comprobante PDF descargable.
