import os
import django
import sys

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser

def reset():
    print("--- List of Current Users ---")
    for u in CustomUser.objects.all():
        print(f"Username: '{u.username}' | Email: '{u.email}' | Role: {u.role}")

    # Set password for the requested admin
    # The user says admin@salesianos.com.ar is the one.
    admins = CustomUser.objects.filter(username='admin@salesianos.com.ar')
    if not admins.exists():
        admins = CustomUser.objects.filter(email='admin@salesianos.com.ar')

    if admins.exists():
        u = admins.first()
        u.set_password('Admin1234!')
        u.save()
        print(f"\nSUCCESS: Password for '{u.username}' has been set to 'Admin1234!'")
    else:
        print("\nERROR: No user found with username or email 'admin@salesianos.com.ar'")

if __name__ == '__main__':
    reset()
