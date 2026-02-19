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

  const { sequences } = req.body;

  if (!sequences || !Array.isArray(sequences) || sequences.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de secuencias' });
  }

  try {
    const pool = await poolPromise;

    for (const item of sequences) {
      if (!item.secuencia || !item.tipo) {
        continue; // Skip invalid items
      }

      if (item.tipo !== 'Viper' && item.tipo !== 'BOA') {
        continue; // Skip invalid types
      }

      await pool
        .request()
        .input('Secuencia', sql.NVarChar, item.secuencia)
        .input('Linea', sql.NVarChar, item.tipo)
        .query(
          'INSERT INTO [Secuencias BOA-VIPER] (ID, [Secuencia], [Linea]) VALUES (NEWID(), @Secuencia, @Linea)'
        );
    }

    return res.status(200).json({ message: 'Secuencias guardadas exitosamente' });
  } catch (error) {
    console.error('Error al guardar secuencias:', error);
    return res.status(500).json({ error: 'Error al guardar secuencias' });
  }
}
