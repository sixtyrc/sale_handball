# FASE 2 - SOP: CUENTA CORRIENTE Y SISTEMA FINANCIERO
**Fecha:** 2026-04-03 (Actualizado 11:10)
**Estado:** Actualizado / Estable

## 1. OBJETIVO / CONTEXTO
Implementar el sistema financiero central: Cuenta Corriente inmutable por socio, movimientos con signo (débito/crédito), generación masiva de cuotas mensuales, registro de pagos y descuentos escalonados por grupo familiar.

## 2. REGLAS CRÍTICAS DE NEGOCIO (INAMOVIBLES)
- **NUNCA DELETE**: Los movimientos financieros son INMUTABLES. Toda corrección se hace con un movimiento de AJUSTE (compensación).
- **SALDO CALCULADO**: El saldo siempre se obtiene como `SUM(monto)` de los movimientos. Nunca guardar un campo `saldo` mutable.
- **SIGNOS**: Débito = negativo (deuda). Crédito = positivo (pago/a favor).
- **TIPOS VÁLIDOS**: `CUOTA | PAGO | MORA | ARBITRAJE | TERCER_TIEMPO | SEGURO | AJUSTE | BECA | SALDO_INICIAL`
- **ATOMICIDAD**: Toda operación múltiple DEBE usar `transaction.atomic()`.
- **ANTI-DUPLICADO CUOTAS**: El sistema controla que no se genere más de una CUOTA por socio en el mismo mes/año, usando `fecha__year` y `fecha__month`. Los socios ya cubiertos se omiten y se informan en la respuesta.

## 3. MODELOS
- **`CuentaCorriente`**: 1:1 con Socio. Se crea automáticamente (Signal). No tiene campo `saldo`.
- **`MovimientoFinanciero`**: Registro individual inmutable.

## 4. DESCUENTO POR GRUPO FAMILIAR (GrupoFamiliar — ABR-2026)
- **Modelo**: `GrupoFamiliar` en `core/models.py`. FK en `Socio.grupo_familiar`.
- **Descuento**: Calculado en `GrupoFamiliar.descuento_porcentaje`, que delega en `ClubConfig` (configurable por club).
- **Tabla de Defaults**: 2 miembros=15%, 3 miembros=25%, 4+ miembros=30%.
- **Aplicación**: Al generar cuotas masivas, se aplica `max(beca_individual, descuento_familiar)`. No se acumulan (para no generar crédito negativo accidental).
- **Tipo de movimiento generado**: `BECA` con descripción que indica si es beca o descuento familiar.
- **Endpoint**: `GET/POST /api/v1/grupos-familiares/` (DRF ViewSet, multi-tenant).
- **Migración aplicada**: `core/0008_grupo_familiar_y_descuentos_club.py` + `admin_club/0004_grupo_familiar_y_descuentos_club.py`

## 5. ENDPOINTS DE LA API
- `GET /api/v1/finanzas/cuentas/` → Lista optimizada con saldo calculado (incluye nro_socio).
- `GET /api/v1/finanzas/socios/{id}/cuenta/` → Detalle de cuenta individual.
- `POST /api/v1/finanzas/movimientos/` → Crear movimiento (ADMIN/DIRIGENTE).
- `POST /api/v1/finanzas/cuotas/generar/` → Cuotas masivas con anti-duplicado y descuento familiar.
- `POST /api/v1/finanzas/saldo-inicial/` → Migración de deuda histórica.
- `GET /api/v1/finanzas/movimientos/{id}/pdf/` → Recibo PDF duplicado.
- `GET/POST /api/v1/grupos-familiares/` → CRUD de grupos familiares.

## 6. FEATURES UX (ABR-2026)
- **Filtrado por DNI**: Botón "Cuenta" en ficha de socio navega a `/finanzas?dni=XXXXXXXX`. FinanzasPage lee el param y auto-filtra.
- **Limpiar Filtro**: Botón X dentro del input borra filtro y limpia la URL.
- **Exportar Excel (CSV)**: Genera CSV con título, subtítulo, fecha y datos de filteredCuentas. Separador `;` para compatibilidad con Excel español. BOM UTF-8 incluido.
- **Pantalla de Resultados en GeneradorCuotasModal**: Tras generar, muestra cuántos socios fueron procesados y cuántos omitidos (con lista de nros de socio). No cierra el modal automáticamente para que el admin pueda revisar.
- **Selector de Fecha en Cuotas**: El modal permite seleccionar la fecha del movimiento, lo que permite pre-generar cuotas futuras. El anti-duplicado usa mes+año de esa fecha.

## 7. RESTRICCIONES Y CASOS BORDE (MEMORIA DE APRENDIZAJE)
- **N+1 Queries (¡CRÍTICO!)**: NUNCA iterar desde el frontend llamando a la API por cada socio. Usar `/finanzas/cuentas/` que resuelve todo en una query optimizada.
- **Cobros Especiales**: No registrar un pago de seguro como pago aislado positivo. Registrar cargo + pago en el mismo momento.
- **Nro Recibo PDF**: Se autogenera por `count()` de pagos positivos del tenant, no por secuencia fija.
- **Filtro DNI: Navegación Socios→Finanzas**: Usa `?dni=` en la URL, NO `?socioId=`. La búsqueda es por texto contains en el campo `c.socio.dni.toString()`.
- **Saldo $ 0 = Al Día SIN cuotas generadas**: Si un socio recién fue creado y nadie generó cuotas aún, aparece "AL DÍA $0". Esto es correcto. El sistema no genera deudas hasta que un admin ejecuta "Generar Cuotas".
- **Generación de Cuotas en Mes Futuro**: Es válido y sin problemas. El saldo baja el día de la operación, no en la fecha seleccionada. Sugerencia: la fecha debe reflejar el mes al que corresponde la cuota.
- **GrupoFamiliar único_together ('club', 'nombre')**: Dos clubs pueden tener un grupo llamado "Familia García" sin conflicto.

---
*Documento actualizado al 03/04/2026 11:10 - Sesión: Descuento Familiar + Anti-duplicado Cuotas.*
