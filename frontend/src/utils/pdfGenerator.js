import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../services/api';

const fetchFileAsBase64 = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        return null;
    }
};

export const generateSocioPDF = async (socio, clubConfig) => {
    try {
        // Fetch remaining details
        const [perfilRes, lesionesRes] = await Promise.all([
            api.get(`deportes/perfiles/`), // Needs filtering or fetching all 
            api.get(`deportes/lesiones/?socio=${socio.id}`)
        ]);

        // Find profile for this socio if it exists
        const perfil = perfilRes.data.find(p => p.socio_detalle?.id === socio.id) || null;
        const lesiones = lesionesRes.data || [];

        // Initialize PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;

        // Custom colors based on "premium" look
        const primaryColor = [15, 23, 42]; // slate-900
        const accentColor = [37, 99, 235]; // blue-600
        
        // -------------------------
        // HEADER
        // -------------------------
        // Try getting club logo as base64
        let logoBase64 = null;
        if (clubConfig?.logo) {
            logoBase64 = await fetchFileAsBase64(clubConfig.logo);
        } else {
            // Default check in public folder if possible, skipping for now
             logoBase64 = await fetchFileAsBase64('/logo_pwa.png');
        }

        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', margin, margin, 20, 20);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.text(clubConfig?.nombre || 'Club Deportivo', margin + 25, margin + 8);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Ficha Médica y Deportiva Oficial', margin + 25, margin + 14);
        doc.text(`Generada el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin + 25, margin + 19);

        // Line separator
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

        let currentY = margin + 35;

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
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
                edad--;
            }
            return edad;
        };

        const socioBody = [
            ['Nombres:', socio.nombres, 'Apellidos:', socio.apellidos],
            ['Nro. Socio:', socio.nro_socio || 'N/A', 'DNI:', socio.dni],
            ['Fecha Nac.:', new Date(socio.fecha_nacimiento).toLocaleDateString(), 'Edad:', `${calcularEdad(socio.fecha_nacimiento)} años`],
            ['Sexo:', socio.sexo, 'Grupo Sanguíneo:', socio.grupo_sanguineo || '-'],
            ['Teléfono:', socio.telefono || '-', 'Email:', socio.email_contacto || '-'],
            ['Elegibilidad:', socio.estado, 'Emergencia:', `${socio.contacto_emergencia_nombre || '-'} (${socio.contacto_emergencia_telefono || '-'})`]
        ];

        doc.autoTable({
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

        const perfilBody = perfil ? [
            ['Categoría Actual:', perfil.categoria_nombre || '-', 'Apto Médico:', perfil.apto_medico_vigente ? 'Vigente' : 'Vencido o N/A'],
            ['Posición Principal:', perfil.posicion_principal ? perfil.posicion_principal.replace('_', ' ') : '-', 'Mano Hábil:', perfil.mano_habil || '-'],
            ['Altura (cm):', perfil.altura_cm ? `${perfil.altura_cm} cm` : '-', 'Peso (kg):', perfil.peso_kg ? `${perfil.peso_kg} kg` : '-'],
            ['Seguro / Federación:', perfil.habilitado_federacion ? 'HABILITADO' : 'NO HABILITADO', 'Nro Fed.:', perfil.nro_federacion || '-']
        ] : [['Sin perfil deportivo configurado para este socio.', '', '', '']];

        doc.autoTable({
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

        // -------------------------
        // DATOS DEL TUTOR (Si es menor)
        // -------------------------
        if (calcularEdad(socio.fecha_nacimiento) < 18 || socio.nombre_tutor) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text('DATOS DEL TUTOR LEGAL', margin, currentY);
            currentY += 5;

            const tutorBody = [
                ['Nombre Tutor:', socio.nombre_tutor || '-', 'DNI Tutor:', socio.dni_tutor || '-'],
                ['Parentesco:', socio.parentesco_tutor || '-', 'Teléfono:', socio.tel_tutor || '-']
            ];

            doc.autoTable({
                startY: currentY,
                body: tutorBody,
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
        }

        // -------------------------
        // HISTORIAL DE LESIONES
        // -------------------------
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('HISTORIAL DE LESIONES', margin, currentY);
        currentY += 5;

        if (lesiones && lesiones.length > 0) {
            const head = [['FECHA', 'TIPO / CONTEXTO', 'DIAGNÓSTICO', 'ESTADO', 'ALTA / PROBABLE']];
            const body = lesiones.map(l => [
                new Date(l.fecha_lesion).toLocaleDateString(),
                l.contexto.replace('_', ' '),
                l.diagnostico,
                l.estado,
                l.fecha_alta_real ? new Date(l.fecha_alta_real).toLocaleDateString() : (l.fecha_probable_alta ? new Date(l.fecha_probable_alta).toLocaleDateString() : '-')
            ]);

            doc.autoTable({
                startY: currentY,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                styles: { fontSize: 8, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 25, fontStyle: 'bold' },
                    4: { cellWidth: 25 }
                },
                margin: { left: margin },
                didParseCell: function(data) {
                    // Pintar de rojo si está activa
                    if (data.section === 'body' && data.column.index === 3) {
                        if (data.cell.raw === 'ACTIVA') {
                            data.cell.styles.textColor = [225, 29, 72]; // rose-600
                        } else {
                            data.cell.styles.textColor = [16, 185, 129]; // emerald-500
                        }
                    }
                }
            });
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text('No registra historial de lesiones.', margin, currentY + 2);
        }

        // -------------------------
        // FOOTER
        // -------------------------
        const pages = doc.internal.getNumberOfPages();
        for (let j = 1; j <= pages; j++) {
            doc.setPage(j);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            
            // Left Footer
            doc.text('Powered by ctsoft.com.ar', margin, pageHeight - 10);
            
            // Center Page Info
            doc.text(`Página ${j} de ${pages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Right Footer
            doc.text(`${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        // Output PDF Document
        const safeName = `${socio.apellidos}_${socio.nombres}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`Ficha_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);

        return true;
    } catch (err) {
        console.error("Error generando PDF:", err);
        return false;
    }
};
