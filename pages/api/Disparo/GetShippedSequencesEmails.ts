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
        SELECT [Correo]
        FROM [Correos Disparo]
        WHERE [Disparo Actualizado] = 'TRUE'
      `);

    const correos = result.recordset.map((row: any) => row.Correo);

    return res.status(200).json({ 
      correos: correos || []
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return res.status(500).json({ 
      error: 'Error fetching emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
