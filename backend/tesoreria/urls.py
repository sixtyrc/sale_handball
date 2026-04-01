from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CajaDiariaViewSet, 
    PagoRecibidoViewSet, 
    ProductoMerchandisingViewSet,
    MercadoPagoQRGeneratorView
)

router = DefaultRouter()
router.register(r'cajas', CajaDiariaViewSet, basename='caja')
router.register(r'pagos', PagoRecibidoViewSet, basename='pago')
router.register(r'tienda', ProductoMerchandisingViewSet, basename='tienda')

urlpatterns = [
    path('', include(router.urls)),
    path('mercadopago/config/', MercadoPagoQRGeneratorView.as_view(), name='mp-config'),
]
