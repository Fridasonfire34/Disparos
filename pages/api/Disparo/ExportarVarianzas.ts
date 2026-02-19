import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const config = {
  server: 'HPC-050',
  database: 'TMP',
  authentication: {
    type: 'default'
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 30000
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const pool = new sql.ConnectionPool(config);
      await pool.connect();

      // Obtener datos de SI VARIANZAS
      const result = await pool.request().query(`
        SELECT 
          [Secuencia],
          [PartNumber] as [Numero de Parte],
          [Qty] as [Cantidad Requerida],
          [Iposa/Varianza/ECN],
          [Tipo de Cambio]
        FROM [SI VARIANZAS]
      `);

      const data = result.recordset;

      // Limpiar SI VARIANZAS y FIRMES
      await pool.request().query('DELETE FROM [SI VARIANZAS]');
      await pool.request().query('DELETE FROM [FIRMES]');

      await pool.close();

      // Retornar datos para que el frontend genere el Excel
      res.status(200).json({
        success: true,
        data: data,
        message: 'Datos exportados correctamente'
      });
    } catch (error) {
      console.error('Error exporting varianzas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar varianzas: ' + (error instanceof Error ? error.message : 'Error desconocido')
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
