import puppeteer, { Browser, Page } from 'puppeteer';
import { NextApiRequest, NextApiResponse } from 'next';

interface TravelerPDFRequest {
  travelName: string;
  linea: 'BOA' | 'CDU';
  tableData: Array<{
    childMaterial: string;
    workOrder: string;
    qty: number;
    packing: string;
  }>;
  docName: string;
}

function renderTravelerHTML(req: TravelerPDFRequest): string {
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
  
  // Clean travel name: remove "Viper", "Verde", "BOA", "CDU", etc.
  const travelNameClean = travelName
    .replace(/Viper/gi, '')
    .replace(/Verde/gi, '')
    .replace(/BOA/gi, '')
    .replace(/CDU/gi, '')
    .replace(/Azul/gi, '')
    .replace(/Amarillo/gi, '')
    .replace(/Celeste/gi, '')
    .replace(/Rosa/gi, '')
    .trim();

  const totalQty = tableData.reduce((sum, row) => sum + row.qty, 0);
  const currentDate = new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Column widths (in pixels, matching VB.NET values proportionally)
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
        "Kanban": '',
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

    pagesHTML += `
      <page>
        <div class="page-container">
          <!-- HEADER -->
          <div class="header-row">
            <div class="header-item">TRAVELER</div>
            <div class="header-item">${currentDate}</div>
            <div class="header-item">${docName}</div>
            <div class="header-item text-right">Hoja ${currentPageNum} de ${totalPages}</div>
          </div>

          <!-- TITLE -->
          <div class="table-title">${travelNameClean}</div>

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
            <div class="footer-line-1">Cart Name - LRTN ${firstPacking}</div>
            <div class="footer-line-2">
              <div class="footer-item">Sequence - ${travelNameClean}</div>
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Calibri', Arial, sans-serif;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        page {
          display: block;
          page-break-after: always;
          margin: 0;
          padding: 22.5px;
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
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .header-item {
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: bold;
        }

        .text-right {
          text-align: right;
        }

        /* TITLE */
        .table-title {
          font-family: Arial, sans-serif;
          font-size: 48px;
          font-weight: bold;
          text-align: center;
          margin: 44px 0 44px 0;
          color: #000;
          line-height: 1.2;
        }

        /* TABLE */
        .data-table {
          border-collapse: collapse;
          margin: 0 auto;
          font-family: Calibri, Arial, sans-serif;
          font-size: 11px;
          margin-bottom: 22px;
        }

        .data-table th {
          border: 1px solid #000;
          padding: 6px 3px;
          text-align: center;
          font-weight: bold;
          font-family: Arial, sans-serif;
          font-size: 12px;
          background-color: #f5f5f5;
          height: 22px;
          vertical-align: middle;
        }

        .data-table td {
          border: 1px solid #000;
          padding: 4px 3px;
          text-align: center;
          height: 22px;
          vertical-align: middle;
          font-size: 11px;
          font-family: Calibri, Arial, sans-serif;
          font-weight: normal;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* PART NUMBER COLUMN */
        .data-table td.part-font {
          font-family: Calibri, Arial, sans-serif;
          font-size: 11px;
          text-align: left;
          padding-left: 6px;
        }

        /* PACKING/BARCODE COLUMN */
        .data-table td.barcode-font {
          font-family: 'Free 3 of 9 Extended', monospace;
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 1px;
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
          font-size: 14px;
          font-weight: bold;
        }

        .footer-line-2 {
          display: flex;
          justify-content: space-between;
          font-family: Arial, sans-serif;
          font-size: 14px;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const request = req.body as TravelerPDFRequest;
    
    // Generar HTML
    const html = renderTravelerHTML(request);

    // Iniciar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generar PDF en memoria
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();

    // Retornar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${request.travelName}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({
      error: 'Error generating PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
