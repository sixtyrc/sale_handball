
import os
import django
import sys

# Setup Django Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
sys.path.append(BACKEND_DIR)

# Set Settings Module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users_to_reset = {
    'admin': 'admin1234',
    'coach': 'coach1234',
    'buffet': 'buffet1234'
}

for username, new_password in users_to_reset.items():
    try:
        user = User.objects.get(username=username)
        user.set_password(new_password)
        user.save()
        print(f"Password reset for user: {username} -> {new_password}")
    except User.DoesNotExist:
        print(f"User not found: {username}")
