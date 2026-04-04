from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.http import HttpResponse
from .models import Jornada, Voluntario, DonacionCantina, VentaJornada, CajaJornada, EgresoJornada, AsistenciaVoluntario
from .serializers import (
    JornadaListSerializer, JornadaDetailSerializer, 
    VoluntarioSerializer, DonacionCantinaSerializer, 
    VentaJornadaSerializer, CajaJornadaSerializer,
    KioscoJornadaSerializer, EgresoJornadaSerializer,
    AsistenciaVoluntarioSerializer
)
from .logic import cerrar_oficialmente_jornada, rendir_a_tesoreria_central
from .reports import generar_pdf_ficha_jornada
from core.models import Socio
import datetime

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

    @action(detail=False, methods=['get'], url_path='ranking')
    def ranking_familias(self, request):
        from django.db.models import Count, Sum, F, ExpressionWrapper, DecimalField
        from django.db.models.functions import Coalesce
        
        # Base points for showing up: 10 pts per voluntary shift (model Voluntario)
        # AND 10 pts per attendance log (model AsistenciaVoluntario)
        # Note: We sum both to allow migration/transition
        voluntarios_pts = Coalesce(Count('voluntariados'), 0) * 10
        asistencias_pts = Coalesce(Sum('asistencias_eventos__puntos_asignados'), 0)
        
        donaciones_pts = Coalesce(Sum('donaciones_cantina__valorizado_estimado'), DecimalField(0, max_digits=12, decimal_places=2)) / 1000
        compras_pts = Coalesce(Sum('ventajornada__monto'), DecimalField(0, max_digits=12, decimal_places=2)) / 1000
        
        ranking = Socio.objects.filter(club=request.user.club).annotate(
            pts_vol=ExpressionWrapper(voluntarios_pts, output_field=DecimalField(decimal_places=2)),
            pts_asis=ExpressionWrapper(asistencias_pts, output_field=DecimalField(decimal_places=2)),
            pts_don=ExpressionWrapper(donaciones_pts, output_field=DecimalField(decimal_places=2)),
            pts_com=ExpressionWrapper(compras_pts, output_field=DecimalField(decimal_places=2))
        ).annotate(
            puntos_totales=F('pts_vol') + F('pts_asis') + F('pts_don') + F('pts_com')
        ).filter(puntos_totales__gt=0).order_by('-puntos_totales')[:20]

        data = []
        for r in ranking:
            data.append({
                'id': r.id,
                'nombre': f"{r.apellidos}, {r.nombres}",
                'puntos': round(r.puntos_totales, 1),
                'detalle': f"Voluntariados: {r.pts_vol + r.pts_asis} pts"
            })
            
        return Response(data, status=status.HTTP_200_OK)

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

class EgresoJornadaViewSet(viewsets.ModelViewSet):
    permission_classes = [EsAdminClub]
    serializer_class = EgresoJornadaSerializer

    def get_queryset(self):
        return EgresoJornada.objects.filter(jornada__club=self.request.user.club)

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

    @action(detail=True, methods=['post'], url_path='registrar-asistencia')
    def registrar_asistencia(self, request, pk=None):
        pin = request.data.get('pin')
        jornada = get_object_or_404(Jornada, id=pk, access_pin=pin)
        dni = request.data.get('dni_declarado')
        nombre = request.data.get('nombre_declarado')
        tarea = request.data.get('tarea')

        now = datetime.datetime.now()
        AsistenciaVoluntario.objects.filter(jornada=jornada, dni_declarado=dni, hora_salida__isnull=True).update(hora_salida=now)

        socio_match = Socio.objects.filter(club=jornada.club, nro_socio=dni).first() 
        if not socio_match:
            if hasattr(Socio, 'dni'):
                socio_match = Socio.objects.filter(club=jornada.club, dni=dni).first()

        asistencia = AsistenciaVoluntario.objects.create(
            jornada=jornada,
            nombre_declarado=nombre,
            dni_declarado=dni,
            socio=socio_match,
            tarea=tarea,
            hora_entrada=now
        )

        return Response(AsistenciaVoluntarioSerializer(asistencia).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='cerrar-asistencia')
    def cerrar_asistencia(self, request, pk=None):
        dni = request.data.get('dni_declarado')
        now = datetime.datetime.now()
        
        asistencia = AsistenciaVoluntario.objects.filter(
            jornada_id=pk, dni_declarado=dni, hora_salida__isnull=True
        ).order_by('-hora_entrada').first()

        if asistencia:
            asistencia.hora_salida = now
            asistencia.save()
            return Response({'status': 'Turno cerrado', 'entrada': asistencia.hora_entrada, 'salida': now})
        
        return Response({'error': 'No se encontró un turno abierto para este DNI.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='cargar-venta')
    def cargar_venta(self, request, pk=None):
        pin = request.data.get('pin')
        jornada = get_object_or_404(Jornada, id=pk, access_pin=pin)
        
        serializer = VentaJornadaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(jornada=jornada)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
