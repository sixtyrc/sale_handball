# FASE 7 - SOP: JORNADA LOCAL Y CANTINA ("SOMOS LOCALES")
**Fecha:** 2026-04-01  
**Estado:** Iniciando

## 1. OBJETIVO / CONTEXTO
Sistematizar la gestión de los días en que el club es local. Reemplazar los Excels y anotaciones manuales por un módulo integrado que permita:
- Asignar tareas a padres/colaboradores.
- Controlar donaciones (ingreso sin costo).
- Gestionar una caja comercial separada del club para el evento particular.

## 2. MODELOS A CREAR (app: `jornada_local`)

### `Jornada`
- Evento raíz. Vinculado a uno o varios `Evento` de tipo PARTIDO.
- Campos: `club` (FK), `titulo`, `fecha`, `estado` (PLANEADA/EN_CURSO/FINALIZADA).

### `Voluntariado`
- Asignación de gente a tareas.
- Campos: `jornada` (FK), `persona` (FK Socio/User), `tarea` (ENTRADAS/CANTINA/MESA/LIMPIEZA), `turno` (HORA_INICIO, HORA_FIN).

### `DonacionCantina`
- Registro de lo que traen las familias para vender.
- Campos: `jornada` (FK), `donante` (FK Socio), `producto` (str, ej: "Docena Empanadas"), `cantidad`, `valorizado_estimado` (opcional).

### `VentaJornada`
- Registro simplificado de ventas (Entradas y Cantina).
- Campos: `jornada` (FK), `monto`, `tipo` (ENTRADA/BUFFET), `metodo` (EFECTIVO/QR).

### `CajaJornada`
- Balance rápido del evento.
- Campos: `ingresos_cantina`, `ingresos_entradas`, `egresos_arbitros`, `egresos_varios`.
- *Regla*: Al finalizar, el sobrante neto puede transferirse a la Caja General del club.

## 3. LÓGICA DE NEGOCIO
- **Muro de Ayuda**: Un endpoint que sume las `DonacionesCantina` y `Voluntariado` por socio/familia para mostrar en el Dashboard quiénes son los que más apoyan.
- **Acceso Público**: Link para que los padres vean las tareas pendientes y puedan "anotarse" como voluntarios desde la PWA.

## 4. RESTRICCIONES Y CASOS BORDE (MEMORIA APRENDIZAJE)
- **Error Frontend vs Backend**: El componente `JornadaFormModal.jsx` enviaba el campo `descripcion`, pero el modelo `Jornada` en el backend usa el campo `observaciones`. Esto causaba un error 400 (Bad Request). **Solución**: Se homogeneizó usar `observaciones` en toda la app de Locales. Siempre verificar los nombres de los campos en el backend antes de armar los modales.
- **Tercer Tiempo vs Cantina**: El 3T es para los jugadores (débito en Cta Cta), la Cantina es para el público (venta contado). No confundirlos.
- **Cierre de Caja**: La `CajaJornada` es efímera. Debe morir con el evento y el saldo final inyectarse en la contabilidad general del club con el tipo `EVENTO_LOCAL`.
- **Ranking Familias**: Agregado el endpoint `/locales/jornadas/ranking/` usando `aggregate` y `annotate` en Django para sumar puntos de Voluntariados (10pts) y Donaciones / Compras en cantina (1pti por $1000).

---
*Fin del documento SOP Fase 7.*
