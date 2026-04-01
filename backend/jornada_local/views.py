from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.http import HttpResponse
from .models import Jornada, Voluntario, DonacionCantina, VentaJornada, CajaJornada
from .serializers import (
    JornadaListSerializer, JornadaDetailSerializer, 
    VoluntarioSerializer, DonacionCantinaSerializer, 
    VentaJornadaSerializer, CajaJornadaSerializer,
    KioscoJornadaSerializer
)
from .logic import cerrar_oficialmente_jornada, rendir_a_tesoreria_central
from .reports import generar_pdf_ficha_jornada

class EsAdminClub(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'DIRIGENTE']

class JornadaViewSet(viewsets.ModelViewSet):
    permission_classes = [EsAdminClub]

    def get_queryset(self):
        return Jornada.objects.filter(club=self.request.user.club).order_by('-fecha')

    def get_serializer_class(self):
        if self.action == 'list':
            return JornadaListSerializer
        return JornadaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(club=self.request.user.club)

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar_jornada(self, request, pk=None):
        jornada = self.get_object()
        efectivo_fisico = request.data.get('efectivo_declarado', 0)
        observaciones = request.data.get('observaciones', '')
        
        try:
            resultado = cerrar_oficialmente_jornada(jornada.id, efectivo_fisico, observaciones)
            return Response({'status': 'Cerrada con éxito', 'resumen': resultado['resumen']}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='rendir')
    def rendir_jornada(self, request, pk=None):
        jornada = self.get_object()
        if jornada.estado != 'FINALIZADA':
            return Response({'error': 'La jornada debe estar FINALIZADA para rendirla.'}, status=status.HTTP_400_BAD_REQUEST)
        
        rendir_a_tesoreria_central(jornada.id)
        return Response({'status': 'Rendida a Tesorería Central'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='pdf')
    def exportar_pdf(self, request, pk=None):
        jornada = self.get_object()
        pdf_file = generar_pdf_ficha_jornada(jornada.id)
        
        response = HttpResponse(pdf_file, content_type='application/pdf')
        filename = f"ficha_jornada_{jornada.fecha}_{jornada.slug}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response

class VoluntarioViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VoluntarioSerializer

    def get_queryset(self):
        return Voluntario.objects.filter(jornada__club=self.request.user.club)

class DonacionCantinaViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DonacionCantinaSerializer

    def get_queryset(self):
        return DonacionCantina.objects.filter(jornada__club=self.request.user.club)

# Vistas de Kiosco (Con Validación por PIN)
class KioscoViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny] # Público con PIN

    @action(detail=False, methods=['post'], url_path='validar-pin')
    def validar_pin(self, request):
        pin = request.data.get('pin')
        slug = request.data.get('slug')
        jornada = get_object_or_404(Jornada, slug=slug, access_pin=pin)
        
        if jornada.estado in ['FINALIZADA', 'CANCELADA']:
            return Response({'error': 'La jornada ya no acepta registros.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(KioscoJornadaSerializer(jornada).data)

    @action(detail=True, methods=['post'], url_path='cargar-venta')
    def cargar_venta(self, request, pk=None):
        pin = request.data.get('pin')
        jornada = get_object_or_404(Jornada, id=pk, access_pin=pin)
        
        serializer = VentaJornadaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(jornada=jornada)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
