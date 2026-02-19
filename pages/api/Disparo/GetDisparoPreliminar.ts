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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const selectQuery = `
      SELECT [Fecha Requerida Entrega], [Tipo], [Orden de Produccion], [Secuencia], [Cantidad Requerida]
      FROM [DisparoPREL]
      ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Orden de Produccion] ASC
    `;

    const result = await pool.request().query(selectQuery);
    await pool.close();

    return res.status(200).json({ data: result.recordset || [] });
  } catch (error) {
    console.error('Error loading Disparo Preliminar:', error);
    return res.status(500).json({
      error: 'Error al cargar el Disparo Preliminar: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}
