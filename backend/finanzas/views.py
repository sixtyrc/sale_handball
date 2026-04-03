from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.models import Socio
from .models import CuentaCorriente, MovimientoFinanciero, AvisoPago
from .serializers import (
    CuentaCorrienteSerializer, MovimientoFinancieroSerializer,
    GenerarCuotasSerializer, SaldoInicialSerializer, AvisoPagoSerializer
)


class IsAdminRole(IsAuthenticated):
    """Permiso: solo usuarios con role ADMIN del mismo club."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'ADMIN'


class IsAdminOrProfesorRole(IsAuthenticated):
    """Permiso: usuarios con rol ADMIN o PROFESOR del mismo club."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role in ['ADMIN', 'PROFESOR', 'DIRIGENTE']


class CuentaCorrienteView(APIView):
    """GET /api/v1/finanzas/socios/{socio_id}/cuenta/ → Saldo + historial de movimientos."""
    permission_classes = [IsAuthenticated]

    def get(self, request, socio_id):
        try:
            cuenta = CuentaCorriente.objects.get(
                socio__id=socio_id,
                socio__club=request.user.club
            )
        except CuentaCorriente.DoesNotExist:
            return Response({'error': 'Cuenta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CuentaCorrienteSerializer(cuenta)
        return Response(serializer.data)


class CuentaCorrienteListView(APIView):
    """GET /api/v1/finanzas/cuentas/ → Lista todas las cuentas del club con su saldo optimizado."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        socios = Socio.objects.filter(club=request.user.club)
        
        # En vez de 500 queries, traemos todos los movimientos relevantes
        # Para acelerar drásticamente la carga
        cuentas = CuentaCorriente.objects.filter(socio__in=socios).select_related('socio')
        
        data = []
        for cuenta in cuentas:
            data.append({
                'id': cuenta.id,
                'socio': {
                    'id': cuenta.socio.id,
                    'nombres': cuenta.socio.nombres,
                    'apellidos': cuenta.socio.apellidos,
                    'dni': cuenta.socio.dni,
                    'nro_socio': cuenta.socio.nro_socio,
                },
                'saldo': cuenta.saldo,
                'created_at': cuenta.created_at
            })
            
        return Response(data)


class RegistrarMovimientoView(APIView):
    """POST /api/v1/finanzas/movimientos/ → Registra un movimiento individual."""
    permission_classes = [IsAdminOrProfesorRole]

    def post(self, request):
        socio_id = request.data.get('socio_id')
        if not socio_id:
            return Response({'error': 'socio_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cuenta, _ = CuentaCorriente.objects.get_or_create(
                socio__id=socio_id,
                socio__club=request.user.club,
                defaults={'socio': Socio.objects.get(id=socio_id, club=request.user.club)}
            )
        except Socio.DoesNotExist:
            return Response({'error': 'Socio no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        data = {**request.data, 'cuenta': cuenta.id}
        serializer = MovimientoFinancieroSerializer(data=data)

        if serializer.is_valid():
            serializer.save(cuenta=cuenta, creado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GenerarCuotasMasivasView(APIView):
    """POST /api/v1/finanzas/cuotas/generar/ → Genera cuotas para todos los socios ACTIVOS del club.
    
    Protecciones:
    - Anti-duplicado: si un socio ya tiene una CUOTA en el mismo mes/año, se omite.
    - Descuento familiar: aplica bonificación extra si el socio pertenece a un GrupoFamiliar.
    """
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = GenerarCuotasSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        monto = -abs(serializer.validated_data['monto'])  # Débito = negativo
        descripcion = serializer.validated_data['descripcion']
        fecha = serializer.validated_data['fecha']
        mes = fecha.month
        anio = fecha.year

        socios_activos = Socio.objects.filter(
            club=request.user.club, estado='ACTIVO'
        ).select_related('grupo_familiar__club__configuracion')

        movimientos_creados = 0
        socios_saltados = []

        with transaction.atomic():
            for socio in socios_activos:
                cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)

                # ─── ANTI-DUPLICADO: ¿ya tiene CUOTA este mes/año? ───
                ya_tiene_cuota = MovimientoFinanciero.objects.filter(
                    cuenta=cuenta,
                    tipo='CUOTA',
                    fecha__year=anio,
                    fecha__month=mes
                ).exists()

                if ya_tiene_cuota:
                    socios_saltados.append(socio.nro_socio or socio.dni)
                    continue

                # 1. Registrar la Cuota Plena (Débito)
                MovimientoFinanciero.objects.create(
                    cuenta=cuenta,
                    tipo='CUOTA',
                    monto=monto,
                    descripcion=descripcion,
                    fecha=fecha,
                    creado_por=request.user
                )

                # 2. Calcular el mayor descuento aplicable (beca individual vs familiar)
                desc_beca = socio.porcentaje_beca or 0
                desc_familiar = 0
                if socio.grupo_familiar:
                    desc_familiar = socio.grupo_familiar.descuento_porcentaje

                # Tomamos el mayor (no se acumulan para evitar cuotas en negativo accidentalmente)
                descuento_final = max(desc_beca, desc_familiar)

                if descuento_final > 0:
                    bonificacion = abs(monto) * (Decimal(str(descuento_final)) / Decimal('100'))
                    
                    if desc_familiar > desc_beca:
                        n_miembros = socio.grupo_familiar.miembros_activos
                        desc_descripcion = f'Desc. Familiar ({n_miembros} miembros) {desc_familiar}% – {descripcion}'
                        tipo_mov = 'BECA'
                    else:
                        desc_descripcion = f'Bonificación Beca {desc_beca}% – {descripcion}'
                        tipo_mov = 'BECA'

                    MovimientoFinanciero.objects.create(
                        cuenta=cuenta,
                        tipo=tipo_mov,
                        monto=bonificacion,
                        descripcion=desc_descripcion,
                        fecha=fecha,
                        creado_por=request.user
                    )

                movimientos_creados += 1

        return Response({
            'message': f'Cuotas generadas para {movimientos_creados} socios. {len(socios_saltados)} ya tenían cuota para {mes:02d}/{anio}.',
            'socios_procesados': movimientos_creados,
            'socios_saltados_count': len(socios_saltados),
            'socios_saltados_detalle': socios_saltados,
            'monto': abs(monto),
            'periodo': f'{mes:02d}/{anio}',
            'fecha': fecha
        }, status=status.HTTP_201_CREATED)


class SaldoInicialView(APIView):
    """POST /api/v1/finanzas/saldo-inicial/ → Carga la deuda histórica para un socio."""
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = SaldoInicialSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            socio = Socio.objects.get(
                id=serializer.validated_data['socio_id'],
                club=request.user.club
            )
        except Socio.DoesNotExist:
            return Response({'error': 'Socio no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)
        monto = -abs(serializer.validated_data['monto'])  # Deuda inicial = débito

        with transaction.atomic():
            movimiento = MovimientoFinanciero.objects.create(
                cuenta=cuenta,
                tipo='SALDO_INICIAL',
                monto=monto,
                descripcion=serializer.validated_data['descripcion'],
                fecha=serializer.validated_data['fecha'],
                creado_por=request.user
            )

        return Response({
            'message': 'Saldo inicial registrado correctamente.',
            'movimiento_id': str(movimiento.id),
            'saldo_actual': str(cuenta.saldo)
        }, status=status.HTTP_201_CREATED)

from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from rest_framework.permissions import BasePermission

from reportlab.lib import colors
from num2words import num2words
import os

class GenerarReciboPDFView(APIView):
    """GET /api/v1/finanzas/movimientos/{id}/pdf/ → Genera un recibo PDF del pago con estilo profesional."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            movimiento = MovimientoFinanciero.objects.get(id=pk, cuenta__socio__club=request.user.club)
        except MovimientoFinanciero.DoesNotExist:
            return Response({'error': 'Movimiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Autogenerar número de recibo secuencial calculando todos los pagos positivos del club previos o iguales a este
        count = MovimientoFinanciero.objects.filter(
            cuenta__socio__club=movimiento.cuenta.socio.club,
            monto__gt=0,
            created_at__lte=movimiento.created_at
        ).count()
        numero_recibo = f"{count:06d}"
        socio_slug = f"{movimiento.cuenta.socio.apellidos}_{movimiento.cuenta.socio.nombres}".replace(" ", "_").upper()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="RECIBO_{socio_slug}_{numero_recibo}.pdf"'

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4
        monto_abs = abs(movimiento.monto)

        def draw_receipt(y_start):
            # CINTILLO ROJO TOP
            p.setFillColor(colors.red)
            p.rect(2*cm, y_start, width - 4*cm, 1.5*cm, stroke=0, fill=1)
            p.setFillColor(colors.white)
            p.setFont("Helvetica-Bold", 24)
            p.drawCentredString(width/2, y_start + 0.4*cm, "RECIBO DE PAGO")

            # RECUADRO CABECERA (Grisado fino)
            p.setStrokeColor(colors.gray)
            p.setLineWidth(1)
            p.rect(2*cm, y_start - 3*cm, width - 4*cm, 2.7*cm)

            # Logo (Opcional)
            try:
                config = movimiento.cuenta.socio.club.configuracion
                if config.logo and os.path.exists(config.logo.path):
                    p.drawImage(config.logo.path, 2.2*cm, y_start - 2.8*cm, width=2.5*cm, height=2.5*cm, preserveAspectRatio=True, mask='auto')
                else:
                    p.setFillColor(colors.black)
                    p.setFont("Helvetica-Bold", 14)
                    p.drawString(2.3*cm, y_start - 1.6*cm, movimiento.cuenta.socio.club.nombre[:20])
            except Exception:
                p.setFillColor(colors.black)
                p.setFont("Helvetica-Bold", 14)
                p.drawString(2.3*cm, y_start - 1.6*cm, "CLUB SPORTS")

            # Info Recibo
            p.setFillColor(colors.black)
            p.setFont("Helvetica-Bold", 10)
            p.drawString(12*cm, y_start - 1.5*cm, "N° RECIBO")
            p.drawString(12*cm, y_start - 2.2*cm, "FECHA")
            p.setFont("Helvetica", 10)
            p.drawString(15*cm, y_start - 1.5*cm, numero_recibo)
            meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
            fecha_str = f"{movimiento.fecha.day}-{meses[movimiento.fecha.month-1]}.-{str(movimiento.fecha.year)[2:]}"
            p.drawString(15*cm, y_start - 2.2*cm, fecha_str)

            # RECUADRO CUERPO
            p.setStrokeColor(colors.gray)
            p.rect(2*cm, y_start - 8.5*cm, width - 4*cm, 5.2*cm)

            # Reciente De
            p.setFillColor(colors.HexColor('#FDE68A')) # Amarillo suave
            p.rect(2.1*cm, y_start - 4*cm, 3.5*cm, 0.6*cm, stroke=0, fill=1)
            p.setFillColor(colors.black)
            p.setFont("Helvetica-Bold", 10)
            p.drawString(2.3*cm, y_start - 3.8*cm, "RECIBÍ DE:")
            p.setFont("Helvetica", 11)
            p.drawString(5.8*cm, y_start - 3.8*cm, f"{movimiento.cuenta.socio.nombres} {movimiento.cuenta.socio.apellidos}".upper())

            # La Suma De
            p.setFillColor(colors.HexColor('#FDE68A')) 
            p.rect(2.1*cm, y_start - 4.9*cm, 3.5*cm, 0.6*cm, stroke=0, fill=1)
            p.setFillColor(colors.black)
            p.setFont("Helvetica-Bold", 10)
            p.drawString(2.3*cm, y_start - 4.7*cm, "LA SUMA DE:")
            p.setFont("Helvetica", 11)
            try:
                # Intenta usar lib externa, si no, manual
                monto_letras = num2words(int(monto_abs), lang='es').title()
                decimales = f"{int(monto_abs * 100) % 100:02d}/100"
                monto_texto = f"{monto_letras} Pesos {decimales}"
            except Exception:
                monto_texto = f"Pesos {monto_abs:,.2f}"
            
            p.drawCentredString(12*cm, y_start - 4.7*cm, monto_texto)
            p.setStrokeColor(colors.black)
            p.setDash(1, 1)
            p.line(5.8*cm, y_start - 4.8*cm, width - 2.2*cm, y_start - 4.8*cm)
            p.setDash()

            # Concepto
            p.setFont("Helvetica-Bold", 10)
            p.drawCentredString(width/2, y_start - 5.6*cm, "POR CONCEPTO DE:")
            p.setDash(1, 1)
            p.line(2.2*cm, y_start - 5.7*cm, width - 2.2*cm, y_start - 5.7*cm)
            p.line(2.2*cm, y_start - 6.5*cm, width - 2.2*cm, y_start - 6.5*cm)
            p.line(2.2*cm, y_start - 7.3*cm, width - 2.2*cm, y_start - 7.3*cm)
            p.setDash()
            
            p.setFont("Helvetica", 11)
            p.drawCentredString(width/2, y_start - 6.1*cm, str(movimiento.descripcion).upper()[:90])

            # Pie y Totales
            p.setFillColor(colors.HexColor('#FDE68A')) 
            p.rect(2.1*cm, y_start - 9.1*cm, 3.5*cm, 0.5*cm, stroke=0, fill=1)
            p.setFillColor(colors.black)
            p.setFont("Helvetica-Bold", 9)
            p.drawString(2.3*cm, y_start - 8.95*cm, "OBSERVACIONES")

            p.setStrokeColor(colors.black)
            p.rect(2.1*cm, y_start - 10.5*cm, 9*cm, 1.3*cm)

            p.setFont("Helvetica-Oblique", 11)
            p.drawString(13*cm, y_start - 9*cm, "Moneda")
            p.setFont("Helvetica-Bold", 11)
            p.setFillColor(colors.red)
            p.drawString(15*cm, y_start - 9*cm, "PESOS")
            p.setFillColor(colors.black)

            p.setFont("Helvetica-Bold", 11)
            p.drawString(12.5*cm, y_start - 9.8*cm, "TOTAL:")
            p.drawString(11.5*cm, y_start - 10.4*cm, "TOTAL RECIBIDO:")

            p.setFillColor(colors.HexColor('#FDE68A'))
            p.rect(14.5*cm, y_start - 10.6*cm, 4.3*cm, 1.4*cm, stroke=0, fill=1)
            p.setFillColor(colors.black)
            p.setFont("Helvetica", 12)
            p.drawRightString(18.5*cm, y_start - 9.8*cm, f"{monto_abs:,.2f}")
            p.setFont("Helvetica-Bold", 12)
            p.drawRightString(18.5*cm, y_start - 10.4*cm, f"{monto_abs:,.2f}")

            # Firmas
            p.line(2.1*cm, y_start - 12.3*cm, 8.5*cm, y_start - 12.3*cm)
            p.drawString(2.1*cm, y_start - 12.2*cm, "x.")
            p.setFont("Helvetica-Oblique", 10)
            p.setFillColor(colors.gray)
            p.drawString(2.3*cm, y_start - 12.7*cm, "Firma de Recibido")

            p.setFillColor(colors.black)
            p.line(10.5*cm, y_start - 12.3*cm, width - 2.1*cm, y_start - 12.3*cm)
            p.drawString(10.5*cm, y_start - 12.2*cm, "x.")
            p.setFont("Helvetica-Oblique", 10)
            p.setFillColor(colors.gray)
            p.drawString(10.7*cm, y_start - 12.7*cm, "Firma de Entregado")

        # Dibujar Original (arriba)
        draw_receipt(height - 2*cm)
        
        # Linea de corte
        p.setStrokeColor(colors.gray)
        p.setDash(4, 4)
        p.line(1*cm, height - 15.5*cm, width - 1*cm, height - 15.5*cm)
        p.setDash()
        p.setFont("Helvetica", 8)
        p.drawCentredString(width/2, height - 15.4*cm, "✂ - - - - - corte aquí - - - - - ✂")

        # Dibujar Duplicado (abajo)
        draw_receipt(height - 16.5*cm)
        
        p.showPage()
        p.save()
        return response


# ══════════════════════════════════════════════════════
#  SISTEMA DE AVISOS DE PAGO (Socio → Admin → Recibo)
# ══════════════════════════════════════════════════════

class AvisoPagoSocioView(APIView):
    """
    GET  /api/v1/finanzas/mis-avisos/   → Socio ve sus propios avisos.
    POST /api/v1/finanzas/mis-avisos/   → Socio crea un nuevo aviso de pago.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # El socio solo ve sus propios avisos
        try:
            socio = request.user.perfil_socio
        except Exception:
            return Response({'error': 'No tenés un perfil de socio vinculado.'}, status=status.HTTP_403_FORBIDDEN)

        avisos = AvisoPago.objects.filter(socio=socio)
        serializer = AvisoPagoSerializer(avisos, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            socio = request.user.perfil_socio
        except Exception:
            return Response({'error': 'No tenés un perfil de socio vinculado.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['socio'] = socio.id

        serializer = AvisoPagoSerializer(data=data)
        if serializer.is_valid():
            serializer.save(socio=socio, estado='PENDIENTE')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvisoPagoAdminView(APIView):
    """
    GET /api/v1/finanzas/avisos/   → Admin lista todos los avisos del club.
    Filtros: ?estado=PENDIENTE | VALIDADO | RECHAZADO
    """
    permission_classes = [IsAdminOrProfesorRole]

    def get(self, request):
        estado = request.query_params.get('estado', None)
        qs = AvisoPago.objects.filter(socio__club=request.user.club).select_related('socio', 'validado_por')
        if estado:
            qs = qs.filter(estado=estado)
        serializer = AvisoPagoSerializer(qs, many=True)
        return Response(serializer.data)


class ValidarAvisoView(APIView):
    """
    POST /api/v1/finanzas/avisos/{id}/validar/
    El admin confirma el pago → se genera el MovimientoFinanciero real y el recibo queda disponible.
    Body: { "monto_real": 5000, "descripcion": "Cuota Abril 2026", "metodo_pago": "TRANSFERENCIA" }
    """
    permission_classes = [IsAdminOrProfesorRole]

    def post(self, request, pk):
        try:
            aviso = AvisoPago.objects.get(id=pk, socio__club=request.user.club)
        except AvisoPago.DoesNotExist:
            return Response({'error': 'Aviso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if aviso.estado != 'PENDIENTE':
            return Response({'error': f'El aviso ya fue {aviso.get_estado_display()}. No se puede volver a procesar.'}, status=status.HTTP_400_BAD_REQUEST)

        monto_real = request.data.get('monto_real', aviso.monto_declarado)
        descripcion = request.data.get('descripcion', aviso.descripcion)
        metodo_pago = request.data.get('metodo_pago', 'TRANSFERENCIA')

        with transaction.atomic():
            cuenta, _ = CuentaCorriente.objects.get_or_create(socio=aviso.socio)
            movimiento = MovimientoFinanciero.objects.create(
                cuenta=cuenta,
                tipo='PAGO',
                monto=abs(Decimal(str(monto_real))),  # Crédito = positivo
                descripcion=descripcion,
                metodo_pago=metodo_pago,
                fecha=aviso.fecha_declarada,
                referencia_externa=f"AVISO-{aviso.id}",
                creado_por=request.user,
            )
            aviso.estado = 'VALIDADO'
            aviso.movimiento_generado = movimiento
            aviso.validado_por = request.user
            aviso.fecha_validacion = timezone.now()
            aviso.save()

        return Response({
            'ok': 'Pago validado correctamente.',
            'movimiento_id': str(movimiento.id),
            'recibo_url': f'/api/v1/finanzas/movimientos/{movimiento.id}/pdf/'
        }, status=status.HTTP_200_OK)


class RechazarAvisoView(APIView):
    """
    POST /api/v1/finanzas/avisos/{id}/rechazar/
    El admin rechaza el aviso indicando el motivo.
    Body: { "motivo": "El comprobante no coincide con el monto." }
    """
    permission_classes = [IsAdminOrProfesorRole]

    def post(self, request, pk):
        try:
            aviso = AvisoPago.objects.get(id=pk, socio__club=request.user.club)
        except AvisoPago.DoesNotExist:
            return Response({'error': 'Aviso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if aviso.estado != 'PENDIENTE':
            return Response({'error': f'El aviso ya fue {aviso.get_estado_display()}.'}, status=status.HTTP_400_BAD_REQUEST)

        motivo = request.data.get('motivo', 'Sin motivo especificado.')
        aviso.estado = 'RECHAZADO'
        aviso.observacion_rechazo = motivo
        aviso.validado_por = request.user
        aviso.fecha_validacion = timezone.now()
        aviso.save()

        return Response({'ok': 'Aviso rechazado.', 'motivo': motivo})
