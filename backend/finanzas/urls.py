from django.urls import path
from .views import (
    CuentaCorrienteView,
    RegistrarMovimientoView,
    GenerarCuotasMasivasView,
    SaldoInicialView,
)

urlpatterns = [
    path('socios/<uuid:socio_id>/cuenta/', CuentaCorrienteView.as_view(), name='cuenta-corriente'),
    path('movimientos/', RegistrarMovimientoView.as_view(), name='registrar-movimiento'),
    path('cuotas/generar/', GenerarCuotasMasivasView.as_view(), name='generar-cuotas'),
    path('saldo-inicial/', SaldoInicialView.as_view(), name='saldo-inicial'),
]
