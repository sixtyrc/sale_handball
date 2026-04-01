from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, permissions, status, views, response
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CajaDiaria, PagoRecibido, ProductoMerchandising
from core.models import Socio
from .serializers import (
    CajaDiariaSerializer, 
    PagoRecibidoSerializer, 
    ProductoMerchandisingSerializer,
    CajaAccionSerializer
)

class IsAdminOrTesorero(permissions.BasePermission):
    """Solo administradores o tesoreros del club pueden gestionar la caja."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Por ahora dejamos que ADMIN y administrativos operen la caja
        return request.user.role in ['ADMIN', 'DIRIGENTE']

class CajaDiariaViewSet(viewsets.ModelViewSet):
    serializer_class = CajaDiariaSerializer
    permission_classes = [IsAdminOrTesorero]

    def get_queryset(self):
        # Filtro multi-tenant estricto
        return CajaDiaria.objects.filter(club=self.request.user.club)

    def perform_create(self, serializer):
        # Al crear caja se asigna automáticamente al usuario actual y club
        serializer.save(
            club=self.request.user.club, 
            usuario_responsable=self.request.user,
            monto_esperado_sistema=serializer.validated_data.get('monto_apertura', Decimal('0.00'))
        )

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar_caja(self, request, pk=None):
        caja = self.get_object()
        if caja.estado == 'CERRADA':
            return Response({'error': 'La caja ya se encuentra cerrada.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CajaAccionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            caja.estado = 'CERRADA'
            caja.monto_cierre = serializer.validated_data['monto']
            caja.observaciones = f"{caja.observaciones}\nCierre: {serializer.validated_data.get('observaciones', '')}"
            caja.closed_at = timezone.now()
            caja.save()

        return Response(CajaDiariaSerializer(caja).data)

    @action(detail=False, methods=['get'], url_path='actual')
    def caja_actual(self, request):
        """Devuelve la caja abierta actual (si existe)."""
        caja = CajaDiaria.objects.filter(club=request.user.club, estado='ABIERTA').first()
        if not caja:
            return Response({'status': 'SIN_CAJA_ABIERTA'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CajaDiariaSerializer(caja)
        return Response(serializer.data)

class PagoRecibidoViewSet(viewsets.ModelViewSet):
    serializer_class = PagoRecibidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PagoRecibido.objects.filter(caja__club=self.request.user.club)

    def perform_create(self, serializer):
        # Al registrar un pago se inyecta el usuario actual
        # y se valida que la caja pertenezca al club.
        caja = serializer.validated_data.get('caja')
        if caja.club != self.request.user.club:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No puedes registrar un pago en una caja de otro club.")
            
        serializer.save(usuario_cobrador=self.request.user)

class ProductoMerchandisingViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoMerchandisingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProductoMerchandising.objects.filter(club=self.request.user.club)

    def perform_create(self, serializer):
        serializer.save(club=self.request.user.club)

class MercadoPagoQRGeneratorView(views.APIView):
    """
    Simulación de endpoint para descargar el QR de Mercado Pago configurado.
    En una segunda etapa llamará a la API real de MP. 
    Por ahora devuelve un mensaje de éxito con la config.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.conf import settings
        mp_config = {
            'public_key': getattr(settings, 'MP_PUBLIC_KEY', 'TEST-KEY'),
            'status': 'READY',
            'note': 'Muestra el QR del club para recibir pagos automáticos'
        }
        return Response(mp_config)
