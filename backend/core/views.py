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
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # Auto-assign club from the admin creating it
        club = self.request.user.club
        if not club:
            # Fallback al club por defecto si el usuario no tiene uno asociado (safety check)
            import uuid
            from .models import Club
            club, _ = Club.objects.get_or_create(
                id=uuid.UUID('00000000-0000-0000-0000-000000000001'),
                defaults={'nombre': 'Salesianos Handball (Ref.)'}
            )
        serializer.save(club=club)
