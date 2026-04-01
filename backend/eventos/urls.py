from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventoViewSet

router = DefaultRouter()
router.register(r'eventos', EventoViewSet, basename='evento')

# Base URL /api/v1/actividad/ o /api/v1/
# La dejo genérica para empalmar con la raíz.
urlpatterns = [
    path('', include(router.urls)),
]
