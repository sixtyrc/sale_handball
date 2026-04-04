import os
import django

# No sys.path modification needed if run from here?
# Actually, always safer:
import sys
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CustomUser

# Reset both possible admins just in case
print("--- ALL USERS ---")
for u in CustomUser.objects.all():
    print(f"U: {u.username} | E: {u.email} | R: {u.role}")

for user_val in ['admin', 'admin@salesianos.com.ar']:
    u = CustomUser.objects.filter(username=user_val).first() or CustomUser.objects.filter(email=user_val).first()
    if u:
        u.set_password('Admin1234!')
        u.save()
        print(f"Password reset for: {u.username}")
    else:
        print(f"User not found: {user_val}")
