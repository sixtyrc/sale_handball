import io
import uuid
from django.db import models
from django.core.files.base import ContentFile
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
from PIL import Image

class Club(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=255)
    subdominio = models.CharField(max_length=50, unique=True, null=True, blank=True)
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
    
    SEXO_CHOICES = (
        ('MASCULINO', 'Masculino'),
        ('FEMENINO', 'Femenino'),
        ('OTRO', 'Otro / No especifica'),
    )
    sexo = models.CharField(max_length=20, choices=SEXO_CHOICES, blank=True, null=True)

    BLOOD_TYPE_CHOICES = (
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    )
    grupo_sanguineo = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES, blank=True, null=True)

    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')
    
    # Nuevo: Gestión de Becas y Fotos
    foto = models.ImageField(upload_to='socios/fotos/', null=True, blank=True)
    porcentaje_beca = models.IntegerField(
        default=0, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de bonificación sobre la cuota mensual"
    )
    
    # Datos de Contacto y Emergencia
    telefono = models.CharField(max_length=50, blank=True, null=True)
    email_contacto = models.EmailField(blank=True, null=True)
    contacto_emergencia_nombre = models.CharField(max_length=150, blank=True, null=True)
    contacto_emergencia_telefono = models.CharField(max_length=50, blank=True, null=True)

    # Perfil Deportivo (Base)
    altura = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    mano_habil = models.CharField(max_length=10, choices=(('DER', 'Diestro'), ('IZQ', 'Zurdo')), default='DER')
    posicion_habitual = models.CharField(max_length=100, blank=True, null=True)
    
    # Datos del Tutor (Mandatorio para menores)
    nombre_tutor = models.CharField(max_length=200, blank=True, null=True)
    dni_tutor = models.CharField(max_length=20, blank=True, null=True)
    tel_tutor = models.CharField(max_length=50, blank=True, null=True)
    parentesco_tutor = models.CharField(max_length=100, blank=True, null=True)

    # Nuevo: Dirección
    domicilio = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('club', 'nro_socio')

    def __str__(self):
        return f"{self.apellidos}, {self.nombres} - [{self.nro_socio}]"

    def save(self, *args, **kwargs):
        # Optimización de imagen 4x4 y < 300KB
        if self.foto:
            try:
                img = Image.open(self.foto)
                
                # Convertir a RGB si es necesario (RGBA/P causes issues with JPEG)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Redimensionar a cuadrado 4x4 (ej: 800x800)
                width, height = img.size
                if width != height:
                    min_dim = min(width, height)
                    left = (width - min_dim) / 2
                    top = (height - min_dim) / 2
                    right = (width + min_dim) / 2
                    bottom = (height + min_dim) / 2
                    img = img.crop((left, top, right, bottom))
                
                img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                
                # Comprimir hasta < 300KB
                output = io.BytesIO()
                quality = 85
                img.save(output, format='JPEG', quality=quality)
                
                while output.tell() > 300 * 1024 and quality > 10:
                    output = io.BytesIO()
                    quality -= 5
                    img.save(output, format='JPEG', quality=quality)
                
                output.seek(0)
                self.foto = ContentFile(output.read(), name=f"{self.nro_socio or self.dni}.jpg")
            except Exception as e:
                print(f"Error procesando imagen: {e}")
        
        super().save(*args, **kwargs)

    @property
    def is_becado(self):
        return self.porcentaje_beca > 0

    @property
    def vencimiento_carnet(self):
        """
        Vigencia de 95 días desde el último PAGO de cuota.
        Si la beca es 100%, es VITALICIO.
        """
        if self.porcentaje_beca == 100:
            return "VIGENCIA: VITALICIO"
            
        try:
            from django.apps import apps
            MovimientoFinanciero = apps.get_model('finanzas', 'MovimientoFinanciero')
            
            # Buscamos el último movimiento POSITIVO (pago o crédito)
            ultimo_pago = MovimientoFinanciero.objects.filter(
                cuenta__socio=self,
                monto__gt=0
            ).order_by('-fecha').first()
            
            if not ultimo_pago:
                return "SIN PAGOS (RENOVAR)"
                
            fecha_vencimiento = ultimo_pago.fecha + timedelta(days=95)
            hoy = timezone.now().date()
            
            if hoy > fecha_vencimiento:
                return f"VENCIDO EL {fecha_vencimiento.strftime('%d/%m/%Y')}"
            
            return f"VENCE EL {fecha_vencimiento.strftime('%d/%m/%Y')}"
        except Exception as e:
            print(f"Error calculando vencimiento: {e}")
            return "CONSULTAR ADMINISTRACIÓN"
