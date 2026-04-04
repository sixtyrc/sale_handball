from rest_framework import serializers
from .models import Categoria, PerfilDeportivo, DocumentoDigital, Lesion
from core.serializers import SocioSerializer
from .eligibility import check_player_health

class CategoriaSerializer(serializers.ModelSerializer):
    profesores_nombres = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'genero', 'club', 'activo', 'profesores_nombres']
        read_only_fields = ['id', 'club']

    def get_profesores_nombres(self, obj):
        return [f"{a.usuario_profe.first_name} {a.usuario_profe.last_name}" or a.usuario_profe.email 
                for a in obj.profesores_asignados.all().select_related('usuario_profe')]

class DocumentoDigitalSerializer(serializers.ModelSerializer):
    subido_por_nombre = serializers.CharField(source='subido_por.username', read_only=True)
    validado_por_nombre = serializers.CharField(source='validado_por.username', read_only=True)
    
    class Meta:
        model = DocumentoDigital
        fields = '__all__'
        read_only_fields = ['id', 'socio', 'subido_por', 'validado_por', 'created_at', 'updated_at']

class PerfilDeportivoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria_actual.nombre', read_only=True)
    apto_medico_vigente = serializers.BooleanField(read_only=True)
    puede_jugar = serializers.BooleanField(read_only=True)
    socio_detalle = SocioSerializer(source='socio', read_only=True)
    eligibility = serializers.SerializerMethodField()
    stats_acumuladas = serializers.SerializerMethodField()

    class Meta:
        model = PerfilDeportivo
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_eligibility(self, obj):
        return check_player_health(obj.id)

    def get_stats_acumuladas(self, obj):
        from eventos.models import EstadisticaJugador
        from django.db.models import Sum, Q, Count
        
        # Filtramos partidos que ya estén cerrados para no sumar en vivo basura
        stats = EstadisticaJugador.objects.filter(
            socio=obj.socio,
            detalle_partido__estado_planilla='CERRADA'
        ).aggregate(
            partidos_jugados=Count('id'),
            goles_totales=Sum('goles'),
            penales_convertidos=Sum('penales_convertidos'),
            suspensiones_2min=Sum('suspensiones_2min'),
            tarjetas_rojas=Count('id', filter=Q(roja=True)),
            tarjetas_amarillas=Count('id', filter=Q(amarilla=True)),
            tarjetas_azules=Count('id', filter=Q(azul=True))
        )
        
        return {
            'partidos_jugados': stats['partidos_jugados'] or 0,
            'goles_totales': stats['goles_totales'] or 0,
            'penales_convertidos': stats['penales_convertidos'] or 0,
            'suspensiones_2min': stats['suspensiones_2min'] or 0,
            'tarjetas_rojas': stats['tarjetas_rojas'] or 0,
            'tarjetas_amarillas': stats['tarjetas_amarillas'] or 0,
            'tarjetas_azules': stats['tarjetas_azules'] or 0,
        }


    def validate(self, data):
        # Additional validation if necessary
        return data

class LesionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesion
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
