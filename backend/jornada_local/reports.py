from django.conf import settings
from django.template.loader import render_to_string
from admin_club.models import ClubConfig
from .models import Jornada
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

def generar_pdf_ficha_jornada(jornada_id):
    """
    Genera el reporte PDF profesional de la jornada para el club.
    Incluye membrete, desgloses financieros y branding de CTSoft.
    """
    try:
        from weasyprint import HTML, CSS
    except OSError as e:
        logger.error(f"Error al cargar WeasyPrint: {e}. Asegúrese de tener GTK+ instalado en Windows.")
        raise ImportError("El servicio de PDF no está disponible en este servidor (faltan librerías de sistema).")

    jornada = Jornada.objects.select_related('club', 'balance_caja').get(id=jornada_id)
    config = ClubConfig.objects.filter(club=jornada.club).first()
    
    # Datos de recaudación para el template
    balance = jornada.balance_caja
    resumen = balance.calcular_resumen() if balance else {}
    voluntarios = jornada.voluntarios.select_related('persona').order_by('tarea')
    
    total_bruto = resumen.get('total_efectivo', 0) + resumen.get('total_digital', 0)
    
    context = {
        'jornada': jornada,
        'club': jornada.club,
        'config': config,
        'resumen': resumen,
        'total_bruto': total_bruto,
        'balance': balance,
        'voluntarios': voluntarios,
        'fecha_impresion': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        'logo_url': request_absolute_logo_path(config) if config and config.logo else None
    }

    # Renderizado de HTML
    html_string = render_to_string('reports/ficha_jornada.html', context)
    
    # Generar PDF
    # Podríamos aplicar estilos CSS específicos aquí o en el HTML
    pdf_file = HTML(string=html_string).write_pdf()
    
    return pdf_file

def request_absolute_logo_path(config):
    """Obtengo la ruta absoluta para WeasyPrint (filesystem)"""
    if config and config.logo:
        # En local, WeasyPrint prefiere la ruta del sistema de archivos
        return os.path.join(settings.MEDIA_ROOT, config.logo.name)
    return None
