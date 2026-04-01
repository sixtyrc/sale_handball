import uuid
from decimal import Decimal
from django.db import models, transaction
from django.conf import settings
from core.models import Club, Socio
from finanzas.models import CuentaCorriente, MovimientoFinanciero

class CajaDiaria(models.Model):
    ESTADO_CHOICES = (
        ('ABIERTA', 'Abierta'),
        ('CERRADA', 'Cerrada'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='cajas')
    usuario_responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='cajas_gestionadas')
    
    fecha = models.DateField(auto_now_add=True)
    monto_apertura = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    monto_cierre = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    monto_esperado_sistema = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')
    
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Caja {self.fecha} - {self.club.nombre} ({self.estado})"

    class Meta:
        ordering = ['-fecha', '-created_at']

class PagoRecibido(models.Model):
    METODO_CHOICES = (
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia Bancaria'),
        ('MP_QR', 'Mercado Pago (QR)'),
        ('MP_LINK', 'Mercado Pago (Link)'),
        ('DEBITO_AUTOMATICO', 'Débito Automático'),
        ('OTROS', 'Otros'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    caja = models.ForeignKey(CajaDiaria, on_delete=models.PROTECT, related_name='pagos')
    socio = models.ForeignKey(Socio, on_delete=models.PROTECT, related_name='pagos_realizados')
    
    monto = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    monto_pesos = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Monto real ingresado (Ej: si se paga con descuento)")
    
    metodo_pago = models.CharField(max_length=30, choices=METODO_CHOICES, default='EFECTIVO')
    referencia_operacion = models.CharField(max_length=150, blank=True, null=True)
    comprobante_img = models.ImageField(upload_to='comprobantes/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    usuario_cobrador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='pagos_cobrados')

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        with transaction.atomic():
            super().save(*args, **kwargs)
            if is_new:
                # Automáticamente generamos el movimiento de PAGO (Crédito para el socio)
                cuenta, _ = CuentaCorriente.objects.get_or_create(socio=self.socio)
                MovimientoFinanciero.objects.create(
                    cuenta=cuenta,
                    tipo='PAGO',
                    monto=abs(self.monto), # Crédito = positivo para la deuda (se resta de lo que debe)
                    descripcion=f"Pago recibido (Método: {self.get_metodo_pago_display()}) en Caja {self.caja.fecha}",
                    fecha=self.created_at.date() if self.created_at else models.functions.Now(),
                    referencia_externa=self.referencia_operacion,
                    creado_por=self.usuario_cobrador
                )
                
                # Actualizamos el saldo esperado de la caja
                self.caja.monto_esperado_sistema += self.monto
                self.caja.save()

    def __str__(self):
        return f"Pago {self.socio} - ${self.monto}"

class ProductoMerchandising(models.Model):
    CATEGORIA_CHOICES = (
        ('INDUMENTARIA', 'Indumentaria Club'),
        ('ELEMENTO', 'Elementos Deportivos'),
        ('BEBIDA', 'Bebidas/Cantina'),
        ('MERCH', 'Merchandising'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='productos')
    
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual = models.IntegerField(default=0)
    categoria = models.CharField(max_length=30, choices=CATEGORIA_CHOICES)
    
    activo = models.BooleanField(default=True)
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} - ${self.precio} ({self.club.nombre})"
