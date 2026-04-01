from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Evento, Convocatoria, Asistencia
from core.models import Socio
from finanzas.models import CuentaCorriente, MovimientoFinanciero
from .serializers import (
    EventoSerializer, 
    BulkConvocatoriaRequestSerializer, 
    ConvocatoriaSerializer,
    BulkAsistenciaRequestSerializer,
    ThirdHalfPaymentSerializer
)

class EventoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Eventos. Además contiene las acciones de convocar, asistencia y cobrar 3T.
    """
    serializer_class = EventoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtro estricto: solo veo eventos de MI club.
        return Evento.objects.filter(club=self.request.user.club)

    def perform_create(self, serializer):
        serializer.save(club=self.request.user.club, creado_por=self.request.user)

    @action(detail=True, methods=['post'], url_path='convocar')
    def convocar_jugadores(self, request, pk=None):
        evento = self.get_object()
        serializer = BulkConvocatoriaRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ids_socios = serializer.validated_data['jugadores_ids']
        socios = Socio.objects.filter(id__in=ids_socios, club=request.user.club)
        
        # Validación CRÍTICA: Partidos oficiales requieren "puede_jugar" == True
        errores = []
        if evento.tipo == 'PARTIDO_OFICIAL':
            for socio in socios:
                if not hasattr(socio, 'perfil_deportivo') or not socio.perfil_deportivo.puede_jugar:
                    errores.append(f"El jugador '{socio.apellidos}, {socio.nombres}' no está habilitado por apto/federación.")
        
        if errores:
            return Response({
                "error": "Existen jugadores no habilitados para partido oficial.",
                "detalles": errores
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generar Convocatorias atómicas (get_or_create para no duplicar si repite)
        convocatorias_generadas = []
        with transaction.atomic():
            for socio in socios:
                obj, created = Convocatoria.objects.get_or_create(evento=evento, jugador=socio)
                convocatorias_generadas.append(obj)

        return Response({
            "status": "Convocatoria procesada", "agregados": len(convocatorias_generadas)
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='asistencia')
    def tomar_asistencia(self, request, pk=None):
        evento = self.get_object()
        serializer = BulkAsistenciaRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data_list = serializer.validated_data['asistencias']
        
        # Uso transaction o insert bulk manual. Para PWA es ideal update_or_create
        procesados = 0
        with transaction.atomic():
            for asis in data_list:
                socio = get_object_or_404(Socio, id=asis['jugador_id'], club=request.user.club)
                obj, created = Asistencia.objects.update_or_create(
                    evento=evento, 
                    jugador=socio,
                    defaults={
                        'estado': asis['estado'],
                        'observaciones': asis.get('observaciones', ''),
                        'tomada_por': request.user
                    }
                )
                procesados += 1

        return Response({"status": f"Asistencia guardada para {procesados} jugadores."})

    @action(detail=True, methods=['post'], url_path='cobrar-tercer-tiempo')
    def cobrar_tercer_tiempo(self, request, pk=None):
        """
        Integra el módulo EVENTOS con el módulo FINANZAS (Cuenta Corriente).
        Cobra un monto en la cuenta de los jugadores seleccionados (débito).
        """
        evento = self.get_object()
        serializer = ThirdHalfPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Es un débito -> número negativo en la cuenta corriente
        monto_individual = -abs(Decimal(serializer.validated_data['monto']))
        concepto = f"[3T - {evento.titulo}]: {serializer.validated_data['concepto']}"
        ids_socios = serializer.validated_data['jugadores_ids']

        socios = Socio.objects.filter(id__in=ids_socios, club=request.user.club)
        
        movimientos_count = 0
        with transaction.atomic():
            for socio in socios:
                cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)
                MovimientoFinanciero.objects.create(
                    cuenta=cuenta,
                    tipo='TERCER_TIEMPO',
                    monto=monto_individual,
                    descripcion=concepto,
                    fecha=evento.fecha_hora_inicio.date(), # La fecha del evento
                    creado_por=request.user
                )
                movimientos_count += 1
                
        return Response({
            "status": "OK", 
            "message": f"Se debitó ${abs(monto_individual)} a {movimientos_count} jugadores.",
            "monto_total_club": abs(monto_individual) * movimientos_count
        })
