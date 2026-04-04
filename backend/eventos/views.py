from decimal import Decimal
from django.db import transaction, models
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Evento, Convocatoria, Asistencia, DetallePartido, EquipoEnPartido, EstadisticaJugador, AccionPartido
from core.models import Socio
from finanzas.models import CuentaCorriente, MovimientoFinanciero
from .serializers import (
    EventoSerializer, 
    BulkConvocatoriaRequestSerializer, 
    ConvocatoriaSerializer,
    BulkAsistenciaRequestSerializer,
    ThirdHalfPaymentSerializer,
    ArbitrajePaymentSerializer,
    DetallePartidoSerializer,
    CerrarPlanillaRequestSerializer
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

        # 2. Filtrado Lógico (Soporta filtrado por ID explícito para mayor robustez)
        cat_id = request.query_params.get('categoria_id') or evento.categoria_id
        
        if search_query:
            # Búsqueda explícita de refuerzo
            perfiles = perfiles_base.filter(
                models.Q(socio__nombres__icontains=search_query) |
                models.Q(socio__apellidos__icontains=search_query)
            )
        elif cat_id:
            # Caso Estándar: Traer categoría titular por ID (Robusto vs errores de nombre)
            perfiles = perfiles_base.filter(categoria_actual_id=cat_id)
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

    @action(detail=True, methods=['get'], url_path='planilla')
    def get_planilla(self, request, pk=None):
        """Obtiene o inicializa la planilla técnica para este partido."""
        evento = self.get_object()
        
        # Validar tipo habilitado
        if evento.tipo not in ['PARTIDO_OFICIAL', 'AMISTOSO']:
            return Response({"error": "Las planillas solo están disponibles para partidos."}, status=status.HTTP_400_BAD_REQUEST)

        # Usar get_or_create para DetallePartido
        detalle, created = DetallePartido.objects.get_or_create(evento=evento)
        
        # Si es nueva, pre-configuramos el equipo local (el club)
        if created:
            EquipoEnPartido.objects.get_or_create(
                detalle_partido=detalle,
                es_local=True,
                defaults={'nombre_equipo': evento.club.nombre, 'color_camiseta': 'Oficial'}
            )
            EquipoEnPartido.objects.get_or_create(
                detalle_partido=detalle,
                es_local=False,
                defaults={'nombre_equipo': evento.rival or 'Rival', 'color_camiseta': 'Reserva/Otro'}
            )

        # Aseguramos que los convocados tengan su registro de estadística listo (vacío)
        convocados = Convocatoria.objects.filter(evento=evento)
        for c in convocados:
            EstadisticaJugador.objects.get_or_create(detalle_partido=detalle, socio=c.jugador)

        serializer = DetallePartidoSerializer(detalle)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='asociar-planilla')
    def cerrar_planilla(self, request, pk=None):
        """Guarda estadísticas masivas y cierra la planilla del partido."""
        evento = self.get_object()
        detalle = get_object_or_404(DetallePartido, evento=evento)
        
        serializer = CerrarPlanillaRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        
        with transaction.atomic():
            # 1. Update Detalle
            detalle.goles_local = data['goles_local']
            detalle.goles_visitante = data['goles_visitante']
            detalle.sede_final = data.get('sede_final', detalle.sede_final)
            detalle.observaciones_arbitro = data.get('observaciones', '')
            detalle.estado_planilla = 'CERRADA'
            
            # Sanciones banco
            detalle.amarilla_banco = data.get('amarilla_banco', False)
            detalle.suspension_banco = data.get('suspension_banco', False)
            detalle.roja_banco = data.get('roja_banco', False)
            detalle.azul_banco = data.get('azul_banco', False)
            detalle.save()

            # 2. Update Stats Jugadores (bulk)
            for item in data['stats_jugadores']:
                socio_id = item.get('socio')
                if not socio_id: continue
                
                stats_obj, _ = EstadisticaJugador.objects.get_or_create(
                    detalle_partido=detalle, 
                    socio_id=socio_id
                )
                stats_obj.dorsal = item.get('dorsal', '')
                stats_obj.goles = item.get('goles', 0)
                stats_obj.penales_lanzados = item.get('penales_lanzados', 0)
                stats_obj.penales_convertidos = item.get('penales_convertidos', 0)
                stats_obj.amarilla = item.get('amarilla', False)
                stats_obj.suspensiones_2min = item.get('suspensiones_2min', 0)
                stats_obj.roja = item.get('roja', False)
                stats_obj.azul = item.get('azul', False)
                stats_obj.save()

        return Response({"status": "CP_OK", "message": "Planilla cerrada y estadísticas vinculadas correctamente."})
