# SOP Fase 8: Gestión Deportiva Pro & Convocatorias Inteligentes

**Objetivo:** Implementar la lógica avanzada de elegibilidad de jugadores para convocatorias, permitiendo que un profesor gestione múltiples categorías/ramas y reciba alertas preventivas (Soft Warnings) sobre el estado financiero y médico de sus atletas.

---

## 📅 Protocolo de Operación

### 1. Sistema de Asignación Multirama
- El administrativo vincula al profesor con categorías específicas (ej: Menores Masculino, Cadetes Masculino, Juveniles Femenino).
- El profesor **solo** tendrá visibilidad de los perfiles deportivos vinculados a esas categorías.

### 2. Elegibilidad Dinámica y "Refuerzos"
- Al crear una convocatoria para un evento (partido), el sistema mostrará por defecto la lista de la categoría del evento.
- Existirá una sección de **"Refuerzos Disponibles"** que mostrará jugadores de la categoría inmediata inferior (ej: para un partido de Cadetes, mostrar jugadores de Menores).

### 3. Alertas Preventivas (Soft Warnings)
Las convocatorias **NO** se bloquean, pero muestran badges informativos:
- 🔴 **Deuda**: Si el socio debe el equivalente a 2 o más cuotas (calculado sobre el saldo de su CuentaCorriente).
- 🔴 **Apto Médico**: Si no existe un `DocumentoDigital` tipo APTO_MEDICO o está vencido.
- 🟡 **Seguro/Ficha**: Si no existe registro de pago del Seguro Anual o Ficha Federativa en la Temporada Activa.

---

## 🛠️ Lógica de Implementación (Backend)

### A. Servicio de Elegibilidad (`deportes/eligibility.py`)
Función `check_health(perfil_deportivo_id)` que retorne:
```json
{
  "habilitado": true,
  "warnings": [
    {"tipo": "MOROSIDAD", "mensaje": "Debe 3 cuotas ($6000)", "severidad": "CRITICAL"},
    {"tipo": "APTO_MEDICO", "mensaje": "Vencido hace 15 días", "severidad": "CRITICAL"}
  ]
}
```

### B. Filtro Multirama en API
Sobrescribir `get_queryset` del `PerfilDeportivoViewSet` para usar `AsignacionProfe`:
```python
def get_queryset(self):
    if self.request.user.role == 'PROFESOR':
        asignadas = self.request.user.asignaciones.values_list('categoria_id', flat=True)
        return PerfilDeportivo.objects.filter(categoria_id__in=asignadas)
```

---

## 🎨 Guía de UI/UX (Frontend)

- **Avatar intermitente**: El avatar del jugador tendrá un borde rojo intermitente si tiene warnings críticos.
- **Acceso Directo**: El profesor podrá registrar la asistencia y las estadísticas del partido en ≤ 3 toques desde su Home.
- **Copyright de Marca**: Mantener el pie con "Desarrollado por ctsoft.com.ar" en todas las planillas de convocatoria generadas (PDF).

---

*Fecha: 2026-04-01 – Documentado por Antigravity*
