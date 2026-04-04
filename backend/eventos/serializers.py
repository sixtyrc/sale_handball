from rest_framework import serializers
from .models import Evento, Convocatoria, Asistencia, DetallePartido, EquipoEnPartido, EstadisticaJugador, AccionPartido

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

class EstadisticaJugadorSerializer(serializers.ModelSerializer):
    jugador_nombre = serializers.CharField(source='socio.__str__', read_only=True)
    
    class Meta:
        model = EstadisticaJugador
        fields = '__all__'
        read_only_fields = ['id', 'detalle_partido']

class EquipoEnPartidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipoEnPartido
        fields = '__all__'
        read_only_fields = ['id', 'detalle_partido']

class AccionPartidoSerializer(serializers.ModelSerializer):
    jugador_nombre = serializers.CharField(source='jugador_stats.socio.__str__', read_only=True)
    equipo_nombre = serializers.CharField(source='equipo.nombre_equipo', read_only=True)

    class Meta:
        model = AccionPartido
        fields = '__all__'
        read_only_fields = ['id', 'detalle_partido']

class DetallePartidoSerializer(serializers.ModelSerializer):
    jugadores_stats = EstadisticaJugadorSerializer(many=True, read_only=True)
    equipos_stats = EquipoEnPartidoSerializer(many=True, read_only=True)
    acciones = AccionPartidoSerializer(many=True, read_only=True)

    class Meta:
        model = DetallePartido
        fields = '__all__'
        read_only_fields = ['id', 'evento', 'created_at']

class EventoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.username', read_only=True)
    estado_planilla = serializers.CharField(source='detalle.estado_planilla', read_only=True)
    
    # Marcador rápido si es partido
    score_final = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = '__all__'
        read_only_fields = ['id', 'club', 'creado_por', 'created_at', 'updated_at']

    def get_score_final(self, obj):
        if hasattr(obj, 'detalle'):
            return f"{obj.detalle.goles_local} - {obj.detalle.goles_visitante}"
        return None

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

class CerrarPlanillaRequestSerializer(serializers.Serializer):
    goles_local = serializers.IntegerField(min_value=0)
    goles_visitante = serializers.IntegerField(min_value=0)
    sede_final = serializers.CharField(max_length=200, required=False, allow_blank=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)
    
    # Stats de jugadores
    stats_jugadores = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
    
    # Banco
    amarilla_banco = serializers.BooleanField(default=False)
    suspension_banco = serializers.BooleanField(default=False)
    roja_banco = serializers.BooleanField(default=False)
    azul_banco = serializers.BooleanField(default=False)
