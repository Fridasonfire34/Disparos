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

interface TarjetaConfig {
  nombre: string;
  tabla: string;
  query: string;
  columnas: string[];
  nombreArchivo: string;
}

const tarjetas: TarjetaConfig[] = [
  {
    nombre: 'SO',
    tabla: '[Specials]',
    query: "SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo] FROM [Specials]",
    columnas: ['Linea', 'Orden de Produccion', 'Secuencia', 'Numero de Parte', 'Fecha Requerida Entrega', 'Cantidad Requerida', 'Tipo'],
    nombreArchivo: 'SpecialOrders'
  },
  {
    nombre: 'Panther',
    tabla: '[Panther]',
    query: "SELECT [Orden de Produccion], [Numero de Parte], [Cantidad Requerida] FROM [Panther] ORDER BY [Orden de Produccion] ASC",
    columnas: ['Orden de Produccion', 'Numero de Parte', 'Cantidad Requerida'],
    nombreArchivo: 'PantherRep'
  },
  {
    nombre: 'PressShop',
    tabla: '[Press Shop]',
    query: "SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo] FROM [Press Shop]",
    columnas: ['Linea', 'Orden de Produccion', 'Secuencia', 'Numero de Parte', 'Fecha Requerida Entrega', 'Cantidad Requerida', 'Tipo'],
    nombreArchivo: 'PShopQ'
  },
  {
    nombre: 'MPC',
    tabla: '[MPC]',
    query: "SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo] FROM [MPC]",
    columnas: ['Linea', 'Orden de Produccion', 'Secuencia', 'Numero de Parte', 'Fecha Requerida Entrega', 'Cantidad Requerida', 'Tipo'],
    nombreArchivo: 'MPCQ'
  },
  {
    nombre: 'Legacy',
    tabla: '[Legacy]',
    query: "SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo] FROM [Legacy]",
    columnas: ['Linea', 'Orden de Produccion', 'Secuencia', 'Numero de Parte', 'Fecha Requerida Entrega', 'Cantidad Requerida', 'Tipo'],
    nombreArchivo: 'TSLegacy4'
  },
  {
    nombre: 'TSVPAC',
    tabla: '[TSVPACQ]',
    query: "SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo] FROM [TSVPACQ]",
    columnas: ['Linea', 'Orden de Produccion', 'Secuencia', 'Numero de Parte', 'Fecha Requerida Entrega', 'Cantidad Requerida', 'Tipo'],
    nombreArchivo: 'TSVPACQ'
  },
  {
    nombre: 'Coil',
    tabla: '[COILSHOP]',
    query: "SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo] FROM [COILSHOP]",
    columnas: ['Linea', 'Orden de Produccion', 'Secuencia', 'Numero de Parte', 'Fecha Requerida Entrega', 'Cantidad Requerida', 'Tipo'],
    nombreArchivo: 'CoilShop'
  },
  {
    nombre: 'TrackFilter',
    tabla: '[Filter Track]',
    query: "SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo] FROM [Filter Track]",
    columnas: ['Linea', 'Orden de Produccion', 'Secuencia', 'Numero de Parte', 'Fecha Requerida Entrega', 'Cantidad Requerida', 'Tipo'],
    nombreArchivo: 'Filter Tracks'
  }
];

async function createExcelForTarjeta(config: TarjetaConfig, rows: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(config.nombre);

  // Agregar header
  worksheet.addRow(config.columnas);
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

  // Para Panther, aplicar transformación de deduplicación
  if (config.nombre === 'Panther') {
    const uniqueOrders = new Set<string>();
    for (const row of rows) {
      const orden = row['Orden de Produccion'];
      if (!uniqueOrders.has(orden)) {
        if (uniqueOrders.size > 0) {
          worksheet.addRow([]);
        }
        worksheet.addRow([orden, row['Numero de Parte'], row['Cantidad Requerida']]);
        uniqueOrders.add(orden);
      } else {
        worksheet.addRow(['', row['Numero de Parte'], row['Cantidad Requerida']]);
      }
    }
  } else {
    // Para otras tarjetas, solo agregar las filas
    for (const row of rows) {
      const values = config.columnas.map(col => row[col] ?? '');
      worksheet.addRow(values);
    }
  }

  // Auto-fit columnas
  worksheet.columns.forEach((col) => {
    col.width = Math.min(30, Math.max(12, (col.header?.toString().length || 10) + 4));
  });

  return await workbook.xlsx.writeBuffer();
}

function formatTarjetaTimestamp(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hourStr = String(hours).padStart(2, '0');

  return `${day}${month}${year} ${hourStr}${minutes} ${ampm}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tarjeta } = req.query;

  if (!tarjeta) {
    return res.status(200).json({ 
      tarjetas: tarjetas.map(t => ({ nombre: t.nombre, nombreArchivo: t.nombreArchivo }))
    });
  }

  const config = tarjetas.find(t => t.nombre === tarjeta);
  if (!config) {
    return res.status(400).json({ error: 'Tarjeta no encontrada' });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(config.query);
    await pool.close();

    const rows = result.recordset || [];
    
    if (rows.length === 0) {
      return res.status(400).json({ error: `No hay datos para ${config.nombre}` });
    }

    const buffer = await createExcelForTarjeta(config, rows);
    const filename = `${config.nombreArchivo} ${formatTarjetaTimestamp(new Date())}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error(`Error exporting tarjeta ${tarjeta}:`, error);
    return res.status(500).json({
      error: 'Error al exportar tarjeta: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}

