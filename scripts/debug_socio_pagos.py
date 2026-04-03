import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio
from finanzas.models import MovimientoFinanciero

socio = Socio.objects.get(dni='49200184')
print(f"Socio: {socio.apellidos}, {socio.nombres} (#{socio.nro_socio})")
print(f"Propiedad vencimiento: {socio.vencimiento_carnet}")

movs = MovimientoFinanciero.objects.filter(cuenta__socio=socio)
print(f"\nMovimientos ({movs.count()}):")
for m in movs:
    print(f"- {m.fecha} | {m.tipo} | {m.monto} | {m.descripcion}")
