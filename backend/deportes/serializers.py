from rest_framework import serializers
from .models import Categoria, PerfilDeportivo, DocumentoDigital
from core.serializers import SocioSerializer
from .eligibility import check_player_health

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'genero', 'club']
        read_only_fields = ['id', 'club']

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

    class Meta:
        model = PerfilDeportivo
        fields = '__all__'
        read_only_fields = ['id', 'socio', 'created_at', 'updated_at']

    def get_eligibility(self, obj):
        return check_player_health(obj.id)

    def validate(self, data):
        # Additional validation if necessary
        return data
