import uuid
from datetime import date
from django.db import models
from django.conf import settings
from core.models import Socio, Club

class Categoria(models.Model):
    GENERO_CHOICES = (
        ('MASCULINO', 'Masculino'),
        ('FEMENINO', 'Femenino'),
        ('MIXTO', 'Mixto'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='categorias')
    nombre = models.CharField(max_length=100) # Ej. Sub-8, Minis, Infantiles, Menores, Cadetes, Juveniles, Juniors, Mayores
    descripcion = models.TextField(blank=True, null=True)
    genero = models.CharField(max_length=20, choices=GENERO_CHOICES)
    orden = models.PositiveIntegerField(default=0, help_text="Orden de edad (0=Mayores, 1=Juniors, 2=Juveniles, etc. o viceversa)")
    activo = models.BooleanField(default=True, help_text="Permite desactivar categorías que el club no utiliza (ej. Senior)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.genero})"

    @classmethod
    def get_category_by_age(cls, club, birth_year, gender):
        """
        Lógica de Categorización Automática (Confederación Argentina de Handball - CAH)
        Basada en el año calendario actual.
        """
        current_year = date.today().year
        age = current_year - birth_year
        
        # Mapeo de categorías estándar CAH
        target_name = "Primera"
        if age <= 8: target_name = "Mini" # Promocional
        elif age <= 10: target_name = "Infantiles"
        elif age <= 12: target_name = "Menores"
        elif age <= 14: target_name = "Cadetes"
        elif age <= 16: target_name = "Juveniles"
        elif age <= 18: target_name = "Juniors"
        else: target_name = "Mayores"

        # Buscamos la categoría en el club que coincida con el nombre y género
        # Nota: CAH separa por género, pero algunas categorías base pueden ser Mixto
        return cls.objects.filter(
            club=club, 
            nombre__icontains=target_name,
            genero__in=[gender, 'MIXTO'],
            activo=True
        ).first()

class PerfilDeportivo(models.Model):
    POSICION_CHOICES = (
        ('ARQUERO', 'Arquero'),
        ('EXTREMO_IZQ', 'Extremo Izquierdo'),
        ('EXTREMO_DER', 'Extremo Derecho'),
        ('LATERAL_IZQ', 'Lateral Izquierdo'),
        ('LATERAL_DER', 'Lateral Derecho'),
        ('CENTRAL', 'Central'),
        ('PIVOT', 'Pivot'),
        ('ENTRENADOR', 'Entrenador'),
        ('AYUDANTE', 'Ayudante Técnico'),
        ('DELEGADO', 'Delegado'),
    )
    
    MANO_HABIL_CHOICES = (
        ('DERECHA', 'Derecha'),
        ('IZQUIERDA', 'Izquierda'),
        ('AMBIDIESTRO', 'Ambidiestro'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    socio = models.OneToOneField(Socio, on_delete=models.CASCADE, related_name='perfil_deportivo')
    categoria_actual = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True, related_name='jugadores')
    
    posicion_principal = models.CharField(max_length=30, choices=POSICION_CHOICES, blank=True, null=True)
    posicion_secundaria = models.CharField(max_length=30, choices=POSICION_CHOICES, blank=True, null=True)
    mano_habil = models.CharField(max_length=20, choices=MANO_HABIL_CHOICES, blank=True, null=True)
    
    altura_cm = models.PositiveIntegerField(blank=True, null=True)
    peso_kg = models.PositiveIntegerField(blank=True, null=True)
    
    nro_camiseta = models.PositiveIntegerField(blank=True, null=True)
    nro_federacion = models.CharField(max_length=50, blank=True, null=True)
    habilitado_federacion = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil Deportivo: {self.socio}"

    @property
    def apto_medico_vigente(self):
        apto = self.socio.documentos.filter(tipo='APTO_FISICO', estado_validacion='APROBADO').last()
        if apto and apto.fecha_vencimiento and apto.fecha_vencimiento >= date.today():
             return True
        return False

    @property
    def puede_jugar(self):
        # Inhabilitar por lesión
        if self.socio.lesiones.filter(estado='ACTIVA').exists():
            return False
        return self.habilitado_federacion and self.apto_medico_vigente


def documento_path(instance, filename):
    return f"documentos/club_{instance.socio.club.id}/socio_{instance.socio.id}/{filename}"

class DocumentoDigital(models.Model):
    TIPO_DOC_CHOICES = (
        ('DNI', 'DNI (Frente y Dorso)'),
        ('AUTORIZACION_TUTOR', 'Autorización Tutor (Menores)'),
        ('CONSENTIMIENTO_IMAGEN', 'Consentimiento de Imagen'),
        ('APTO_FISICO', 'Certificado de Apto Físico'),
        ('FICHA_FEDERATIVA', 'Ficha de Federación'),
        ('OTRO', 'Otro Documento'),
    )
    
    ESTADO_VALIDACION_CHOICES = (
        ('PENDIENTE', 'Pendiente de Revisión'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='documentos')
    tipo = models.CharField(max_length=50, choices=TIPO_DOC_CHOICES)
    archivo = models.FileField(upload_to=documento_path, null=True, blank=True)
    
    fecha_emision = models.DateField(blank=True, null=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    
    estado_validacion = models.CharField(max_length=20, choices=ESTADO_VALIDACION_CHOICES, default='PENDIENTE')
    observaciones = models.TextField(blank=True, null=True)
    
    subido_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='docs_subidos')
    validado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='docs_validados')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.socio}"

    @property
    def is_vencido(self):
        if self.fecha_vencimiento:
            return self.fecha_vencimiento < date.today()
        return False

class AsignacionProfe(models.Model):
    """
    IMPORTANTE: Permite flexibilidad para que un profesor maneje 
    varias categorías y ramas (Masculino/Femenino) a la vez.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario_profe = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asignaciones_categorias')
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='profesores_asignados')
    
    # Campo opcional para distinguir rol en el cuerpo técnico de esa categoría
    rol_especifico = models.CharField(max_length=100, blank=True, null=True, help_text="Ej: Preparador Físico, Ayudante, Profe Principal")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario_profe', 'categoria')
        verbose_name = "Asignación de Profesor"
        verbose_name_plural = "Asignaciones de Profesores"

    def __str__(self):
        return f"{self.usuario_profe.email} -> {self.categoria}"

class Lesion(models.Model):
    CONTEXTO_CHOICES = (
        ('PARTIDO_OFICIAL', 'Partido Oficial'),
        ('PARTIDO_AMISTOSO', 'Partido Amistoso'),
        ('ENTRENAMIENTO', 'Entrenamiento'),
        ('PARTICULAR', 'Particular / Fuera del club'),
    )
    ESTADO_CHOICES = (
        ('ACTIVA', 'Activa'),
        ('RECUPERADA', 'Recuperada'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    socio = models.ForeignKey('core.Socio', on_delete=models.CASCADE, related_name='lesiones')
    
    fecha_lesion = models.DateField()
    fecha_probable_alta = models.DateField(blank=True, null=True)
    fecha_alta_real = models.DateField(blank=True, null=True)
    
    contexto = models.CharField(max_length=50, choices=CONTEXTO_CHOICES)
    diagnostico = models.TextField()
    
    uso_seguro = models.BooleanField(default=False)
    observaciones_seguro = models.TextField(blank=True, null=True, help_text="Datos de la póliza, nro siniestro, etc.")
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVA')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Lesión"
        verbose_name_plural = "Lesiones"
        ordering = ['-fecha_lesion']

    def __str__(self):
        return f"{self.socio} - {self.diagnostico[:30]} ({self.estado})"
