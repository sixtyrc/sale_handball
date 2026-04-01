# FASE 5 - SOP: EVENTOS, PARTIDOS Y ASISTENCIA
**Fecha:** 2026-04-01  
**Estado:** En curso

## 1. OBJETIVO / CONTEXTO
Desarrollar el módulo interactivo principal para los `PROFESOR` y `ADMIN`. Permite agendar Entrenamientos, Partidos (Amistosos u Oficiales) y Terceros Tiempos, registrar la asistencia nominal de los jugadores, cobrar entradas/aranceles en la cancha (Tercer Tiempo) y convocar jugadores ("Planilla de Juego").

## 2. MODELOS A CREAR (app: `eventos`)

### `Evento`
- **Tipos**: ENTRENAMIENTO | PARTIDO_OFICIAL | AMISTOSO | TERCER_TIEMPO
- Campos: `club` (FK), `categoria` (FK Categoria, null si es general), `titulo`, `fecha_hora_inicio`, `fecha_hora_fin`, `lugar`.
- Condición Partido: `rival` (str), `competencia` (str), `condicion` (LOCAL/VISITANTE/NEUTRAL).

### `Convocatoria`
- Lista de convocados a un partido/evento.
- Campos: `evento` (FK), `jugador` (FK Socio), `confirmado` (bool).
- *Regla*: Solo se puede convocar a jugadores de la `Categoria` del evento que tengan `puede_jugar == True` (Apto Médico + Federación OK).

### `Asistencia`
- Control en tiempo real (PWA). P|A|T (Presente, Ausente, Tarde).
- Campos: `evento` (FK), `jugador` (FK Socio), `estado` (PRESENTE/AUSENTE/TARDE/JUSTIFICADO), `observaciones`.

### `ArancelTercerTiempo` (Integración Finanzas - Fase 2)
- Muchos clubes cobran el 3T en efectivo en el lugar o lo anotan en la cuenta corriente.
- Si el `PROFESOR` marca "Anotar en Cuenta", se genera un `MovimientoFinanciero` tipo TERCER_TIEMPO (Débito) en la `CuentaCorriente` del Socio.

## 3. LOGICA Y ENDPOINTS API
- `GET /api/v1/eventos/` -> Lista filtrada por `club` y `categoria`.
- `POST /api/v1/eventos/{id}/convocar/` -> Espera una lista de `socios_id`. Rechaza si alguno no tiene `puede_jugar`.
- `POST /api/v1/eventos/{id}/asistencia/` -> Envío masivo de asistencia (Array de `{socio_id, estado}`).
- `POST /api/v1/eventos/{id}/cobrar-3t/` -> Crea movimientos financieros atómicos para los asistentes.

## 4. RESTRICCIONES Y CASOS BORDE (MEMORIA APRENDIZAJE)
- **Roles:** El `PROFESOR` solo puede crear eventos / tomar asistencia de sus categorías asignadas. Por ahora, si es `PROFESOR` dejamos que opere sobre las categorías del club.
- **Validación Estricta:** El endpoint de convocatoria DEBE interceptar y devolver Array de errores con los jugadores "No Habilitados" para partidos oficiales, bloqueando el guardado.

---
*Fin del documento SOP Fase 5.*
