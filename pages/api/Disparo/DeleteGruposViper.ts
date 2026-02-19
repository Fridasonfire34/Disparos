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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { grupoLogistico } = req.body;

  if (!grupoLogistico || typeof grupoLogistico !== 'string' || grupoLogistico.trim() === '') {
    return res.status(400).json({ error: 'Grupo Logistico requerido' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .input('GrupoLogistico', sql.NVarChar, grupoLogistico.trim())
      .query('DELETE FROM [Grupos Viper] WHERE [Grupo Logistico] = @GrupoLogistico');

    await pool.close();

    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    return res.status(200).json({ message: 'Grupo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting Grupos Viper:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al eliminar Grupo Viper' });
  }
}
