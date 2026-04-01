
import os
import django
import uuid

import sys

# Setup Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from core.models import Club

def seed_club():
    # ID estático para Salesianos (como el usuario pidió 'ID 1')
    # Usaremos un UUID que termine en ...1 para consistencia
    SALESIANOS_ID = uuid.UUID('00000000-0000-0000-0000-000000000001')
    
    club, created = Club.objects.get_or_create(
        id=SALESIANOS_ID,
        defaults={'nombre': 'Salesianos Handball'}
    )
    
    if created:
        print(f"Club '{club.nombre}' creado con ID: {club.id}")
    else:
        print(f"Club '{club.nombre}' ya existe. ID: {club.id}")

if __name__ == '__main__':
    seed_club()
