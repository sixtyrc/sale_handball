# FASE 3 - SOP: MÓDULO DEPORTIVO Y PERFILES
**Fecha:** 2026-04-01  
**Estado:** En curso

## 1. OBJETIVO / CONTEXTO
Construir el módulo deportivo del club: categorías de handball, perfil técnico del jugador (posición, mano hábil, etc.), ficha médica/documentación digital y habilitación federativa para partidos.

## 2. MODELOS A CREAR (app: `deportes`)

### `Categoria`
- Por Club (Multi-tenant). Ej: Sub-8, Sub-10, Sub-12... Primera División.
- Campos: `nombre`, `descripcion`, `genero` (MASCULINO/FEMENINO/MIXTO), `club`.

### `PerfilDeportivo` (1:1 con Socio)
- Posición principal y secundaria: ARQUERO | EXTREMO_IZQ | EXTREMO_DER | LATERAL_IZQ | LATERAL_DER | CENTRAL | PIVOT
- `mano_habil`: DERECHA | IZQUIERDA | AMBAS
- `altura_cm`, `peso_kg`, `categoria` (FK a Categoria)
- `nro_camiseta`, `habilitado_federacion` (bool), `nro_federacion`

### `DocumentoDigital` (FKM con Socio)
- Tipos: DNI | AUTORIZACION_TUTOR | CONSENTIMIENTO_IMAGEN | APTO_FISICO | FICHA_FEDERATIVA
- `archivo` (FileField), `fecha_vencimiento`, `estado_validacion` (PENDIENTE / APROBADO / VENCIDO)

## 3. REGLAS DE NEGOCIO
- Un jugador está **HABILITADO** para jugar si: `habilitado_federacion=True` AND tiene `APTO_FISICO` vigente.
- Alerta visual: 🔴 Vencido (doc expirada), 🟡 Por vencer (< 30 días), 🟢 Vigente.
- Multi-tenant: categorías y perfiles siempre filtrados por `club` del usuario autenticado.

## 4. RESTRICCIONES Y CASOS BORDE (MEMORIA DE APRENDIZAJE)
- **FileField en desarrollo local**: Configurar `MEDIA_ROOT` y `MEDIA_URL` en settings para que los archivos se guarden en `backend/media/`.
- `DocumentoDigital` con tipo `APTO_FISICO` es el único que controla la habilitación para partidos.
- **Stats Globales**: Se implementó `StatsGlobalesModal.jsx` para mostrar métricas agregadas del plantel (jugadores habilitados vs deuda/en riesgo, distribución M/F/X). Este módulo elimina al antiguo botón "en desarrollo" y consolida un vistazo íntegro de la salud deportiva e institucional.
- **CREDENTIALS LOGGING**: Cualquier usuario de prueba creado debe estar en `user_pass/user_pass.md`.

---
*Fin del documento SOP Fase 3.*
