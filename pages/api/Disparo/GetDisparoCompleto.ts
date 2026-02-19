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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, months } = req.body;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const pool = await poolPromise;
    let query = 'SELECT * FROM DISPARO WHERE ';

    if (months && months.length > 0) {
      const monthConditions = months.map((month: number) => 
        `(YEAR(Entrega) = ${year} AND MONTH(Entrega) = ${month})`
      ).join(' OR ');
      query += monthConditions;
    } else {
      query += `YEAR(Entrega) = ${year}`;
    }

    query += ' ORDER BY Entrega ASC, Linea ASC, [Secuencia] ASC';

    const result = await pool.request().query(query);

    return res.status(200).json({
      data: result.recordset || []
    });
  } catch (error) {
    console.error('Error fetching disparo completo:', error);
    return res.status(500).json({
      error: 'Error al obtener datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
