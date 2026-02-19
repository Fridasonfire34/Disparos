import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

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

const previewQueries: Record<string, string> = {
  'Disparo Preliminar': `
    SELECT [Fecha Requerida Entrega], [Tipo], [Orden de Produccion], [Secuencia], [Cantidad Requerida]
    FROM [DisparoPREL]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  'Disparo Nuevo': `
    SELECT *
    FROM [Disparo FQ]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  Panther: `SELECT * FROM [Panther]`,
  TSVPAC: `
    SELECT *
    FROM [TSVPACQ]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  'Press Shop': `
    SELECT *
    FROM [Press Shop]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  MPCQ: `
    SELECT *
    FROM [MPC]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  Legacy: `
    SELECT *
    FROM [Legacy]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  CoilShop: `
    SELECT *
    FROM [COILSHOP]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  'FILTER TRACK': `
    SELECT *
    FROM [Filter Track]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
  'Special Orders': `
    SELECT *
    FROM [Specials]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
  `,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const source = typeof req.query.source === 'string' ? req.query.source : '';
  const query = previewQueries[source];

  if (!query) {
    return res.status(400).json({ error: 'Fuente no valida' });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(query);
    await pool.close();

    return res.status(200).json({ data: result.recordset || [] });
  } catch (error) {
    console.error('Error loading preview table:', error);
    return res.status(500).json({
      error: 'Error al cargar vista previa: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}
