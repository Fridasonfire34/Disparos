import { ConnectionPool } from 'mssql';
import sql from 'mssql';

const poolPromise = new ConnectionPool({
  server: 'HPC-050',
  database: 'TMP',
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .query(`
        SELECT 
          [Linea], 
          [Qty], 
          [Orden Produccion], 
          [Fecha CMX]
        FROM DISPARO
        WHERE Linea LIKE '% TS'
        AND Estatus <> 'ENVIADO'
        ORDER BY [Entrega] ASC, [Linea] ASC, [Fecha CMX] ASC, [Secuencia] ASC
      `);

    return res.status(200).json({
      data: result.recordset || []
    });
  } catch (error) {
    console.error('Error fetching tube sheets:', error);
    return res.status(500).json({
      error: 'Error al obtener datos de tube sheets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
