
import uuid
from core.models import Club
club, created = Club.objects.get_or_create(
    id=uuid.UUID('00000000-0000-0000-0000-000000000001'), 
    defaults={'nombre': 'Salesianos Handball'}
)
print(f"Club: {club.nombre} (ID: {club.id}) - Creado: {created}")
