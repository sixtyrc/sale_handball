# FASE 6 - SOP: TESORERÍA, PAGOS Y MERCHANDISING
**Fecha:** 2026-04-01  
**Estado:** En curso

## 1. OBJETIVO / CONTEXTO
Convertir el sistema en una herramienta de recaudación eficiente. Implementar el módulo de Caja Diaria, integración con Mercado Pago (Links y QR), y una tienda simple de Merchandising/Cantina base para el día a día del club.

## 2. MODELOS A CREAR (app: `tesoreria`)

### `CajaDiaria`
- Control de dinero en efectivo y digital.
- Campos: `club` (FK), `usuario` (FK, quien abre/cierra), `monto_apertura`, `monto_cierre`, `fecha`, `estado` (ABIERTA/CERRADA).

### `PagoRecibido`
- Vínculo entre un Socio, un Pago y la Caja.
- Campos: `caja` (FK), `socio` (FK), `monto`, `metodo` (EFECTIVO/TRANSFERENCIA/MP_QR/MP_LINK), `comprobante_img` (ImageField).

### `ProductoMerchandising` (Tienda/Cantina base)
- Stock de remeras del club, shorts, pelotas, etc.
- Campos: `nombre`, `precio`, `stock_actual`, `categoria` (INDUMENTARIA/ELEMENTO/BEBIDA).

## 3. INTEGRACIÓN MERCADO PAGO (100% FREE API)
- El sistema generará un **QR Dinámico** o un **Link de Pago** enviando el `client_id` y `client_secret` de las credenciales cargadas en `.env`.
- Cuando el socio paga, se dispara un Webhook (si es posible) o se registra manualmente por el admin validando el comprobante.

## 4. REGLAS DE NEGOCIO
- Cada `PagoRecibido` impacta automáticamente como un movimiento positivo (CRÉDITO) en la `CuentaCorriente` del Socio.
- La **Mora** se calcula en tiempo real: Si un socio tiene un saldo negativo equivalente a > 2 cuotas activas, se marca con el flag `moroso=True`.

## 5. RESTRICCIONES Y CASOS BORDE (MEMORIA APRENDIZAJE)
- **Atrocidad de Caja**: No se puede registrar un pago si no hay una `CajaDiaria` abierta para ese Club.
- **QR Local**: Usar librería `qrcode` para generar la imagen del QR y permitir que el administrativo lo ponga en el mostrador del club.

---
*Fin del documento SOP Fase 6.*
