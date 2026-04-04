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
        ('SOCIO', 'Socio (Portal Autogestión)'),
        ('SOCIO_TUTOR', 'Socio / Tutor'),
        ('DIRIGENTE', 'Dirigente / Comisión'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='usuarios', null=True, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='SOCIO_TUTOR')
    primer_ingreso = models.BooleanField(default=False, help_text="Si True, el socio debe cambiar su contraseña al primer login.")

    def __str__(self):
        return f"{self.email} - {self.role}"


class GrupoFamiliar(models.Model):
    """Agrupa socios de una misma familia para aplicar descuentos escalonados por cantidad de miembros activos."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='grupos_familiares')
    nombre = models.CharField(max_length=200, help_text="Ej: Familia García")
    apellido_referencia = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.club})"

    @property
    def miembros_activos(self):
        return self.socios.filter(estado='ACTIVO').count()

    @property
    def descuento_porcentaje(self):
        """Descuento escalonado según configuración del club."""
        n = self.miembros_activos
        try:
            config = self.club.configuracion
            if n >= 4:
                return config.descuento_4_mas_hermanos
            if n == 3:
                return config.descuento_3_hermanos
            if n == 2:
                return config.descuento_2_hermanos
        except Exception:
            pass
        return 0

    class Meta:
        verbose_name = "Grupo Familiar"
        verbose_name_plural = "Grupos Familiares"
        unique_together = ('club', 'nombre')


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
    
    POSICION_CHOICES = (
        ('ARQUERO', 'Arquero'),
        ('EXTREMO_IZQ', 'Extremo Izquierdo'),
        ('EXTREMO_DER', 'Extremo Derecho'),
        ('LATERAL_IZQ', 'Lateral Izquierdo'),
        ('LATERAL_DER', 'Lateral Derecho'),
        ('CENTRAL', 'Central'),
        ('PIVOT', 'Pivot'),
    )
    posicion_habitual = models.CharField(max_length=100, choices=POSICION_CHOICES, blank=True, null=True)
    
    # Campo para aclaraciones extras
    observaciones = models.TextField(blank=True, null=True)
    
    # Datos del Tutor (Mandatorio para menores)
    nombre_tutor = models.CharField(max_length=200, blank=True, null=True)
    dni_tutor = models.CharField(max_length=20, blank=True, null=True)
    tel_tutor = models.CharField(max_length=50, blank=True, null=True)
    parentesco_tutor = models.CharField(max_length=100, blank=True, null=True)

    # Nuevo: Dirección
    domicilio = models.CharField(max_length=255, blank=True, null=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Grupo Familiar (para descuento por hermanos)
    grupo_familiar = models.ForeignKey(
        GrupoFamiliar,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='socios',
        help_text="Grupo familiar al que pertenece. Permite calcular descuentos por hermanos."
    )
    
    es_profesor = models.BooleanField(default=False, help_text="Marcar para crear usuario Profesor y asignar como Cuerpo Técnico")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('club', 'nro_socio')

    def __str__(self):
        return f"{self.apellidos}, {self.nombres} - [{self.nro_socio}]"

    def save(self, *args, **kwargs):
        # Auto-generación de nro_socio definitivo (DNI[:2] + 001...)
        is_new = self._state.adding
        if not self.nro_socio:
            prefix = str(self.dni)[:2] if self.dni else "00"
            
            # Buscar la secuencia actual del club
            ultima_secuencia = Socio.objects.filter(club=self.club).count()
            next_num = ultima_secuencia + 1
            self.nro_socio = f"{prefix}{str(next_num).zfill(3)}"

        # Optimización de imagen 4x4 y < 300KB
        if self.foto:
            try:
                img = Image.open(self.foto)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                width, height = img.size
                if width != height:
                    min_dim = min(width, height)
                    left = (width - min_dim) / 2
                    top = (height - min_dim) / 2
                    right = (width + min_dim) / 2
                    bottom = (height + min_dim) / 2
                    img = img.crop((left, top, right, bottom))
                
                img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=85)
                output.seek(0)
                self.foto = ContentFile(output.read(), name=f"{self.nro_socio}.jpg")
            except Exception as e:
                print(f"Error procesando imagen: {e}")
        
        super().save(*args, **kwargs)
        
        # AUTOMATIZACIÓN DE CATEGORÍA (REGLAS CAH)
        try:
            from deportes.models import PerfilDeportivo, Categoria
            perfil, created_p = PerfilDeportivo.objects.get_or_create(socio=self)
            
            # Si es nuevo perfil y el socio tiene fecha nacimiento, categorizar
            if self.fecha_nacimiento:
                categoria_auto = Categoria.get_category_by_age(
                    birth_year=self.fecha_nacimiento.year,
                    gender=self.sexo if self.sexo in ['MASCULINO', 'FEMENINO'] else 'MIXTO',
                    club=self.club
                )
                
                if categoria_auto:
                    perfil.categoria_actual = categoria_auto
                    perfil.habilitado_federacion = True
                    perfil.save()
            
            # Auto-asignación de perfil Entrenador si aplica
            if self.es_profesor and not perfil.posicion_principal:
                perfil.posicion_principal = 'ENTRENADOR'
                perfil.save()
        except Exception as e:
            print(f"Error en categorización automática: {e}")

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
