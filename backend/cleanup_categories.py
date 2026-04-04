import os
import django
import sys

# Setup Django Environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio
from deportes.models import Categoria, PerfilDeportivo
from django.db.models import Count

def cleanup():
    print("--- Starting Categories Cleanup ---")
    
    # 1. Find duplicates by Name and Gender (within the same club)
    dupes_info = Categoria.objects.values('nombre', 'genero', 'club').annotate(c=Count('id')).filter(c__gt=1)
    
    for info in dupes_info:
        cats = Categoria.objects.filter(nombre=info['nombre'], genero=info['genero'], club=info['club']).order_by('created_at')
        main_cat = cats[0]
        others = cats[1:]
        
        print(f"Merging {len(others)} duplicates into {main_cat.nombre} ({main_cat.genero}) - ID: {main_cat.id}")
        
        for other in others:
            # Move players
            moved = PerfilDeportivo.objects.filter(categoria_actual=other).update(categoria_actual=main_cat)
            print(f"  Moved {moved} players from {other.id}")
            # Delete dupes
            other.delete()

    print("\n--- Syncing Socio Categorization with corrected CAH logic ---")
    active_socios = Socio.objects.all()
    count = 0
    for s in active_socios:
        try:
            s.save() # This triggers the new auto-categorization
            count += 1
        except Exception as e:
            print(f"Error syncing socio {s.nro_socio}: {e}")

    print(f"Synced {count} socios.")
    print("--- Cleanup Finished ---")

if __name__ == '__main__':
    cleanup()
