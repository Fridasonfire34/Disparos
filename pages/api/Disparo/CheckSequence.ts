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

  const { secuencia } = req.body;

  if (!secuencia) {
    return res.status(400).json({ error: 'Secuencia es requerida' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('Secuencia', sql.NVarChar, secuencia)
      .query('SELECT [Linea] FROM [Secuencias BOA-VIPER] WHERE [Secuencia] = @Secuencia');

    if (result.recordset.length > 0) {
      return res.status(200).json({
        existe: true,
        linea: result.recordset[0].Linea,
      });
    } else {
      return res.status(200).json({
        existe: false,
      });
    }
  } catch (error) {
    console.error('Error al verificar secuencia:', error);
    return res.status(500).json({ error: 'Error al verificar secuencia' });
  }
}
