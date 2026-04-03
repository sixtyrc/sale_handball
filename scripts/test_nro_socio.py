import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio, Club

# Get first club
club = Club.objects.first()
if not club:
    print("No club found")
    sys.exit(1)

# Create a test socio with DNI 49...
test_socio = Socio(
    club=club,
    dni="49TEST01",
    nombres="Test",
    apellidos="Socio",
    fecha_nacimiento="2000-01-01"
)
test_socio.save()

print(f"Created Socio with DNI {test_socio.dni} -> NRO: {test_socio.nro_socio}")

# Cleanup
# test_socio.delete()
