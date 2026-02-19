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

  try {
    const { id, linea, semana, wo, fechaProduccionCMX } = req.body;

    // Validar campos requeridos
    if (!id || !linea || !semana || !wo || !fechaProduccionCMX) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        details: 'ID, Linea, Semana, WO y Fecha Produccion CMX son obligatorios'
      });
    }

    // Validar que la fecha sea un datetime válido
    const fechaObj = new Date(fechaProduccionCMX);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        error: 'Fecha inválida',
        details: 'La fecha ingresada no es válida'
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('ID', sql.NVarChar, id.toString().trim())
      .input('Linea', sql.VarChar, linea.toString().trim())
      .input('Semana', sql.VarChar, semana.toString().trim())
      .input('WO', sql.VarChar, wo.toString().trim())
      .input('FechaProduccionCMX', sql.DateTime, fechaObj)
      .query(
        'UPDATE [Schedule Production Disparo] ' +
        'SET [Linea] = @Linea, [Semana] = @Semana, [WO] = @WO, [Fecha Produccion CMX] = @FechaProduccionCMX ' +
        'WHERE ID = @ID'
      );

    const rowsAffected = result.rowsAffected[0] || 0;

    if (rowsAffected > 0) {
      try {
        await pool.request().query(`
          UPDATE D
          SET D.[Fecha CMX] = CASE 
                              WHEN D.[Fecha CMX] IS NULL AND SPD.[Fecha Produccion CMX] IS NOT NULL THEN SPD.[Fecha Produccion CMX]
                              ELSE D.[Fecha CMX]
                            END,
              D.[WK] = CASE 
                       WHEN D.[Fecha CMX] IS NULL AND SPD.[Semana] IS NOT NULL THEN SPD.[Semana]
                       ELSE D.[WK]
                     END
          FROM [DISPARO] D
          LEFT JOIN [Schedule Production Disparo] SPD ON D.[Orden Produccion] = SPD.[WO]
          WHERE D.[Fecha CMX] IS NULL
        `);
      } catch (updateError) {
        console.error('Error updating DISPARO table:', updateError);
      }

      return res.status(200).json({
        message: 'Los datos se actualizaron correctamente',
        rowsAffected
      });
    } else {
      return res.status(404).json({
        error: 'No se pudo actualizar los datos',
        details: 'No se encontró el registro con el ID especificado'
      });
    }
  } catch (error) {
    console.error('Error updating schedule production data:', error);
    return res.status(500).json({
      error: 'Error al actualizar los datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
