# FASE 11 - SOP: IMPLEMENTACIÓN DE PLANILLAS Y ESTADÍSTICAS
**Fecha:** 2026-04-03
**Estado:** Completada y Auditada.
**Componente:** Backend (deportes, eventos) / Frontend (deportes)

## 📌 Contexto y Objetivo
Se requiere automatizar la agregación (consolidación) de las estadísticas provenientes de las planillas de los partidos (`EstadisticaJugador`) en el perfil de cada jugador (`PerfilDeportivo`). Esto permite realizar un seguimiento histórico de desempeño y un control estricto disciplinario desde dispositivos móviles.

El componente de carga de datos en vivo desde la cancha ya se encuentra estabilizado (`PlanillaCargaModal.jsx`) y el servicio de cerrado (`/api/v1/eventos/{id}/asociar-planilla/`). Falta la retroalimentación visual hacia el Perfil Deportivo.

## 🛠️ Restricciones y Patrones Estrictos (Trampas Conocidas)
1. **Evitar Sobrecarga de Datos (No duplicar columnas):** No se deben crear campos crudos como `goles_totales` persistentes en `PerfilDeportivo`, ya que un error de asincronía arruinaría la integridad de la base. Se debe utilizar **Django Aggregation/Annotation** (`Sum`, `Count`) consultando dinámicamente la tabla `EstadisticaJugador` al serializar el Perfil.
2. **Consultas N+1:** Al anotar estadísticas en el `PerfilDeportivoViewSet`, es obligatorio utilizar `.annotate()` y `.prefetch_related()` para no detonar la base de datos al listar al equipo completo.
3. **Optimización Mobile-First:** El `AthleteCard.jsx` debe mostrar un "Badge" o un segmento contraido con el resumen (Goles: 45 | Amarillas: 2 | 2MIN: 5) de manera visual y clara, priorizando colores claros para estado saludable y rojo para disciplinarios.

## 📝 Pasos de Implementación
1. **[Back] Modificar capa de datos:** Actualizar `deportes/serializers.py` en `PerfilDeportivoSerializer` para que incluya un campo `stats_acumuladas`. Este campo ejecutará la suma de goles, `penales_convertidos`, cantidad de tarjetas (`amarilla`, `roja`, `azul`) y suspensiones de 2 minutos asociadas al ID del Socio en la tabla `EstadisticaJugador` de la App `eventos`.
2. **[Back] Modificar ViewSet:** Verificar que `PerfilDeportivoViewSet` incluya anotaciones si es requerido para performance.
3. **[Front] Añadir Dashboard/Tarjetas Visuales:** Actualizar la vista o modales de Deporte de un socio, para mostrar estas `stats_acumuladas` al hacer click o directamente en su tarjeta principal (`AthleteCard.jsx` o similar).

## 💡 Manejo de Errores y Auto-Corrección
- Si la agregación en BD causa conflictos cross-app (importación circular entre `deportes` y `eventos`), la función se debe resolver utilizando un `SerializerMethodField` buscando directamente en el registro `EstadisticaJugador.objects.filter(socio=obj.socio)`.

Última Modificación Mantenida por: Antigravity.
