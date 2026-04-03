import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const fetchFileAsBase64 = async (url) => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error fetching image for PDF:", e);
        return null;
    }
};

export const generateSocioPDF = async (socio, clubConfig) => {
    try {
        // Fetch explicit profile data to get real-time eligibility and category
        const [perfilRes, lesionesRes] = await Promise.all([
            api.get(`deportes/perfiles/?socio=${socio.id}`), 
            api.get(`deportes/lesiones/?socio=${socio.id}`)
        ]);

        const perfil = perfilRes.data && perfilRes.data.length > 0 ? perfilRes.data[0] : null;
        const eligibility = perfil?.eligibility || { habilitado: false, warnings: [] };
        const lesiones = lesionesRes.data || [];

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const primaryColor = [15, 23, 42]; 
        const accentColor = [37, 99, 235]; 
        
        // -------------------------
        // HEADER
        // -------------------------
        let logoClub = null;
        if (clubConfig?.logo) {
            logoClub = await fetchFileAsBase64(clubConfig.logo);
        }

        if (logoClub) {
            doc.addImage(logoClub, 'PNG', margin, 10, 30, 30);
        } else {
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, 10, 30, 30);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        const clubTitle = (clubConfig?.nombre || 'Club Deportivo').toUpperCase();
        doc.text(clubTitle, 50, 25);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Ficha Médica y Deportiva Oficial', 50, 32);
        doc.text(`Generada el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 50, 38);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, 45, pageWidth - margin, 45);

        let currentY = 55;

        // -------------------------
        // SOCIO DATA TABLE
        // -------------------------
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('DATOS PERSONALES', margin, currentY);
        currentY += 5;

        const calcularEdad = (fechaNacimiento) => {
            if (!fechaNacimiento) return '-';
            const hoy = new Date();
            const nac = new Date(fechaNacimiento);
            let edad = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
            return edad;
        };

        const hasMedicalWarning = eligibility.warnings.some(w => w.tipo === 'MEDICO');
        const hasAdminWarning = eligibility.warnings.some(w => w.tipo === 'ADMINISTRATIVO');
        const hasFinancialWarning = eligibility.warnings.some(w => w.tipo === 'MOROSIDAD' && w.severidad === 'CRITICAL');

        const socioBody = [
            ['Nombres:', socio.nombres, 'Apellidos:', socio.apellidos],
            ['Nro. Socio:', socio.nro_socio || 'N/A', 'DNI:', socio.dni],
            ['Fecha Nac.:', new Date(socio.fecha_nacimiento).toLocaleDateString(), 'Edad:', `${calcularEdad(socio.fecha_nacimiento)} años`],
            ['Sexo:', socio.sexo || '-', 'Grupo Sanguíneo:', socio.grupo_sanguineo || '-'],
            ['Teléfono:', socio.telefono || '-', 'Email:', socio.email_contacto || '-'],
            ['Elegibilidad:', eligibility.habilitado ? 'HABILITADO' : 'INHABILITADO / BLOQUEADO', 'Emergencia:', socio.contacto_emergencia_nombre ? `${socio.contacto_emergencia_nombre} (${socio.contacto_emergencia_telefono || '-'})` : '-']
        ];
        
        autoTable(doc, {
            startY: currentY,
            body: socioBody,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 50] },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 },
                1: { cellWidth: 55 },
                2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 },
                3: { cellWidth: 55 }
            },
            margin: { left: margin }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // -------------------------
        // PERFIL DEPORTIVO TABLE
        // -------------------------
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('PERFIL DEPORTIVO', margin, currentY);
        currentY += 5;

        // FIX CATEGORIA: Age based if no profile linked
        const age = calcularEdad(socio.fecha_nacimiento);
        const getCategoryByAge = (a) => {
            if (a <= 10) return 'MINI';
            if (a <= 12) return 'INFANTILES';
            if (a <= 14) return 'MENORES';
            if (a <= 16) return 'CADETES';
            if (a <= 18) return 'JUVENILES';
            if (a <= 21) return 'JUNIORS';
            return 'MAYORES';
        };

        const categoriaFinal = perfil?.categoria_nombre || getCategoryByAge(age);
        const alturaStr = perfil?.altura_cm ? `${perfil.altura_cm} cm` : (socio.altura ? `${parseFloat(socio.altura) * 100} cm` : '-');
        const pesoStr = perfil?.peso_kg ? `${perfil.peso_kg} kg` : (socio.peso ? `${socio.peso} kg` : '-');
        const manoStr = perfil?.mano_habil || (socio.mano_habil === 'DER' ? 'Derecha' : socio.mano_habil === 'IZQ' ? 'Izquierda' : '-');
        const posicionStr = perfil?.posicion_principal ? perfil.posicion_principal.replace('_', ' ') : (socio.posicion_habitual || '-');

        const perfilBody = [
            ['Categoría Actual:', categoriaFinal, 'Apto Médico:', hasMedicalWarning ? 'VENCIDO / NO CARGADO' : 'VIGENTE'],
            ['Posición Principal:', posicionStr, 'Mano Hábil:', manoStr],
            ['Altura:', alturaStr, 'Peso:', pesoStr],
            ['Seguro / Cuota:', hasAdminWarning ? 'PENDIENTE T.' : 'AL DÍA', 'Financiero:', hasFinancialWarning ? 'DEUDA CRÍTICA' : 'SIN DEUDA CRÍTICA']
        ];

        autoTable(doc, {
            startY: currentY,
            body: perfilBody,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 50] },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 },
                1: { cellWidth: 55 },
                2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 },
                3: { cellWidth: 55 }
            },
            margin: { left: margin }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // TUTOR SECTION
        if (age < 18 || socio.nombre_tutor) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text('DATOS DEL TUTOR LEGAL', margin, currentY);
            currentY += 5;
            autoTable(doc, {
                startY: currentY,
                body: [['Nombre Tutor:', socio.nombre_tutor || '-', 'DNI Tutor:', socio.dni_tutor || '-'], ['Parentesco:', socio.parentesco_tutor || '-', 'Teléfono:', socio.tel_tutor || '-']],
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 50] },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 }, 1: { cellWidth: 55 }, 2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 }, 3: { cellWidth: 55 } },
                margin: { left: margin }
            });
            currentY = doc.lastAutoTable.finalY + 10;
        }

        // LESIONES
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('HISTORIAL DE LESIONES', margin, currentY);
        currentY += 5;
        if (lesiones.length > 0) {
            autoTable(doc, {
                startY: currentY,
                head: [['FECHA', 'CONTEXTO', 'DIAGNÓSTICO', 'ESTADO', 'ALTA']],
                body: lesiones.map(l => [new Date(l.fecha_lesion).toLocaleDateString(), l.contexto.replace('_', ' '), l.diagnostico, l.estado, l.fecha_alta_real ? new Date(l.fecha_alta_real).toLocaleDateString() : '-']),
                theme: 'striped',
                headStyles: { fillColor: accentColor, textColor: [255, 255, 255] },
                styles: { fontSize: 8 },
                margin: { left: margin }
            });
        } else {
            doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(150, 150, 150).text('No registra historial de lesiones.', margin, currentY + 2);
        }

        // FOOTER
        const pages = doc.internal.getNumberOfPages();
        for (let j = 1; j <= pages; j++) {
            doc.setPage(j);
            doc.setFontSize(8).setTextColor(150, 150, 150);
            doc.text('Powered by ctsoft.com.ar', margin, pageHeight - 10);
            doc.text(`Página ${j} de ${pages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        doc.save(`Ficha_${socio.apellidos}_${socio.nombres}_${new Date().toISOString().split('T')[0]}.pdf`);
        return true;
    } catch (err) {
        console.error("Error generando PDF:", err);
        return false;
    }
};
