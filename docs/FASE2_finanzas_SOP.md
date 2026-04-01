# FASE 2 - SOP: CUENTA CORRIENTE Y SISTEMA FINANCIERO
**Fecha:** 2026-04-01  
**Estado:** En curso

## 1. OBJETIVO / CONTEXTO
Implementar el sistema financiero central: Cuenta Corriente inmutable por socio, movimientos con signo (débito/crédito), generación masiva de cuotas mensuales y registro de pagos.

## 2. REGLAS CRÍTICAS DE NEGOCIO (INAMOVIBLES)
- **NUNCA DELETE**: Los movimientos financieros son INMUTABLES. Toda corrección se hace con un movimiento de AJUSTE (compensación). El campo `is_active` puede desactivar visualmente pero el registro persiste.
- **SALDO CALCULADO**: El saldo siempre se obtiene como `SUM(monto)` de los movimientos. Nunca guardar un campo `saldo` mutable en la cuenta corriente.
- **SIGNOS**: Débito = negativo (deuda del socio). Crédito = positivo (a favor del socio / pago realizado).
- **TIPOS VÁLIDOS**: `CUOTA | PAGO | MORA | ARBITRAJE | TERCER_TIEMPO | SEGURO | AJUSTE | SALDO_INICIAL`
- **ATOMICIDAD**: Toda operación que genere múltiples movimientos DEBE usar `transaction.atomic()`.

## 3. MODELOS A CREAR (app: `finanzas`)
- **`CuentaCorriente`**: 1:1 con Socio. Se crea automáticamente (Signal). No tiene campo `saldo`.
- **`MovimientoFinanciero`**: Registro individual inmutable. Campos: `cuenta`, `tipo`, `monto` (Decimal 10,2), `descripcion`, `fecha`, `creado_por` (FK User), `referencia_externa`.

## 4. ENDPOINTS DE LA API
- `GET /api/v1/finanzas/socios/{id}/cuenta/` → Saldo calculado + lista de movimientos.
- `POST /api/v1/finanzas/movimientos/` → Crear movimiento (sólo ADMIN).
- `POST /api/v1/finanzas/cuotas/generar/` → Generar cuotas masivas para todos los socios ACTIVOS del club.
- `POST /api/v1/finanzas/saldo-inicial/` → Migración: cargar deuda histórica de un socio.

## 5. RESTRICCIONES Y CASOS BORDE (MEMORIA DE APRENDIZAJE)
- **Mora automática**: No se implementa en Fase 2. Se agrega en Fase 4 al tener `ClubConfig`.
- **Psycopg2 Decimal**: Usar `Decimal` de Python para montos, nunca `float`. Evita errores de redondeo.
- **Signal auto-create**: Si se crea un `Socio` sin triggear el signal (por ejemplo desde shell), la `CuentaCorriente` puede no existir. Validar con `get_or_create`.

---
*Fin del documento SOP Fase 2.*
