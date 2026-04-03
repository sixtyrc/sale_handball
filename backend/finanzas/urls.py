from django.urls import path
from .views import (
    CuentaCorrienteView,
    CuentaCorrienteListView,
    RegistrarMovimientoView,
    GenerarCuotasMasivasView,
    SaldoInicialView,
    GenerarReciboPDFView,
    AvisoPagoSocioView,
    AvisoPagoAdminView,
    ValidarAvisoView,
    RechazarAvisoView,
)

urlpatterns = [
    path('socios/<uuid:socio_id>/cuenta/', CuentaCorrienteView.as_view(), name='cuenta-corriente'),
    path('cuentas/', CuentaCorrienteListView.as_view(), name='listar-cuentas'),
    path('movimientos/', RegistrarMovimientoView.as_view(), name='registrar-movimiento'),
    path('movimientos/<uuid:pk>/pdf/', GenerarReciboPDFView.as_view(), name='generar-pdf'),
    path('cuotas/generar/', GenerarCuotasMasivasView.as_view(), name='generar-cuotas'),
    path('saldo-inicial/', SaldoInicialView.as_view(), name='saldo-inicial'),
    # Avisos de pago
    path('mis-avisos/', AvisoPagoSocioView.as_view(), name='mis-avisos'),
    path('avisos/', AvisoPagoAdminView.as_view(), name='admin-avisos'),
    path('avisos/<uuid:pk>/validar/', ValidarAvisoView.as_view(), name='validar-aviso'),
    path('avisos/<uuid:pk>/rechazar/', RechazarAvisoView.as_view(), name='rechazar-aviso'),
]
