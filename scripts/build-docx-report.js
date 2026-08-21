const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} = require('docx');

async function generateDocx() {
  const primaryColor = '1B2A4A'; // Navy Blue SyBorx
  const secondaryColor = '3B82F6'; // Blue Accent
  const lightBg = 'F1F5F9';
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  function createHeaderCell(text, widthPercent) {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { fill: primaryColor, type: ShadingType.CLEAR },
      borders: tableBorder,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text,
              bold: true,
              color: 'FFFFFF',
              font: 'Arial',
              size: 20,
            }),
          ],
        }),
      ],
    });
  }

  function createCell(text, widthPercent, isBold = false, align = AlignmentType.LEFT) {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      borders: tableBorder,
      children: [
        new Paragraph({
          alignment: align,
          children: [
            new TextRun({
              text,
              bold: isBold,
              font: 'Arial',
              size: 19,
              color: '1E293B',
            }),
          ],
        }),
      ],
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Portada
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'SyBorx Messenger',
                bold: true,
                size: 52,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Plataforma Empresarial de Mensajería, Comunidades y Colaboración en Tiempo Real',
                italics: true,
                size: 24,
                color: secondaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'REPORTE TÉCNICO INTEGRAL, ANÁLISIS FINANCIERO Y ESTRATEGIA CLOUDFLARE',
                bold: true,
                size: 26,
                color: '334155',
                font: 'Arial',
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Documento', 25),
                  createHeaderCell('Versión', 25),
                  createHeaderCell('Fecha', 25),
                  createHeaderCell('Estado', 25),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Reporte Técnico & Costos', 25, true),
                  createCell('2.0 Enterprise', 25),
                  createCell('Agosto 2026', 25),
                  createCell('Núcleo Implementado', 25),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // 1. Resumen Ejecutivo
          new Paragraph({
            text: '1. Resumen Ejecutivo y Justificación de Negocio',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'SyBorx Messenger es una plataforma de mensajería empresarial e infraestructura de colaboración en tiempo real diseñada para centralizar la comunicación operativa y de ingeniería dentro de la organización. Inspirada en la agilidad de Discord y la estructura empresarial de Slack, la solución ofrece comunidades segmentadas, canales temáticos (#general, #dev-backend, #anuncios), mensajería directa 1 a 1, presencia en vivo, compartición de archivos y control de acceso basado en roles (RBAC).',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'Justificación Estratégica: ',
                bold: true,
                font: 'Arial',
                size: 21,
              }),
              new TextRun({
                text: 'Al poseer el 100% de la propiedad intelectual y de la infraestructura, la empresa garantiza la soberanía y confidencialidad total de sus datos, evitando costos recurrentes de licenciamiento por usuario ($8 - $15 USD/mes en Slack/Teams) y permitiendo auditoría granular y políticas de seguridad a medida.',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),

          // 2. Arquitectura
          new Paragraph({
            text: '2. Arquitectura Tecnológica y Stack',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Capa', 20),
                  createHeaderCell('Tecnología', 25),
                  createHeaderCell('Versión', 15),
                  createHeaderCell('Propósito / Detalle', 40),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Backend Core', 20, true),
                  createCell('NestJS (Node.js + TS)', 25),
                  createCell('10.3 / 5.4', 15),
                  createCell('Arquitectura modular, DTOs validados y alta concurrencia.', 40),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Base de Datos', 20, true),
                  createCell('PostgreSQL (Docker)', 25),
                  createCell('16.0', 15),
                  createCell('11 tablas relacionales, índices btree y claves UUID.', 40),
                ],
              }),
              new TableRow({
                children: [
                  createCell('ORM', 20, true),
                  createCell('Prisma ORM', 25),
                  createCell('5.14', 15),
                  createCell('Migraciones seguras, cliente fuertemente tipado.', 40),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Tiempo Real', 20, true),
                  createCell('Socket.io Gateway', 25),
                  createCell('4.7.5', 15),
                  createCell('WebSockets persistentes con salas por canal y DM.', 40),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Frontend', 20, true),
                  createCell('HTML5 + CSS3 + JS SPA', 25),
                  createCell('Nativo', 15),
                  createCell('Diseño Liquid Glass, carga ultrarrápida sin sobrecarga.', 40),
                ],
              }),
            ],
          }),

          // 3. Seguridad
          new Paragraph({
            text: '3. Seguridad Enterprise y Políticas de Contraseñas',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '• Autenticación JWT Dual: ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'Access token de corta duración (1 día) y Refresh token hasheado con Bcrypt en base de datos (7 días con revocación al logout).',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '• Expiración Semestral (6 meses): ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'El sistema valida la fecha passwordChangedAt. Si supera los 180 días, bloquea la sesión y exige la actualización preventiva de la clave.',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '• Claves Temporales de 24h por Administrador: ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'El módulo Admin permite generar contraseñas temporales criptográficas de un solo uso para usuarios que olvidaron su clave, forzando su cambio al iniciar sesión.',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '• Validación de Fuerza en Tiempo Real: ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'Verificación interactiva de 8+ caracteres, mayúscula, minúscula, dígito, símbolo especial y coincidencia exacta.',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),

          // 4. Estimación de Costos de Desarrollo (CAPEX)
          new Paragraph({
            text: '4. Estimación de Costos de Desarrollo de Software (CAPEX)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Especialidad / Rol', 30),
                  createHeaderCell('Horas', 15),
                  createHeaderCell('Tarifa / Hr', 25),
                  createHeaderCell('Subtotal (USD)', 30),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Arquitecto de Software / DB', 30, true),
                  createCell('40 hrs', 15, false, AlignmentType.CENTER),
                  createCell('$55.00 USD', 25, false, AlignmentType.CENTER),
                  createCell('$2,200.00 USD', 30, true, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Senior Backend Engineer', 30, true),
                  createCell('110 hrs', 15, false, AlignmentType.CENTER),
                  createCell('$45.00 USD', 25, false, AlignmentType.CENTER),
                  createCell('$4,950.00 USD', 30, true, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Senior Frontend / UI Engineer', 30, true),
                  createCell('90 hrs', 15, false, AlignmentType.CENTER),
                  createCell('$40.00 USD', 25, false, AlignmentType.CENTER),
                  createCell('$3,600.00 USD', 30, true, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Seguridad & QA Integration', 30, true),
                  createCell('35 hrs', 15, false, AlignmentType.CENTER),
                  createCell('$40.00 USD', 25, false, AlignmentType.CENTER),
                  createCell('$1,400.00 USD', 30, true, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('DevOps & Dockerización', 30, true),
                  createCell('25 hrs', 15, false, AlignmentType.CENTER),
                  createCell('$45.00 USD', 25, false, AlignmentType.CENTER),
                  createCell('$1,125.00 USD', 30, true, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Project Management & Doc', 30, true),
                  createCell('20 hrs', 15, false, AlignmentType.CENTER),
                  createCell('$35.00 USD', 25, false, AlignmentType.CENTER),
                  createCell('$700.00 USD', 30, true, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('TOTAL DESARROLLO (CAPEX)', 30, true),
                  createCell('320 hrs', 15, true, AlignmentType.CENTER),
                  createCell('—', 25, true, AlignmentType.CENTER),
                  createCell('$13,975.00 USD', 30, true, AlignmentType.RIGHT),
                ],
              }),
            ],
          }),

          // 5. Costos de Infraestructura y Retorno de Inversión
          new Paragraph({
            text: '5. Costos Operativos Mensuales (OPEX) y Retorno de Inversión (ROI)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: '• Costo Operativo Cloud: ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'Un VPS dedicado de 4 vCPU y 8 GB RAM ($24.00/mes) + Cloudflare R2 ($1.50/mes) totalizan ~$26.50 USD/mes (~$318.00 USD/año) para soportar hasta 500 usuarios concurrentes.',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: '• Comparativa ROI a 3 años (50 usuarios): ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'Slack Business+ representaría $22,500.00 USD en 3 años. SyBorx Messenger representará $14,929.00 USD (incluyendo el 100% del desarrollo e infraestructura), generando un ahorro superior a $7,500.00 USD y un ahorro neto anual de más de $7,000.00 USD a partir del año 4.',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),

          // 6. Reporte Cloudflare
          new Paragraph({
            text: '6. Reporte de Integración con Cloudflare (Seguridad, CDN y Tunnels)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '1. Cloudflare Tunnel (Zero Trust / cloudflared): ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'Permite conectar el servidor interno a internet mediante un túnel cifrado saliente sin abrir puertos en el firewall/router de la oficina y sin requerir IP pública fija ($0.00 USD en Free Tier).',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '2. Protección Anti-DDoS y WAF: ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'Filtrado de tráfico malicioso en el Edge y Rate Limiting para evitar ataques de fuerza bruta en los endpoints de inicio de sesión.',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '3. Cloudflare R2 Object Storage: ',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
              new TextRun({
                text: 'Almacenamiento de fotos y documentos adjuntos compatible con S3 con CERO costo por transferencia de datos salientes (Zero Egress Fees).',
                font: 'Arial',
                size: 20,
              }),
            ],
          }),

          // Tabla Cloudflare
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Servicio Cloudflare', 35),
                  createHeaderCell('Plan Recomendado', 30),
                  createHeaderCell('Costo Estimado', 35),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cloudflare DNS + Anti-DDoS', 35, true),
                  createCell('Free Tier', 30),
                  createCell('$0.00 / mes', 35, false, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cloudflare Tunnel (Zero Trust)', 35, true),
                  createCell('Free Tier (hasta 50 users)', 30),
                  createCell('$0.00 / mes', 35, false, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cloudflare R2 (100 GB Storage)', 35, true),
                  createCell('Pay-as-you-go', 30),
                  createCell('~$1.50 / mes', 35, false, AlignmentType.RIGHT),
                ],
              }),
              new TableRow({
                children: [
                  createCell('TOTAL SUITE CLOUDFLARE', 35, true),
                  createCell('Enterprise Security', 30, true),
                  createCell('~$1.50 USD / mes', 35, true, AlignmentType.RIGHT),
                ],
              }),
            ],
          }),

          // Conclusiones
          new Paragraph({
            text: '7. Conclusiones y Próximos Pasos',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'SyBorx Messenger se consolida como una solución lista para producción que ofrece alta velocidad, interfaz moderna y seguridad empresarial. Se recomienda implementar la conexión mediante Cloudflare Tunnel para el despliegue corporativo en https://messenger.syborx.com.',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'Reporte_Tecnico_SyBorx_Messenger.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('✓ Reporte Word generado exitosamente en:', outputPath);
}

generateDocx().catch(console.error);
