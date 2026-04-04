from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Categoria, PerfilDeportivo, DocumentoDigital, Lesion
from core.models import Socio
from .serializers import CategoriaSerializer, PerfilDeportivoSerializer, DocumentoDigitalSerializer, LesionSerializer

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
        user = self.request.user
        base_qs = Categoria.objects.filter(club=user.club)
        
        # Si es profesor, solo ve sus categorías asignadas
        if user.role == 'PROFESOR':
            categorias_ids = user.asignaciones_categorias.values_list('categoria_id', flat=True)
            return base_qs.filter(id__in=categorias_ids)
            
        return base_qs

    def perform_create(self, serializer):
        serializer.save(club=self.request.user.club)

    def perform_update(self, serializer):
        serializer.save(club=self.request.user.club)

    @action(detail=True, methods=['get'])
    def profesores(self, request, pk=None):
        categoria = self.get_object()
        asignaciones = categoria.profesores_asignados.all().select_related('usuario_profe')
        data = [{
            'asignacion_id': a.id,
            'id': a.usuario_profe.id,
            'nombre': f"{a.usuario_profe.first_name} {a.usuario_profe.last_name}" or a.usuario_profe.email,
            'rol': a.rol_especifico
        } for a in asignaciones]
        return Response(data)

    @action(detail=True, methods=['post'])
    def asignar_profe(self, request, pk=None):
        categoria = self.get_object()
        profe_id = request.data.get('profe_id')
        from core.models import CustomUser
        profe = get_object_or_404(CustomUser, id=profe_id, club=request.user.club, role='PROFESOR')
        
        from .models import AsignacionProfe
        asignacion, created = AsignacionProfe.objects.get_or_create(
            categoria=categoria,
            usuario_profe=profe
        )
        
        if not created:
            asignacion.delete()
            return Response({'status': 'eliminado'})
            
        return Response({'status': 'asignado'})

    @action(detail=True, methods=['post'])
    def vincular_socios(self, request, pk=None):
        categoria = self.get_object()
        socio_ids = request.data.get('socio_ids', [])
        
        counts = 0
        for s_id in socio_ids:
            socio = get_object_or_404(Socio, id=s_id, club=request.user.club)
            PerfilDeportivo.objects.update_or_create(
                socio=socio,
                defaults={
                    'categoria_actual': categoria,
                    'habilitado_federacion': True # Por defecto habilitamos al vincular
                }
            )
            counts += 1
            
        return Response({'status': 'ok', 'vinculados': counts})

    @action(detail=False, methods=['get'])
    def disponibles_profes(self, request):
        from core.models import CustomUser
        profes = CustomUser.objects.filter(club=request.user.club, role='PROFESOR')
        data = [{
            'id': p.id,
            'nombre': f"{p.first_name} {p.last_name}" or p.email
        } for p in profes]
        return Response(data)

class PerfilDeportivoViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilDeportivoSerializer
    permission_classes = [permissions.IsAuthenticated, IsFromClub]

    def get_queryset(self):
        user = self.request.user
        # Optimización (N+1): Pre-traemos socio, categoría y los stats en un solo flujo eficiente
        base_qs = PerfilDeportivo.objects.filter(socio__club=user.club)\
            .select_related('socio', 'categoria_actual')\
            .prefetch_related('socio__documentos')
        
        # Filtro de visibilidad por rol
        if user.role == 'PROFESOR':
            categorias_asignadas = user.asignaciones_categorias.values_list('categoria_id', flat=True)
            return base_qs.filter(categoria_actual_id__in=categorias_asignadas)
            
        return base_qs

    def perform_create(self, serializer):
        socio_data = self.request.data.get('socio')
        socio_id = socio_data.get('id') if isinstance(socio_data, dict) else socio_data
        socio = get_object_or_404(Socio, id=socio_id, club=self.request.user.club)
        
        # Evitar duplicados: usamos update_or_create para que si ya existe, lo mueva de categoría en vez de fallar
        perfil, created = PerfilDeportivo.objects.update_or_create(
            socio=socio,
            defaults={
                'categoria_actual': serializer.validated_data.get('categoria_actual'),
                'habilitado_federacion': serializer.validated_data.get('habilitado_federacion', 
                                         serializer.validated_data.get('estado_federativo', True) == 'HABILITADO')
            }
        )
        # Sincronizamos el serializer con el objeto creado/actualizado
        serializer.instance = perfil

class DocumentoDigitalViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentoDigitalSerializer
    permission_classes = [permissions.IsAuthenticated, IsFromClub]

    def get_queryset(self):
        return DocumentoDigital.objects.filter(socio__club=self.request.user.club)

    def perform_create(self, serializer):
        socio_id = self.request.data.get('socio')
        socio = get_object_or_404(Socio, id=socio_id, club=self.request.user.club)
        # Auto-aprobar si lo carga un ADMIN, DIRIGENTE o PROFESOR
        estado = 'APROBADO' if self.request.user.role in ['ADMIN', 'DIRIGENTE', 'PROFESOR'] else 'PENDIENTE'
        serializer.save(socio=socio, subido_por=self.request.user, estado_validacion=estado)

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

class LesionViewSet(viewsets.ModelViewSet):
    serializer_class = LesionSerializer
    permission_classes = [permissions.IsAuthenticated, IsFromClub]

    def get_queryset(self):
        user = self.request.user
        qs = Lesion.objects.filter(socio__club=user.club)
        socio_id = self.request.query_params.get('socio')
        if socio_id:
            qs = qs.filter(socio_id=socio_id)
        return qs

    def perform_create(self, serializer):
        socio_id = self.request.data.get('socio')
        socio = get_object_or_404(Socio, id=socio_id, club=self.request.user.club)
        serializer.save(socio=socio)
