import os
import django
import sys
sys.path.append('d:/Proyectos/Salesianos/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio

print("LISTA COMPLETA DE SOCIOS:")
for s in Socio.objects.all():
    print(f"[{s.id}] {s.apellidos}, {s.nombres} | Prof: {s.es_profesor}")
