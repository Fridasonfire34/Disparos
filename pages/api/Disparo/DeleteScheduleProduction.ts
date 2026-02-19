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
    const { semana, ano } = req.body;

    if (!semana || !ano) {
      return res.status(400).json({ error: 'Semana y Año son requeridos' });
    }

    const pool = await poolPromise;

    const result1 = await pool
      .request()
      .input('Semana', sql.VarChar, semana.toString())
      .input('Ano', sql.Int, parseInt(ano))
      .query('DELETE FROM [Schedule Production Disparo] WHERE Semana = @Semana AND Año = @Ano');

    const result2 = await pool
      .request()
      .input('Semana', sql.VarChar, semana.toString())
      .input('Ano', sql.Int, parseInt(ano))
      .query('DELETE FROM [Master Schedule Production] WHERE Semana = @Semana AND Año = @Ano');

    const rowsAffected1 = result1.rowsAffected[0] || 0;
    const rowsAffected2 = result2.rowsAffected[0] || 0;

    return res.status(200).json({
      message: 'Operación completada',
      rowsAffected1,
      rowsAffected2
    });
  } catch (error) {
    console.error('Error deleting schedule production data:', error);
    return res.status(500).json({
      error: 'Failed to delete schedule production data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
