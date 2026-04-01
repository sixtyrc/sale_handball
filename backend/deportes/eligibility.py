from django.utils import timezone
from decimal import Decimal
from finanzas.models import CuentaCorriente, MovimientoFinanciero
from admin_club.models import ConceptoCobrable, Temporada
from .models import PerfilDeportivo, DocumentoDigital

def check_player_health(perfil_id):
    """
    Realiza un chequeo exhaustivo (no bloqueante) del estado del jugador:
    1. Financiero (Deuda > 2 cuotas sociales)
    2. Seguro/Ficha (Pago en temporada activa)
    3. Médico (Apto médico vigente)
    """
    perfil = PerfilDeportivo.objects.select_related('socio', 'categoria', 'club').get(id=perfil_id)
    socio = perfil.socio
    club = perfil.club
    
    warnings = []
    ahora = timezone.now().date()
    temporada_activa = Temporada.objects.filter(club=club, activa=True).first()
    
    # 1. Chequeo Financiero (Deuda > 2 cuotas)
    # Buscamos el valor de la cuota social en ConceptoCobrable si existe
    valor_cuota = Decimal('2000.00') # Valor default por si no está configurado
    if temporada_activa:
        concepto_cuota = ConceptoCobrable.objects.filter(temporada=temporada_activa, tipo='CUOTA').first()
        if concepto_cuota:
            valor_cuota = concepto_cuota.monto
            
    cuenta = getattr(socio, 'cuenta_corriente', None)
    if cuenta and cuenta.saldo < -(2 * valor_cuota):
        warnings.append({
            'tipo': 'MOROSIDAD',
            'mensaje': f'Deuda de ${abs(cuenta.saldo)} (Supera 2 cuotas)',
            'severidad': 'CRITICAL'
        })
        
    # 2. Chequeo de Seguro/Ficha Federativa
    if temporada_activa:
        # Buscamos movimientos de tipo SEGURO o FEDERACION para este socio en esta temporada
        pagos_temporada = MovimientoFinanciero.objects.filter(
            cuenta__socio=socio,
            tipo__in=['SEGURO', 'FEDERACION'],
            created_at__gte=temporada_activa.fecha_inicio
        ).exists()
        
        if not pagos_temporada:
            warnings.append({
                'tipo': 'ADMINISTRATIVO',
                'mensaje': 'Sin registro de pago de Seguro o Ficha Federativa 2026.',
                'severidad': 'WARNING'
            })
            
    # 3. Chequeo Médico (Apto Médico)
    apto = DocumentoDigital.objects.filter(
        perfil=perfil, 
        tipo='APTO_MEDICO'
    ).order_by('-fecha_vencimiento').first()
    
    if not apto:
        warnings.append({
            'tipo': 'MEDICO',
            'mensaje': 'Falta cargar Apto Médico.',
            'severidad': 'CRITICAL'
        })
    elif apto.fecha_vencimiento < ahora:
        warnings.append({
            'tipo': 'MEDICO',
            'mensaje': f'Apto Médico VENCIDO el {apto.fecha_vencimiento.strftime("%d/%m/%Y")}.',
            'severidad': 'CRITICAL'
        })
        
    return {
        'habilitado': len([w for w in warnings if w['severidad'] == 'CRITICAL']) == 0,
        'warnings': warnings
    }
