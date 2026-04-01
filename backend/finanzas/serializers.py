from decimal import Decimal
from rest_framework import serializers
from .models import CuentaCorriente, MovimientoFinanciero


class MovimientoFinancieroSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = MovimientoFinanciero
        fields = [
            'id', 'tipo', 'monto', 'descripcion', 'fecha',
            'referencia_externa', 'creado_por', 'creado_por_nombre', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'creado_por']

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return f"{obj.creado_por.first_name} {obj.creado_por.last_name}".strip() or obj.creado_por.username
        return "Sistema"

    def validate_monto(self, value):
        if value == Decimal('0'):
            raise serializers.ValidationError("El monto no puede ser cero.")
        return value


class CuentaCorrienteSerializer(serializers.ModelSerializer):
    saldo = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    movimientos = MovimientoFinancieroSerializer(many=True, read_only=True)
    socio_nombre = serializers.SerializerMethodField()

    class Meta:
        model = CuentaCorriente
        fields = ['id', 'socio', 'socio_nombre', 'saldo', 'movimientos', 'created_at']

    def get_socio_nombre(self, obj):
        return f"{obj.socio.apellidos}, {obj.socio.nombres}"


class GenerarCuotasSerializer(serializers.Serializer):
    """Datos para generar cuotas masivas para todos los socios activos del club."""
    monto = serializers.DecimalField(max_digits=10, decimal_places=2)
    descripcion = serializers.CharField(max_length=255, default="Cuota mensual")
    fecha = serializers.DateField()


class SaldoInicialSerializer(serializers.Serializer):
    """Migración de deuda histórica para un socio."""
    socio_id = serializers.UUIDField()
    monto = serializers.DecimalField(max_digits=10, decimal_places=2)
    descripcion = serializers.CharField(max_length=255, default="Saldo inicial / Deuda histórica")
    fecha = serializers.DateField()
