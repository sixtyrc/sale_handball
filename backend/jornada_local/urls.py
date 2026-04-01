from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JornadaViewSet, 
    VoluntarioViewSet, 
    DonacionCantinaViewSet,
    KioscoViewSet
)

router = DefaultRouter()
router.register(r'jornadas', JornadaViewSet, basename='jornada')
router.register(r'voluntarios', VoluntarioViewSet, basename='voluntario')
router.register(r'donaciones', DonacionCantinaViewSet, basename='donacion')
router.register(r'kiosco', KioscoViewSet, basename='kiosco')

urlpatterns = [
    path('', include(router.urls)),
]
