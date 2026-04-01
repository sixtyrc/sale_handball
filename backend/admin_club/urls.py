from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClubConfigView, PublicBrandingView, TemporadaViewSet, ConceptoCobrableViewSet

router = DefaultRouter()
router.register(r'temporadas', TemporadaViewSet, basename='temporadas')
router.register(r'conceptos', ConceptoCobrableViewSet, basename='conceptos')

# Base URL /api/v1/admin-club/
urlpatterns = [
    path('', include(router.urls)),
    path('config/', ClubConfigView.as_view(), name='club-config-detalle'),
    path('branding/<str:subdominio>/', PublicBrandingView.as_view(), name='club-branding-public'),
]
