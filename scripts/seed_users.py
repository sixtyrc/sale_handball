
import os
import django
import sys

# Setup Django Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
sys.path.append(BACKEND_DIR)

# Set Settings Module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Club

User = get_user_model()

def seed_users():
    club = Club.objects.filter(nombre='Salesianos Handball').first()
    if not club:
        print("Error: Club Salesianos no encontrado. Ejecuta seed_salesianos.py primero.")
        return

    test_users = [
        ('admin', 'admin@salesianos.com.ar', 'admin1234', 'Administrador', 'ADMIN', True),
        ('buffet', 'buffet@salesianos.com.ar', 'buffet1234', 'Operario Buffet', 'PROFESOR', False), # Usamos PROFESOR como fallback si no hay STAFF
        ('coach', 'coach@salesianos.com.ar', 'coach1234', 'Entrenador Prof', 'PROFESOR', False),
    ]

    for username, email, password, name, role, is_super in test_users:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': name,
                'is_superuser': is_super,
                'is_staff': True,
                'club': club,
                'role': role
            }
        )
        if created:
            user.set_password(password)
            user.save()
            print(f"Usuario creado: {username} (Log con Email: {email}) / {password}")
        else:
            print(f"Usuario ya existe: {username}")

if __name__ == '__main__':
    seed_users()
