import type { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { secuencia, tipo } = req.body;

  if (!secuencia || !tipo) {
    return res.status(400).json({ error: 'Secuencia y tipo son requeridos' });
  }

  if (tipo !== 'Viper' && tipo !== 'BOA') {
    return res.status(400).json({ error: 'Tipo debe ser "Viper" o "BOA"' });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('Secuencia', sql.NVarChar, secuencia)
      .input('Linea', sql.NVarChar, tipo)
      .query(
        'INSERT INTO [Secuencias BOA-VIPER] (ID, [Secuencia], [Linea]) VALUES (NEWID(), @Secuencia, @Linea)'
      );

    return res.status(200).json({ message: 'Secuencia guardada exitosamente' });
  } catch (error) {
    console.error('Error al guardar secuencia:', error);
    return res.status(500).json({ error: 'Error al guardar secuencia' });
  }
}
