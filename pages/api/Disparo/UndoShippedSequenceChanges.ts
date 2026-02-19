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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const pool = await poolPromise;

    await pool
      .request()
      .input('id', sql.NVarChar, id)
      .query(`
        UPDATE DISPARO
        SET Estatus = 'Sin Estatus',
            Cambios = NULL,
            [Numero de caja enviada] = NULL,
            [Hora de envio] = NULL
        WHERE ID = @id
      `);

    return res.status(200).json({ 
      message: 'Cambios deshechados correctamente'
    });
  } catch (error) {
    console.error('Error undoing changes:', error);
    return res.status(500).json({ 
      error: 'Error undoing changes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
