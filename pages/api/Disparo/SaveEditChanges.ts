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

  const { numEmpleado, estatus, caja, fechaEnvio, horaEnvio, amPm, comentarios, color, rows, tipo } = req.body;

  if (!numEmpleado || isNaN(Number(numEmpleado))) {
    return res.status(400).json({ error: 'Número de empleado inválido' });
  }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No hay filas para actualizar' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);
    
    // Validate employee exists
    const employeeCheck = await pool
      .request()
      .input('numEmpleado', sql.Int, Number(numEmpleado))
      .query(`
        SELECT COUNT(*) as count 
        FROM Usuarios 
        WHERE [Numero empleado] = @numEmpleado
      `);

    if (employeeCheck.recordset[0].count === 0) {
      return res.status(403).json({ error: 'Número de empleado no encontrado' });
    }

    // Process each row
    for (const row of rows) {
      const secuencia = row.Secuencia;
      const linea = row.Linea;
      const tipoRow = row.Tipo; // BOA, Viper, etc
      const id = row.ID;
      const estatusAnterior = row.Estatus || 'Sin Estatus';

      // Log to CONTROL DISPAROS
      // Usuario = numEmpleado (float), Secuencia = Orden Produccion (float)
      const ordenProduccion = row['Orden Produccion'] ? Number(row['Orden Produccion']) : null;
      
      await pool
        .request()
        .input('usuario', sql.Float, Number(numEmpleado))
        .input('tipoCambio', sql.NVarChar, 'Cambio')
        .input('secuencia', sql.Float, ordenProduccion)
        .input('linea', sql.NVarChar, tipoRow)
        .input('estatusAnterior', sql.NVarChar, estatusAnterior)
        .input('estatusNuevo', sql.NVarChar, estatus || 'Sin Estatus')
        .input('hora', sql.DateTime, new Date())
        .query(`
          INSERT INTO [CONTROL DISPAROS] 
          (Usuario, [Tipo de Cambio], Secuencia, [Linea], [Estatus Anterior], [Estatus Nuevo], Hora)
          VALUES (@usuario, @tipoCambio, @secuencia, @linea, @estatusAnterior, @estatusNuevo, @hora)
        `);

      // Update DISPARO table
      if (estatus === 'ENVIADO') {
        // For ENVIADO status, update with special fields and clear colors
        // Parse hora de envio to datetime
        let horaCompleta: Date | null = null;
        if (horaEnvio && fechaEnvio) {
          const [hora, minutos] = horaEnvio.split(':').map(Number);
          const fechaDate = new Date(fechaEnvio);
          fechaDate.setHours(hora, minutos || 0, 0, 0);
          horaCompleta = fechaDate;
        }
        
        await pool
          .request()
          .input('id', sql.NVarChar, id)
          .input('estatus', sql.NVarChar, estatus)
          .input('caja', sql.NVarChar, caja || null)
          .input('horaEnvio', sql.DateTime, horaCompleta)
          .input('comentarios', sql.NVarChar, comentarios || null)
          .input('colors', sql.NVarChar, color || null)
          .query(`
            UPDATE DISPARO
            SET Estatus = @estatus,
                [Colors] = @colors,
                [Numero de caja enviada] = @caja,
                [Hora de envio] = @horaEnvio,
                [Comentarios] = @comentarios,
                [Cambios] = 'OK'
            WHERE ID = @id
          `);

        // Insert into appropriate Envios table based on caja
        if (caja === 'VIPER') {
          await pool
            .request()
            .input('secuencia', sql.NVarChar, secuencia)
            .input('fecha', sql.Date, fechaEnvio ? new Date(fechaEnvio) : new Date())
            .query(`
              IF NOT EXISTS (SELECT 1 FROM [Envios Viper] WHERE Secuencia = @secuencia)
              BEGIN
                INSERT INTO [Envios Viper] (Secuencia, [Fecha de Envio])
                VALUES (@secuencia, @fecha)
              END
              ELSE
              BEGIN
                UPDATE [Envios Viper]
                SET [Fecha de Envio] = @fecha
                WHERE Secuencia = @secuencia
              END
            `);
        } else if (caja === 'BOA') {
          await pool
            .request()
            .input('secuencia', sql.NVarChar, secuencia)
            .input('fecha', sql.Date, fechaEnvio ? new Date(fechaEnvio) : new Date())
            .query(`
              IF NOT EXISTS (SELECT 1 FROM [Envios BOA] WHERE Secuencia = @secuencia)
              BEGIN
                INSERT INTO [Envios BOA] (Secuencia, [Fecha de Envio])
                VALUES (@secuencia, @fecha)
              END
              ELSE
              BEGIN
                UPDATE [Envios BOA]
                SET [Fecha de Envio] = @fecha
                WHERE Secuencia = @secuencia
              END
            `);
        }
      } else {
        // For other statuses
        await pool
          .request()
          .input('id', sql.NVarChar, id)
          .input('estatus', sql.NVarChar, estatus)
          .input('comentarios', sql.NVarChar, comentarios || null)
          .input('colors', sql.NVarChar, color || null)
          .query(`
            UPDATE DISPARO
            SET Estatus = @estatus,
                [Colors] = @colors,
                [Comentarios] = @comentarios,
                [Cambios] = 'OK'
            WHERE ID = @id
          `);
      }
    }

    await pool.close();

    // Refresh consolidated data after saving changes
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/Disparo/RefreshConsolidatedData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (refreshError) {
      console.error('Error refreshing consolidated data:', refreshError);
      // Don't fail the response, just log the error
    }

    return res.status(200).json({ 
      message: 'Cambios guardados correctamente',
      rowsUpdated: rows.length 
    });
  } catch (error) {
    console.error('Error saving changes:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al guardar los cambios' });
  }
}
