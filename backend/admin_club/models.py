import uuid
from decimal import Decimal
from django.db import models
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import Club

def logo_path(instance, filename):
    return f"branding/club_{instance.club.id}/{filename}"

class ClubConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.OneToOneField(Club, on_delete=models.CASCADE, related_name='configuracion')
    
    logo = models.ImageField(upload_to=logo_path, blank=True, null=True)
    color_primario = models.CharField(max_length=7, default='#2563eb', help_text="Formato Hex (#FFFFFF)")
    color_secundario = models.CharField(max_length=7, default='#1e40af', help_text="Formato Hex (#FFFFFF)")
    
    dia_vencimiento_cuota = models.IntegerField(
        default=10, 
        validators=[MinValueValidator(1), MaxValueValidator(28)],
        help_text="Día del mes en que vence la cuota."
    )
    dias_gracia = models.IntegerField(default=5)
    porcentaje_mora = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Configuración: {self.club}"

class Temporada(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='temporadas')
    nombre = models.CharField(max_length=150)  # ej: "Apertura 2026", "Anual 2026"
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(blank=True, null=True)
    activa = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        estado = "ACTIVA" if self.activa else "INACTIVA"
        return f"{self.nombre} ({estado}) - {self.club}"

class ConceptoCobrable(models.Model):
    TIPO_CHOICES = (
        ('CUOTA', 'Cuota Social'),
        ('SEGURO', 'Seguro Deportivo'),
        ('FEDERACION', 'Ficha Federativa'),
        ('ARBITRAJE', 'Arancel Arbitral'),
        ('OTRO', 'Otro Concepto'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    temporada = models.ForeignKey(Temporada, on_delete=models.CASCADE, related_name='conceptos')
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    descripcion = models.CharField(max_length=200, blank=True, null=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_tipo_display()} - ${self.monto} ({self.temporada.nombre})"

    class Meta:
        unique_together = ('temporada', 'tipo', 'descripcion')

# Signals
@receiver(post_save, sender=Club)
def crear_config_default(sender, instance, created, **kwargs):
    if created:
        ClubConfig.objects.get_or_create(club=instance)

@receiver(pre_save, sender=Temporada)
def asegurar_temporada_activa_unica(sender, instance, **kwargs):
    if instance.activa:
        # Apagamos todas las demás temporadas activas de este club
        Temporada.objects.filter(club=instance.club, activa=True).exclude(pk=instance.pk).update(activa=False)
