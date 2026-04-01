import uuid
from decimal import Decimal
from django.db import models
from core.models import Club, Socio

class Jornada(models.Model):
    ESTADO_CHOICES = (
        ('PLANEADA', 'Planeada'),
        ('EN_CURSO', 'En Curso'),
        ('FINALIZADA', 'Finalizada'),
        ('CANCELADA', 'Cancelada'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='jornadas_locales')
    titulo = models.CharField(max_length=200, help_text="Ej: Fecha 3 vs Club Mitre")
    fecha = models.DateField()
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PLANEADA')
    observaciones = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.titulo} - {self.fecha} ({self.get_estado_display()})"

    class Meta:
        ordering = ['-fecha']

class Voluntario(models.Model):
    TAREA_CHOICES = (
        ('ENTRADAS', 'Cobro de Entradas'),
        ('CANTINA', 'Atención de Cantina'),
        ('MESA', 'Mesa de Control / Planilla'),
        ('LIMPIEZA', 'Limpieza y Orden'),
        ('PLANILLERO', 'Planillero / Veedor'),
        ('OTRO', 'Otros'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    jornada = models.ForeignKey(Jornada, on_delete=models.CASCADE, related_name='voluntarios')
    persona = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='voluntariados', help_text="Tanto el socio como sus tutores pueden ser voluntarios.")
    
    tarea = models.CharField(max_length=50, choices=TAREA_CHOICES)
    horario_inicio = models.TimeField(null=True, blank=True)
    horario_fin = models.TimeField(null=True, blank=True)
    
    cumplido = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.persona} en {self.get_tarea_display()} ({self.jornada.titulo})"

class DonacionCantina(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    jornada = models.ForeignKey(Jornada, on_delete=models.CASCADE, related_name='donaciones')
    donante = models.ForeignKey(Socio, on_delete=models.SET_NULL, null=True, related_name='donaciones_cantina')
    
    producto = models.CharField(max_length=150, help_text="Ej: Bizcochuelo, 10 empanadas, pack gaseosas")
    cantidad = models.PositiveIntegerField(default=1)
    valorizado_estimado = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Para medir el aporte monetario de la donación")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Donación {self.producto} - {self.donante}"

class VentaJornada(models.Model):
    TIPO_CHOICES = (
        ('ENTRADA', 'Venta de Entrada'),
        ('BUFFET', 'Venta Cantina / Buffet'),
        ('SORTEO', 'Rifa / Sorteo'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    jornada = models.ForeignKey(Jornada, on_delete=models.CASCADE, related_name='ventas')
    
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    metodo_pago = models.CharField(max_length=50, default='EFECTIVO')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Venta {self.tipo}: ${self.monto}"

class CajaJornada(models.Model):
    """
    Rendición del evento. No es la contabilidad general del club, 
    es la caja del día que luego se rinde.
    """
    jornada = models.OneToOneField(Jornada, on_delete=models.CASCADE, primary_key=True, related_name='balance_caja')
    
    # Egresos locales (lo que el club paga en el momento)
    egreso_arbitros = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    egreso_viaticos = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    otros_egresos = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    efectivo_sobrante_neto = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Lo que el club se queda en mano")
    
    rendida_a_tesoreria = models.BooleanField(default=False)
    fecha_rendicion = models.DateTimeField(null=True, blank=True)

    def calcular_balance(self):
        ingresos = self.jornada.ventas.aggregate(models.Sum('monto'))['monto__sum'] or Decimal('0.00')
        egresos = self.egreso_arbitros + self.egreso_viaticos + self.otros_egresos
        return ingresos - egresos

    def __str__(self):
        return f"Balance: {self.jornada.titulo}"
