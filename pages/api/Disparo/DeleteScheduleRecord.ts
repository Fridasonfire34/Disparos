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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    // Validar que el ID sea proporcionado
    if (!id) {
      return res.status(400).json({
        error: 'ID requerido',
        details: 'El ID de la secuencia es obligatorio'
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('ID', sql.NVarChar, id.toString().trim())
      .query('DELETE FROM [Schedule Production Disparo] WHERE ID = @ID');

    const rowsAffected = result.rowsAffected[0] || 0;

    if (rowsAffected > 0) {
      return res.status(200).json({
        message: 'Secuencia eliminada exitosamente',
        rowsAffected
      });
    } else {
      return res.status(404).json({
        error: 'No se encontró la secuencia a eliminar',
        rowsAffected: 0
      });
    }
  } catch (error) {
    console.error('Error deleting schedule record:', error);
    return res.status(500).json({
      error: 'Error al eliminar la secuencia',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
