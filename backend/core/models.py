import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class Club(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin / Administrativo'),
        ('PROFESOR', 'Profesor'),
        ('SOCIO_TUTOR', 'Socio / Tutor'),
        ('DIRIGENTE', 'Dirigente / Comisión'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='usuarios', null=True, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='SOCIO_TUTOR')

    def __str__(self):
        return f"{self.email} - {self.role}"


class Socio(models.Model):
    ESTADO_CHOICES = (
        ('ACTIVO', 'Activo'),
        ('INACTIVO', 'Inactivo'),
        ('SUSPENDIDO', 'Suspendido (Moroso o Disciplina)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='perfil_socio', null=True, blank=True)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='socios')
    
    nro_socio = models.CharField(max_length=50, blank=True, null=True)
    dni = models.CharField(max_length=20, unique=True)
    nombres = models.CharField(max_length=150)
    apellidos = models.CharField(max_length=150)
    fecha_nacimiento = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')
    
    # Contactos
    telefono = models.CharField(max_length=50, blank=True, null=True)
    email_contacto = models.EmailField(blank=True, null=True)
    contacto_emergencia_nombre = models.CharField(max_length=150, blank=True, null=True)
    contacto_emergencia_telefono = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('club', 'nro_socio')

    def __str__(self):
        return f"{self.apellidos}, {self.nombres} - [{self.nro_socio}]"
