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
    const { linea, entrega, secuencia, cantidad, ordenProduccion, estatus, numEmpleado } = req.body;

    // Validate required fields
    if (!linea || !entrega || !secuencia || !cantidad || !ordenProduccion || !estatus || !numEmpleado) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = await poolPromise;

    // Insert into CONTROL DISPAROS
    await pool
      .request()
      .input('Usuario', sql.Float, numEmpleado)
      .input('Hora', sql.DateTime, new Date())
      .query(`
        INSERT INTO [CONTROL DISPAROS] (Usuario, Hora, [Tipo de Cambio], [Estatus Anterior], [Estatus Nuevo])
        VALUES (@Usuario, @Hora, 'Agregar Secuencia', NULL, NULL)
      `);

    // Insert into DISPARO
    const entregaDate = new Date(entrega);
    
    await pool
      .request()
      .input('Linea', sql.NVarChar, linea)
      .input('Entrega', sql.DateTime, entregaDate)
      .input('Secuencia', sql.Float, parseFloat(secuencia))
      .input('Qty', sql.Float, parseFloat(cantidad))
      .input('OrdenProduccion', sql.NVarChar, ordenProduccion)
      .input('Estatus', sql.NVarChar, estatus)
      .query(`
        INSERT INTO DISPARO (ID, Linea, Entrega, Secuencia, Qty, [Orden Produccion], Estatus)
        VALUES (NEWID(), @Linea, @Entrega, @Secuencia, @Qty, @OrdenProduccion, @Estatus)
      `);

    return res.status(200).json({
      message: 'Secuencia agregada correctamente',
      data: {
        linea,
        entrega: entregaDate,
        secuencia: parseFloat(secuencia),
        cantidad: parseFloat(cantidad),
        ordenProduccion,
        estatus
      }
    });
  } catch (error) {
    console.error('Error adding sequence:', error);
    return res.status(500).json({
      error: 'Error adding sequence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
