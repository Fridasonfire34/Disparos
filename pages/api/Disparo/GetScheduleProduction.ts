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
    const linea = typeof req.query.linea === 'string' ? req.query.linea.trim() : '';
    const yearParam = typeof req.query.year === 'string' ? Number(req.query.year) : undefined;
    const request = pool.request();

    let query = 'SELECT * FROM [Schedule Production Disparo]';
    const conditions: string[] = [];

    if (linea) {
      conditions.push('Linea LIKE @Linea');
      request.input('Linea', sql.VarChar, `%${linea}%`);
    }

    if (Number.isFinite(yearParam)) {
      conditions.push('YEAR([Fecha Produccion CMX]) = @Year');
      request.input('Year', sql.Int, yearParam as number);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY YEAR([Fecha Produccion CMX]) DESC, Semana ASC';

    const result = await request.query(query);

    return res.status(200).json({
      data: result.recordset || []
    });
  } catch (error) {
    console.error('Error fetching schedule production data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch schedule production data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
