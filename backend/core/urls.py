from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, ClubViewSet, SocioViewSet

router = DefaultRouter()
router.register(r'clubs', ClubViewSet)
router.register(r'socios', SocioViewSet, basename='socios')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]
