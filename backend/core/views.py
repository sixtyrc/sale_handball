from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Club, CustomUser, Socio
from .serializers import ClubSerializer, CustomUserSerializer, SocioSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            # Buscamos por username O por email para evitar confusiones
            from django.db.models import Q
            user = CustomUser.objects.get(Q(username=username) | Q(email=username))
            
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': CustomUserSerializer(user).data
                })
            return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado o no existe'}, status=status.HTTP_404_NOT_FOUND)

class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticated] # Only system level or specific club admin

class SocioViewSet(viewsets.ModelViewSet):
    serializer_class = SocioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Multi-tenant filter
        return Socio.objects.filter(club=self.request.user.club)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ ERROR DE VALIDACIÓN DRF:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        from django.db import IntegrityError
        try:
            self.perform_create(serializer)
        except IntegrityError as e:
            error_msg = str(e).lower()
            if "nro_socio" in error_msg or "llave duplicada" in error_msg or "duplicate key" in error_msg:
                return Response({"nro_socio": ["El número de socio ya existe en este club."]}, status=status.HTTP_400_BAD_REQUEST)
            if "dni" in error_msg:
                return Response({"dni": ["Este DNI ya está registrado en este club."]}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": ["Error de integridad (posible duplicado)."]}, status=status.HTTP_400_BAD_REQUEST)
            
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        club = self.request.user.club
        if not club:
            # Fallback al club por defecto si el usuario no tiene uno asociado (safety check)
            import uuid
            from .models import Club
            club, _ = Club.objects.get_or_create(
                id=uuid.UUID('00000000-0000-0000-0000-000000000001'),
                defaults={'nombre': 'Salesianos Handball (Ref.)'}
            )
        
        # Generar nro_socio secuencial automático de 5 dígitos
        nro_socio = serializer.validated_data.get('nro_socio', '')
        if not nro_socio or nro_socio.strip() == '':
            from django.db.models import IntegerField
            from django.db.models.functions import Cast
            
            ultimo_socio = Socio.objects.filter(
                club=club
            ).exclude(
                nro_socio__isnull=True
            ).exclude(
                nro_socio__exact=''
            ).annotate(
                nro_int=Cast('nro_socio', output_field=IntegerField())
            ).order_by('-nro_int').first()
            
            if ultimo_socio and ultimo_socio.nro_int:
                nuevo_nro = ultimo_socio.nro_int + 1
            else:
                nuevo_nro = 1
                
            nro_socio_str = str(nuevo_nro).zfill(5)
            serializer.save(club=club, nro_socio=nro_socio_str)
        else:
            # Si lo mandan manualmente y no está vacío, lo respetamos pero rellenamos a 5 dígitos
            nro_socio_str = str(nro_socio).strip().zfill(5)
            serializer.save(club=club, nro_socio=nro_socio_str)

class SocioPublicCheckView(APIView):
    """
    Endpoint 100% público para que un árbitro/entrenador escanee el QR 
    y valide al instante si el jugador está habilitado y pertenece al club.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, socio_id):
        from .models import Socio
        from admin_club.models import ClubConfig
        from admin_club.serializers import PublicBrandingSerializer
        
        try:
            socio = Socio.objects.get(id=socio_id)
            config = ClubConfig.objects.filter(club=socio.club).first()
            
            # Formateamos data de respuesta amigable para el scanner móvil
            return Response({
                'id': socio.id,
                'nro_socio': socio.nro_socio,
                'dni': socio.dni,
                'nombres': socio.nombres,
                'apellidos': socio.apellidos,
                'foto': socio.foto.url if socio.foto else None,
                'estado': socio.estado,
                'validez_carnet': socio.vencimiento_carnet,
                'club': PublicBrandingSerializer(config).data if config else None,
                'habilitado': not ("VENCIDO" in socio.vencimiento_carnet or "RENOVAR" in socio.vencimiento_carnet)
            })
        except Socio.DoesNotExist:
            return Response({'error': 'Socio no encontrado'}, status=status.HTTP_404_NOT_FOUND)
