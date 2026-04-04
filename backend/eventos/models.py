import uuid
from django.db import models
from django.conf import settings
from core.models import Club, Socio
from deportes.models import Categoria

class Evento(models.Model):
    TIPO_CHOICES = (
        ('ENTRENAMIENTO', 'Entrenamiento'),
        ('PARTIDO_OFICIAL', 'Partido Oficial'),
        ('AMISTOSO', 'Partido Amistoso'),
        ('TERCER_TIEMPO', 'Tercer Tiempo'),
        ('TORNEO_CLUB', 'Torneo de Club'),
        ('OTRO', 'Otro Evento'),
    )

    CONDICION_CHOICES = (
        ('LOCAL', 'En Casa (Local)'),
        ('VISITANTE', 'Visitante'),
        ('NEUTRAL', 'Cancha Neutral'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='eventos')
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True, related_name='eventos_categoria')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    lugar = models.CharField(max_length=200, blank=True, null=True)
    
    fecha_hora_inicio = models.DateTimeField()
    fecha_hora_fin = models.DateTimeField()

    # Específico para partidos
    rival = models.CharField(max_length=150, blank=True, null=True)
    competencia = models.CharField(max_length=150, blank=True, null=True) # ej: "Apertura AsBal"
    condicion_partido = models.CharField(max_length=30, choices=CONDICION_CHOICES, blank=True, null=True)
    
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='eventos_creados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_hora_inicio']

    def __str__(self):
        cat = f" - {self.categoria.nombre}" if self.categoria else ""
        return f"{self.titulo} ({self.get_tipo_display()}){cat}"

class Convocatoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='convocados')
    jugador = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='convocatorias')
    confirmado = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('evento', 'jugador')
        
    def __str__(self):
        return f"Convocatoria: {self.jugador} -> {self.evento.titulo}"

class Asistencia(models.Model):
    ESTADO_CHOICES = (
        ('PRESENTE', 'Presente'),
        ('AUSENTE', 'Ausente'),
        ('TARDE', 'Llegó Tarde'),
        ('JUSTIFICADO', 'Ausencia Justificada'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='asistencias')
    jugador = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='asistencias_historial')
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES)
    observaciones = models.CharField(max_length=255, blank=True, null=True)

    tomada_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='asistencias_tomadas')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('evento', 'jugador')

    def __str__(self):
        return f"Asistencia {self.get_estado_display()} - {self.jugador} ({self.evento.titulo})"

# ─────────────────────────────────────────────────────────────────────────────
# NUEVOS MODELOS PARA PLANILLA DE PARTIDOS (Paso 01)
# ─────────────────────────────────────────────────────────────────────────────

class DetallePartido(models.Model):
    """Información extendida exclusiva para eventos de tipo PARTIDO_OFICIAL o AMISTOSO."""
    ESTADO_PLANILLA = (
        ('PENDIENTE', 'Pendiente de Carga'),
        ('CARGANDO', 'En Proceso'),
        ('CERRADA', 'Finalizada y Confirmada'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evento = models.OneToOneField(Evento, on_delete=models.CASCADE, related_name='detalle')
    
    # Datos de Sede (por si difieren del lugar del evento inicial)
    sede_final = models.CharField(max_length=200, blank=True, null=True)
    
    # Resultado Final
    goles_local = models.PositiveIntegerField(default=0)
    goles_visitante = models.PositiveIntegerField(default=0)
    
    # Estado de la carga técnica
    estado_planilla = models.CharField(max_length=20, choices=ESTADO_PLANILLA, default='PENDIENTE')
    
    # Información de Sanciones de Banco (Cuerpo Técnico)
    amarilla_banco = models.BooleanField(default=False)
    suspension_banco = models.BooleanField(default=False, help_text="Sanción de 2 min al oficial de banco")
    roja_banco = models.BooleanField(default=False)
    azul_banco = models.BooleanField(default=False)

    observaciones_arbitro = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Planilla: {self.evento.titulo} ({self.goles_local}-{self.goles_visitante})"

class EquipoEnPartido(models.Model):
    """Configuración de los equipos que disputan el partido."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detalle_partido = models.ForeignKey(DetallePartido, on_delete=models.CASCADE, related_name='equipos_stats')
    
    es_local = models.BooleanField(default=True)
    nombre_equipo = models.CharField(max_length=150) # "Salesianos" o el nombre del rival
    color_camiseta = models.CharField(max_length=50, blank=True, null=True)
    
    # Timeouts (En handball suelen permitirse hasta 3)
    timeouts_usados = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Equipo en Partido"
        verbose_name_plural = "Equipos en Partidos"

class EstadisticaJugador(models.Model):
    """Estadísticas individuales por jugador (Socio) en un partido específico."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detalle_partido = models.ForeignKey(DetallePartido, on_delete=models.CASCADE, related_name='jugadores_stats')
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='estadisticas_partidos')
    
    dorsal = models.CharField(max_length=5, blank=True, null=True)
    
    # Ofensivo
    goles = models.PositiveIntegerField(default=0)
    penales_lanzados = models.PositiveIntegerField(default=0)
    penales_convertidos = models.PositiveIntegerField(default=0)
    
    # Disciplinario
    amarilla = models.BooleanField(default=False)
    suspensiones_2min = models.PositiveSmallIntegerField(default=0, help_text="Máximo 3 suspensiones")
    roja = models.BooleanField(default=False)
    azul = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Estadística de Jugador"
        verbose_name_plural = "Estadísticas de Jugadores"
        unique_together = ('detalle_partido', 'socio')

    def __str__(self):
        return f"{self.socio} (# {self.dorsal}) - G:{self.goles}"

class AccionPartido(models.Model):
    """Timeline de eventos significativos durante el partido (Live Score / Crónica)."""
    TIPO_ACCION = (
        ('GOL', 'Gol de Campo'),
        ('GOL_7M', 'Gol de 7 metros (Penal)'),
        ('FALLO_7M', 'Penal Fallado'),
        ('AMARILLA', 'Tarjeta Amarilla'),
        ('2MIN', 'Suspensión 2 Minutos'),
        ('ROJA', 'Tarjeta Roja'),
        ('AZUL', 'Tarjeta Azul'),
        ('TIMEOUT', 'Tiempo Muerto'),
        ('OTRO', 'Otro Evento'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detalle_partido = models.ForeignKey(DetallePartido, on_delete=models.CASCADE, related_name='acciones')
    
    minuto = models.PositiveSmallIntegerField()
    tipo = models.CharField(max_length=20, choices=TIPO_ACCION)
    
    # Relación con el jugador (si aplica)
    jugador_stats = models.ForeignKey(EstadisticaJugador, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Relación con el equipo (Local/Visitante)
    equipo = models.ForeignKey(EquipoEnPartido, on_delete=models.CASCADE, related_name='acciones_equipo')
    
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['minuto', 'id']
        verbose_name = "Acción de Partido"
        verbose_name_plural = "Acciones de Partidos"
