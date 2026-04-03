import os
import sys
import django

# Setup path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio, Club, CustomUser

def check_status():
    print("--- REPORTE DE ESTADO DE DATOS ---")
    
    # 1. Check current clubs
    clubs = Club.objects.all()
    print(f"Total de Clubes: {clubs.count()}")
    for c in clubs:
        print(f" - Club: {c.nombre} (ID: {c.id})")
    
    # 2. Check total socios
    socios = Socio.objects.all()
    print(f"Total de Socios en TODA la Base: {socios.count()}")
    
    # 3. Check current user (assuming 'admin' or similar)
    users = CustomUser.objects.all()
    for u in users:
        print(f" - Usuario: {u.username} | Club Asociado: {u.club.nombre if u.club else 'NINGUNO'} (Role: {u.role})")
        
    # 4. Filter check (what the API does)
    if users.exists():
        test_user = users.first()
        if test_user.club:
            socios_filtro = Socio.objects.filter(club=test_user.club)
            print(f"Socios visibles para {test_user.username}: {socios_filtro.count()}")
        else:
            print(f"EL USUARIO {test_user.username} NO TIENE CLUB ASOCIADO. No verá nada en la API.")

if __name__ == "__main__":
    check_status()
