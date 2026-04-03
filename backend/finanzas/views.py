from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.models import Socio
from .models import CuentaCorriente, MovimientoFinanciero
from .serializers import (
    CuentaCorrienteSerializer, MovimientoFinancieroSerializer,
    GenerarCuotasSerializer, SaldoInicialSerializer
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
                },
                'saldo': cuenta.saldo, # Propiedad @property
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
    """POST /api/v1/finanzas/cuotas/generar/ → Genera cuotas para todos los socios ACTIVOS del club."""
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = GenerarCuotasSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        monto = -abs(serializer.validated_data['monto'])  # Débito = negativo
        descripcion = serializer.validated_data['descripcion']
        fecha = serializer.validated_data['fecha']

        socios_activos = Socio.objects.filter(club=request.user.club, estado='ACTIVO')

        movimientos_creados = 0
        with transaction.atomic():
            for socio in socios_activos:
                cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)
                
                # 1. Registrar la Cuota Plena (Débito)
                MovimientoFinanciero.objects.create(
                    cuenta=cuenta,
                    tipo='CUOTA',
                    monto=monto,
                    descripcion=descripcion,
                    fecha=fecha,
                    creado_por=request.user
                )
                
                # 2. Aplicar Bonificación por Beca si corresponde (Crédito)
                if socio.porcentaje_beca > 0:
                    bonificacion = abs(monto) * (Decimal(str(socio.porcentaje_beca)) / Decimal('100'))
                    MovimientoFinanciero.objects.create(
                        cuenta=cuenta,
                        tipo='BECA',
                        monto=bonificacion,
                        descripcion=f'Bonificación Beca {socio.porcentaje_beca}% - {descripcion}',
                        fecha=fecha,
                        creado_por=request.user
                    )
                
                movimientos_creados += 1

        return Response({
            'message': f'Cuotas generadas exitosamente para {movimientos_creados} socios activos.',
            'socios_procesados': movimientos_creados,
            'monto': abs(monto),
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
