from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Club, CustomUser, Socio, GrupoFamiliar
from .serializers import ClubSerializer, CustomUserSerializer, SocioSerializer, GrupoFamiliarSerializer

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
                    'primer_ingreso': user.primer_ingreso,
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
        qs = Socio.objects.filter(club=self.request.user.club)
        es_profesor = self.request.query_params.get('es_profesor')
        if es_profesor is not None:
            es_profesor_bool = es_profesor.lower() == 'true'
            qs = qs.filter(es_profesor=es_profesor_bool)
        return qs

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
            socio = serializer.save(club=club, nro_socio=nro_socio_str)
        else:
            # Si lo mandan manualmente y no está vacío, lo respetamos pero rellenamos a 5 dígitos
            nro_socio_str = str(nro_socio).strip().zfill(5)
            socio = serializer.save(club=club, nro_socio=nro_socio_str)

        # ── Auto-creación de usuario de autogestión para el socio ──
        if socio and not socio.usuario:
            try:
                dni = socio.dni
                # Evitar duplicados: si ya existe un user con ese dni, lo vinculamos
                user, created = CustomUser.objects.get_or_create(
                    username=dni,
                    defaults={
                        'email': socio.email_contacto or '',
                        'first_name': socio.nombres,
                        'last_name': socio.apellidos,
                        'club': club,
                        'role': 'PROFESOR' if socio.es_profesor else 'SOCIO',
                        'primer_ingreso': True,
                    }
                )
                if created:
                    user.set_password(dni)
                    user.save()
                socio.usuario = user
                socio.save(update_fields=['usuario'])

                # Enviar mail de bienvenida si tiene correo configurado
                if socio.email_contacto:
                    from django.core.mail import send_mail
                    from django.conf import settings
                    send_mail(
                        subject='Bienvenido al Club - Tus datos de acceso',
                        message=(
                            f'Hola {socio.nombres},\n\n'
                            f'Ya podés acceder al portal del socio con:\n'
                            f'  Usuario: {dni}\n'
                            f'  Contraseña: {dni}\n\n'
                            f'Te pediremos que cambies la contraseña al primer ingreso.\n\n'
                            f'Saludos, el equipo del Club.'
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[socio.email_contacto],
                        fail_silently=True,  # No rompemos el alta si el mail falla
                    )
            except Exception as e:
                print(f"⚠️ Error al crear usuario automático para socio {socio.dni}: {e}")

    def perform_update(self, serializer):
        socio = serializer.save(club=self.request.user.club)
        if socio.usuario:
            new_role = 'PROFESOR' if socio.es_profesor else 'SOCIO'
            if socio.usuario.role != new_role:
                socio.usuario.role = new_role
                socio.usuario.save(update_fields=['role'])

    @action(detail=False, methods=['get'], url_path='disponibles-vincular')
    def disponibles_vincular(self, request):
        """
        Lista de socios que NO tienen perfil deportivo aún, filtrados por la categoría destino.
        Permite una vinculación inteligente (edad y sexo).
        """
        from deportes.models import Categoria, PerfilDeportivo
        from django.db.models import Exists, OuterRef
        from datetime import date
        from .models import Socio
        from .serializers import SocioSerializer
        
        cat_id = request.query_params.get('categoria_id')
        if not cat_id:
            return Response({"error": "Debe especificar una categoria_id"}, status=400)
            
        categoria = get_object_or_404(Categoria, id=cat_id, club=request.user.club)
        
        # Filtro base: socios del club
        qs = Socio.objects.filter(club=request.user.club)
        # Opcional: Podríamos excluir a los que ya están en ESTA categoría específica si quisieras
        # Pero para que el modal funcione siempre, traemos a todos los que NO son de esta categoría
        qs = qs.exclude(perfil_deportivo__categoria_actual=categoria)
        
        # Filtro por Sexo (si la categoría no es Mixto)
        if categoria.genero != 'MIXTO':
            qs = qs.filter(sexo=categoria.genero)
            
        socios_data = []
        for s in qs:
            sugerida = None
            if s.fecha_nacimiento:
                sugerida = Categoria.get_category_by_age(s.club, s.fecha_nacimiento.year, s.sexo)
            
            socios_data.append({
                'id': s.id,
                'nombres': s.nombres,
                'apellidos': s.apellidos,
                'dni': s.dni,
                'fecha_nacimiento': s.fecha_nacimiento,
                'categoria_sugerida': sugerida.nombre if sugerida else "Sin Categoría",
                'coincide_categoria': sugerida.id == categoria.id if sugerida else False
            })
            
        return Response(socios_data)

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

class GrupoFamiliarViewSet(viewsets.ModelViewSet):
    """
    CRUD de Grupos Familiares del club.
    Permite crear, editar, listar y asignar socios a grupos para calcular descuentos.
    """
    serializer_class = GrupoFamiliarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GrupoFamiliar.objects.filter(club=self.request.user.club).prefetch_related('socios')

    def perform_create(self, serializer):
        serializer.save(club=self.request.user.club)


class CambiarPasswordView(APIView):
    """
    Endpoint para que el socio cambie su contraseña.
    Si es primer ingreso, marca primer_ingreso=False al completar.
    POST /api/v1/auth/cambiar-password/
    Body: { "password_actual": "...", "password_nuevo": "...", "password_confirmar": "..." }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        password_actual = request.data.get('password_actual')
        password_nuevo = request.data.get('password_nuevo')
        password_confirmar = request.data.get('password_confirmar')

        if not user.check_password(password_actual):
            return Response({'error': 'La contraseña actual es incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)

        if not password_nuevo or len(password_nuevo) < 6:
            return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

        if password_nuevo != password_confirmar:
            return Response({'error': 'Las contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password_nuevo)
        user.primer_ingreso = False
        user.save()

        return Response({'ok': 'Contraseña actualizada correctamente.'})


class SolicitarResetPasswordView(APIView):
    """
    Genera un token de reseteo y lo envía por email via Resend.
    POST /api/v1/auth/solicitar-reset/
    Body: { "email": "..." }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        from django.core.mail import send_mail
        from django.conf import settings

        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            # Por seguridad respondemos OK igual (no revelar si el mail existe)
            return Response({'ok': 'Si el email está registrado, recibirás un enlace.'})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # URL del portal del socio con el token
        reset_url = f"http://localhost:3051/socio/reset-password/{uid}/{token}/"

        send_mail(
            subject='Restablecé tu contraseña - Club',
            message=(
                f'Hola {user.first_name},\n\n'
                f'Hacé clic en el siguiente enlace para restablecer tu contraseña:\n\n'
                f'{reset_url}\n\n'
                f'Si no solicitaste esto, ignorá este mensaje.\n\n'
                f'Saludos, el equipo del Club.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({'ok': 'Si el email está registrado, recibirás un enlace.'})


class ConfirmarResetPasswordView(APIView):
    """
    Confirma el token y aplica la nueva contraseña.
    POST /api/v1/auth/confirmar-reset/
    Body: { "uid": "...", "token": "...", "password_nuevo": "...", "password_confirmar": "..." }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        uid = request.data.get('uid')
        token = request.data.get('token')
        password_nuevo = request.data.get('password_nuevo')
        password_confirmar = request.data.get('password_confirmar')

        if password_nuevo != password_confirmar:
            return Response({'error': 'Las contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)

        if not password_nuevo or len(password_nuevo) < 6:
            return Response({'error': 'La contraseña debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, CustomUser.DoesNotExist):
            return Response({'error': 'Link inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'El link ya fue usado o expiró.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password_nuevo)
        user.primer_ingreso = False
        user.save()

        return Response({'ok': 'Contraseña restablecida correctamente. Ya podés ingresar.'})
