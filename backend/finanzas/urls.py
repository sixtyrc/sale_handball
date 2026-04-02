from django.urls import path
from .views import (
    CuentaCorrienteView,
    CuentaCorrienteListView,
    RegistrarMovimientoView,
    GenerarCuotasMasivasView,
    SaldoInicialView,
    GenerarReciboPDFView,
)

urlpatterns = [
    path('socios/<uuid:socio_id>/cuenta/', CuentaCorrienteView.as_view(), name='cuenta-corriente'),
    path('cuentas/', CuentaCorrienteListView.as_view(), name='listar-cuentas'),
    path('movimientos/', RegistrarMovimientoView.as_view(), name='registrar-movimiento'),
    path('movimientos/<uuid:pk>/pdf/', GenerarReciboPDFView.as_view(), name='generar-pdf'),
    path('cuotas/generar/', GenerarCuotasMasivasView.as_view(), name='generar-cuotas'),
    path('saldo-inicial/', SaldoInicialView.as_view(), name='saldo-inicial'),
]
