import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'TMP',
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

  const { nombreCaja } = req.body;

  if (!nombreCaja || !nombreCaja.trim()) {
    return res.status(400).json({ error: 'Por favor ingresa el nombre de la nueva caja' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);
    
    await pool
      .request()
      .input('nombreCaja', sql.NVarChar, nombreCaja.trim())
      .query('INSERT INTO CAJAS ([Nombre caja]) VALUES (@nombreCaja)');

    await pool.close();

    return res.status(200).json({ 
      message: `Se agregó '${nombreCaja}' correctamente.`,
      nombreCaja: nombreCaja.trim()
    });
  } catch (error) {
    console.error('Error adding custom caja:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al agregar la nueva caja' });
  }
}
