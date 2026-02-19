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
    const { rows, numEmpleado } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No hay filas para guardar' });
    }

    if (!numEmpleado || isNaN(Number(numEmpleado))) {
      return res.status(400).json({ error: 'Número de empleado inválido' });
    }

    const pool = await poolPromise;

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

    // Insert each row
    for (const row of rows) {
      // Parse the Entrega datetime
      let entregaDate: Date | null = null;
      try {
        entregaDate = new Date(row.Entrega);
        if (isNaN(entregaDate.getTime())) {
          entregaDate = null;
        }
      } catch {
        entregaDate = null;
      }

      await pool
        .request()
        .input('Tipo', sql.NVarChar, row.Tipo)
        .input('Linea', sql.NVarChar, row.Gpo_Log)
        .input('Entrega', sql.DateTime, entregaDate)
        .input('Secuencia', sql.NVarChar, row.Secuencia)
        .input('Qty', sql.Float, parseFloat(row.Cantidad) || 0)
        .input('OrdenProduccion', sql.NVarChar, row.OP)
        .input('Estatus', sql.NVarChar, row.Estatus)
        .query(`
          INSERT INTO DISPARO (ID, Tipo, Linea, Entrega, Secuencia, Qty, [Orden Produccion], Estatus)
          VALUES (NEWID(), @Tipo, @Linea, @Entrega, @Secuencia, @Qty, @OrdenProduccion, @Estatus)
        `);
    }

    return res.status(200).json({
      message: 'Secuencias agregadas correctamente',
      rowsInserted: rows.length
    });
  } catch (error) {
    console.error('Error adding sequences:', error);
    return res.status(500).json({
      error: 'Error al guardar en base de datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
