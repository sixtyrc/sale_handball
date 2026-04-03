from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, ClubViewSet, SocioViewSet, SocioPublicCheckView, GrupoFamiliarViewSet,
    CambiarPasswordView, SolicitarResetPasswordView, ConfirmarResetPasswordView
)

router = DefaultRouter()
router.register(r'clubs', ClubViewSet)
router.register(r'socios', SocioViewSet, basename='socios')
router.register(r'grupos-familiares', GrupoFamiliarViewSet, basename='grupos-familiares')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('validar-carnet/<uuid:socio_id>/', SocioPublicCheckView.as_view(), name='public-check'),
    # Auth - Portal del Socio
    path('auth/cambiar-password/', CambiarPasswordView.as_view(), name='cambiar-password'),
    path('auth/solicitar-reset/', SolicitarResetPasswordView.as_view(), name='solicitar-reset'),
    path('auth/confirmar-reset/', ConfirmarResetPasswordView.as_view(), name='confirmar-reset'),
    path('', include(router.urls)),
]
