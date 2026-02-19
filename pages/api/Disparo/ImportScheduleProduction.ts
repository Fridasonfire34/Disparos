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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

function determineLinea(numeroParte: string, lineaActual: string): string {
  const fanCoilParts = ['40RU000433', '40RU000434', '40RU000435', '40RU000479', '40RU000480', '40RU000481'];
  const pressParts = ['48EJ500050', '48EJ500094', '48EJ500309', '48EJ501714', '48EJ502041', '48EJ503486', '50DJ502834'];
  const mpcqParts = ['48EJ402621', '48EJ501902', '48EJ501906', '48TJ500146', '48TJ500568', '48TJ500570', '48TJ500571', '48TJ500578', '48ZZ401018', '48ZZ401111', '50DJ405003', '50DW400129', '50DW410926', '50DW411369', '50DW411475', '50DW411476', '50DW411879', '50DW500283', '50DW500284', '50DW500288', '50ZZ401109'];
  const boaParts = ['48va000566', '48VA001439', '48VA001578', '48VA001578A', '48VA001753', '48VA001780', '48VA001799', '48VA001881', '48VA001914', '48VA001918', '48VA001937', '48VA001994', '48VA002012', '50EJ500910A', '50EJ500918', '50EJ500922', '50EJ500967', '50EJ500968', '50EJ500969', '50EJ500970'];
  const housingParts = ['48ZZ008095'];

  if (fanCoilParts.includes(numeroParte)) {
    return 'FanCoil Panther';
  } else if (pressParts.includes(numeroParte)) {
    return lineaActual + ' Press Shop';
  } else if (mpcqParts.includes(numeroParte)) {
    return lineaActual + ' MPCQ';
  } else if (numeroParte.startsWith('28M') || numeroParte.startsWith('28N')) {
    return lineaActual + ' TS';
  } else if (boaParts.includes(numeroParte)) {
    return lineaActual + ' BOA';
  } else if (housingParts.includes(numeroParte)) {
    return lineaActual + ' Housing Inducer';
  } else if (numeroParte.startsWith('99') || numeroParte.startsWith('48E') || numeroParte.startsWith('50DW') || 
             numeroParte.startsWith('48R') || numeroParte.startsWith('38') || numeroParte.startsWith('48Z') ||
             numeroParte.startsWith('00PS') || numeroParte.startsWith('40R') || numeroParte.startsWith('11227')) {
    if (lineaActual !== 'FanCoil Panther' && !lineaActual.includes('Press Shop') && !lineaActual.includes('MPCQ')) {
      return lineaActual + ' Legacy';
    }
  }
  return lineaActual;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let fileContent = '';
    let fileName = 'unknown.csv';

    if (typeof req.body === 'string') {
      fileContent = req.body;
    } else if (req.body && typeof req.body === 'object') {
      fileContent = req.body.fileContent || '';
      fileName = req.body.fileName || fileName;
    }

    if (!fileContent) {
      return res.status(400).json({ error: 'No file content provided' });
    }

    const lines = fileContent.split('\n').filter((line: string) => line.trim());

    if (lines.length < 2) {
      return res.status(400).json({ error: 'El archivo está vacío o es inválido' });
    }

    const pool = await poolPromise;

    console.log('Paso 1: Eliminando datos previos de [SCHEDULE PRODUCTION SOL]...');
    await pool.request().query('DELETE FROM [SCHEDULE PRODUCTION SOL]');

    console.log('Paso 2: Insertando datos del CSV en [SCHEDULE PRODUCTION SOL]...');
    let processedLines = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split(',');
      if (fields.length < 14) continue;

      let lineaValor = fields[1]?.trim() || '';
      let ordenProduccionValor = fields[2]?.trim() || '';
      const secuenciaValor = fields[3]?.trim() || '';
      let numeroParteValor = fields[5]?.trim() || '';
      let fechaProduccionValor = fields[12]?.trim() || '';
      const cantidadValor = parseFloat(fields[13]) || 0;

      if (ordenProduccionValor.includes('009')) {
        ordenProduccionValor = ordenProduccionValor.substring(2);
      }

      if (fechaProduccionValor.includes(' ')) {
        fechaProduccionValor = fechaProduccionValor.split(' ')[0];
      }

      const fechaDate = fechaProduccionValor ? new Date(fechaProduccionValor) : null;

      lineaValor = determineLinea(numeroParteValor, lineaValor);

      try {
        await pool
          .request()
          .input('Linea', sql.VarChar, lineaValor || null)
          .input('Orden_de_Produccion', sql.VarChar, ordenProduccionValor || null)
          .input('Secuencia', sql.VarChar, secuenciaValor || null)
          .input('Numero_de_Parte', sql.VarChar, numeroParteValor || null)
          .input('Cantidad', sql.Float, cantidadValor)
          .input('FechaProduccion', sql.DateTime, fechaDate)
          .input('FileName', sql.VarChar, fileName)
          .query(
            `INSERT INTO [SCHEDULE PRODUCTION SOL] 
            ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Cantidad], [Fecha Produccion], [Año], [File Name])
            VALUES (@Linea, @Orden_de_Produccion, @Secuencia, @Numero_de_Parte, @Cantidad, @FechaProduccion, YEAR(GETDATE()), @FileName)`
          );

        processedLines++;
      } catch (lineError) {
        console.error(`Error processing line ${i}:`, lineError);
      }
    }

    const semanaFromFileName = fileName.replace('.csv', '').replace('.xlsx', '').replace('.xls', '');
    await pool
      .request()
      .input('Semana', sql.VarChar, semanaFromFileName)
      .query(`UPDATE [SCHEDULE PRODUCTION SOL] SET Semana = @Semana`);

    console.log('Paso 3: Procesando duplicados en [Master Schedule Production]...');
    try {
      await pool.request().query(`
        WITH SumaCantidad AS (
          SELECT
            [Orden de Produccion],
            [Numero de Parte],
            Linea,
            Secuencia,
            SUM([Cantidad]) AS TotalCantidad
          FROM [Master Schedule Production]
          GROUP BY
            [Orden de Produccion],
            [Numero de Parte],
            Linea,
            Secuencia
        )
        UPDATE t1
        SET t1.[Cantidad] = t2.TotalCantidad
        FROM [Master Schedule Production] t1
        JOIN SumaCantidad t2 ON t1.[Orden de Produccion] = t2.[Orden de Produccion]
          AND t1.Linea = t2.Linea
          AND t1.[Numero de Parte] = t2.[Numero de Parte]
          AND t1.Secuencia = t2.Secuencia
      `);

      await pool.request().query(`
        WITH CTE AS (
          SELECT *,
                ROW_NUMBER() OVER(PARTITION BY [Numero de Parte], Linea, [Orden de Produccion], Secuencia 
                ORDER BY [Orden de Produccion]) AS RowNum
          FROM [Master Schedule Production]
        )
        DELETE FROM CTE WHERE RowNum > 1
      `);
    } catch (e) {
      console.error('Error processing duplicates:', e);
    }

    console.log('Paso 4: Verificando duplicados entre SOL y [Schedule Production Disparo]...');
    try {
      const solData = await pool.request().query(`
        SELECT DISTINCT [Orden de Produccion], [Semana], [Año] 
        FROM [SCHEDULE PRODUCTION SOL]
      `);

      for (const row of solData.recordset) {
        const ordenProduccion = row['Orden de Produccion'];
        const semana = row['Semana'];
        const ano = row['Año'];

        const checkResult = await pool
          .request()
          .input('OrdenProduccion', sql.VarChar, ordenProduccion)
          .input('Semana', sql.VarChar, semana)
          .input('Ano', sql.SmallInt, ano)
          .query(`
            SELECT 1
            FROM [Schedule Production Disparo]
            WHERE [WO] = @OrdenProduccion AND [Semana] = @Semana AND [Año] = @Ano
          `);

        if (checkResult.recordset.length > 0) {
          console.log(`La secuencia ${ordenProduccion} de la ${semana} ya existe en Disparo`);
          await pool
            .request()
            .input('OrdenProduccion', sql.VarChar, ordenProduccion)
            .input('Semana', sql.VarChar, semana)
            .input('Ano', sql.SmallInt, ano)
            .query(`
              DELETE FROM [SCHEDULE PRODUCTION SOL]
              WHERE [Orden de Produccion] = @OrdenProduccion AND [Semana] = @Semana AND [Año] = @Ano
            `);
        }
      }
    } catch (e) {
      console.error('Error checking duplicates in Disparo:', e);
    }

    console.log('Paso 5: Actualizando WEEK (Semana) con lógica de ADD y FS...');
    try {
      const semanasYAños = await pool.request().query(`
        SELECT DISTINCT [Semana], [Año], [File Name]
        FROM [SCHEDULE PRODUCTION SOL]
      `);

      for (const row of semanasYAños.recordset) {
        let semanaOriginal = row['Semana']?.trim() || '';
        const ano = row['Año'];
        const fileName = row['File Name'];

        let nuevaSemana = semanaOriginal;

        if (fileName.toUpperCase().includes('ADD') && !nuevaSemana.toUpperCase().includes('ADD')) {
          nuevaSemana += ' ADD';
        }

        const existeEnMaster = await pool
          .request()
          .input('Semana', sql.VarChar, semanaOriginal)
          .input('Ano', sql.SmallInt, ano)
          .query(`
            SELECT 1
            FROM [Master Schedule Production]
            WHERE [Semana] = @Semana AND [Año] = @Ano
          `);

        if (existeEnMaster.recordset.length > 0 && !nuevaSemana.toUpperCase().includes('FS')) {
          nuevaSemana += ' FS';
        }

        if (nuevaSemana !== semanaOriginal) {
          await pool
            .request()
            .input('NuevaSemana', sql.VarChar, nuevaSemana)
            .input('SemanaOriginal', sql.VarChar, semanaOriginal)
            .input('Ano', sql.SmallInt, ano)
            .input('FileName', sql.VarChar, fileName)
            .query(`
              UPDATE [SCHEDULE PRODUCTION SOL]
              SET [Semana] = @NuevaSemana
              WHERE [Semana] = @SemanaOriginal AND [Año] = @Ano AND [File Name] = @FileName
            `);
        }
      }
    } catch (e) {
      console.error('Error updating WEEK:', e);
    }

    console.log('Paso 6: Insertando datos en [Master Schedule Production]...');
    try {
      await pool.request().query(`
        INSERT INTO [Master Schedule Production] 
        ([Linea], [Semana], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Produccion CMX], [Cantidad], [Fecha Insercion], [Año], [ID])
        SELECT 
          [Linea], 
          [Semana], 
          [Orden de Produccion], 
          [Secuencia], 
          [Numero de Parte], 
          [Fecha Produccion], 
          [Cantidad],
          GETDATE() AS [Fecha Insercion],
          [Año], 
          [Orden de Produccion] + [Secuencia] + [Numero de Parte] + CAST([Cantidad] AS VARCHAR) AS [ID]
        FROM [SCHEDULE PRODUCTION SOL]
      `);
    } catch (e) {
      console.error('Error inserting into Master:', e);
    }

    console.log('Paso 7: Actualizando [ID Discrepancia] en [Master Schedule Production]...');
    try {
      await pool.request().query(`
        UPDATE [Master Schedule Production] 
        SET [ID Discrepancia] = 
          CAST(ISNULL([Orden de Produccion], '') AS VARCHAR) + 
          CAST(ISNULL([Secuencia], '') AS VARCHAR) + 
          CAST(ISNULL([Numero de Parte], '') AS VARCHAR) + 
          CAST(ISNULL([Linea], '') AS VARCHAR)
      `);
    } catch (e) {
      console.error('Error updating ID Discrepancia:', e);
    }

    console.log('Paso 8: Insertando datos en [Schedule Production Disparo]...');
    try {
      const solData = await pool.request().query(`
        SELECT DISTINCT [Orden de Produccion], [Linea], [Fecha Produccion], [Semana], [Año] 
        FROM [SCHEDULE PRODUCTION SOL]
      `);

      for (const row of solData.recordset) {
        const ordenProduccion = row['Orden de Produccion'];
        const linea = row['Linea'];
        const fechaProduccion = row['Fecha Produccion'];
        const semana = row['Semana'];
        const ano = row['Año'];
        const id = ordenProduccion + linea;

        await pool
          .request()
          .input('Linea', sql.VarChar, linea)
          .input('WO', sql.VarChar, ordenProduccion)
          .input('Semana', sql.VarChar, semana)
          .input('FechaProduccionCMX', sql.DateTime, fechaProduccion)
          .input('Ano', sql.SmallInt, ano)
          .input('ID', sql.VarChar, id)
          .query(`
            INSERT INTO [Schedule Production Disparo] 
            ([Linea], [WO], [Semana], [Fecha Produccion CMX], [Año], [Fecha Insercion], [ID]) 
            VALUES (@Linea, @WO, @Semana, @FechaProduccionCMX, @Ano, GETDATE(), @ID)
          `);
      }
    } catch (e) {
      console.error('Error inserting into Disparo:', e);
    }

    console.log('Paso 9: Actualizando tabla [DISPARO] con datos de [Schedule Production Disparo]...');
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
    } catch (e) {
      console.error('Error updating DISPARO table:', e);
    }

    console.log(`Importación completada: ${processedLines} líneas procesadas`);

    return res.status(200).json({
      message: `Se ha cargado ${fileName} correctamente (${processedLines} líneas procesadas)`,
      processedLines
    });
  } catch (error) {
    console.error('Error importing schedule production:', error);
    return res.status(500).json({
      error: 'Error al importar archivo',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
