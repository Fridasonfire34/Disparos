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

  const { ano, fecha } = req.query;

  if (!ano || !fecha) {
    return res.status(400).json({ error: 'Año y Fecha son requeridos' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);

    const tiposResult = await pool
      .request()
      .input('Ano', sql.VarChar, ano)
      .input('Fecha', sql.Date, fecha)
      .query('SELECT DISTINCT [Tipo] FROM [Packings BOA] WHERE [Año] = @Ano AND [Fecha] = @Fecha AND [Tipo] IS NOT NULL ORDER BY [Tipo] ASC');

    await pool.close();

    const tipos = tiposResult.recordset.map((row) => String(row['Tipo'] || ''));

    return res.status(200).json({ tipos });
  } catch (error) {
    console.error('Error fetching packing BOA tipos:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al obtener tipos de Packings BOA' });
  }
}
