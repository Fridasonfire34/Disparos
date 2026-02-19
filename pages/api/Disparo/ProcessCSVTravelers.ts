import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import sql from 'mssql';

const sqlConfigTravelers: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'Travelers',
  connectionTimeout: 30000,
  requestTimeout: 120000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export const config = {
  api: {
    bodyParser: false,
  },
};

interface CsvRow {
  line: string;
  workOrder: string;
  balloonNumber: string;
  childMaterial: string;
  childDescription: string;
  qty: number;
  logisticGroup: string;
  supplyArea: string;
}

function parseCsvFile(filePath: string): string[][] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim());
  return lines.map((line) => line.split(',').map((field) => field.trim()));
}

function mapCsvRow(fields: string[]): CsvRow | null {
  if (fields.length < 26) {
    return null;
  }

  const qtyValue = Number.parseFloat(fields[13] || '0');

  return {
    line: fields[1] || '',
    workOrder: fields[2] || '',
    balloonNumber: fields[4] || '',
    childMaterial: fields[5] || '',
    childDescription: fields[6] || '',
    supplyArea: fields[7] || '',
    qty: Number.isFinite(qtyValue) ? qtyValue : 0,
    logisticGroup: fields[25] || '',
  };
}

async function limpiarTablas(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().query('DELETE FROM [SOL]');
  await pool.request().query('DELETE FROM [Valores Unicos Gpo_Log]');
  await pool.request().query('DELETE FROM [Doc Escaner]');
}

async function duplicarValores(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().query(`
    DECLARE @MaxQty INT;
    SELECT @MaxQty = MAX(CAST([Qty] AS INT)) FROM [SOL];

    WITH Numbers AS (
      SELECT 1 AS n
      UNION ALL
      SELECT n + 1
      FROM Numbers
      WHERE n + 1 <= @MaxQty
    ),
    Expanded AS (
      SELECT 
        s.[Work Order],
        s.[Child Material],
        s.[Child Description],
        s.[Qty],
        s.[Logistic Group],
        s.[Packing],
        s.[TRAVEL NAME],
        s.[Linea],
        s.[BalloonNumber],
        s.[Color Grupo],
        s.[Supply Area],
        s.[Semana],
        s.[Fecha],
        s.[Fecha Pack],
        s.[Supply ID],
        s.[LG Color ID],
        1 AS NewQty
      FROM [SOL] s
      JOIN Numbers n ON n.n <= CAST(s.[Qty] AS INT)
    )
    SELECT 
      [Work Order],
      [Child Material],
      [Child Description],
      [Logistic Group],
      1 AS [Qty],
      [Packing],
      [TRAVEL NAME],
      [Linea],
      [BalloonNumber],
      [Color Grupo],
      [Supply Area],
      [Semana],
      [Fecha],
      [Fecha Pack],
      [Supply ID],
      [LG Color ID]
    INTO SOL_TEMP
    FROM Expanded
    OPTION (MAXRECURSION 32767);
  `);

  await pool.request().query(`
    DROP TABLE SOL;
    EXEC sp_rename 'SOL_TEMP', 'SOL';
  `);
}

async function updateSemana(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().query(`
    UPDATE [SOL]
    SET [Semana] = LEFT([Semana], CHARINDEX('.', [Semana]) - 1)
    WHERE CHARINDEX('.', [Semana]) > 0
  `);
}

async function updateLinea(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().query(`
    UPDATE [SOL]
    SET [Linea] = CASE
      WHEN Linea = 'LRTA' THEN 'BOA'
      WHEN Linea = 'LRTN' THEN 'VIPER'
      WHEN Linea = 'CDUs' THEN 'CDU'
      ELSE Linea
    END
  `);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  let uploadedFile: File | undefined;
  let fileName = '';

  try {
    const [_, files] = await form.parse(req);
    uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    fileName = uploadedFile.originalFilename || 'unknown.csv';

    if (!uploadedFile.mimetype?.includes('csv') && !fileName.endsWith('.csv')) {
      return res.status(400).json({ error: 'File must be CSV format' });
    }

    const csvLines = parseCsvFile(uploadedFile.filepath);
    if (csvLines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or has no data rows' });
    }

    const pool = await sql.connect(sqlConfigTravelers);

    try {
      await limpiarTablas(pool);

      const insertQuery = `
        INSERT INTO [SOL]
          ([Linea], [Work Order], [BalloonNumber], [Child Material], [Child Description], [Qty], [Logistic Group], [Supply Area], [Semana], [Fecha])
        VALUES
          (@Linea, @WorkOrder, @BalloonNumber, @ChildMaterial, @ChildDescription, @Qty, @LogisticGroup, @SupplyArea, @Semana, @Fecha)
      `;

      let rowsInserted = 0;
      for (let i = 1; i < csvLines.length; i++) {
        const row = mapCsvRow(csvLines[i]);
        if (!row) {
          continue;
        }

        const request = pool.request();
        request.input('Linea', sql.NVarChar(sql.MAX), row.line || null);
        request.input('WorkOrder', sql.NVarChar(sql.MAX), row.workOrder || null);
        request.input('BalloonNumber', sql.NVarChar(sql.MAX), row.balloonNumber || null);
        request.input('ChildMaterial', sql.NVarChar(sql.MAX), row.childMaterial || null);
        request.input('ChildDescription', sql.NVarChar(sql.MAX), row.childDescription || null);
        request.input('Qty', sql.Float, row.qty || 0);
        request.input('LogisticGroup', sql.NVarChar(sql.MAX), row.logisticGroup || null);
        request.input('SupplyArea', sql.NVarChar(sql.MAX), row.supplyArea || null);
        request.input('Semana', sql.NVarChar(sql.MAX), fileName);
        request.input('Fecha', sql.DateTime, new Date());

        await request.query(insertQuery);
        rowsInserted++;
      }

      await duplicarValores(pool);
      await updateSemana(pool);
      await updateLinea(pool);

      await pool.close();

      return res.status(200).json({
        message: 'Archivo procesado correctamente',
        rowsInserted,
      });
    } catch (dbError) {
      await pool.close();
      throw dbError;
    }
  } catch (error) {
    console.error('Error processing travelers CSV:', error);
    return res.status(500).json({
      error: 'Error al procesar el archivo: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  } finally {
    if (uploadedFile?.filepath) {
      fs.unlink(uploadedFile.filepath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
  }
}
