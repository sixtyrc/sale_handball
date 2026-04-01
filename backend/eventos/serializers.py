from rest_framework import serializers
from .models import Evento, Convocatoria, Asistencia

class ConvocatoriaSerializer(serializers.ModelSerializer):
    jugador_id = serializers.UUIDField(source='jugador.id', read_only=True)
    jugador_nombre = serializers.CharField(source='jugador.__str__', read_only=True)

    class Meta:
        model = Convocatoria
        fields = ['id', 'evento', 'jugador_id', 'jugador_nombre', 'confirmado']
        read_only_fields = ['id', 'evento']

class AsistenciaSerializer(serializers.ModelSerializer):
    jugador_id = serializers.UUIDField(source='jugador.id', read_only=True)
    jugador_nombre = serializers.CharField(source='jugador.__str__', read_only=True)
    tomada_por_nombre = serializers.CharField(source='tomada_por.username', read_only=True)

    class Meta:
        model = Asistencia
        fields = ['id', 'evento', 'jugador', 'jugador_id', 'jugador_nombre', 'estado', 'observaciones', 'tomada_por_nombre']
        read_only_fields = ['id', 'evento', 'jugador_id', 'jugador_nombre', 'tomada_por_nombre']

class EventoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.username', read_only=True)

    class Meta:
        model = Evento
        fields = '__all__'
        read_only_fields = ['id', 'club', 'creado_por', 'created_at', 'updated_at']

# Serializers auxiliares para endpoints custom de negocio
class BulkConvocatoriaRequestSerializer(serializers.Serializer):
    jugadores_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="Lista de UUIDs de los socios a convocar."
    )

class AsistenciaItemSerializer(serializers.Serializer):
    jugador_id = serializers.UUIDField()
    estado = serializers.ChoiceField(choices=Asistencia.ESTADO_CHOICES)
    observaciones = serializers.CharField(max_length=255, required=False, allow_blank=True)

class BulkAsistenciaRequestSerializer(serializers.Serializer):
    asistencias = AsistenciaItemSerializer(many=True, allow_empty=False)

class ThirdHalfPaymentSerializer(serializers.Serializer):
    concepto = serializers.CharField(max_length=200, help_text="Ej: Hamburguesa + Gaseosa")
    monto = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Valor individual en positivo")
    jugadores_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="Jugadores a los que se les debitará en la cuenta corriente"
    )

class ArbitrajePaymentSerializer(serializers.Serializer):
    costo_total_arbitro = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Monto total fijado por la asociación")
    jugadores_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="Jugadores presentes que dividirán el costo"
    )
