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
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, secuencia, tipo } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID requerido' });
  }

  if (!secuencia) {
    return res.status(400).json({ error: 'Secuencia requerida' });
  }

  if (!tipo || (tipo !== 'Viper' && tipo !== 'BOA')) {
    return res.status(400).json({ error: 'Tipo inválido. Debe ser Viper o BOA' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('ID', sql.UniqueIdentifier, id)
      .input('Secuencia', sql.NVarChar, secuencia)
      .input('Tipo', sql.NVarChar, tipo)
      .query(`
        UPDATE DISPARO
        SET Secuencia = @Secuencia, Tipo = @Tipo
        WHERE ID = @ID
        AND Tipo IN ('Viper', 'BOA')
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Secuencia no encontrada' });
    }

    return res.status(200).json({ 
      message: 'Secuencia actualizada correctamente'
    });
  } catch (error) {
    console.error('Error updating sequence:', error);
    return res.status(500).json({ 
      error: 'Error al actualizar secuencia',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
