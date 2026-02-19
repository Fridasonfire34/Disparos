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

  const { numEmpleado, rows } = req.body;

  if (!numEmpleado || isNaN(Number(numEmpleado))) {
    return res.status(400).json({ error: 'Número de empleado inválido' });
  }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No hay filas para eliminar' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);
    
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

    const employeeResult = await pool
      .request()
      .input('numEmpleado', sql.Int, Number(numEmpleado))
      .query(`
        SELECT [Nombre Empleado]
        FROM Usuarios 
        WHERE [Numero empleado] = @numEmpleado
      `);

    const employeeName = employeeResult.recordset[0]?.Nombre || 'Desconocido';
    
    for (const row of rows) {
      const id = row.ID;
      const linea = row.Linea;
      const estatusAnterior = row.Estatus || 'Sin Estatus';

      if (!id) {
        console.error('Row missing ID:', row);
        continue;
      }

      const ordenProduccion = row['Orden Produccion'] ? Number(row['Orden Produccion']) : null;
      
      await pool
        .request()
        .input('usuario', sql.Float, Number(numEmpleado))
        .input('nombre', sql.NVarChar, employeeName)
        .input('tipoCambio', sql.NVarChar, 'Eliminaci\u00f3n')
        .input('secuencia', sql.Float, ordenProduccion)
        .input('linea', sql.NVarChar, linea)
        .input('estatusAnterior', sql.NVarChar, estatusAnterior)
        .input('estatusNuevo', sql.NVarChar, 'ELIMINADO')
        .input('hora', sql.DateTime, new Date())
        .query(`
          INSERT INTO [CONTROL DISPAROS] 
          (Usuario, [Nombre], [Tipo de Cambio], Secuencia, Linea, [Estatus Anterior], [Estatus Nuevo], Hora)
          VALUES (@usuario, @nombre, @tipoCambio, @secuencia, @linea, @estatusAnterior, @estatusNuevo, @hora)
        `);

      await pool
        .request()
        .input('id', sql.NVarChar, id)
        .query(`
          DELETE FROM DISPARO
          WHERE ID = @id
        `);

    }

    await pool.close();

    return res.status(200).json({ 
      message: 'Secuencias eliminadas correctamente',
      rowsDeleted: rows.length 
    });
  } catch (error) {
    console.error('Error deleting sequences:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al eliminar las secuencias' });
  }
}
