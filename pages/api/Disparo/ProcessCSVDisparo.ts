import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'TMP',
  connectionTimeout: 30000,
  requestTimeout: 120000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

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

interface CSVRowData {
  lineaValor: string;
  ordenProduccionValor: string;
  secuenciaValor: string;
  numeroParteValor: string;
  fechaRequeridaEntrega: Date | null;
  cantidadRequeridaValor: number;
  grupoLogisticoValor: string;
  supplyAreaValor: string;
  balloonValor: string;
}

interface DictEntry {
  quantity: number;
  rowData: CSVRowData;
}

async function parseCSV(filePath: string): Promise<string[][]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  return lines.map(line => {
    // Handle CSV format: split by comma, but trim each field
    return line.split(',').map(field => field.trim());
  });
}

async function deleteSOLTable(connection: sql.ConnectionPool): Promise<void> {
  const query = 'DELETE FROM [SOL TABLE]';
  await connection.request().query(query);
}

async function getDictFromCSV(lines: string[][]): Promise<Map<string, DictEntry>> {
  const dict = new Map<string, DictEntry>();

  // Skip header row (index 0) and process data rows
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i];
    
    // CSV field indices (based on the original VB.NET code):
    // 1: Line, 2: Work Order, 3: Sequence, 4: Balloon, 5: Part Number
    // 7: Supply Area, 10: Required Delivery Date, 13: Quantity, 25: Logistic Group
    
    let balloonValor = fields[4] || '';
    let numeroParteValor = fields[5] || '';
    let lineaValor = fields[1] || '';
    let ordenProduccionValor = fields[2] || '';
    let secuenciaValor = fields[3] || '';
    let supplyAreaValor = fields[7] || '';
    const fechaRequeridaEntregaStr = fields[10] || '';
    const cantidadRequeridaValor = parseFloat(fields[13] || '0');
    let grupoLogisticoValor = fields[25] || '';

    // Handle "009" prefix in Work Order
    if (ordenProduccionValor.startsWith('009')) {
      const firstNineIndex = ordenProduccionValor.indexOf('9');
      ordenProduccionValor = ordenProduccionValor.substring(firstNineIndex);
    }

    // Parse fecha with validation
    let fechaObj: Date | null = null;
    try {
      const fechaParsed = new Date(fechaRequeridaEntregaStr);
      if (!isNaN(fechaParsed.getTime())) {
        fechaObj = fechaParsed;
      }
    } catch {
      // Invalid date, leave as null
    }

    // Create composite key (VB.NET uses underscore separator)
    const key = `${lineaValor}_${ordenProduccionValor}_${secuenciaValor}_${numeroParteValor}_${fechaObj ? fechaObj.toISOString() : ''}_${grupoLogisticoValor}_${supplyAreaValor}_${balloonValor}`;

    const rowData: CSVRowData = {
      lineaValor,
      ordenProduccionValor,
      secuenciaValor,
      numeroParteValor,
      fechaRequeridaEntrega: fechaObj,
      cantidadRequeridaValor,
      grupoLogisticoValor,
      supplyAreaValor,
      balloonValor,
    };

    // Aggregate quantities for same composite key
    if (dict.has(key)) {
      const existing = dict.get(key)!;
      existing.quantity += cantidadRequeridaValor;
    } else {
      dict.set(key, { quantity: cantidadRequeridaValor, rowData });
    }
  }

  return dict;
}

async function determineTipo(
  connection: sql.ConnectionPool,
  numeroParteValor: string,
  lineaValor: string
): Promise<string> {
  let tipo = '';

  try {
    const tipoQuery = 'SELECT Linea FROM [Familias] WHERE [Numero de Parte] = @PartNumber';
    const tipoRequest = connection.request();
    tipoRequest.input('PartNumber', sql.NVarChar(sql.MAX), numeroParteValor);
    const tipoResult = await tipoRequest.query(tipoQuery);

    if (tipoResult.recordset && tipoResult.recordset.length > 0) {
      tipo = lineaValor + ' ' + tipoResult.recordset[0].Linea;
    }
  } catch (err) {
    console.error('Error querying Familias exact match:', err);
  }

  if (tipo === '') {
    try {
      const tipoCduQuery = "SELECT Linea FROM [Familias] WHERE [Linea] = 'CDU' AND [Numero de Parte] = @PartNumber";
      const tipoCduRequest = connection.request();
      tipoCduRequest.input('PartNumber', sql.NVarChar(sql.MAX), numeroParteValor);
      const tipoCduResult = await tipoCduRequest.query(tipoCduQuery);

      if (tipoCduResult.recordset && tipoCduResult.recordset.length > 0) {
        tipo = tipoCduResult.recordset[0].Linea;
      }
    } catch (err) {
      console.error('Error querying Familias CDU match:', err);
    }
  }

  // Check for Special Order conditions
  if (tipo === '' &&
      numeroParteValor.includes('-') &&
      !numeroParteValor.includes('M') &&
      !numeroParteValor.includes('P') &&
      !numeroParteValor.includes('073') &&
      numeroParteValor.length <= 10) {
    tipo = 'Special Order';
  }

  if (tipo === '') {
    try {
      const tipoQueryLike = 'SELECT Linea FROM [Familias] WHERE @PartNumber LIKE [Numero de Parte] + \'%\'';
      const likeRequest = connection.request();
      likeRequest.input('PartNumber', sql.NVarChar(sql.MAX), numeroParteValor);
      const likeResult = await likeRequest.query(tipoQueryLike);

      if (likeResult.recordset && likeResult.recordset.length > 0) {
        tipo = lineaValor + ' ' + likeResult.recordset[0].Linea;
      }
    } catch (err) {
      console.error('Error querying Familias LIKE match:', err);
    }
  }


  if (lineaValor === '39M' && numeroParteValor.startsWith('93M2X')) {
    tipo = '39M FILTER TRACK ASSY';
  }

  if (lineaValor.includes('39M+') && numeroParteValor.startsWith('93M2X')) {
    tipo = '39M+ / 39M++ FILTER TRACK ASSY';
  }

  if (lineaValor === '39L' && numeroParteValor.startsWith('39TA')) {
    tipo = '39L FILTER TRACK ASSY';
  }

  if (numeroParteValor.includes('39TA50012302')) {
    tipo = lineaValor;
  }

  return tipo;
}

async function runTarjetaPanther(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [Panther]';
  const insertQuery = `
    INSERT INTO [Panther] ([Orden de Produccion], [Numero de Parte], [Cantidad Requerida])
    SELECT [Orden de Produccion], [Numero de Parte], [Cantidad Requerida]
    FROM [SOL TABLE]
    WHERE Tipo = 'FanCoil Panther' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function runTarjetaFilter(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [Filter Track]';
  const insertQuery = `
    INSERT INTO [Filter Track] ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo])
    SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo]
    FROM [SOL TABLE]
    WHERE Tipo LIKE '%FILTER%' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function runTarjetaTSVPAC(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [TSVPACQ]';
  const insertQuery = `
    INSERT INTO [TSVPACQ] ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo])
    SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo]
    FROM [SOL TABLE]
    WHERE Tipo LIKE '% TSVPAC%' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function runTarjetaSpecial(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [Specials]';
  const insertQuery = `
    INSERT INTO [Specials] ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo])
    SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo]
    FROM [SOL TABLE]
    WHERE Tipo LIKE '%Or%' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function runTarjetaPress(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [Press Shop]';
  const insertQuery = `
    INSERT INTO [Press Shop] ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo])
    SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo]
    FROM [SOL TABLE]
    WHERE Tipo LIKE '%Press%' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function runTarjetaMPC(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [MPC]';
  const insertQuery = `
    INSERT INTO [MPC] ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo])
    SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo]
    FROM [SOL TABLE]
    WHERE Tipo LIKE '%MPC%' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function runTarjetaLegacy(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [Legacy]';
  const insertQuery = `
    INSERT INTO [Legacy] ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo])
    SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo]
    FROM [SOL TABLE]
    WHERE Tipo LIKE '% Legacy%' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function runTarjetaCoil(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [COILSHOP]';
  const insertQuery = `
    INSERT INTO [COILSHOP] ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo])
    SELECT [Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo]
    FROM [SOL TABLE]
    WHERE Tipo LIKE '% Coil%' AND [BOA-Viper] IS NULL
  `;

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
}

async function updateBOAViper(connection: sql.ConnectionPool): Promise<void> {
  const updateDisparoV = "UPDATE [SOL TABLE] SET [BOA-Viper] = 'Viper' WHERE Linea = 'LRTN'";
  const updateDisparoB = "UPDATE [SOL TABLE] SET [BOA-Viper] = 'BOA' WHERE Linea = 'LRTA'";
  const updateDisparoCDU = "UPDATE [SOL TABLE] SET [BOA-Viper] = 'CDU' WHERE Linea = 'CDUs'";

  await connection.request().query(updateDisparoV);
  await connection.request().query(updateDisparoB);
  await connection.request().query(updateDisparoCDU);
}

async function runDuplicadosSOL(connection: sql.ConnectionPool): Promise<void> {
  const ascQuery = `
    SELECT *
    FROM [SOL TABLE]
    WHERE [BOA-VIPER] IS NULL
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Secuencia] ASC
  `;

  const queryActualizar = `
    WITH SumaCantidad AS (
      SELECT
        [Fecha Requerida Entrega],
        [Numero de Parte],
        Tipo,
        [Orden de Produccion],
        Secuencia,
        SUM([Cantidad Requerida]) AS TotalCantidad
      FROM [SOL TABLE]
      GROUP BY
        [Fecha Requerida Entrega],
        [Numero de Parte],
        Tipo,
        [Orden de Produccion],
        Secuencia
    )
    UPDATE t1
    SET t1.[Cantidad Requerida] = t2.TotalCantidad
    FROM [SOL TABLE] t1
    JOIN SumaCantidad t2 ON t1.[Fecha Requerida Entrega] = t2.[Fecha Requerida Entrega]
      AND t1.Tipo = t2.Tipo
      AND t1.[Orden de Produccion] = t2.[Orden de Produccion]
      AND t1.Secuencia = t2.Secuencia
      AND t1.[Numero de Parte] = t2.[Numero de Parte];
  `;

  const queryEliminar = `
    WITH CTE AS (
      SELECT *,
             ROW_NUMBER() OVER(
               PARTITION BY [Fecha Requerida Entrega], [Numero de Parte], Tipo, [Orden de Produccion], Secuencia
               ORDER BY [Fecha Requerida Entrega]
             ) AS RowNum
      FROM [SOL TABLE]
    )
    DELETE FROM CTE WHERE RowNum > 1;
  `;

  await connection.request().query(ascQuery);
  await connection.request().query(queryActualizar);
  await connection.request().query(queryEliminar);
}

async function runDuplicadosBases(connection: sql.ConnectionPool): Promise<void> {
  const deleteDuplicatesQuery = `
    ;WITH fechas_filtradas AS (
      SELECT DISTINCT [Fecha Requerida Entrega]
      FROM [BASES]
      WHERE [Tipo] = '39M BASES'
    ),
    fecha_maxima AS (
      SELECT MAX([Fecha Requerida Entrega]) AS fecha_max
      FROM fechas_filtradas
    )
    DELETE FROM [BASES]
    WHERE [Tipo] = '39M BASES'
      AND [Fecha Requerida Entrega] = (SELECT fecha_max FROM fecha_maxima)
  `;

  await connection.request().query(deleteDuplicatesQuery);
}

async function runCopiarBases(connection: sql.ConnectionPool): Promise<void> {
  const insertQuery = `
    INSERT INTO [BASES]
      ([Tipo], [Orden de Produccion], [Secuencia], [Numero de Parte], [Cantidad Requerida], [Fecha Requerida Entrega])
    SELECT [Tipo], [Orden de Produccion], [Secuencia], [Numero de Parte], [Cantidad Requerida], [Fecha Requerida Entrega]
    FROM [SOL TABLE]
    WHERE [Tipo] = '39M BASES';
  `;

  await connection.request().query(insertQuery);
  await runDuplicadosBases(connection);
}

async function runCopiarPlus(connection: sql.ConnectionPool): Promise<void> {
  const insertQuery = `
    INSERT INTO [BASES]
      ([Tipo], [Orden de Produccion], [Secuencia], [Numero de Parte], [Cantidad Requerida], [Fecha Requerida Entrega])
    SELECT [Tipo], [Orden de Produccion], [Secuencia], [Numero de Parte], [Cantidad Requerida], [Fecha Requerida Entrega]
    FROM [SOL TABLE]
    WHERE [Tipo] LIKE '%39M+ / 39M++%';
  `;

  await connection.request().query(insertQuery);
}

async function runLimpiarBaseYPlus(connection: sql.ConnectionPool): Promise<void> {
  const deleteBases = 'DELETE FROM [BASES]';
  const deleteMPBase = "DELETE FROM [SOL_CONSOLIDADO] WHERE [Tipo] = '39M+ / 39M++ BASES'";

  await connection.request().query(deleteBases);
  await connection.request().query(deleteMPBase);
}

async function runCopiarBaseYPlus(connection: sql.ConnectionPool): Promise<void> {
  const insertQuery = `
    INSERT INTO [SOL_CONSOLIDADO]
      ([Tipo], [Orden de Produccion], [Secuencia], [Numero de Parte], [Cantidad Requerida], [Fecha Requerida Entrega])
    SELECT [Tipo], [Orden de Produccion], [Secuencia], [Numero de Parte], [Cantidad Requerida], [Fecha Requerida Entrega]
    FROM [BASES];
  `;

  await connection.request().query(insertQuery);
  await runLimpiarBaseYPlus(connection);
}

async function runUpdateIdCons(connection: sql.ConnectionPool): Promise<void> {
  const updateSecQueryV = `
    UPDATE [SOL_CONSOLIDADO]
    SET [Secuencia] = [Supply Area]
    WHERE [BOA-Viper] IS NOT NULL;
  `;

  const updateSO = "UPDATE [SOL_CONSOLIDADO] SET [Tipo] = 'VPAC' WHERE [Tipo] = 'Special Order'";

  const updateDW = `
    UPDATE [SOL_CONSOLIDADO]
    SET [Tipo] = REPLACE([Tipo], ' Double Wall', '')
    WHERE [Tipo] LIKE '%Double Wall%';
  `;

  const updateCoil = "UPDATE [SOL_CONSOLIDADO] SET [Tipo] = 'TS Legacy' WHERE [Tipo] = 'Coil Shop 3/8'";

  const updateQueryTS = `
    UPDATE [SOL_CONSOLIDADO]
    SET [Tipo] = REPLACE([Tipo], ' TubeSheet', ' TS')
    WHERE [Tipo] LIKE '% TubeSheet%'
  `;

  const updateIdConsQuery = `
    UPDATE [SOL_CONSOLIDADO]
    SET [ID_CONS] = [Tipo] + ' ' + [Orden de Produccion] + ' ' + [Secuencia] + ' ' +
      REPLACE(CONVERT(VARCHAR(16), [Fecha Requerida Entrega], 120), ':', '-')
  `;

  await connection.request().query(updateSecQueryV);
  await connection.request().query(updateSO);
  await connection.request().query(updateDW);
  await connection.request().query(updateCoil);
  await connection.request().query(updateQueryTS);
  await connection.request().query(updateIdConsQuery);
}

async function runSolCons(connection: sql.ConnectionPool): Promise<void> {
  await runCopiarBases(connection);
  await runCopiarPlus(connection);

  const insertQuery = `
    INSERT INTO [SOL_CONSOLIDADO]
      ([Tipo], [Orden de Produccion], [Secuencia], [Numero de Parte], [Supply Area], [BOA-Viper], [Cantidad Requerida], [Fecha Requerida Entrega])
    SELECT
      CASE WHEN [BOA-Viper] IS NOT NULL THEN [Gpo Logistico] ELSE [Tipo] END AS [Tipo],
      [Orden de Produccion], [Secuencia], [Numero de Parte], [Supply Area], [BOA-Viper], [Cantidad Requerida], [Fecha Requerida Entrega]
    FROM [SOL TABLE]
    WHERE [Tipo] NOT LIKE '%BASES%' AND [Tipo] NOT LIKE '%39M+ / 39M++%'
  `;

  await connection.request().query(insertQuery);
  await runCopiarBaseYPlus(connection);
  await runUpdateIdCons(connection);
}

async function runLimpiarSolBoa(travelersPool: sql.ConnectionPool): Promise<void> {
  const deleteSol = 'DELETE FROM [SOL]';
  await travelersPool.request().query(deleteSol);
}

async function runCopiarBoa(tmpPool: sql.ConnectionPool): Promise<void> {
  const travelersPool = await new sql.ConnectionPool(sqlConfigTravelers).connect();

  try {
    await runLimpiarSolBoa(travelersPool);

    const selectQuery = `
      SELECT [Orden de Produccion], [Numero de Parte], [Cantidad Requerida], [Tipo],
             [Gpo Logistico], [BOA-Viper], [Supply Area], [BalloonNumber]
      FROM [SOL TABLE]
      WHERE [BOA-Viper] IN ('BOA', 'CDU')
    `;

    const result = await tmpPool.request().query(selectQuery);
    const rows = result.recordset || [];

    const insertQuery = `
      INSERT INTO [SOL]
        ([Work Order], [Child Material], [Qty], [Logistic Group], [Linea], [Supply Area], [BalloonNumber], Fecha)
      VALUES (@WorkOrder, @ChildMaterial, @Qty, @LogisticGroup, @Linea, @SupplyArea, @BalloonNumber, @Fecha)
    `;

    for (const row of rows) {
      const request = travelersPool.request();
      request.input('WorkOrder', sql.NVarChar(sql.MAX), row['Orden de Produccion'] ?? null);
      request.input('ChildMaterial', sql.NVarChar(sql.MAX), row['Numero de Parte'] ?? null);
      request.input('Qty', sql.Int, row['Cantidad Requerida'] ?? null);
      request.input('LogisticGroup', sql.NVarChar(sql.MAX), row['Gpo Logistico'] ?? null);
      request.input('Linea', sql.NVarChar(sql.MAX), row['BOA-Viper'] ?? null);
      request.input('SupplyArea', sql.NVarChar(sql.MAX), row['Supply Area'] ?? null);
      request.input('BalloonNumber', sql.NVarChar(sql.MAX), row['BalloonNumber'] ?? null);
      request.input('Fecha', sql.DateTime, new Date());

      await request.query(insertQuery);
    }
  } finally {
    await travelersPool.close();
  }
}

async function runDuplicadosPrel(connection: sql.ConnectionPool): Promise<void> {
  const ascQuery = `
    SELECT *
    FROM [DisparoPREL]
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Secuencia] ASC
  `;

  const queryActualizar = `
    WITH SumaCantidad AS (
      SELECT
        [Fecha Requerida Entrega],
        Tipo,
        [Orden de Produccion],
        Secuencia,
        SUM([Cantidad Requerida]) AS TotalCantidad
      FROM [DisparoPREL]
      GROUP BY
        [Fecha Requerida Entrega],
        Tipo,
        [Orden de Produccion],
        Secuencia
    )
    UPDATE t1
    SET t1.[Cantidad Requerida] = t2.TotalCantidad
    FROM [DisparoPREL] t1
    JOIN SumaCantidad t2 ON t1.[Fecha Requerida Entrega] = t2.[Fecha Requerida Entrega]
      AND t1.Tipo = t2.Tipo
      AND t1.[Orden de Produccion] = t2.[Orden de Produccion]
      AND t1.Secuencia = t2.Secuencia;
  `;

  const queryEliminar = `
    WITH CTE AS (
      SELECT *,
             ROW_NUMBER() OVER(
               PARTITION BY [Fecha Requerida Entrega], Tipo, [Orden de Produccion], Secuencia
               ORDER BY [Fecha Requerida Entrega]
             ) AS RowNum
      FROM [DisparoPREL]
    )
    DELETE FROM CTE WHERE RowNum > 1;
  `;

  await connection.request().query(ascQuery);
  await connection.request().query(queryActualizar);
  await connection.request().query(queryEliminar);
}

async function runDisparoPrel(connection: sql.ConnectionPool): Promise<void> {
  const deleteQuery = 'DELETE FROM [DisparoPREL]';
  const insertQuery = `
    INSERT INTO [DisparoPREL] ([Fecha Requerida Entrega], [Tipo], [Orden de Produccion], [Secuencia], [Cantidad Requerida])
    SELECT [Fecha Requerida Entrega], [Tipo], [Orden de Produccion], [Secuencia], [Cantidad Requerida]
    FROM [SOL TABLE]
    ORDER BY [Fecha Requerida Entrega] ASC
  `;

  const updateBases = "UPDATE [DisparoPREL] SET [Tipo] = REPLACE([Tipo], ' BASES', '') WHERE [Tipo] LIKE '% BASES%'";
  const updateTubeSheet = "UPDATE [DisparoPREL] SET [Tipo] = REPLACE([Tipo], ' TubeSheet', ' TS') WHERE [Tipo] LIKE '% TubeSheet%'";
  const updateTechos = "UPDATE [DisparoPREL] SET [Tipo] = REPLACE([Tipo], ' Techos094', '') WHERE [Tipo] LIKE '% Techos094%'";

  await connection.request().query(deleteQuery);
  await connection.request().query(insertQuery);
  await connection.request().query(updateBases);
  await connection.request().query(updateTubeSheet);
  await connection.request().query(updateTechos);

  await runDuplicadosPrel(connection);
}

async function runDuplicadosFQ(connection: sql.ConnectionPool): Promise<void> {
  const ascQuery = `
    SELECT *
    FROM [Disparo FQ]
    WHERE [BOA-Viper] IS NULL
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Secuencia] ASC
  `;

  const queryActualizar = `
    WITH SumaCantidad AS (
      SELECT
        [Fecha Requerida Entrega],
        Tipo,
        [Orden de Produccion],
        Secuencia,
        SUM([Cantidad Requerida]) AS TotalCantidad
      FROM [Disparo FQ]
      WHERE [BOA-Viper] IS NULL
      GROUP BY
        [Fecha Requerida Entrega],
        Tipo,
        [Orden de Produccion],
        Secuencia
    )
    UPDATE t1
    SET t1.[Cantidad Requerida] = t2.TotalCantidad
    FROM [Disparo FQ] t1
    JOIN SumaCantidad t2
      ON t1.[Fecha Requerida Entrega] = t2.[Fecha Requerida Entrega]
      AND t1.Tipo = t2.Tipo
      AND t1.[Orden de Produccion] = t2.[Orden de Produccion]
      AND t1.Secuencia = t2.Secuencia
    WHERE t1.[BOA-Viper] IS NULL;
  `;

  const queryEliminar = `
    WITH CTE AS (
      SELECT *,
             ROW_NUMBER() OVER(
               PARTITION BY [Fecha Requerida Entrega], Tipo, [Orden de Produccion], Secuencia
               ORDER BY [Fecha Requerida Entrega]
             ) AS RowNum
      FROM [Disparo FQ]
      WHERE [BOA-Viper] IS NULL
    )
    DELETE FROM CTE WHERE RowNum > 1;
  `;

  await connection.request().query(ascQuery);
  await connection.request().query(queryActualizar);
  await connection.request().query(queryEliminar);
}

async function runEliminarPlusRepetidas(connection: sql.ConnectionPool): Promise<void> {
  const deleteDuplicatesQuery = `
    ;WITH CTE AS (
      SELECT *,
             ROW_NUMBER() OVER (
               PARTITION BY [Tipo], [Orden de Produccion], [Secuencia]
               ORDER BY [Cantidad Requerida] DESC
             ) AS RowNumber
      FROM [Disparo FQ]
      WHERE [Tipo] LIKE '39M+ / 39M++'
    )
    DELETE FROM CTE WHERE RowNumber > 1
  `;

  await connection.request().query(deleteDuplicatesQuery);
}

async function runEliminarBasesRepetidas(connection: sql.ConnectionPool): Promise<void> {
  const basesPlus = "UPDATE [Disparo FQ] SET [Tipo] = '39M+ / 39M++' WHERE [Tipo] = '39M+ / 39M++ BASES'";
  const deleteDuplicatesQuery = `
    ;WITH CTE AS (
      SELECT *,
             ROW_NUMBER() OVER (
               PARTITION BY [Tipo], [Orden de Produccion], [Secuencia]
               ORDER BY [Fecha Requerida Entrega]
             ) AS RowNumber
      FROM [Disparo FQ]
      WHERE [Tipo] LIKE '39M BASES'
    )
    DELETE FROM CTE WHERE RowNumber > 1
  `;

  await connection.request().query(basesPlus);
  await connection.request().query(deleteDuplicatesQuery);
  await runEliminarPlusRepetidas(connection);
}

async function runActualizarGposLog(connection: sql.ConnectionPool): Promise<void> {
  const updateTipoQuery = `
    UPDATE [Disparo FQ]
    SET [Tipo] = [Gpo Logistico]
    WHERE [BOA-Viper] IS NOT NULL;
  `;

  const updateSecQueryV = `
    UPDATE [Disparo FQ]
    SET [Secuencia] = [Supply Area]
    WHERE [BOA-Viper] IS NOT NULL;
  `;

  const dropColumnQuery = 'ALTER TABLE [Disparo FQ] DROP COLUMN [Gpo Logistico];';
  const dropColumnQueryV = 'ALTER TABLE [Disparo FQ] DROP COLUMN [Supply Area];';

  await connection.request().query(updateTipoQuery);
  await connection.request().query(updateSecQueryV);
  await connection.request().query(dropColumnQuery);
  await connection.request().query(dropColumnQueryV);
}

async function runConcatenarDisparo(connection: sql.ConnectionPool): Promise<void> {
  const ascQuery = `
    SELECT *
    FROM [Disparo FQ]
    WHERE [BOA-Viper] IS NOT NULL
    ORDER BY [Fecha Requerida Entrega] ASC, [Tipo] ASC, [Secuencia] ASC
  `;

  const queryActualizar = `
    WITH SumaCantidad AS (
      SELECT
        [Fecha Requerida Entrega],
        Tipo,
        [Orden de Produccion],
        Secuencia,
        SUM([Cantidad Requerida]) AS TotalCantidad
      FROM [Disparo FQ]
      WHERE [BOA-Viper] IS NOT NULL
      GROUP BY
        [Fecha Requerida Entrega],
        Tipo,
        [Orden de Produccion],
        Secuencia
    )
    UPDATE t1
    SET t1.[Cantidad Requerida] = t2.TotalCantidad
    FROM [Disparo FQ] t1
    JOIN SumaCantidad t2
      ON t1.[Fecha Requerida Entrega] = t2.[Fecha Requerida Entrega]
      AND t1.Tipo = t2.Tipo
      AND t1.[Orden de Produccion] = t2.[Orden de Produccion]
      AND t1.Secuencia = t2.Secuencia
    WHERE t1.[BOA-Viper] IS NOT NULL;
  `;

  const queryEliminar = `
    WITH CTE AS (
      SELECT *,
             ROW_NUMBER() OVER(
               PARTITION BY [Fecha Requerida Entrega], Tipo, [Orden de Produccion], Secuencia
               ORDER BY [Fecha Requerida Entrega]
             ) AS RowNum
      FROM [Disparo FQ]
      WHERE [BOA-Viper] IS NOT NULL
    )
    DELETE FROM CTE WHERE RowNum > 1;
  `;

  await connection.request().query(ascQuery);
  await connection.request().query(queryActualizar);
  await connection.request().query(queryEliminar);
}

async function runDuplicadosViper(connection: sql.ConnectionPool): Promise<void> {
  const queryActualizar = `
    ;WITH SumaCantidad AS (
      SELECT
        [Tipo],
        [Secuencia],
        [Orden de Produccion],
        MIN([Fecha Requerida Entrega]) AS FechaMenor,
        SUM([Cantidad Requerida]) AS TotalCantidad
      FROM [Disparo FQ]
      WHERE [BOA-Viper] = 'Viper'
      GROUP BY
        [Tipo],
        [Secuencia],
        [Orden de Produccion]
    )
    UPDATE t
    SET t.[Cantidad Requerida] = s.TotalCantidad
    FROM [Disparo FQ] t
    INNER JOIN SumaCantidad s
      ON t.[Tipo] = s.[Tipo]
      AND t.[Secuencia] = s.[Secuencia]
      AND t.[Orden de Produccion] = s.[Orden de Produccion]
      AND t.[Fecha Requerida Entrega] = s.FechaMenor
    WHERE t.[BOA-Viper] = 'Viper';
  `;

  const queryEliminar = `
    ;WITH CTE AS (
      SELECT *,
             ROW_NUMBER() OVER(
               PARTITION BY [Tipo], [Secuencia], [Orden de Produccion]
               ORDER BY [Fecha Requerida Entrega] ASC
             ) AS rn
      FROM [Disparo FQ]
      WHERE [BOA-Viper] = 'Viper'
    )
    DELETE FROM CTE
    WHERE rn > 1;
  `;

  await connection.request().query(queryActualizar);
  await connection.request().query(queryEliminar);
}

async function runActualizarIdConsDisparo(connection: sql.ConnectionPool): Promise<void> {
  const updateIdConsQuery = `
    UPDATE DISPARO
    SET [ID_CONS] = [Linea] + ' ' + REPLACE(FORMAT([Orden Produccion], '0.00'), '.00', '') + ' ' + [Secuencia] + ' ' +
      REPLACE(CONVERT(VARCHAR(16), [Entrega], 120), ':', '-')
  `;

  await connection.request().query(updateIdConsQuery);
}

async function runUpdateFechasDisparo(connection: sql.ConnectionPool): Promise<void> {
  const updateQuery = `
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
  `;

  const request = connection.request();
  request.timeout = 120000;
  await request.query(updateQuery);
}

async function runUpdateTipoViper(connection: sql.ConnectionPool): Promise<void> {
  const updateQuery = `
    UPDATE D
    SET D.[Tipo Viper] = TV.[Tipo]
    FROM [DISPARO] AS D
    INNER JOIN [Tipos Viper] AS TV
      ON D.[Secuencia] = TV.[Supply Area]
    WHERE D.[Tipo] = 'Viper';
  `;

  const request = connection.request();
  request.timeout = 120000;
  await request.query(updateQuery);
}

async function runNuevoDsp(connection: sql.ConnectionPool): Promise<void> {
  const deletePlusBases = "DELETE FROM [Disparo FQ] WHERE [Tipo] LIKE '%39M+ / 39M++ BASES%'";
  const resetEstatus = "UPDATE DISPARO SET Estatus = 'Sin Estatus' WHERE Estatus = 'Disparo Nuevo'";
  const insertQuery = `
    INSERT INTO DISPARO (ID, Linea, Entrega, Secuencia, Qty, [Orden Produccion], Estatus, Cambios, Tipo)
    SELECT NEWID(), Tipo, [Fecha Requerida Entrega], Secuencia, [Cantidad Requerida], [Orden de Produccion], Estatus, NULL, [BOA-Viper]
    FROM [Disparo FQ]
  `;

  await connection.request().query(deletePlusBases);
  await runActualizarGposLog(connection);
  await runConcatenarDisparo(connection);
  await runDuplicadosViper(connection);

  await connection.request().query(resetEstatus);
  await connection.request().query(insertQuery);

  await runActualizarIdConsDisparo(connection);
  await runUpdateFechasDisparo(connection);
  await runUpdateTipoViper(connection);
}

async function runCrearTablaDisparoFQ(connection: sql.ConnectionPool): Promise<void> {
  const dropTableQuery = "IF OBJECT_ID('Disparo FQ', 'U') IS NOT NULL DROP TABLE [Disparo FQ]";
  const createTableQuery = `
    CREATE TABLE [Disparo FQ] (
      [Tipo] NVARCHAR(MAX),
      [Fecha Requerida Entrega] DATETIME,
      [Secuencia] NVARCHAR(50),
      [Cantidad Requerida] FLOAT,
      [Orden de Produccion] NVARCHAR(50),
      [Estatus] NVARCHAR(MAX),
      [Linea] NVARCHAR(MAX),
      [Numero de Parte] NVARCHAR(50),
      [Gpo Logistico] NVARCHAR(50),
      [BOA-Viper] NVARCHAR(50),
      [Supply Area] NVARCHAR(50)
    )
  `;
  const insertQuery = `
    INSERT INTO [Disparo FQ]
      ([Tipo], [Fecha Requerida Entrega], [Secuencia], [Cantidad Requerida], [Orden de Produccion], [Linea], [Numero de Parte], [Gpo Logistico], [BOA-Viper], [Supply Area])
    SELECT [Tipo], [Fecha Requerida Entrega], [Secuencia], [Cantidad Requerida], [Orden de Produccion], [Linea], [Numero de Parte], [Gpo Logistico], [BOA-Viper], [Supply Area]
    FROM [SOL TABLE];
  `;

  const updateEstatus = "UPDATE [Disparo FQ] SET Estatus = 'Disparo Nuevo'";
  const updateSO = "UPDATE [Disparo FQ] SET [Tipo] = [Linea], [Linea] = 'VPAC' WHERE [Tipo] = 'Special Order'";
  const updateDW = `
    UPDATE [Disparo FQ]
    SET [Tipo] = REPLACE([Tipo], ' Double Wall', '')
    WHERE [Tipo] LIKE '%Double Wall%';
  `;
  const dropLineaQuery = "IF COL_LENGTH('Disparo FQ', 'Linea') IS NOT NULL ALTER TABLE [Disparo FQ] DROP COLUMN [Linea]";
  const dropParteQuery = "IF COL_LENGTH('Disparo FQ', 'Numero de Parte') IS NOT NULL ALTER TABLE [Disparo FQ] DROP COLUMN [Numero de Parte]";
  const updateCoil = "UPDATE [Disparo FQ] SET [Tipo] = 'TS Legacy' WHERE [Tipo] = 'Coil Shop 3/8'";
  const updateQueryTS = "UPDATE [Disparo FQ] SET [Tipo] = REPLACE([Tipo], ' TubeSheet', ' TS') WHERE [Tipo] LIKE '% TubeSheet%'";

  await connection.request().query(dropTableQuery);
  await connection.request().query(createTableQuery);
  await connection.request().query(insertQuery);
  await connection.request().query(updateEstatus);
  await connection.request().query(updateSO);
  await connection.request().query(updateDW);
  await connection.request().query(dropLineaQuery);
  await connection.request().query(dropParteQuery);
  await connection.request().query(updateCoil);
  await connection.request().query(updateQueryTS);

  await runDuplicadosFQ(connection);
  await runEliminarBasesRepetidas(connection);
  await runNuevoDsp(connection);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  let uploadedFile: File | undefined;
  let numEmpleado: string = '';

  try {
    const [fields, files] = await form.parse(req);
    
    uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    numEmpleado = Array.isArray(fields.empleado) ? fields.empleado[0] : fields.empleado || '';

    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!uploadedFile.mimetype?.includes('csv') && !uploadedFile.originalFilename?.endsWith('.csv')) {
      return res.status(400).json({ error: 'File must be CSV format' });
    }

    const pool = await sql.connect(sqlConfig);

    try {
      const csvLines = await parseCSV(uploadedFile.filepath);

      if (csvLines.length < 2) {
        return res.status(400).json({ error: 'CSV file is empty or has no data rows' });
      }

      const fechaHoraActual = new Date();

      await deleteSOLTable(pool);

      const dict = await getDictFromCSV(csvLines);

      const sortedEntries = Array.from(dict.entries()).sort(([a], [b]) => a.localeCompare(b));

      let rowsProcessed = 0;
      for (const [key, entry] of sortedEntries) {
        const { quantity, rowData } = entry;
        const {
          lineaValor,
          ordenProduccionValor,
          secuenciaValor,
          numeroParteValor,
          fechaRequeridaEntrega,
          grupoLogisticoValor,
          supplyAreaValor,
          balloonValor,
        } = rowData;

        // Determine tipo using comprehensive logic
        let tipo = await determineTipo(pool, numeroParteValor, lineaValor);

        // Insert into SOL TABLE
        const insertQuery = `
          INSERT INTO [SOL TABLE] 
          ([Linea], [Orden de Produccion], [Secuencia], [Numero de Parte], [Fecha Requerida Entrega], [Cantidad Requerida], [Tipo], [Gpo Logistico], [Supply Area], [BalloonNumber]) 
          VALUES (@Linea, @Orden_de_Produccion, @Secuencia, @Numero_de_Parte, @Fecha_Requerida_Entrega, @Cantidad_Requerida, @Tipo, @GpoLogistico, @SupplyArea, @BalloonNumber)
        `;

        const insertRequest = pool.request();
        insertRequest.input('Linea', sql.NVarChar(sql.MAX), lineaValor || null);
        insertRequest.input('Orden_de_Produccion', sql.NVarChar(sql.MAX), ordenProduccionValor || null);
        insertRequest.input('Secuencia', sql.NVarChar(sql.MAX), secuenciaValor || null);
        insertRequest.input('Numero_de_Parte', sql.NVarChar(sql.MAX), numeroParteValor || null);
        insertRequest.input('Fecha_Requerida_Entrega', sql.DateTime, fechaRequeridaEntrega || null);
        insertRequest.input('Cantidad_Requerida', sql.Float, quantity);
        insertRequest.input('Tipo', sql.NVarChar(sql.MAX), tipo || null);
        insertRequest.input('GpoLogistico', sql.NVarChar(sql.MAX), grupoLogisticoValor || null);
        insertRequest.input('SupplyArea', sql.NVarChar(sql.MAX), supplyAreaValor || null);
        insertRequest.input('BalloonNumber', sql.NVarChar(sql.MAX), balloonValor || null);

        await insertRequest.query(insertQuery);

        // Update Tipo to Linea if null/empty (VB.NET logic)
        const updateTipoQuery = `
          UPDATE [SOL TABLE] 
          SET [Tipo] = [Linea] 
          WHERE [Tipo] IS NULL OR LTRIM(RTRIM([Tipo])) = '';
        `;
        await pool.request().query(updateTipoQuery);

        // Log to CONTROL DISPAROS per row (VB.NET logic)
        const insertControlQuery = `
          INSERT INTO [CONTROL DISPAROS] 
          (Usuario, [Tipo de Cambio], [Estatus Anterior], [Estatus Nuevo], [Secuencia], [Linea], [Hora]) 
          VALUES (@Usuario, 'Disparo nuevo', NULL, NULL, @Secuencia, @Linea, @Hora)
        `;

        const controlRequest = pool.request();
        controlRequest.input('Usuario', sql.NVarChar(sql.MAX), numEmpleado);
        controlRequest.input('Secuencia', sql.NVarChar(sql.MAX), ordenProduccionValor || null);
        controlRequest.input('Linea', sql.NVarChar(sql.MAX), tipo || lineaValor || null);
        controlRequest.input('Hora', sql.DateTime, fechaHoraActual);

        await controlRequest.query(insertControlQuery);

        rowsProcessed++;
      }

      await updateBOAViper(pool);
      await runDuplicadosSOL(pool);
      await runSolCons(pool);
      await runCopiarBoa(pool);
      await runDisparoPrel(pool);
      await runCrearTablaDisparoFQ(pool);
      await runTarjetaPanther(pool);
      await runTarjetaFilter(pool);
      await runTarjetaTSVPAC(pool);
      await runTarjetaSpecial(pool);
      await runTarjetaPress(pool);
      await runTarjetaMPC(pool);
      await runTarjetaLegacy(pool);
      await runTarjetaCoil(pool);

      await pool.close();

      return res.status(200).json({
        message: `Disparo cargado correctamente`,
        rowsProcessed,
      });
    } catch (dbError) {
      await pool.close();
      throw dbError;
    }
  } catch (error) {
    console.error('Error processing CSV:', error);
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
