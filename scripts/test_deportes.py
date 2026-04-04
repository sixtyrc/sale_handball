import os
import django
import sys

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Socio, Club, CustomUser
from deportes.models import Categoria, PerfilDeportivo
from datetime import date

def test_autocategorization():
    club = Club.objects.first()
    if not club:
        print("No clubs exist.")
        return

    # Check if a category exists for Menores (usually 11-12 years old, so born around 2014)
    cat, _ = Categoria.objects.get_or_create(club=club, nombre='Menores', genero='MASCULINO')

    print(f"Borrando socio de prueba si existe...")
    Socio.objects.filter(dni='TEST1234').delete()

    print(f"Creando socio edad Menores (ej. nació hace 12 años)...")
    socio = Socio(
        club=club,
        dni='TEST1234',
        nombres='Test',
        apellidos='AutoCategeria',
        fecha_nacimiento=date(date.today().year - 12, 1, 1),
        sexo='MASCULINO'
    )
    socio.save()

    print(f"Socio guardado. ID: {socio.id}, Nro: {socio.nro_socio}")

    # Verificar si tiene PerfilDeportivo
    try:
        perfil = PerfilDeportivo.objects.get(socio=socio)
        print(f"¡ÉXITO! Perfil deportivo creado.")
        print(f"Categoría asignada: {perfil.categoria_actual}")
        if perfil.categoria_actual and 'Menores' in perfil.categoria_actual.nombre:
            print("LA AUTOCATEGORIZACIÓN FUNCIONÓ CORRECTAMENTE.")
        else:
            print("LA CATEGORÍA ES INCORRECTA O NULA.")
    except PerfilDeportivo.DoesNotExist:
        print("FRACASO: No se creó perfil deportivo.")

if __name__ == '__main__':
    test_autocategorization()
