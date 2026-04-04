import uuid
from decimal import Decimal
from django.db import models
from django.db.models import Sum
from django.conf import settings
from core.models import Socio


class CuentaCorriente(models.Model):
    """
    Una cuenta corriente por socio. Se crea automáticamente via Signal.
    NUNCA tiene un campo 'saldo' mutable — el saldo siempre se calcula.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    socio = models.OneToOneField(Socio, on_delete=models.CASCADE, related_name='cuenta_corriente')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cuenta de {self.socio.apellidos}, {self.socio.nombres}"

    @property
    def saldo(self):
        """Saldo calculado: positivo = a favor, negativo = deuda."""
        result = self.movimientos.aggregate(total=Sum('monto'))
        return result['total'] or Decimal('0.00')

    class Meta:
        verbose_name = "Cuenta Corriente"
        verbose_name_plural = "Cuentas Corrientes"


class MovimientoFinanciero(models.Model):
    """
    Registro inmutable de cada transacción financiera.
    NUNCA se permite DELETE. Los errores se compensan con AJUSTE.
    Débito = monto negativo (deuda). Crédito = monto positivo (pago/favor).
    """

    TIPO_CHOICES = (
        ('CUOTA', 'Cuota Mensual'),
        ('PAGO', 'Pago de Socio'),
        ('MORA', 'Recargo por Mora'),
        ('ARBITRAJE', 'Arancel Arbitral'),
        ('TERCER_TIEMPO', 'Tercer Tiempo'),
        ('SEGURO', 'Seguro Federativo'),
        ('AJUSTE', 'Ajuste / Corrección'),
        ('BECA', 'Bonificación por Beca'),
        ('SALDO_INICIAL', 'Saldo Inicial / Deuda Histórica'),
    )

    METODO_PAGO_CHOICES = (
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia / Banco'),
        ('MERCADOPAGO', 'Mercado Pago'),
        ('OTRO', 'Otro / Ajuste'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cuenta = models.ForeignKey(CuentaCorriente, on_delete=models.PROTECT, related_name='movimientos')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)  # Negativo = débito, positivo = crédito
    descripcion = models.CharField(max_length=255)
    metodo_pago = models.CharField(max_length=50, choices=METODO_PAGO_CHOICES, default='EFECTIVO', blank=True, null=True)
    fecha = models.DateField()
    referencia_externa = models.CharField(max_length=100, blank=True, null=True)  # Nro recibo, transacción MP
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='movimientos_generados',
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        signo = "+" if self.monto >= 0 else ""
        return f"[{self.tipo}] {signo}{self.monto} — {self.cuenta.socio}"

    class Meta:
        verbose_name = "Movimiento Financiero"
        verbose_name_plural = "Movimientos Financieros"
        ordering = ['-fecha', '-created_at']


def comprobante_path(instance, filename):
    return f"comprobantes/club_{instance.socio.club.id}/socio_{instance.socio.id}/{filename}"


class AvisoPago(models.Model):
    """
    El socio avisa que realizó un pago (ej: transferencia).
    El admin lo valida → recién entonces se genera el MovimientoFinanciero real.
    NUNCA auto-genera el movimiento. Siempre requiere aprobación humana.
    """
    ESTADO_CHOICES = (
        ('PENDIENTE', 'Pendiente de Revisión'),
        ('VALIDADO', 'Validado — Recibo Generado'),
        ('RECHAZADO', 'Rechazado'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    socio = models.ForeignKey(
        Socio, on_delete=models.CASCADE, related_name='avisos_pago'
    )
    monto_declarado = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_declarada = models.DateField()
    descripcion = models.CharField(max_length=255, help_text="Ej: Cuota Abril 2026")
    comprobante = models.ImageField(
        upload_to=comprobante_path, null=True, blank=True,
        max_length=500,
        help_text="Foto o captura del comprobante de transferencia (opcional)"
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    observacion_rechazo = models.TextField(
        blank=True, null=True,
        help_text="Motivo del rechazo para mostrarle al socio."
    )

    # Se llena cuando el admin valida y genera el movimiento real
    movimiento_generado = models.OneToOneField(
        MovimientoFinanciero, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='aviso_origen'
    )

    validado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='avisos_validados'
    )
    fecha_validacion = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Aviso [{self.estado}] {self.socio} — ${self.monto_declarado} ({self.fecha_declarada})"

    class Meta:
        verbose_name = "Aviso de Pago"
        verbose_name_plural = "Avisos de Pago"
        ordering = ['-created_at']
