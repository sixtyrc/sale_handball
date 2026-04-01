from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Categoria, PerfilDeportivo, DocumentoDigital
from core.models import Socio
from .serializers import CategoriaSerializer, PerfilDeportivoSerializer, DocumentoDigitalSerializer

class IsFromClub(permissions.BasePermission):
    """Permiso para asegurar que el usuario accede a datos de su club."""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'club'):
            return obj.club == request.user.club
        if hasattr(obj, 'socio'):
            return obj.socio.club == request.user.club
        return False

class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated, IsFromClub]

    def get_queryset(self):
        return Categoria.objects.filter(club=self.request.user.club)

    def perform_create(self, serializer):
        serializer.save(club=self.request.user.club)

class PerfilDeportivoViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilDeportivoSerializer
    permission_classes = [permissions.IsAuthenticated, IsFromClub]

    def get_queryset(self):
        user = self.request.user
        base_qs = PerfilDeportivo.objects.filter(socio__club=user.club)
        
        # Si es profesor, limitamos a sus categorías asignadas (ramas)
        if user.role == 'PROFESOR':
            categorias_asignadas = user.asignaciones_categorias.values_list('categoria_id', flat=True)
            return base_qs.filter(categoria_actual_id__in=categorias_asignadas)
            
        return base_qs

    def perform_create(self, serializer):
        socio_id = self.request.data.get('socio')
        socio = get_object_or_404(Socio, id=socio_id, club=self.request.user.club)
        serializer.save(socio=socio)

class DocumentoDigitalViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentoDigitalSerializer
    permission_classes = [permissions.IsAuthenticated, IsFromClub]

    def get_queryset(self):
        return DocumentoDigital.objects.filter(socio__club=self.request.user.club)

    def perform_create(self, serializer):
        socio_id = self.request.data.get('socio')
        socio = get_object_or_404(Socio, id=socio_id, club=self.request.user.club)
        serializer.save(socio=socio, subido_por=self.request.user)

    @action(detail=True, methods=['post'], url_path='validar')
    def validar_documento(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'DIRIGENTE']:
            return Response({'error': 'No tienes permisos para validar documentos.'}, status=status.HTTP_403_FORBIDDEN)
            
        documento = self.get_object()
        estado = request.data.get('estado')
        
        if estado not in ['APROBADO', 'RECHAZADO']:
            return Response({'error': 'Estado inválido.'}, status=status.HTTP_400_BAD_REQUEST)
            
        documento.estado_validacion = estado
        documento.validado_por = request.user
        documento.observaciones = request.data.get('observaciones', documento.observaciones)
        documento.save()
        
        return Response(DocumentoDigitalSerializer(documento).data)
