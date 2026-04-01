from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.models import Socio
from .models import CuentaCorriente, MovimientoFinanciero
from .serializers import (
    CuentaCorrienteSerializer, MovimientoFinancieroSerializer,
    GenerarCuotasSerializer, SaldoInicialSerializer
)


class IsAdminRole(IsAuthenticated):
    """Permiso: solo usuarios con role ADMIN del mismo club."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'ADMIN'


class CuentaCorrienteView(APIView):
    """GET /api/v1/finanzas/socios/{socio_id}/cuenta/ → Saldo + historial de movimientos."""
    permission_classes = [IsAuthenticated]

    def get(self, request, socio_id):
        try:
            cuenta = CuentaCorriente.objects.get(
                socio__id=socio_id,
                socio__club=request.user.club
            )
        except CuentaCorriente.DoesNotExist:
            return Response({'error': 'Cuenta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CuentaCorrienteSerializer(cuenta)
        return Response(serializer.data)


class RegistrarMovimientoView(APIView):
    """POST /api/v1/finanzas/movimientos/ → Registra un movimiento individual."""
    permission_classes = [IsAdminRole]

    def post(self, request):
        socio_id = request.data.get('socio_id')
        if not socio_id:
            return Response({'error': 'socio_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cuenta, _ = CuentaCorriente.objects.get_or_create(
                socio__id=socio_id,
                socio__club=request.user.club,
                defaults={'socio': Socio.objects.get(id=socio_id, club=request.user.club)}
            )
        except Socio.DoesNotExist:
            return Response({'error': 'Socio no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        data = {**request.data, 'cuenta': cuenta.id}
        serializer = MovimientoFinancieroSerializer(data=data)

        if serializer.is_valid():
            serializer.save(cuenta=cuenta, creado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GenerarCuotasMasivasView(APIView):
    """POST /api/v1/finanzas/cuotas/generar/ → Genera cuotas para todos los socios ACTIVOS del club."""
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = GenerarCuotasSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        monto = -abs(serializer.validated_data['monto'])  # Débito = negativo
        descripcion = serializer.validated_data['descripcion']
        fecha = serializer.validated_data['fecha']

        socios_activos = Socio.objects.filter(club=request.user.club, estado='ACTIVO')

        movimientos_creados = 0
        with transaction.atomic():
            for socio in socios_activos:
                cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)
                MovimientoFinanciero.objects.create(
                    cuenta=cuenta,
                    tipo='CUOTA',
                    monto=monto,
                    descripcion=descripcion,
                    fecha=fecha,
                    creado_por=request.user
                )
                movimientos_creados += 1

        return Response({
            'message': f'Cuotas generadas exitosamente para {movimientos_creados} socios activos.',
            'socios_procesados': movimientos_creados,
            'monto': abs(monto),
            'fecha': fecha
        }, status=status.HTTP_201_CREATED)


class SaldoInicialView(APIView):
    """POST /api/v1/finanzas/saldo-inicial/ → Carga la deuda histórica para un socio."""
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = SaldoInicialSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            socio = Socio.objects.get(
                id=serializer.validated_data['socio_id'],
                club=request.user.club
            )
        except Socio.DoesNotExist:
            return Response({'error': 'Socio no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)
        monto = -abs(serializer.validated_data['monto'])  # Deuda inicial = débito

        with transaction.atomic():
            movimiento = MovimientoFinanciero.objects.create(
                cuenta=cuenta,
                tipo='SALDO_INICIAL',
                monto=monto,
                descripcion=serializer.validated_data['descripcion'],
                fecha=serializer.validated_data['fecha'],
                creado_por=request.user
            )

        return Response({
            'message': 'Saldo inicial registrado correctamente.',
            'movimiento_id': str(movimiento.id),
            'saldo_actual': str(cuenta.saldo)
        }, status=status.HTTP_201_CREATED)
