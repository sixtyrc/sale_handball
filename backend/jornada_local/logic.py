from django.utils import timezone
from decimal import Decimal
from django.db import transaction
from .models import CajaJornada, Jornada

def cerrar_oficialmente_jornada(jornada_id, efectivo_fisico, observaciones=""):
    """
    Lógica de cierre administrativo de la jornada.
    Calcula la diferencia de caja y bloquea la jornada para edición.
    """
    with transaction.atomic():
        jornada = Jornada.objects.select_for_update().get(id=jornada_id)
        
        if jornada.estado == 'FINALIZADA':
            raise ValueError("La jornada ya se encuentra finalizada.")
            
        # Obtenemos o creamos el balance
        balance, created = CajaJornada.objects.get_or_create(jornada=jornada)
        
        # Guardamos el arqueo
        balance.efectivo_declarado = Decimal(str(efectivo_fisico))
        balance.observaciones_cierre = observaciones
        
        # Marcamos la jornada como finalizada
        jornada.estado = 'FINALIZADA'
        jornada.save()
        
        # Calculamos resumen para auditoría inmediata
        resumen = balance.calcular_resumen()
        
        balance.save()
        
        return {
            'jornada': jornada,
            'balance': balance,
            'resumen': resumen
        }

def rendir_a_tesoreria_central(jornada_id):
    """
    Marca la caja como rendida. 
    Idealmente aquí se podría generar un movimiento en la Caja Central del Club
    si quisiéramos integración total, pero el usuario pidió contabilidad separada.
    """
    balance = CajaJornada.objects.get(jornada_id=jornada_id)
    balance.rendida_a_tesoreria = True
    balance.fecha_rendicion = timezone.now()
    balance.save()
    return balance
