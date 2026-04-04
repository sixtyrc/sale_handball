import os
import django
import sys
sys.path.append('d:/Proyectos/Salesianos/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser

targets = ['buffet', 'coach']
deleted, _ = CustomUser.objects.filter(username__in=targets).delete()
print(f"USUARIOS ELIMINADOS: {deleted}")
