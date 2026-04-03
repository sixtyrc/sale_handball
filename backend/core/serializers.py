from rest_framework import serializers
from .models import Club, CustomUser, Socio, GrupoFamiliar

class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'nombre', 'created_at']

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'club']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class GrupoFamiliarSerializer(serializers.ModelSerializer):
    miembros_activos = serializers.ReadOnlyField()
    descuento_porcentaje = serializers.ReadOnlyField()
    miembros = serializers.SerializerMethodField()

    class Meta:
        model = GrupoFamiliar
        fields = [
            'id', 'nombre', 'apellido_referencia', 'observaciones',
            'miembros_activos', 'descuento_porcentaje', 'miembros', 'created_at'
        ]
        read_only_fields = ['club']

    def get_miembros(self, obj):
        return [
            {
                'id': s.id,
                'nombres': s.nombres,
                'apellidos': s.apellidos,
                'nro_socio': s.nro_socio,
                'estado': s.estado,
            }
            for s in obj.socios.all()
        ]

class SocioSerializer(serializers.ModelSerializer):
    vencimiento_carnet = serializers.ReadOnlyField()
    grupo_familiar_id = serializers.PrimaryKeyRelatedField(
        source='grupo_familiar',
        queryset=GrupoFamiliar.objects.all(),
        required=False,
        allow_null=True
    )
    grupo_familiar_nombre = serializers.SerializerMethodField()
    descuento_familiar = serializers.SerializerMethodField()
    lesionado_activo = serializers.SerializerMethodField()

    class Meta:
        model = Socio
        fields = [
            'id', 'usuario', 'club', 'nro_socio', 'dni', 'nombres', 'apellidos',
            'fecha_nacimiento', 'sexo', 'grupo_sanguineo', 'estado', 'foto',
            'porcentaje_beca', 'telefono', 'email_contacto', 'domicilio',
            'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
            'altura', 'peso', 'mano_habil', 'posicion_habitual', 'nombre_tutor',
            'dni_tutor', 'tel_tutor', 'parentesco_tutor', 'vencimiento_carnet',
            'grupo_familiar_id', 'grupo_familiar_nombre', 'descuento_familiar',
            'lesionado_activo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['club', 'usuario', 'nro_socio']

    def get_grupo_familiar_nombre(self, obj):
        return obj.grupo_familiar.nombre if obj.grupo_familiar else None

    def get_descuento_familiar(self, obj):
        if obj.grupo_familiar:
            return obj.grupo_familiar.descuento_porcentaje
        return 0

    def get_lesionado_activo(self, obj):
        return getattr(obj, 'lesiones', None) and obj.lesiones.filter(estado='ACTIVA').exists()
