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

type PrelRow = {
  'Fecha Requerida Entrega': string | Date;
  Tipo: string;
  'Orden de Produccion': string;
  Secuencia: number | string;
  'Cantidad Requerida': number | string;
};

function formatDateValue(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? '');
  return date.toISOString();
}

function formatDateForExcel(isoDateString: string): string {
  if (!isoDateString) return '';
  try {
    const date = new Date(isoDateString);
    if (Number.isNaN(date.getTime())) return isoDateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoDateString;
  }
}

function applyPrelTransforms(rows: PrelRow[]): (string | number)[][] {
  const mapped = rows.map((row) => ({
    fecha: formatDateValue(row['Fecha Requerida Entrega']),
    tipo: row.Tipo ?? '',
    orden: row['Orden de Produccion'] ?? '',
    secuencia: row.Secuencia ?? '',
    cantidad: row['Cantidad Requerida'] ?? '',
  }));

  mapped.sort((a, b) => a.fecha.localeCompare(b.fecha));

  let lastFecha = '';
  for (const item of mapped) {
    if (item.fecha === lastFecha) {
      item.fecha = '';
    } else {
      lastFecha = item.fecha;
    }
  }

  let currentTipo = '';
  let count = 0;
  for (let i = 0; i < mapped.length; i++) {
    const item = mapped[i];
    if (item.tipo === currentTipo) {
      if (!item.fecha) {
        count += 1;
      }
    } else {
      if (count > 1) {
        for (let j = 1; j <= count - 1; j += 1) {
          if (!mapped[i - j].fecha) {
            mapped[i - j].tipo = '';
          }
        }
      }
      currentTipo = item.tipo;
      count = 1;
    }
  }
  if (count > 1) {
    for (let j = 1; j <= count - 1; j += 1) {
      const idx = mapped.length - j;
      if (idx >= 0 && !mapped[idx].fecha) {
        mapped[idx].tipo = '';
      }
    }
  }

  const withTipoGaps: typeof mapped = [];
  for (let i = 0; i < mapped.length; i += 1) {
    const item = mapped[i];
    if (item.tipo) {
      withTipoGaps.push({ fecha: '', tipo: '', orden: '', secuencia: '', cantidad: '' });
    }
    withTipoGaps.push(item);
  }
  if (withTipoGaps[0] && !withTipoGaps[0].tipo && !withTipoGaps[0].fecha) {
    withTipoGaps.shift();
  }

  const finalRows: typeof mapped = [];
  for (let i = 0; i < withTipoGaps.length; i += 1) {
    const item = withTipoGaps[i];
    if (item.fecha) {
      finalRows.push({ fecha: '', tipo: '', orden: '', secuencia: '', cantidad: '' });
    }
    finalRows.push(item);
  }
  if (finalRows[0] && !finalRows[0].fecha && !finalRows[0].tipo) {
    finalRows.shift();
  }

  return finalRows.map((row) => [
    formatDateForExcel(row.fecha),
    row.tipo,
    row.orden,
    row.secuencia,
    row.cantidad,
  ]);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    await pool.request().query("UPDATE [DisparoPREL] SET Tipo = 'Ts Legacy' WHERE Tipo LIKE '%3/8 TS Legacy%'");
    await pool.request().query("UPDATE [DisparoPREL] SET Tipo = 'VPAC TS VPAC' WHERE Tipo LIKE '% 3/8 TSVPAC%'");

    const queryPreliminar = "SELECT * FROM [DisparoPREL] ORDER BY [Tipo] ASC";
    const result = await pool.request().query(queryPreliminar);
    await pool.close();

    const rows = (result.recordset || []) as PrelRow[];
    if (!rows.length) {
      return res.status(400).json({ error: 'No hay datos para importar' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Disparo Preliminar');

    worksheet.addRow([
      'Fecha Requerida Entrega',
      'Linea',
      'Orden de Produccion',
      'Secuencia',
      'Cantidad Requerida',
    ]);

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const transformed = applyPrelTransforms(rows);
    for (const row of transformed) {
      worksheet.addRow(row);
    }

    worksheet.columns.forEach((col) => {
      col.width = Math.min(30, Math.max(12, (col.header?.toString().length || 10) + 4));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
    const hourStr = String(hours).padStart(2, '0');
    const fileName = `Disparo PRELIMINAR ${day}${month}${year} ${hourStr}${minutes} ${ampm}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error exporting Disparo Preliminar:', error);
    return res.status(500).json({
      error: 'Error al exportar los datos: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}
