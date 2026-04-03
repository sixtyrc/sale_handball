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
from deportes.models import PerfilDeportivo, Categoria
from deportes.eligibility import check_player_health

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

    @action(detail=True, methods=['get'], url_path='convocables')
    def get_convocables(self, request, pk=None):
        """
        Retorna la lista de jugadores inteligentes para este evento.
        - Pre-selecciona todos los de la categoría del evento.
        - Permite buscar cualquier otro socio del club como refuerzo (barra de búsqueda).
        - Si no hay categoría, devuelve todos los del club (perfiles).
        """
        evento = self.get_object()
        search_query = request.query_params.get('search', '').strip()

        # 1. Base Query: Solo socios con perfil deportivo en este club
        perfiles_base = PerfilDeportivo.objects.filter(
            socio__club=evento.club
        ).select_related('socio', 'categoria_actual')

        # 2. Filtrado Lógico
        if search_query:
            # Búsqueda explícita de refuerzo
            perfiles = perfiles_base.filter(
                models.Q(socio__nombres__icontains=search_query) |
                models.Q(socio__apellidos__icontains=search_query)
            )
        elif evento.categoria:
            # Caso Estándar: Traer categoría titular + pre-seleccionarlos
            perfiles = perfiles_base.filter(
                categoria_actual=evento.categoria
            )
        else:
            # Caso Evento General
            perfiles = perfiles_base

        data = []
        for p in perfiles:
            health = check_player_health(p.id)
            data.append({
                'id': str(p.socio.id),
                'nombre_completo': f"{p.socio.apellidos}, {p.socio.nombres}",
                'categoria': p.categoria_actual.nombre if p.categoria_actual else 'Sin categoría',
                # Pre-seleccionar si es de la categoría titular del evento Y no estamos buscando refuerzos
                'pre_seleccionado': (evento.categoria and p.categoria_actual == evento.categoria) if not search_query else False,
                'habilitado_federacion': p.habilitado_federacion,
                'eligibility': health
            })

        return Response(data)

    @action(detail=True, methods=['post'], url_path='convocar')
    def convocar_jugadores(self, request, pk=None):
        evento = self.get_object()
        serializer = BulkConvocatoriaRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ids_socios = serializer.validated_data['jugadores_ids']
        socios = Socio.objects.filter(id__in=ids_socios, club=request.user.club)
        
        # Lógica de SOFT WARNINGS REALES (Usando eligibility service)
        warnings = []
        for socio in socios:
            if hasattr(socio, 'perfil_deportivo'):
                health = check_player_health(socio.perfil_deportivo.id)
                if health['warnings']:
                    warnings.append({
                        "socio": str(socio),
                        "warnings": health['warnings']
                    })

        # Generar Convocatorias atómicas
        convocatorias_generadas = []
        with transaction.atomic():
            for socio in socios:
                obj, created = Convocatoria.objects.get_or_create(evento=evento, jugador=socio)
                convocatorias_generadas.append(obj)

        return Response({
            "status": "Convocatoria guardada exitosamente", 
            "agregados": len(convocatorias_generadas),
            "warnings": warnings if warnings else None
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
