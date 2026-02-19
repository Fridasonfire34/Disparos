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

    const result = await pool.request().query(`
      SELECT TOP 1 [Semana]
      FROM [Schedule Production Disparo]
      ORDER BY [Fecha Insercion] DESC
    `);

    if (result.recordset.length > 0) {
      const semana = result.recordset[0]['Semana'];
      return res.status(200).json({ semana });
    } else {
      return res.status(200).json({ semana: 'Semana Actual no disponible' });
    }
  } catch (error) {
    console.error('Error getting semana actual:', error);
    return res.status(500).json({
      error: 'Error al obtener semana actual',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
