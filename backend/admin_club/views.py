from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ClubConfig, Temporada, ConceptoCobrable
from core.models import Club
from .serializers import ClubConfigSerializer, TemporadaSerializer, ConceptoCobrableSerializer, PublicBrandingSerializer

class IsAdminRole(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'ADMIN'

class ClubConfigView(views.APIView):
    """
    GET /api/v1/admin-club/config/
    PUT /api/v1/admin-club/config/
    Solo accesible para ADMINs del propio club.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        config, created = ClubConfig.objects.get_or_create(club=request.user.club)
        serializer = ClubConfigSerializer(config)
        return Response(serializer.data)

    def put(self, request):
        config, created = ClubConfig.objects.get_or_create(club=request.user.club)
        serializer = ClubConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PublicBrandingView(views.APIView):
    """
    GET /api/v1/admin-club/branding/{subdominio}/
    Endpoints 100% públicos para pintar PWA según la URL solicitada.
    CUIDADO: Nunca devolver información sensible o de configuración de mora aquí.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, subdominio):
        club = get_object_or_404(Club, subdominio__iexact=subdominio)
        config, created = ClubConfig.objects.get_or_create(club=club)
        serializer = PublicBrandingSerializer(config)
        return Response(serializer.data)

class TemporadaViewSet(viewsets.ModelViewSet):
    """
    Gestión de las temporadas del club (Ej: Apertura 2026).
    """
    serializer_class = TemporadaSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Temporada.objects.filter(club=self.request.user.club)

    def perform_create(self, serializer):
        serializer.save(club=self.request.user.club)

class ConceptoCobrableViewSet(viewsets.ModelViewSet):
    """
    Gestión de conceptos ($) atados a temporadas.
    """
    serializer_class = ConceptoCobrableSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        # Protegiendo que el admin solo vea conceptos de sus temporadas
        return ConceptoCobrable.objects.filter(temporada__club=self.request.user.club)
    
    def perform_create(self, serializer):
        # Valida que la temporada asignada pertenezca al club del admin
        temporada = serializer.validated_data.get('temporada')
        if temporada.club != self.request.user.club:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No puedes asignar conceptos a temporadas de otros clubes.")
        serializer.save()
