from rest_framework import serializers
from .models import ClubConfig, Temporada, ConceptoCobrable

class ConceptoCobrableSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConceptoCobrable
        fields = ['id', 'temporada', 'tipo', 'descripcion', 'monto']

class TemporadaSerializer(serializers.ModelSerializer):
    conceptos = ConceptoCobrableSerializer(many=True, read_only=True)
    class Meta:
        model = Temporada
        fields = ['id', 'club', 'nombre', 'fecha_inicio', 'fecha_fin', 'activa', 'conceptos']
        read_only_fields = ['id', 'club']

class ClubConfigSerializer(serializers.ModelSerializer):
    club_nombre = serializers.CharField(source='club.nombre', read_only=True)
    
    class Meta:
        model = ClubConfig
        fields = [
            'id', 'club', 'club_nombre', 'logo', 'color_primario', 'color_secundario', 
            'nombre_institucional', 'web', 'email_contacto', 'telefono', 'direccion',
            'dia_vencimiento_cuota', 'dias_gracia', 'porcentaje_mora', 'inicio_ciclo_contable'
        ]
        read_only_fields = ['id', 'club']

class PublicBrandingSerializer(serializers.ModelSerializer):
    """
    Serializador super liviano y PÚBLICO. 
    Solo expone información estética para pintar la pantalla de Login y Web Pública.
    NUNCA exponer configuraciones financieras por aquí.
    """
    club_nombre = serializers.CharField(source='club.nombre', read_only=True)
    club_subdominio = serializers.CharField(source='club.subdominio', read_only=True)

    class Meta:
        model = ClubConfig
        fields = ['club_nombre', 'club_subdominio', 'logo', 'color_primario', 'color_secundario']
