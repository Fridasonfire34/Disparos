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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { numeroParte } = req.body as { numeroParte?: string };

  if (!numeroParte?.trim()) {
    return res.status(400).json({ error: 'Numero de parte invalido' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);

    await pool
      .request()
      .input('numeroParte', sql.VarChar, numeroParte.trim())
      .query('DELETE FROM Kanban WHERE [Numero de Parte] = @numeroParte');

    await pool.close();

    return res.status(200).json({ message: 'Kanban eliminado correctamente.' });
  } catch (error) {
    console.error('Error deleting kanban:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al eliminar Kanban' });
  }
}
