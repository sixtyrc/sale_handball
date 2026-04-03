import os
import sys
import django
from decimal import Decimal
from django.db.models import Sum, Q

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio
from finanzas.models import MovimientoFinanciero
from admin_club.models import ClubConfig, Temporada
from deportes.eligibility import check_player_health

def check_tomasi():
    socio = Socio.objects.filter(nro_socio='49200').first()
    if not socio:
        print("Socio 49200 no encontrado.")
        return

    print(f"--- ANALIZANDO SOCIO: {socio.apellidos}, {socio.nombres} ---")
    
    # 1. Configurar fecha de corte simulada si no hay
    config, _ = ClubConfig.objects.get_or_create(club=socio.club)
    import datetime
    config.inicio_ciclo_contable = datetime.date(2026, 4, 1) # Suponiendo que la temporada arranca en Abril
    config.save()
    
    print(f"Fecha de Corte configurada: {config.inicio_ciclo_contable}")

    # 2. Ver movimientos
    movs = MovimientoFinanciero.objects.filter(cuenta__socio=socio)
    print(f"\nResumen de Movimientos:")
    for m in movs:
        print(f"  - {m.fecha} | {m.tipo} | {m.monto} | {m.descripcion}")

    # 3. Calcular según nueva lógica
    total_creditos = movs.filter(monto__gt=0).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')
    debitos_vigentes = movs.filter(monto__lt=0).filter(
        Q(fecha__gte=config.inicio_ciclo_contable) | Q(tipo='SALDO_INICIAL')
    ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')
    
    saldo_elig = total_creditos + debitos_vigentes
    
    print(f"\nResultados Nueva Lógica:")
    print(f"  Créditos Totales (A favor): ${total_creditos}")
    print(f"  Débitos Vigentes (Desde Abril o Saldo Inicial): ${debitos_vigentes}")
    print(f"  SALDO PARA ELEGIBILIDAD: ${saldo_elig}")
    
    # 4. Check real via function
    # Necesitamos el perfil deportivo
    perfil = socio.perfil_deportivo
    status = check_player_health(perfil.id)
    print(f"\nStatus Final: {'HABILITADO' if status['habilitado'] else 'BLOQUEADO'}")
    for w in status['warnings']:
        print(f"  WARN: {w['mensaje']} ({w['severidad']})")

if __name__ == "__main__":
    check_tomasi()
