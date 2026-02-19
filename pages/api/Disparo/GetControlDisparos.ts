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
    connectTimeout: 30000,
    requestTimeout: 30000
  }
}).connect();

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const showAll = req.query.showAll === 'true';
    const pool = await poolPromise;
    
    let query = 'SELECT * FROM [CONTROL DISPAROS]';
    if (!showAll) {
      query += ' WHERE [Hora] >= DATEADD(DAY, -5, CAST(GETDATE() AS DATE))';
    }
    query += ' ORDER BY [Hora] ASC';
    
    const result = await pool
      .request()
      .query(query);

    return res.status(200).json({
      data: result.recordset || []
    });
  } catch (error) {
    console.error('Error fetching control disparos:', error);
    return res.status(500).json({
      error: 'Error al obtener datos de control de disparos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
