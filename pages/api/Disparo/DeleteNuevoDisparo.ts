import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'TMP',
  connectionTimeout: 30000,
  requestTimeout: 120000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { numEmpleado } = req.body || {};

  if (!numEmpleado || isNaN(Number(numEmpleado))) {
    return res.status(400).json({ error: 'Número de empleado inválido' });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    const deleteDisparoNvo = "DELETE FROM DISPARO WHERE [Estatus] = 'Disparo Nuevo'";
    const deleteTarjetas = 'DELETE FROM [SOL TABLE]';
    const deleteFQ = 'DELETE FROM [Disparo FQ]';
    const deletePREL = 'DELETE FROM [DisparoPREL]';

    await pool.request().query(deleteDisparoNvo);
    await pool.request().query(deleteTarjetas);
    await pool.request().query(deleteFQ);
    await pool.request().query(deletePREL);

    await pool.close();

    return res.status(200).json({ message: 'Se ha eliminado el Disparo' });
  } catch (error) {
    console.error('Error deleting Disparo:', error);
    return res.status(500).json({
      error: 'Error al eliminar el Disparo: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}
