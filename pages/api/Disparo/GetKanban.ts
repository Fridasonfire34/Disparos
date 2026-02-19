import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'Travelers',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .query('SELECT * FROM Kanban ORDER BY [Numero de Parte] ASC');

    await pool.close();

    return res.status(200).json({ kanban: result.recordset });
  } catch (error) {
    console.error('Error fetching kanban:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al obtener Kanban' });
  }
}
