import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import ExcelJS from 'exceljs';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'TMP',
  connectionTimeout: 30000,
  requestTimeout: 120000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const colorMap: { [key: string]: string } = {
  'Red': 'FFFF0000',
  'Blue': '00003CCC',
  'Orange': 'FFED7D31',
  'Light Pink': 'FFFFC0C0',
  'Neon Pink': 'FFFF80FF',
  'Melon': 'FFFF8080',
  'Light Blue': 'FFBDD7EE',
  'Beige': 'FFFFE0C0',
  'White': 'FFFFFFFF',
  'Soft Pink': 'FFFF99CC',
  'Black13': 'FF0D0D0D',
  'Green142': 'FF8ED973',
  'Grey166': 'FFA6A6A6',
  'W242': 'FFF2F2F2',
  'Grey89': 'FF595959',
  'Grey217': 'FFD9D9D9',
  'Gray': 'FF808080',
  'Green78': 'FF4EA72E',
  'Grey191': 'FFBFBFBF',
  'Pink206': 'FFF2CEEF',
  'Orange169': 'FFF1A983',
  'Blue179': 'FF44B3E1',
  'Pink158': 'FFE49EDD',
  'BlackB': 'FF000000',
  'Pink109': 'FFD86DCD',
  'Grey64': 'FF404040',
  'Green211': 'FF47D359',
  'Y153': 'FFFFFF99',
  'Cyan': 'FF00FFFF',
  'PP660': 'FF6600FF',
  'Red204': 'FFCC0000',
  'PP102': 'FF660066',
  'Blue51': 'FF3333FF',
  'Pink147': 'FFD60093',
  'GreenCCC0': 'FFCCCC00',
  'Blue33CCC': 'FF33CCCC',
  'PP6699': 'FF666635',
  'BROWN': 'FF993300',
  'Teal': 'FF008080',
  'Purple160': 'FFA02B93',
};

function formatEntrega(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return formatted.replace(/,\s/, ' ').replace(/p\.\s+m\./, 'p.m.');
}

function rgbStringToArgb(rgbString: string | null): string {
  if (!rgbString) return 'FFFFFFFF';

  try {
    const parts = rgbString.split(',').map((value) => {
      const num = parseInt(value.trim(), 10);
      return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 255);
    });

    if (parts.length >= 3) {
      const r = parts[0].toString(16).padStart(2, '0').toUpperCase();
      const g = parts[1].toString(16).padStart(2, '0').toUpperCase();
      const b = parts[2].toString(16).padStart(2, '0').toUpperCase();
      return `FF${r}${g}${b}`;
    }
  } catch (error) {
    // No-op: fallback below.
  }

  return 'FFFFFFFF';
}

function formatWorksheet(worksheet: ExcelJS.Worksheet, data: any[], isViper: boolean = false) {
  if (data.length === 0) return;

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 14, name: 'Arial' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'center' };
  headerRow.height = 25;

  // Set header values
  const headerValues = isViper 
    ? ['Linea', 'Entrega', 'Supply Area', 'Qty', 'Orden Produccion', 'Estatus', 'Comentarios', 'Fecha CMX', 'WK', 'Numero de caja enviada', 'Hora de envio']
    : ['Linea', 'Entrega', 'Secuencia', 'Qty', 'Orden Produccion', 'Estatus', 'Comentarios', 'Fecha CMX', 'WK', 'Numero de caja enviada', 'Hora de envio'];
  
  for (let col = 0; col < headerValues.length; col++) {
    worksheet.getCell(1, col + 1).value = headerValues[col];
    worksheet.getCell(1, col + 1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  }

  // Format rows
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;
    let bgColorEstatus = 'FFFFFFFF';
    let bgColorColors = 'FFFFFFFF';

    // Process each column
    let colIndex = 1;
    for (const key in row) {
      const cell = worksheet.getCell(rowNum, colIndex);
      const value = row[key];
      const colNum = colIndex - 1;

      if (key === 'Entrega' || colNum === 1) {
        // Format Entrega date
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            cell.value = formatEntrega(date);
          } else {
            cell.value = value;
          }
        }
      } else if (key === 'Orden Produccion' || colNum === 4) {
        // Format Orden Produccion - remove leading zeros
        if (value) {
          const numVal = parseFloat(String(value).replace(/^0+/, ''));
          cell.value = isNaN(numVal) ? value : numVal;
        }
      } else if (key === 'Estatus' || colNum === 5) {
        // Format Estatus
        if (value) {
          const estatus = String(value).trim().toUpperCase();
          if (estatus === 'SIN ESTATUS') {
            cell.value = '';
          } else if (estatus === 'DISPARO NUEVO') {
            cell.value = 'Disparo Nuevo';
          } else {
            cell.value = estatus;
          }

          if (estatus === 'RTS' || estatus === 'LISTO PARA ENVIAR') {
            bgColorEstatus = 'FFFFFF00'; // Yellow
          } else if (estatus === 'ENVIADO' || estatus === 'ENVIADO PENDIENTE') {
            bgColorEstatus = 'FF00B050'; // Green
          }
        }
      } else if (key === 'Fecha CMX' || colNum === 7) {
        // Format Fecha CMX
        if (!value) {
          cell.value = 'REVISION CON PLANEACION';
        } else {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            cell.value = date;
            cell.numFmt = 'dd/MM/yyyy';
          } else {
            cell.value = value;
          }
        }
      } else if (key === 'Hora de envio' || colNum === 10) {
        // Format Hora de envio
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            cell.value = formatEntrega(date);
          } else {
            cell.value = value;
          }
        }
      } else if (key === 'Colors' || colNum === 11) {
        // Map Colors
        const colorKey = value ? String(value).trim() : '';
        const rgbColor = rgbStringToArgb(colorKey);
        bgColorColors = rgbColor !== 'FFFFFFFF' ? rgbColor : (colorMap[colorKey] || 'FFFFFFFF');
      } else {
        cell.value = value;
      }

      // Apply cell styling
      cell.font = { bold: true, name: 'Arial Black', size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      colIndex++;
    }

    // Apply background color to entire row
    for (let col = 1; col <= colIndex - 1; col++) {
      const cell = worksheet.getCell(rowNum, col);
      const finalColor = bgColorColors !== 'FFFFFFFF' ? bgColorColors : bgColorEstatus;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: finalColor } };
    }
  }

  // Apply header autofilter
  if (data.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headerValues.length },
    };
  }

  // Set column widths
  worksheet.getColumn(1).width = 50;
  worksheet.getColumn(2).width = 35;
  worksheet.getColumn(3).width = isViper ? 19 : 19;
  worksheet.getColumn(4).width = 30;
  worksheet.getColumn(5).width = 30;
  worksheet.getColumn(6).width = 45;
  worksheet.getColumn(7).width = 102;
  worksheet.getColumn(8).width = 38;
  worksheet.getColumn(9).width = isViper ? 12 : 14;
  worksheet.getColumn(10).width = 26;
  worksheet.getColumn(11).width = 26;

  // Delete Colors column (column 12)
  if (worksheet.columnCount >= 12) {
    worksheet.spliceColumns(12, 1);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const workbook = new ExcelJS.Workbook();

    // Query para 39M
    const query39M = "SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors] FROM [DISPARO] WHERE TIPO IS NULL AND Estatus <> 'ENVIADO' ORDER BY [Entrega] ASC, [Linea] ASC, [Fecha CMX] ASC, [Secuencia] ASC";
    const result39M = await pool.request().query(query39M);
    const data39M = result39M.recordset || [];

    if (data39M.length > 0) {
      const worksheet39M = workbook.addWorksheet('39M');
      formatWorksheet(worksheet39M, data39M, false);
    }

    // Query para VIPER
    const queryViper = "SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors] FROM [DISPARO] WHERE TIPO = 'Viper' AND Estatus <> 'ENVIADO' ORDER BY [Entrega] ASC, [Linea] ASC, [Fecha CMX] ASC, [Secuencia] ASC";
    const resultViper = await pool.request().query(queryViper);
    const dataViper = resultViper.recordset || [];

    if (dataViper.length > 0) {
      const worksheetViper = workbook.addWorksheet('VIPER');
      formatWorksheet(worksheetViper, dataViper, true);
    }

    // Query para BOA
    const queryBOA = "SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors] FROM [DISPARO] WHERE TIPO = 'BOA' AND Estatus <> 'ENVIADO' ORDER BY [Entrega] ASC, [Linea] ASC, [Fecha CMX] ASC, [Secuencia] ASC";
    const resultBOA = await pool.request().query(queryBOA);
    const dataBOA = resultBOA.recordset || [];

    if (dataBOA.length > 0) {
      const worksheetBOA = workbook.addWorksheet('BOA');
      formatWorksheet(worksheetBOA, dataBOA, false);
    }

    // Query para CDU
    const queryCDU = "SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors] FROM [DISPARO] WHERE TIPO = 'CDU' AND Estatus <> 'ENVIADO' ORDER BY [Entrega] ASC, [Linea] ASC, [Fecha CMX] ASC, [Secuencia] ASC";
    const resultCDU = await pool.request().query(queryCDU);
    const dataCDU = resultCDU.recordset || [];

    if (dataCDU.length > 0) {
      const worksheetCDU = workbook.addWorksheet('CDU');
      formatWorksheet(worksheetCDU, dataCDU, false);
    }

    await pool.close();

    if (workbook.worksheets.length === 0) {
      return res.status(400).json({ error: 'No hay datos para generar Disparo' });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
    const hourStr = String(hours).padStart(2, '0');
    const filename = `DISPARO ${day}${month}${year} ${hourStr}${minutes}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('Error exporting Disparo:', error);
    return res.status(500).json({
      error: 'Error al exportar Disparo: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}
