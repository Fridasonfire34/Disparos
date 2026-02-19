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

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);

    // 1. Delete old data
    await pool.request().query('DELETE FROM [CONSOL Enviados Viper]');
    await pool.request().query('DELETE FROM [CONSOL Enviados BOA]');
    await pool.request().query('DELETE FROM [Envios Viper]');
    await pool.request().query('DELETE FROM [Envios BOA]');

    // 2. Insert into CONSOL Enviados Viper
    await pool.request().query(`
      INSERT INTO [CONSOL Enviados Viper]
      (
          [Entrega],
          [Estatus],
          [Tipo Viper],
          [Qty]
      )
      SELECT  
          [Entrega], 
          [Estatus], 
          [Tipo Viper], 
          [Qty] 
      FROM [DISPARO] 
      WHERE 
          [Tipo Viper] IS NOT NULL
          AND [Entrega] >= DATEADD(DAY, -15, GETDATE())
       AND [Estatus] IN (
              'ENVIADO',
              'Listo para Enviar - Falta de carro adecuado',
              'Listo para Enviar - EN CAJA',
              '*EN PROCESO DE TRASPALEO',
              'Disparo Nuevo',
              'ENVIADO PENDIENTE'
          );
    `);

    // 3. Insert into CONSOL Enviados BOA
    await pool.request().query(`
      INSERT INTO [CONSOL Enviados BOA]
      (
          [Entrega],
          [Estatus],
          [Qty]
      )
      SELECT  
          [Entrega], 
          [Estatus], 
          [Qty] 
      FROM [DISPARO] 
      WHERE 
          [Tipo] = 'BOA'
          AND [Entrega] >= DATEADD(DAY, -15, GETDATE())
       AND [Estatus] IN (
              'ENVIADO',
              'Listo para Enviar - Falta de carro adecuado',
              'Listo para Enviar - EN CAJA',
              '*EN PROCESO DE TRASPALEO',
              'Disparo Nuevo',
              'ENVIADO PENDIENTE'
          );
    `);

    // 4. Update and consolidate CONSOL Enviados Viper
    await pool.request().query(`
      WITH SumaCantidad AS (
          SELECT
              [Entrega],
              Estatus,
              [Tipo Viper],
              SUM([Qty]) AS TotalCantidad
          FROM [CONSOL Enviados Viper]
          GROUP BY 
              [Entrega],
              Estatus,
              [Tipo Viper]
      )
      UPDATE t1
      SET t1.[Qty] = t2.TotalCantidad
      FROM [CONSOL Enviados Viper] t1
      JOIN SumaCantidad t2 
          ON t1.[Entrega] = t2.[Entrega]
          AND t1.[Tipo Viper] = t2.[Tipo Viper]
          AND t1.[Estatus] = t2.[Estatus];
    `);

    // 5. Delete duplicates from CONSOL Enviados Viper
    await pool.request().query(`
      WITH CTE AS (
          SELECT *,
                 ROW_NUMBER() OVER(PARTITION BY [Entrega], [Estatus], [Tipo Viper]
                                   ORDER BY [Entrega]) AS RowNum
          FROM [CONSOL Enviados Viper]
      )
      DELETE FROM CTE WHERE RowNum > 1;
    `);

    // 6. Update and consolidate CONSOL Enviados BOA
    await pool.request().query(`
      WITH SumaCantidad AS (
          SELECT
              [Entrega],
              Estatus,
              SUM([Qty]) AS TotalCantidad
          FROM [CONSOL Enviados BOA]
          GROUP BY 
              [Entrega],
              Estatus
      )
      UPDATE t1
      SET t1.[Qty] = t2.TotalCantidad
      FROM [CONSOL Enviados BOA] t1
      JOIN SumaCantidad t2 
          ON t1.[Entrega] = t2.[Entrega]
          AND t1.[Estatus] = t2.[Estatus];
    `);

    // 7. Delete duplicates from CONSOL Enviados BOA
    await pool.request().query(`
      WITH CTE AS (
          SELECT *,
                 ROW_NUMBER() OVER(PARTITION BY [Entrega], [Estatus]
                                   ORDER BY [Entrega]) AS RowNum
          FROM [CONSOL Enviados BOA]
      )
      DELETE FROM CTE WHERE RowNum > 1;
    `);

    // 8. Insert into Envios Viper
    await pool.request().query(`
      INSERT INTO [Envios Viper]
      (
          [Fecha Entrega],
          [Estacion],
          [En proceso de Traspaleo],
          [Enviado],
          [Enviado Pendiente],
          [Listo para Enviar - Falta de carro adecuado],
          [Listo para Enviar - Por subir a caja],
          [Disparo nuevo],
          [Total]
      )
      SELECT
          [Entrega] AS [Fecha Entrega],
          [Tipo Viper] AS [Estacion],

          SUM(CASE 
              WHEN [Estatus] = '*EN PROCESO DE TRASPALEO' 
              THEN [Qty] 
          END) AS [En proceso de Traspaleo],

          SUM(CASE 
              WHEN [Estatus] = 'ENVIADO' 
              THEN [Qty] 
          END) AS [Enviado],

          SUM(CASE 
              WHEN [Estatus] = 'ENVIADO PENDIENTE' 
              THEN [Qty] 
          END) AS [Enviado Pendiente],

          SUM(CASE 
              WHEN [Estatus] = 'Listo para Enviar - Falta de carro adecuado' 
              THEN [Qty] 
          END) AS [Listo para Enviar - Falta de Carro adecuado],

          SUM(CASE 
              WHEN [Estatus] = 'Listo para Enviar  - Por subir a caja' 
              THEN [Qty] 
          END) AS [Listo para Enviar - EN CAJA],

          SUM(CASE 
              WHEN [Estatus] = 'Disparo Nuevo' 
              THEN [Qty] 
          END) AS [Disparo Nuevo],

          SUM([Qty]) AS [Total]

      FROM [CONSOL Enviados Viper]
      GROUP BY
          [Entrega],
          [Tipo Viper]
      ORDER BY
          [Entrega],
          [Tipo Viper];
    `);

    // 9. Insert into Envios BOA
    await pool.request().query(`
      INSERT INTO [Envios BOA]
      (
          [Fecha Entrega],
          [En proceso de Traspaleo],
          [Enviado],
          [Enviado Pendiente],
          [Listo para Enviar - Falta de carro adecuado],
          [Listo para Enviar - Por subir a caja],
          [Disparo nuevo],
          [Total]
      )
      SELECT
          [Entrega] AS [Fecha Entrega],

          SUM(CASE 
              WHEN [Estatus] = '*EN PROCESO DE TRASPALEO' 
              THEN [Qty] 
          END) AS [En proceso de Traspaleo],

          SUM(CASE 
              WHEN [Estatus] = 'ENVIADO' 
              THEN [Qty] 
          END) AS [Enviado],

          SUM(CASE 
              WHEN [Estatus] = 'ENVIADO PENDIENTE' 
              THEN [Qty] 
          END) AS [Enviado Pendiente],

          SUM(CASE 
              WHEN [Estatus] = 'Listo para Enviar - Falta de carro adecuado' 
              THEN [Qty] 
          END) AS [Listo para Enviar - Falta de carro adecuado],

          SUM(CASE 
              WHEN [Estatus] = 'Listo para Enviar  - Por subir a caja' 
              THEN [Qty] 
          END) AS [Listo para Enviar  - EN CAJA],

          SUM(CASE 
              WHEN [Estatus] = 'Disparo Nuevo' 
              THEN [Qty] 
          END) AS [Disparo Nuevo],

          SUM([Qty]) AS [Total]

      FROM [CONSOL Enviados BOA]
      GROUP BY
          [Entrega]
      ORDER BY
          [Entrega];
    `);

    // 10. Clean and insert into Junta 7AM Borrador
    await pool.request().query('DELETE FROM [Junta 7AM Borrador]');
    await pool.request().query('DELETE FROM [Junta 7AM]');

    await pool.request().query(`
      INSERT INTO [JUNTA 7AM Borrador]
      (
          [Secuencia],
          [Tipo],
          [Estatus]
      )
      SELECT DISTINCT
          [Orden Produccion],
          [Tipo Viper],
          [Estatus]
      FROM [DISPARO]
      WHERE [Tipo Viper] IS NOT NULL
          AND [Orden Produccion] IN (
              SELECT DISTINCT [Orden Produccion]
              FROM [DISPARO]
              WHERE [Entrega] >= DATEADD(DAY, -16, GETDATE())
                  AND [Tipo Viper] IS NOT NULL
          )
      ORDER BY [Orden Produccion] ASC;
    `);

    // 11. Update Junta 7AM Borrador with dates from DISPARO
    await pool.request().query(`
      UPDATE J
      SET J.[Entrega] = D.[Entrega]
      FROM [JUNTA 7AM Borrador] AS J
      INNER JOIN [DISPARO] AS D 
          ON J.[Secuencia] = D.[Orden Produccion]
      WHERE D.[Tipo Viper] = 'COIL'
          AND D.[Entrega] IS NOT NULL
    `);

    // 12. Insert into Junta 7AM
    await pool.request().query(`
      INSERT INTO [Junta 7AM]
      (
          [Secuencia],
          [Entrega],
          [Fecha Embarque Coil],
          [Fecha Embarque Linea],
          [Fecha Embarque SUBA-ESTACION 01]
      )
      SELECT
          [Secuencia],
          [Entrega],
          MAX(CASE 
              WHEN [Tipo] = 'Coil' 
              THEN [Estatus] 
          END) AS [Fecha Embarque Coil],

          MAX(CASE 
              WHEN [Tipo] = 'Linea' 
              THEN [Estatus] 
          END) AS [Fecha Embarque Linea],

          MAX(CASE 
              WHEN [Tipo] = 'SUBA-ESTACION 01' 
              THEN [Estatus] 
          END) AS [Fecha Embarque SUBA-ESTACION 01]

      FROM [Junta 7AM Borrador]
      GROUP BY
          [Secuencia],
          [Entrega]
      ORDER BY
          [Secuencia];
    `);

    // 13. Update Junta 7AM with IDs
    await pool.request().query('UPDATE [Junta 7AM] SET [ID] = NEWID() WHERE ID IS NULL');

    // 14. Clean Coil
    await pool.request().query(`
      UPDATE [Junta 7AM] 
      SET [Fecha Embarque Coil] = NULL 
      WHERE [Fecha Embarque Coil] <> 'ENVIADO' OR [Fecha Embarque Coil] IS NULL;
    `);

    // 15. Clean Linea
    await pool.request().query(`
      UPDATE [Junta 7AM] 
      SET [Fecha Embarque Linea] = NULL 
      WHERE [Fecha Embarque Linea] <> 'ENVIADO' OR [Fecha Embarque Linea] IS NULL;
    `);

    // 16. Clean Suba
    await pool.request().query(`
      UPDATE [Junta 7AM] 
      SET [Fecha Embarque SUBA-ESTACION 01] = NULL 
      WHERE [Fecha Embarque SUBA-ESTACION 01] <> 'ENVIADO' OR [Fecha Embarque SUBA-ESTACION 01] IS NULL;
    `);

    await pool.close();

    return res.status(200).json({ 
      message: 'Datos consolidados correctamente'
    });
  } catch (error) {
    console.error('Error refreshing consolidated data:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al consolidar datos' });
  }
}
