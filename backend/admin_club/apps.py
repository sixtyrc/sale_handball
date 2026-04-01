from django.apps import AppConfig

class AdminClubConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_club'

    def ready(self):
        import admin_club.models  # noqa: F401
