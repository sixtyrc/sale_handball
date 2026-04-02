import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio, Club, CustomUser
from datetime import date
import uuid

print("=== DIAGNOSTICO DE BASE DE DATOS POSTGRESQL ===")
club = Club.objects.first()
user = CustomUser.objects.filter(email='admin@salesianos.com.ar').first()

print(f"Club detectado: {club.nombre if club else 'NINGUNO'}")
print(f"User detectado: {user.email if user else 'NINGUNO'}")
if user:
    print(f"User club_id: {user.club_id if user.club else 'NINGUNO'}")

try:
    print("\nIntentando crear socio de prueba...")
    # Usamos un DNI aleatorio para evitar conflictos de registro previo
    test_dni = str(uuid.uuid4())[:8]
    Socio.objects.create(
        club=club,
        dni=test_dni,
        nombres='Prueba',
        apellidos='Postgres',
        fecha_nacimiento=date(2000, 1, 1),
        nro_socio=f'TEST-{test_dni}'
    )
    print("✅ TODO OK: La base de datos responde correctamente para el Socio.")
except Exception as e:
    print(f"❌ ERROR EN POSTGRESQL: {e}")
    import traceback
    traceback.print_exc()

print("=============================================")
