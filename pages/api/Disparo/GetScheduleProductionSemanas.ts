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
      .query('SELECT DISTINCT [Semana] FROM [Schedule Production Disparo] ORDER BY [Semana] ASC');

    return res.status(200).json({
      data: result.recordset || []
    });
  } catch (error) {
    console.error('Error fetching semanas:', error);
    return res.status(500).json({ 
      error: 'Error al obtener las semanas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
