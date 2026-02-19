import type { NextApiRequest, NextApiResponse } from 'next';
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

interface ComprobarVarianzasRequest {
  fileContent: string;
  fileName: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'GET') {
    return handleGet(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { fileContent, fileName } = req.body as ComprobarVarianzasRequest;

    if (!fileContent) {
      return res.status(400).json({ message: 'Contenido del archivo es requerido' });
    }

    const pool = await poolPromise;

    // Drop and create FIRMES table
    await pool.request().query(`
      IF OBJECT_ID('FIRMES', 'U') IS NOT NULL DROP TABLE [FIRMES]
    `);

    await pool.request().query(`
      CREATE TABLE [FIRMES] (
        [Orden de Produccion] FLOAT,
        [Numero de Parte] NVARCHAR(50),
        [Cantidad Requerida] FLOAT,
        [Codigo] NVARCHAR(50)
      )
    `);

    // Parse CSV content
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const dict: { [key: string]: number } = {};

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split(',');
      
      // Validar que hay suficientes campos
      if (fields.length < 14) {
        console.warn(`Skipping line ${i + 1}: insufficient fields`);
        continue;
      }

      try {
        const ordenProduccion = parseFloat(fields[2]);
        const numeroParte = fields[5].trim();
        const cantidadRequerida = parseFloat(fields[13]);

        if (isNaN(ordenProduccion) || isNaN(cantidadRequerida)) {
          console.warn(`Skipping line ${i + 1}: invalid numbers`);
          continue;
        }

        const key = `${ordenProduccion}_${numeroParte}`;

        if (dict[key]) {
          dict[key] += cantidadRequerida;
        } else {
          dict[key] = cantidadRequerida;
        }
      } catch (error) {
        console.warn(`Error processing line ${i + 1}:`, error);
        continue;
      }
    }

    // Insert aggregated data into FIRMES table
    let insertedCount = 0;
    for (const [key, cantidadTotal] of Object.entries(dict)) {
      const keyParts = key.split('_');
      const ordenProduccion = parseFloat(keyParts[0]);
      const numeroParte = keyParts[1];
      const codigo = `${ordenProduccion}-${numeroParte}-${cantidadTotal}`;

      const request = pool.request();
      request.input('OrdenProduccion', sql.Float, ordenProduccion);
      request.input('NumeroParte', sql.NVarChar(50), numeroParte);
      request.input('CantidadRequerida', sql.Float, cantidadTotal);
      request.input('Codigo', sql.NVarChar(50), codigo);

      await request.query(`
        INSERT INTO [FIRMES] (
          [Orden de Produccion],
          [Numero de Parte],
          [Cantidad Requerida],
          [Codigo]
        )
        VALUES (
          @OrdenProduccion,
          @NumeroParte,
          @CantidadRequerida,
          @Codigo
        )
      `);

      insertedCount++;
    }

    return res.status(200).json({ 
      message: 'Archivo procesado exitosamente',
      fileName: fileName,
      recordsProcessed: insertedCount
    });
  } catch (error: any) {
    console.error('Error processing file:', error);
    return res.status(500).json({ 
      message: 'Error al procesar archivo', 
      error: error.message 
    });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const pool = await poolPromise;

    // Clear SI VARIANZAS table first
    await pool.request().query(`
      IF OBJECT_ID('SI VARIANZAS', 'U') IS NOT NULL 
      DELETE FROM [SI VARIANZAS]
    `);

    // Insert matching varianzas from BD_Varianzas and FIRMES
    const result = await pool.request().query(`
      INSERT INTO [SI VARIANZAS] (
        [Orden de Produccion],
        [Numero de Parte],
        [Cantidad Requerida],
        [Codigo Varianza],
        [Tipo de Cambio]
      )
      SELECT 
        bdv.[Secuencia],
        bdv.[PartNumber],
        bdv.[Qty],
        bdv.[Iposa/Varianza/ECN],
        bdv.[Tipo de Cambio]
      FROM [BD_Varianzas] bdv
      INNER JOIN [FIRMES] f 
        ON bdv.[Codigo] = f.[Codigo]
        OR bdv.[Codigo] = LEFT(f.[Codigo], LEN(bdv.[Codigo]))
    `);

    const coincidentes = result.rowsAffected[0];

    // Get the inserted data from SI VARIANZAS
    const dataResult = await pool.request().query(`
      SELECT * FROM [SI VARIANZAS]
    `);

    return res.status(200).json({ 
      message: `Se encontraron ${coincidentes} varianzas`,
      coincidentes: coincidentes,
      data: dataResult.recordset
    });
  } catch (error: any) {
    console.error('Error checking varianzas:', error);
    return res.status(500).json({ 
      message: 'Error al comprobar varianzas', 
      error: error.message 
    });
  }
}
