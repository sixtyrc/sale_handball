import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio

socios = Socio.objects.all().order_by('nro_socio')
for s in socios:
    print(f"DNI: {s.dni} | NRO: {s.nro_socio}")
