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

def deep_cleanup():
    print("--- Starting DEEP Categories Cleanup ---")
    
    # 1. Get all categories and normalize names
    all_cats = Categoria.objects.all()
    groups = {} # (normalized_name, genero, club) -> [ids]
    
    for c in all_cats:
        norm_name = c.nombre.strip().upper()
        key = (norm_name, c.genero, c.club_id)
        if key not in groups:
            groups[key] = []
        groups[key].append(c)

    for key, cats in groups.items():
        if len(cats) > 1:
            main_cat = cats[0]
            others = cats[1:]
            print(f"Merging {len(others)} duplicates for {key[0]} ({key[1]})")
            for other in others:
                # Move players
                moved = PerfilDeportivo.objects.filter(categoria_actual=other).update(categoria_actual=main_cat)
                print(f"  - Moved {moved} players from {other.id} to {main_cat.id}")
                # Delete duplicate
                other.delete()

    print("\n--- Correcting CAH logic sync ---")
    active_socios = Socio.objects.all()
    for s in active_socios:
        # Re-run categorization
        if s.fecha_nacimiento:
            cat_auto = Categoria.get_category_by_age(birth_year=s.fecha_nacimiento.year, gender=s.sexo, club=s.club)
            if cat_auto:
                p, _ = PerfilDeportivo.objects.get_or_create(socio=s)
                p.categoria_actual = cat_auto
                p.save()
    
    print("--- Deep Cleanup Finished ---")

if __name__ == '__main__':
    deep_cleanup()
