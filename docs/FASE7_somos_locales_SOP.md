# FASE 7 - SOP: JORNADA LOCAL Y CANTINA ("SOMOS LOCALES")
**Fecha:** 2026-04-03 | **Estado:** EN PROGRESO (Tarea 4 y 7 Completadas)

## 1. OBJETIVO / CONTEXTO
Sistematizar la gestión de los días en que el club es local. Reemplazar los Excels y anotaciones manuales por un módulo integrado que permita:
- Asignar tareas a padres/colaboradores.
- Controlar donaciones (ingreso sin costo).
- Gestionar una caja comercial separada del club para el evento particular (Cantina / Buffet).
- Registrar gastos sobre la marcha (hielo, viáticos, etc.) y realizar arqueo de caja final.

## 2. MODELOS EXISTENTES (app: `jornada_local`)

### `Jornada` — OK
- FK: `club`, campos: `titulo`, `fecha`, `estado`, `access_pin` (auto 4 dígitos), `slug` (auto UUID hex 12 chars).

### `EgresoJornada` — OK (Añadido 2026-04-03)
- Registra gastos realizados con dinero de la caja durante el día.
- Campos: `monto`, `tipo` (SUMINISTROS, VIATICOS, LIMPIEZA, OTRO), `descripcion`.
- **Nota**: El usuario indicó expresamente que Árbitros NO entran en este flujo manual.

### `Voluntario`, `DonacionCantina`, `VentaJornada`, `CajaJornada` — OK

## 3. ESTADO ACTUAL DE IMPLEMENTACIÓN

| Funcionalidad | Estado |
|---|---|
| Crear Jornada (modal) | OK |
| PIN auto-generado en backend | OK |
| Menu: "Somos Local" (antes era "Locales") | OK |
| WhatsApp / Copiar PIN con feedback | OK |
| POS: totalizador sesión y ventas reales | OK |
| Dashboard Jornada (Administrador) | OK 2026-04-03 |
| Registro de Gastos (Egresos dinámicos) | OK 2026-04-03 |
| Cierre de caja + Arqueo + Exportar Excel | OK 2026-04-03 |
| Rendición a Tesorería Central | OK 2026-04-03 |
| Sistema de Presencias (Check-in nominal) | **PRÓXIMO (Tarea 6)** |

## 4. REGLAS CRITICAS DE ARQUITECTURA

### Multi-Tenant (OBLIGATORIO en CADA endpoint y QuerySet)
- **Backend**: SIEMPRE filtrar `club=self.request.user.club`. Ver `JornadaViewSet.get_queryset()` como referencia.
- **Kiosco (Acceso Publico por PIN)**: Los endpoints `KioscoViewSet` son `AllowAny` pero validan el PIN contra `Jornada.access_pin`. El PIN actua como token de sesion para voluntarios sin cuenta.
- **Nunca omitir el filtro `club=`** en un QuerySet. Error silencioso: devuelve lista vacia o mezcla datos de otros clubes.

### Mobile-First (OBLIGATORIO en toda UI de Locales)
- El POS de Cantina y Entradas lo usan voluntarios desde sus celulares, en el campo.
- Botones: minimo `py-4 px-6`, texto `font-bold`, sin elementos < 44px de alto.
- Layout: `flex-col` por defecto en mobile, `md:flex-row` para desktop.
- El mensaje de WhatsApp se abre en la misma app del celular via `window.open(wa.me/...)`

### PIN y Acceso Publico
- El PIN se auto-genera en `Jornada.save()` (4 digitos aleatorios).
- La URL publica usa `window.location.origin` (NO hardcodear localhost!) para que funcione en produccion.
- PIN no tiene vencimiento en BD, el mensaje de WA dice "vence a las 24hs" como convencion social.

## 5. LOGICA DE NEGOCIO
- **Muro de Ayuda**: Endpoint `/locales/jornadas/ranking/` suma voluntariados (10pts) y donaciones (1pt/$1000).
- **Arqueo de Caja Dinámico**: 
  - `EFECTIVO_ESPERADO = SUM(Ventas_Efectivo) - SUM(Egresos_Dia)`.
  - El administrador carga gastos (hielo, viáticos) a medida que ocurren.
  - Al cerrar, declara el `EFECTIVO_REAL` contado. La diferencia genera el Sobrante/Faltante.
- **Acceso Público**: Via PIN desde `/locales/:slug/pos`.
- **Cierre de Caja**: Al finalizar, la jornada queda bloqueada. No se pueden cargar más ventas ni gastos.

## 6. RESTRICCIONES Y CASOS BORDE (MEMORIA)

- **Gatos de Árbitros**: No se cargan en el log de egresos manuales de la jornada (manejo externo o tesorería directa).
- **Relación Venta/Presencia**: Actualmente las ventas no son nominales (no se sabe qué voluntario la hizo exactamente de forma fuerte), pero el sistema permite que cada voluntario abra su sesión.
- **DNI Duplicado**: Si un voluntario entra y sale varias veces, se deben crear registros de presencia separados (logs) para el ranking de horas.
- **Cierre Definitivo**: Una vez cerrada la jornada, el endpoint de Kiosco devuelve error 400. Prevenir que voluntarios sigan vendiendo post-arqueo.
- **URL hardcodeada (BUG RESUELTO)**: Habia un bug donde el boton de copiar tenia `https://salesianos.app/...` hardcodeado. Reemplazado por `window.location.origin`. NUNCA hardcodear URLs de dominio en el frontend.
- **`branding` desde `useAuthStore`**: Para obtener el nombre del club en el mensaje de WA, usar `useAuthStore().branding?.club_nombre`, NO hardcodearlo. Esto respeta el multi-tenant.
- **Kiosco sin auth**: `KioscoViewSet` tiene `AllowAny`. Intencional. La seguridad es el PIN.
- **`related_name` en EstadisticaJugador**: El campo es `estadisticas_partidos` (NOT `estadisticas`). Confundir esto causa 500 en toda la API de socios.
- **PIN de 4 digitos (BUG RESUELTO)**: PinEntry tenia limite de 6 digitos pero el backend genera 4. El boton "Ingresar" nunca se habilitaba. Corregido a 4.
- **JornadaListSerializer sin access_pin (BUG RESUELTO)**: El serializer de lista no devolia access_pin ni slug, causando PIN=undefined en el mensaje de WhatsApp. Corregido agregando ambos campos.

---

## 7. TAREA 6 (PENDIENTE) — Sistema de Presencias de Voluntarios

### Idea de Negocio
Al ingresar el PIN, el voluntario NO va directo al POS. Primero se registra con Nombre + DNI. El sistema verifica si ese DNI corresponde a un socio o tutor registrado:
- **Si coincide**: vincula la presencia al socio, acumula puntos en el Muro de Ayuda automaticamente.
- **Si no coincide**: crea un registro anonimo con nombre+dni para dejar constancia de quien estuvo.

Esto permite saber QUIEN trabajo en cada jornada, en que horario, y cuanto tiempo.

### Modelo Nuevo: `PresenciaVoluntario` (app: `jornada_local`)
```
id: UUID
jornada: FK Jornada
nombre_declarado: CharField(150)  -- lo que tipea el voluntario
dni_declarado: CharField(20)
socio: FK Socio (null=True, blank=True)  -- si matchea en BD
tarea: CharField (choices: ENTRADAS, CANTINA, MESA, LIMPIEZA, etc.)
hora_entrada: DateTimeField(auto_now_add=True)
hora_salida: DateTimeField(null=True, blank=True)  -- se llena al presionar "Salir"
puntos_acumulados: PositiveIntegerField(default=10)  -- 10 pts por turno
```

### Manejo de Re-ingresos (Sesiones Múltiples)
- **Identificador Único**: Se usará el DNI declarado como clave primaria para agrupar registros de una misma persona en el Ranking, aun si no existe en la base de Socios.
- **Lógica de Fichado**:
  - Cada entrada genera un nuevo registro `AsistenciaVoluntario` con `hora_entrada`.
  - Cada salida marca `hora_salida` en el registro abierto más reciente para ese DNI.
- **Caso "Turno Olvidado"**: Si un voluntario intenta un "Check-in" teniendo uno previo sin "Check-out", el sistema realizará un "Auto-close" del anterior (con advertencia) y abrirá el nuevo para asegurar que el cronómetro de horas sea real.
- **Ranking**: El puntaje total se calcula como `SUM(puntos_asignados)` agrupado por `dni_declarado`.

### Endpoints Nuevos
- `POST /api/v1/locales/kiosco/{slug}/registrar-presencia/` → crea PresenciaVoluntario, devuelve id + socio_encontrado
- `PATCH /api/v1/locales/kiosco/presencia/{id}/cerrar/` → registra hora_salida
- `GET /api/v1/locales/jornadas/{id}/presencias/` → lista de quien estuvo (para el admin)

### Integracion con Muro de Ayuda (Ranking)
El endpoint `/locales/jornadas/ranking/` ya suma `Count('voluntariados') * 10`.
Con el nuevo modelo, el ranking debera sumar tambien `Count('presencias') * 10` cuando socio no es null.

### Reglas Multi-Tenant
- El DNI se busca filtrando `Socio.objects.filter(club=jornada.club, dni=dni_declarado)`.
- NUNCA buscar DNI sin filtro de club (podria matchear socios de otro club).

### Estado: PENDIENTE (Tarea 6, proxima iteracion)

### Estado: PENDIENTE (Tarea 6, proxima iteracion)

---

## 8. TAREA 7 (PENDIENTE) — Dashboard de Cierre, Arqueo e Informes

### Idea de Negocio
Para que el proceso esté completo debe haber una forma de cerrar oficialmente el día, donde se concilian las ventas del sistema con la plata real, se visualizan estadísticas en un dashboard interactivo y se pueden exportar detalles a Excel para auditoría y rendición. 

### Flujo UX (Panel de Administración)
1. **Acceso al Dashboard de Jornada**: Al hacer clic en el nombre de la jornada en `LocalesPage`, acceder a una vista detallada `JornadaDashboard` (exclusiva para administradores).
2. **Estadísticas de la Jornada**:
   - Tarjetas principales: Total Recaudado, Ventas Cantina, Ticket Promedio Entradas, Voluntarios Presentes.
   - Gráfico: Ingresos según método de pago (Efectivo vs. Transferencia).
3. **Cierre de Caja (Arqueo)**:
   - Formulario para declarar Efectivo Real Contado.
   - Desglose de Gastos en el momento (Petición a CajaJornada: Arbitros, viáticos, etc).
   - Cálculo visual: `Ventas Efectivo Sistema - Gastos - Efectivo Declarado = Sobrante/Faltante`.
   - Botón final de *Cerrar Jornada Definitivamente* (cambia estado a 'FINALIZADA' y bloquea el kiosco).
4. **Historial Detallado y Exportación**:
   - Tabla con registro individual de cada VentaJornada.
   - Botón "Exportar a Excel" que genera un CSV/XLSX con todas las transacciones, detallando: Fecha, Tipo, Monto, Método de Pago y Voluntario que procesó la venta.

### Endpoints / Backend a revisar o crear:
- `GET /api/v1/locales/jornadas/{id}/estadisticas/`: Devuelve todo el resumen de totales.
- El endpoint `cerrar_jornada` actual que reciba el arqueo.
- Añadir el exportador CSV/XLSX.

---
*Fin del documento SOP Fase 7 -- Actualizado 2026-04-03 22:11*
---
*Fin del documento SOP Fase 7 -- Actualizado 2026-04-03 21:57*
