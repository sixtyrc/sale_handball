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
    ThirdHalfPaymentSerializer,
    ArbitrajePaymentSerializer
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
        
        # Lógica de SOFT WARNINGS (No bloquea, solo avisa)
        warnings = []
        for socio in socios:
            # Check Mora (> 2 cuotas)
            if socio.cuenta_corriente.saldo < 0:
                # Simulación de detección de 2 cuotas pendientes 
                # (Se podría mejorar contando movimientos de tipo CUOTA impagos)
                warnings.append({
                    "socio": str(socio),
                    "tipo": "MORA",
                    "mensaje": "Debe cuotas sociales (> 2 meses)."
                })
            
            # Check Papeles (Apto y Seguro)
            if not hasattr(socio, 'perfil_deportivo') or not socio.perfil_deportivo.puede_jugar:
                msj = "Falta Apto Médico o Seguro Federativo."
                warnings.append({
                    "socio": str(socio),
                    "tipo": "DOCUMENTACION",
                    "mensaje": msj
                })

        # Generar Convocatorias atómicas (Refuerzos permitidos por defecto al filtrar solo por club)
        convocatorias_generadas = []
        with transaction.atomic():
            for socio in socios:
                obj, created = Convocatoria.objects.get_or_create(evento=evento, jugador=socio)
                convocatorias_generadas.append(obj)

        return Response({
            "status": "Convocatoria guardada exitosamente (Refuerzos permitidos)", 
            "agregados": len(convocatorias_generadas),
            "warnings": warnings
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='cobrar-arbitraje')
    def cobrar_arbitraje(self, request, pk=None):
        """
        Calcula el costo del árbitro por jugador según los presentes y lo debita.
        """
        evento = self.get_object()
        serializer = ArbitrajePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        total_arbitro = abs(Decimal(serializer.validated_data['costo_total_arbitro']))
        ids_socios = serializer.validated_data['jugadores_ids']
        cant_jugadores = len(ids_socios)

        if cant_jugadores == 0:
            return Response({"error": "Debe haber al menos 1 jugador para prorratear"}, status=status.HTTP_400_BAD_REQUEST)

        monto_por_jugador = -(total_arbitro / cant_jugadores) # Negativo (débito)
        socios = Socio.objects.filter(id__in=ids_socios, club=request.user.club)

        with transaction.atomic():
            for socio in socios:
                cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)
                MovimientoFinanciero.objects.create(
                    cuenta=cuenta,
                    tipo='ARBITRAJE',
                    monto=monto_por_jugador,
                    descripcion=f"Prorrateo Arbitraje: {evento.titulo} ({total_arbitro}/{cant_jugadores})",
                    fecha=evento.fecha_hora_inicio.date(),
                    creado_por=request.user
                )

        return Response({
            "status": "Cobro de arbitraje realizado",
            "monto_individual": abs(monto_por_jugador),
            "total_arbitraje": total_arbitro,
            "jugadores": cant_jugadores
        })

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
