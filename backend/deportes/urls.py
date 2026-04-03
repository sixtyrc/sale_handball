from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, PerfilDeportivoViewSet, DocumentoDigitalViewSet, LesionViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categorias')
router.register(r'perfiles', PerfilDeportivoViewSet, basename='perfiles')
router.register(r'documentos', DocumentoDigitalViewSet, basename='documentos')
router.register(r'lesiones', LesionViewSet, basename='lesiones')

urlpatterns = [
    path('', include(router.urls)),
]
