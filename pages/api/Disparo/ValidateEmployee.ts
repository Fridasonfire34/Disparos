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

  const { numEmpleado } = req.body;

  if (!numEmpleado || isNaN(Number(numEmpleado))) {
    return res.status(400).json({ error: 'Número de empleado inválido' });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .input('numEmpleado', sql.Int, Number(numEmpleado))
      .query('SELECT COUNT(*) as count FROM Usuarios WHERE [Numero Empleado] = @numEmpleado');

    const exists = result.recordset[0].count > 0;

    await pool.close();

    return res.status(200).json({ valid: exists });
  } catch (error) {
    console.error('Error validating employee:', error);
    return res.status(500).json({ error: 'Error al validar el empleado' });
  }
}
