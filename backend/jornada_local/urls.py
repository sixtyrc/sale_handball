from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Por ahora vacío, lo poblaremos en el siguiente paso
router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
