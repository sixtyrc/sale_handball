from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, ClubViewSet, SocioViewSet, SocioPublicCheckView

router = DefaultRouter()
router.register(r'clubs', ClubViewSet)
router.register(r'socios', SocioViewSet, basename='socios')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('validar-carnet/<uuid:socio_id>/', SocioPublicCheckView.as_view(), name='public-check'),
    path('', include(router.urls)),
]
