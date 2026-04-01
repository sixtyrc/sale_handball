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
            user = CustomUser.objects.get(username=username)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': CustomUserSerializer(user).data
                })
            return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

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

    def perform_create(self, serializer):
        # Auto-assign club from the admin creating it
        serializer.save(club=self.request.user.club)
