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

    const anosResult = await pool
      .request()
      .query('SELECT DISTINCT [Año] FROM [Packings BOA] WHERE [Año] IS NOT NULL ORDER BY [Año] ASC');

    await pool.close();

    const anos = anosResult.recordset.map((row) => String(row['Año'] || ''));

    return res.status(200).json({ anos });
  } catch (error) {
    console.error('Error fetching packing BOA filters:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al obtener filtros de Packings BOA' });
  }
}
