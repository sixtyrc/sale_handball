from rest_framework import serializers
from .models import Jornada, Voluntario, DonacionCantina, VentaJornada, CajaJornada
from core.models import Socio

class SocioSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Socio
        fields = ['id', 'nombres', 'apellidos', 'nro_socio']

class DonacionCantinaSerializer(serializers.ModelSerializer):
    donante_detalle = SocioSimpleSerializer(source='donante', read_only=True)
    
    class Meta:
        model = DonacionCantina
        fields = '__all__'

class VoluntarioSerializer(serializers.ModelSerializer):
    persona_detalle = SocioSimpleSerializer(source='persona', read_only=True)
    tarea_display = serializers.CharField(source='get_tarea_display', read_only=True)
    
    class Meta:
        model = Voluntario
        fields = '__all__'

class VentaJornadaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = VentaJornada
        fields = '__all__'

class CajaJornadaSerializer(serializers.ModelSerializer):
    resumen = serializers.SerializerMethodField()

    class Meta:
        model = CajaJornada
        fields = '__all__'

    def get_resumen(self, obj):
        return obj.calcular_resumen()

class JornadaDetailSerializer(serializers.ModelSerializer):
    voluntarios = VoluntarioSerializer(many=True, read_only=True)
    donaciones = DonacionCantinaSerializer(many=True, read_only=True)
    ventas = VentaJornadaSerializer(many=True, read_only=True)
    balance = CajaJornadaSerializer(source='balance_caja', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Jornada
        fields = '__all__'

class JornadaListSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Jornada
        fields = ['id', 'titulo', 'fecha', 'estado', 'estado_display', 'slug']

# Serializador mínimo para acceso rápido por PIN (Kiosco)
class KioscoJornadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Jornada
        fields = ['id', 'titulo', 'fecha', 'slug']
