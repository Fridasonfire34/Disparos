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

  const { ano } = req.query;

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);

    const anosResult = await pool
      .request()
      .query('SELECT DISTINCT [Año] FROM [Packings] WHERE [Año] IS NOT NULL ORDER BY [Año] ASC');

    const anos = anosResult.recordset.map((row) => String(row['Año'] || ''));

    let semanas: string[] = [];

    if (ano && typeof ano === 'string') {
      const semanasResult = await pool
        .request()
        .input('Ano', sql.VarChar, ano)
        .query('SELECT DISTINCT [Semana] FROM [Packings] WHERE [Año] = @Ano AND [Semana] IS NOT NULL ORDER BY [Semana] ASC');

      semanas = semanasResult.recordset.map((row) => String(row['Semana'] || ''));
    }

    await pool.close();

    return res.status(200).json({ semanas, anos });
  } catch (error) {
    console.error('Error fetching packing filters:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al obtener filtros de Packings' });
  }
}
