import puppeteer, { Browser } from 'puppeteer';
import { NextApiRequest, NextApiResponse } from 'next';
import archiver from 'archiver';
import ExcelJS from 'exceljs';
import { ConnectionPool } from 'mssql';

interface TravelerData {
  travelName: string;
  linea: 'BOA' | 'CDU' | 'VIPER';
  docName: string;
  tableData: Array<{
    childMaterial: string;
    workOrder: string;
    qty: number;
    packing: string;
    kanban?: string;
  }>;
}

interface TravelersZipRequest {
  travelers: TravelerData[];
}

function renderTravelerHTML(req: TravelerData): string {
  const { travelName, linea, tableData, docName } = req;
  
  // Validate required fields
  if (!travelName || typeof travelName !== 'string') {
    throw new Error('Invalid or missing travelName in request');
  }
  if (!Array.isArray(tableData) || tableData.length === 0) {
    throw new Error('Invalid or missing tableData in request');
  }
  if (!docName || typeof docName !== 'string') {
    throw new Error('Invalid or missing docName in request');
  }
  
  // Clean travel name: remove "Viper", "Verde", "BOA", etc.
  const travelNameClean = travelName
    .replace(/Viper/gi, '')
    .replace(/Verde/gi, '')
    .replace(/BOA/gi, '')
    .replace(/Azul/gi, '')
    .replace(/Amarillo/gi, '')
    .replace(/Celeste/gi, '')
    .replace(/Rosa/gi, '')
    .trim();

  const pageTitle = travelNameClean || travelName;

  const totalQty = tableData.reduce((sum, row) => sum + row.qty, 0);
  
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const fullYear = now.getFullYear();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const hours24 = String(now.getHours()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // DocName debe usar el valor de Semana de SOL
  const finalDocName = docName;

  // Fecha para header (formato: 19/02/2026 08:14:57)
  const currentDate = `${day}/${month}/${fullYear} ${hours24}:${minutes}:${seconds}`;

  // Column widths (in pixels)
  const columnWidths: { [key: string]: number } = {
    "Mat'l": 42,
    "N. parte": 110,
    "Sec": 89,
    "Rev": 36,
    "Cant": 43,
    "Prog": 43,
    "Embarques": 95,
    "Packing": 168,
    "Kanban": 64,
    "Liberado": 75
  };

  const columns = Object.keys(columnWidths);
  const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
  const rowsPerPage = 38;
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  let pagesHTML = '';

  // Generate each page
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const startRow = pageNum * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, tableData.length);
    const pageData = tableData.slice(startRow, endRow);
    const currentPageNum = pageNum + 1;

    let tableRows = '';
    pageData.forEach((row) => {
      const cells: { [key: string]: string } = {
        "Mat'l": '',
        "N. parte": row.childMaterial,
        "Sec": row.workOrder,
        "Rev": '',
        "Cant": row.qty.toString(),
        "Prog": '',
        "Embarques": '',
        "Packing": row.packing,
        "Kanban": row.kanban || '',
        "Liberado": ''
      };

      let rowHTML = '<tr>';
      columns.forEach(col => {
        const value = cells[col];
        const width = columnWidths[col];
        const fontClass = col === 'Packing' ? 'barcode-font' : (col === 'N. parte' ? 'part-font' : '');
        rowHTML += `<td style="width: ${width}px;" class="${fontClass}">${value}</td>`;
      });
      rowHTML += '</tr>';
      tableRows += rowHTML;
    });

    const firstPacking = tableData[0]?.packing || '';
    const cartPrefix = linea === 'CDU' ? 'CDU' : 'LRTN';

    pagesHTML += `
      <page>
        <div class="page-container">
          <!-- HEADER -->
          <div class="header-row">
            <div class="header-item"><strong>TRAVELER</strong></div>
            <div class="header-item-normal">${currentDate}</div>
            <div class="header-item-normal">${finalDocName}</div>
            <div class="header-item-normal text-right">Hoja ${currentPageNum} de ${totalPages}</div>
          </div>

          <!-- TITLE -->
          <div class="table-title">${pageTitle}</div>

          <!-- TABLE -->
          <table class="data-table" style="width: ${totalWidth}px;">
            <thead>
              <tr>
                ${columns.map(col => `<th style="width: ${columnWidths[col]}px;">${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <!-- FOOTER -->
          <div class="footer-row">
            <div class="footer-line-1">Cart Name - ${cartPrefix} ${firstPacking}</div>
            <div class="footer-line-2">
              <div class="footer-item">Sequence - ${pageTitle}</div>
              <div class="footer-item" style="text-align: right;">Total Parts - ${totalQty}</div>
            </div>
          </div>
        </div>
      </page>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'Free 3 of 9';
          src: url('file:///C:/Users/FridaGutierrez/Desktop/disparo/public/fonts/FRE3OF9X.TTF') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Calibri', Arial, sans-serif;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        page {
          display: block;
          page-break-after: always;
          margin: 0;
          padding: 2px;
          width: 8.5in;
          height: 11in;
          position: relative;
        }

        .page-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* HEADER ROW */
        .header-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          line-height: 1.4;
        }

        .header-item {
          font-family: Arial, sans-serif;
          font-size: 15px;
          font-weight: bold;
        }

        .header-item-normal {
          font-family: Arial, sans-serif;
          font-size: 15px;
          font-weight: normal;
        }

        .text-right {
          text-align: right;
        }

        /* TITLE */
        .table-title {
          font-family: Arial, sans-serif;
          font-size: 49px;
          font-weight: bold;
          text-align: center;
          margin: 6px 0 6px 0;
          color: #000;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* TABLE */
        .data-table {
          border-collapse: collapse;
          margin: 0 auto;
          font-family: Calibri, Arial, sans-serif;
          font-size: 16px;
          margin-bottom: 6px;
        }

        .data-table th {
          border: 1px solid #000;
          padding: 2px 3px;
          text-align: center;
          font-weight: bold;
          font-family: Arial, sans-serif;
          font-size: 18px;
          background-color: #f5f5f5;
          height: 10px;
          vertical-align: middle;
        }

        .data-table td {
          border: 1px solid #000;
          padding: 1px 3px;
          text-align: center;
          height: 10px;
          vertical-align: middle;
          font-size: 18px;
          font-family: Calibri, Arial, sans-serif;
          font-weight: normal;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .data-table td:nth-child(3),
        .data-table td:nth-child(5) {
          font-size: 18px;
        }

        /* PART NUMBER COLUMN */
        .data-table td.part-font {
          font-family: Calibri, Arial, sans-serif;
          font-size: 18px;
          text-align: left;
          padding-left: 6px;
        }

        /* PACKING/BARCODE COLUMN */
        .data-table td.barcode-font {
          font-family: 'Free 3 of 9', monospace;
          font-size: 24px;
          font-weight: normal;
          letter-spacing: 2px;
          text-align: center;
        }

        /* FOOTER */
        .footer-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 22px;
          font-family: Arial, sans-serif;
          font-weight: bold;
        }

        .footer-line-1 {
          font-family: Arial, sans-serif;
          font-size: 18px;
          font-weight: bold;
        }

        .footer-line-2 {
          display: flex;
          justify-content: space-between;
          font-family: Arial, sans-serif;
          font-size: 18px;
          font-weight: bold;
        }

        .footer-item {
          flex: 1;
        }

        @media print {
          page {
            page-break-after: always;
            margin: 0;
            padding: 22.5px;
            width: 8.5in;
            height: 11in;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${pagesHTML}
    </body>
    </html>
  `;
}

async function generateDocEscanerExcel(): Promise<{ buffer: Buffer; filename: string }> {
  const poolPromise = new ConnectionPool({
    server: 'HPC-050',
    database: 'Travelers',
    user: 'sa',
    password: 'TMPdb1124',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableKeepAlive: true,
      connectionTimeout: 30000,
      requestTimeout: 30000
    }
  }).connect();

  const pool = await poolPromise;

  try {
    // 1. Limpiar Doc Escaner
    await pool.request().query('DELETE FROM [Doc Escaner]');

    // 2. SELECT datos desde SOL
    const solData = await pool.request().query(`
      SELECT [Child Material], [Work Order], [Qty], [Packing], [Linea]
      FROM [SOL]
    `);

    // 3. INSERT en Doc Escaner
    for (const row of solData.recordset) {
      const packingValue = row['Packing'] || '';
      const packingValueTrimmed = packingValue.toString().replace(/\*/g, '');
      const packingDiskNo = parseFloat(packingValueTrimmed) || null;

      await pool.request()
        .input('PartNumber', row['Child Material'])
        .input('BuildSequence', parseFloat(row['Work Order']) || null)
        .input('PONo', parseFloat(row['Work Order']) || null)
        .input('Qty', parseFloat(row['Qty']) || null)
        .input('PackingDiskNo', packingDiskNo)
        .input('Linea', row['Linea'])
        .query(`
          INSERT INTO [Doc Escaner] 
          ([PartNumber], [BuildSequence], [Qty], [PONo], [PackingDiskNo], [Linea])
          VALUES (@PartNumber, @BuildSequence, @Qty, @PONo, @PackingDiskNo, @Linea)
        `);
    }

    // 4. UPDATE BalloonNumber y VendorNo
    await pool.request().query(`
      UPDATE [Doc Escaner] 
      SET [BalloonNumber] = ISNULL([BalloonNumber], 'N/A'), 
          [VendorNo] = '29409'
    `);

    // 5. Obtener Semana para el nombre del archivo
    const semanaResult = await pool.request().query(`
      SELECT TOP 1 [Semana] FROM [SOL]
    `);
    const semana = semanaResult.recordset?.[0]?.Semana || 'Travelers';

    // 6. SELECT datos para el Excel
    const excelData = await pool.request().query(`
      SELECT 
        [PartNumber], 
        [BuildSequence], 
        [BalloonNumber], 
        [Qty], 
        [PONo], 
        [VendorNo], 
        [PackingDiskNo], 
        [Linea]
      FROM [Doc Escaner]
    `);

    // 7. Generar Excel con ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hoja 1');

    // Agregar headers
    const headers = ['PartNumber', 'BuildSequence', 'BalloonNumber', 'Qty', 'PONo', 'VendorNo', 'PackingDiskNo', 'Linea'];
    const headerRow = worksheet.addRow(headers);

    // Estilo de headers
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCFFFF' } // RGB(204, 255, 255)
      };
      cell.border = {
        top: { style: 'thick' },
        bottom: { style: 'thick' },
        left: { style: 'thick' },
        right: { style: 'thick' }
      };
    });

    // Agregar datos
    excelData.recordset.forEach((row: any) => {
      worksheet.addRow([
        row.PartNumber,
        row.BuildSequence,
        row.BalloonNumber,
        row.Qty,
        row.PONo,
        row.VendorNo,
        row.PackingDiskNo,
        row.Linea
      ]);
    });

    // AutoFit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${semana}VIPER & BOA.xls`;

    return { buffer: Buffer.from(buffer), filename };
  } finally {
    await pool.close();
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;

  try {
    const { travelers } = req.body as TravelersZipRequest;

    if (!Array.isArray(travelers) || travelers.length === 0) {
      return res.status(400).json({ error: 'Missing or empty travelers array' });
    }

    // Debug: Log first traveler to verify docName
    if (travelers.length > 0) {
      console.log('First traveler received:', JSON.stringify(travelers[0], null, 2));
    }

    // Generar fecha y hora para el nombre del archivo
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateFormatted = `${day}${month}${year}`; // Formato: 260218
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeFormatted = `${String(hours).padStart(2, '0')}${minutes} ${ampm}`; // Formato: 0348 PM
    
    const zipFilename = `Travelers-DISPARO-${dateFormatted}-${timeFormatted}.zip`;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    // Crear el archivo
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Manejar errores del archive
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error creating ZIP file' });
      }
    });

    // Piping del archive al response ANTES de agregar archivos
    archive.pipe(res);

    // Generar y agregar Excel de Doc Escaner al ZIP
    try {
      console.log('Generating Doc Escaner Excel...');
      const { buffer: excelBuffer, filename: excelFilename } = await generateDocEscanerExcel();
      archive.append(excelBuffer, { name: excelFilename });
      console.log(`Added ${excelFilename} to archive`);
    } catch (excelError) {
      console.error('Error generating Doc Escaner Excel:', excelError);
    }

    // Iniciar Puppeteer una sola vez
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Generar PDF para cada traveler
    for (const traveler of travelers) {
      try {
        console.log(`Generating PDF for traveler: ${traveler.travelName}`);
        
        const html = renderTravelerHTML(traveler);
        console.log(`HTML generated, length: ${html.length}`);
        
        const page = await browser.newPage();
        
        try {
          await page.setContent(html, { waitUntil: 'load' });
          console.log(`Content set for traveler: ${traveler.travelName}`);

          const pdfContent = await page.pdf({
            format: 'A4',
            margin: {
              top: '15px',
              bottom: '15px',
              left: '5px',
              right: '5px'
            }
          });

          // Ensure pdfContent is a Buffer (page.pdf may return Uint8Array)
          const pdfBuffer = Buffer.isBuffer(pdfContent) ? pdfContent : Buffer.from(pdfContent);
          console.log(`PDF generated, buffer type: ${typeof pdfBuffer}, is Buffer: ${Buffer.isBuffer(pdfBuffer)}, length: ${pdfBuffer?.length || 0}`);

          // Agregar PDF al archivo
          if (pdfBuffer && pdfBuffer.length > 0) {
            const fileName = `${traveler.travelName.replace(/[/\\:*?"<>|]/g, '_')}.pdf`;
            archive.append(pdfBuffer, { name: fileName });
            console.log(`Added ${fileName} to archive`);
          } else {
            console.warn(`Invalid PDF buffer for traveler: ${traveler.travelName}, buffer: ${pdfBuffer}`);
          }
        } finally {
          await page.close();
        }
      } catch (pageError) {
        console.error(`Error generating PDF for traveler ${traveler.travelName}:`, pageError);
      }
    }

    // Finalizar el archive DESPUÉS de agregar todos los PDFs
    await archive.finalize();

  } catch (error) {
    console.error('Error generating travelers ZIP:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Error generating travelers ZIP',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
