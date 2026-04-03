import os
import django
import sys
import uuid

# Configurar entorno Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from deportes.models import Categoria
from core.models import Club

def seed_handball_categories():
    # Obtener el primer club para la precarga (o el club específico si se requiere)
    club = Club.objects.first()
    if not club:
        print("Error: No se encontró ningún Club en la base de datos para asignar categorías.")
        return

    print(f"Precargando categorías para el club: {club.nombre}")

    # Definición de categorías según CAH + Recreativas
    # Formato: (Nombre, Género, Orden de Edad)
    categorias_handball = [
        # Formativas / Infantiles
        ("MINI", "MIXTO", 10),
        ("INFANTILES", "MASCULINO", 12),
        ("INFANTILES", "FEMENINO", 12),
        ("MENORES", "MASCULINO", 14),
        ("MENORES", "FEMENINO", 14),
        
        # Competitivas Juveniles
        ("CADETES", "MASCULINO", 16),
        ("CADETES", "FEMENINO", 16),
        ("JUVENILES", "MASCULINO", 18),
        ("JUVENILES", "FEMENINO", 18),
        ("JUNIORS", "MASCULINO", 21),
        ("JUNIORS", "FEMENINO", 21),
        
        # Mayores / Adultos
        ("PRIMERA DIVISIÓN", "MASCULINO", 30),
        ("PRIMERA DIVISIÓN", "FEMENINO", 30),
        
        # Recreativas No Oficiales (Papis/Mamis)
        ("PAPIS HANDBALL", "MASCULINO", 99),
        ("MAMIS HANDBALL", "FEMENINO", 99),
    ]

    count = 0
    for nombre, genero, orden in categorias_handball:
        obj, created = Categoria.objects.get_or_create(
            club=club,
            nombre=nombre,
            genero=genero,
            defaults={'orden': orden, 'descripcion': f'Categoría oficial precargada para {nombre}'}
        )
        if created:
            count += 1
            print(f"+ Categoría creada: {nombre} ({genero})")
        else:
            print(f"~ Categoría ya existente: {nombre} ({genero})")

    print(f"\nProceso finalizado. Se crearon {count} nuevas categorías.")

if __name__ == "__main__":
    seed_handball_categories()
