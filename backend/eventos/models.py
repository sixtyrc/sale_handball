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
