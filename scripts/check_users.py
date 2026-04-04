import os
import django
import sys
sys.path.append('d:/Proyectos/Salesianos/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser

print("LISTA DE USUARIOS (CustomUser):")
for u in CustomUser.objects.all():
    print(f"[{u.id}] {u.username} | Role: {u.role} | Name: {u.first_name} {u.last_name}")
