from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import Socio
from .models import CuentaCorriente


@receiver(post_save, sender=Socio)
def crear_cuenta_corriente(sender, instance, created, **kwargs):
    """
    Crea automáticamente la CuentaCorriente cada vez que se crea un Socio nuevo.
    Si por alguna razón ya existe (migración manual), usa get_or_create para evitar duplicados.
    """
    if created:
        CuentaCorriente.objects.get_or_create(socio=instance)
