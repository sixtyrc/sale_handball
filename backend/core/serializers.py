from rest_framework import serializers
from .models import Club, CustomUser, Socio

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

class SocioSerializer(serializers.ModelSerializer):
    vencimiento_carnet = serializers.ReadOnlyField()
    
    class Meta:
        model = Socio
        fields = [
            'id', 'usuario', 'club', 'nro_socio', 'dni', 'nombres', 'apellidos',
            'fecha_nacimiento', 'sexo', 'grupo_sanguineo', 'estado', 'foto',
            'porcentaje_beca', 'telefono', 'email_contacto', 'domicilio',
            'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
            'altura', 'mano_habil', 'posicion_habitual', 'nombre_tutor',
            'dni_tutor', 'tel_tutor', 'parentesco_tutor', 'vencimiento_carnet',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['club', 'usuario']
