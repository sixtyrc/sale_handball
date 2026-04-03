from django.utils import timezone
from django.db.models import Sum, Q
from decimal import Decimal
from finanzas.models import CuentaCorriente, MovimientoFinanciero
from admin_club.models import ClubConfig, ConceptoCobrable, Temporada
from .models import PerfilDeportivo, DocumentoDigital

def check_player_health(perfil_id):
    """
    Realiza un chequeo del estado del jugador basado en el ciclo contable del club:
    1. Financiero: Deuda acumulada desde el inicio de temporada (compensada con crédito histórico).
    2. Administrativo: Pago de Seguro/Ficha en temporada activa.
    3. Médico: Apto médico vigente.
    """
    perfil = PerfilDeportivo.objects.select_related('socio', 'categoria_actual').get(id=perfil_id)
    socio = perfil.socio
    club = socio.club
    
    warnings = []
    ahora = timezone.now().date()
    
    # Obtenemos configuración y temporada
    config = ClubConfig.objects.filter(club=club).first()
    temporada_activa = Temporada.objects.filter(club=club, activa=True).first()
    
    # Definimos la fecha de corte (Cutoff)
    # Prioridad: 1. Configuración manual, 2. Temporada activa, 3. Inicio de año actual
    if config and config.inicio_ciclo_contable:
        fecha_corte = config.inicio_ciclo_contable
    elif temporada_activa:
        fecha_corte = temporada_activa.fecha_inicio
    else:
        fecha_corte = ahora.replace(month=1, day=1)

    # 1. Chequeo Financiero Inteligente
    cuenta = getattr(socio, 'cuenta_corriente', None)
    if cuenta:
        # A. Créditos Totales (Lo que el socio PAGÓ o tiene a favor de siempre)
        total_creditos = MovimientoFinanciero.objects.filter(
            cuenta=cuenta, 
            monto__gt=0
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

        # B. Débitos Vigentes (Lo que el socio DEBE desde el inicio biológico/sistema)
        # Incluimos: 
        #   - Movimientos con fecha >= fecha_corte
        #   - Movimientos de tipo SALDO_INICIAL (arrastre manual de deuda previa)
        debitos_vigentes = MovimientoFinanciero.objects.filter(
            cuenta=cuenta,
            monto__lt=0
        ).filter(
            Q(fecha__gte=fecha_corte) | Q(tipo='SALDO_INICIAL')
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

        # C. Saldo de Elegibilidad (Créditos - Débitos Absolutos)
        saldo_eligibility = total_creditos + debitos_vigentes # debitos_vigentes es negativo

        # Obtenemos el valor de la cuota para el umbral (default 2 cuotas)
        valor_cuota = Decimal('3000.00')
        if temporada_activa:
            concepto_cuota = ConceptoCobrable.objects.filter(temporada=temporada_activa, tipo='CUOTA').first()
            if concepto_cuota:
                valor_cuota = concepto_cuota.monto
        
        if saldo_eligibility < -(2 * valor_cuota):
            warnings.append({
                'tipo': 'MOROSIDAD',
                'mensaje': f'Deuda Temporada: ${abs(saldo_eligibility)} (Supera 2 cuotas)',
                'detalles': f'Cortado al {fecha_corte.strftime("%d/%m/%Y")}',
                'severidad': 'CRITICAL'
            })
        elif saldo_eligibility < 0:
            warnings.append({
                'tipo': 'MOROSIDAD',
                'mensaje': f'Deuda Pendiente: ${abs(saldo_eligibility)}',
                'severidad': 'WARNING'
            })
            
    # 2. Chequeo de Seguro / Inscripción (Solo temporada actual)
    t_inicio = temporada_activa.fecha_inicio if temporada_activa else ahora.replace(month=1, day=1)
    pago_seguro = MovimientoFinanciero.objects.filter(
        cuenta__socio=socio,
        tipo__in=['SEGURO', 'FEDERACION'],
        fecha__gte=t_inicio
    ).exists()
    
    if not pago_seguro:
        warnings.append({
            'tipo': 'ADMINISTRATIVO',
            'mensaje': f'Falta Seguro Deportivo {t_inicio.year}',
            'severidad': 'CRITICAL' if temporada_activa else 'WARNING'
        })
            
    # 3. Chequeo Médico (Apto Médico)
    apto = DocumentoDigital.objects.filter(
        socio=perfil.socio, 
        tipo='APTO_FISICO'
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
            'mensaje': f'Apto Médico VENCIDO ({apto.fecha_vencimiento.strftime("%d/%m")})',
            'severidad': 'CRITICAL'
        })
        
    return {
        'habilitado': len([w for w in warnings if w['severidad'] == 'CRITICAL']) == 0,
        'warnings': warnings
    }
