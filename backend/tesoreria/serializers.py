from decimal import Decimal
from rest_framework import serializers
from .models import CajaDiaria, PagoRecibido, ProductoMerchandising
from core.models import Socio

class ProductoMerchandisingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoMerchandising
        fields = ['id', 'club', 'nombre', 'descripcion', 'precio', 'stock_actual', 'categoria', 'activo', 'imagen']
        read_only_fields = ['id', 'club']

class PagoRecibidoSerializer(serializers.ModelSerializer):
    socio_nombre = serializers.CharField(source='socio.__str__', read_only=True)
    usuario_cobrador_nombre = serializers.CharField(source='usuario_cobrador.username', read_only=True)

    class Meta:
        model = PagoRecibido
        fields = [
            'id', 'caja', 'socio', 'socio_nombre', 'monto', 'monto_pesos', 
            'metodo_pago', 'referencia_operacion', 'comprobante_img', 
            'created_at', 'usuario_cobrador', 'usuario_cobrador_nombre'
        ]
        read_only_fields = ['id', 'created_at', 'usuario_cobrador', 'usuario_cobrador_nombre']

    def validate_monto(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("El monto de pago debe ser positivo.")
        return value

    def validate(self, data):
        caja = data.get('caja')
        if caja and caja.estado == 'CERRADA':
            raise serializers.ValidationError("No se pueden registrar pagos en una caja cerrada.")
        return data

class CajaDiariaSerializer(serializers.ModelSerializer):
    pagos = PagoRecibidoSerializer(many=True, read_only=True)
    monto_total_recaudado = serializers.SerializerMethodField()
    usuario_responsable_nombre = serializers.CharField(source='usuario_responsable.username', read_only=True)

    class Meta:
        model = CajaDiaria
        fields = [
            'id', 'club', 'usuario_responsable', 'usuario_responsable_nombre', 
            'fecha', 'monto_apertura', 'monto_cierre', 'monto_esperado_sistema', 
            'monto_total_recaudado', 'observaciones', 'estado', 'created_at', 'closed_at', 'pagos'
        ]
        read_only_fields = ['id', 'club', 'monto_esperado_sistema', 'created_at', 'closed_at', 'usuario_responsable']

    def get_monto_total_recaudado(self, obj):
        return obj.monto_esperado_sistema

class CajaAccionSerializer(serializers.Serializer):
    """Para abrir o cerrar caja con el monto inicial/final."""
    monto = serializers.DecimalField(max_digits=12, decimal_places=2)
    observaciones = serializers.CharField(max_length=255, required=False, allow_blank=True)
