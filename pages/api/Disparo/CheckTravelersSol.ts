import { ConnectionPool } from 'mssql';

const poolPromise = new ConnectionPool({
  server: 'HPC-050',
  database: 'Travelers',
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await poolPromise;
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour24 = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const amPm = now.getHours() >= 12 ? 'PM' : 'AM';
    const formattedDate = `DISPARO ${year}${month}${day} ${hour24}${minute} ${amPm}`;

    await pool
      .request()
      .input('Semana', formattedDate)
      .query('UPDATE SOL SET Semana = @Semana WHERE Semana IS NULL');

    await pool.request().query(`
      UPDATE [SOL]
      SET [Linea] = CASE
        WHEN Linea = 'LRTA' THEN 'BOA'
        WHEN Linea = 'LRTN' THEN 'VIPER'
        WHEN Linea = 'CDUs' THEN 'CDU'
        ELSE Linea
      END
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [LG Color ID] = GruposBOA.ID
      FROM SOL
      INNER JOIN [Grupos BOA] AS GruposBOA
        ON SOL.[Logistic Group] = GruposBOA.[Grupo Logistico]
      WHERE SOL.[Linea] = 'BOA'
        AND GruposBOA.[Grupo Logistico] IS NOT NULL
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [LG Color ID] = GruposCDU.ID
      FROM SOL
      INNER JOIN [Grupos CDU] AS GruposCDU
        ON SOL.[Logistic Group] = GruposCDU.[Grupo Logistico]
      WHERE SOL.[Linea] = 'CDU'
        AND GruposCDU.[Grupo Logistico] IS NOT NULL
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [LG Color ID] = GruposViper.ID
      FROM SOL
      INNER JOIN [Grupos Viper] AS GruposViper
        ON SOL.[Logistic Group] = GruposViper.[Grupo Logistico]
      WHERE SOL.[Linea] = 'VIPER'
        AND GruposViper.[Grupo Logistico] IS NOT NULL
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Fecha Pack] = CONCAT(
        RIGHT('00' + CAST(YEAR([Fecha]) AS VARCHAR), 2),
        RIGHT('00' + CAST(MONTH([Fecha]) AS VARCHAR), 2),
        RIGHT('00' + CAST(DAY([Fecha]) AS VARCHAR), 2),
        CAST([Packing] AS VARCHAR)
      );
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Supply ID] = '1'
      WHERE [Supply Area] LIKE '%COIL%'
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Supply ID] = '2'
      WHERE [Supply Area] LIKE '%LRT%'
        OR [Supply Area] LIKE '%MULTI%'
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Supply ID] = '3'
      WHERE [Supply Area] LIKE '%PRESS%'
        OR [Supply Area] LIKE '%SUB%'
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Packing] = CONCAT(
        '*',
        CAST([Fecha Pack] AS VARCHAR),
        RIGHT(CAST([Work Order] AS VARCHAR), 4),
        CAST([Supply ID] AS VARCHAR),
        CAST([LG Color ID] AS VARCHAR),
        '*'
      );
    `);

    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1
        FROM [Packings]
        WHERE [Packing] IN (SELECT [Packing] FROM [SOL])
      )
      BEGIN
        INSERT INTO [Packings]
          ([Work Order], [Child Material], [Qty], [Logistic Group], [Packing], [Travel Name], [Linea], [Balloon Number], [Supply Area], [Semana], [Color Grupo], [Año])
        SELECT
          [Work Order],
          [Child Material],
          [Qty],
          [Logistic Group],
          [Packing],
          [TRAVEL NAME],
          [Linea],
          [BalloonNumber],
          [Supply Area],
          [Semana],
          [Color Grupo],
          YEAR(GETDATE())
        FROM [SOL];
      END
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Supply ID] = '4'
      WHERE [Supply Area] = 'CDU1 WS01'
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Supply ID] = '5'
      WHERE [Supply Area] = 'CDU2 WS02'
    `);

    await pool.request().query(`
      UPDATE SOL
      SET [Supply ID] = '6'
      WHERE [Supply Area] = 'CDU3 WS03'
    `);

    await pool.request().query(`
      UPDATE SOL
      SET SOL.[Color Grupo] = GruposBOA.[Color Grupo]
      FROM SOL
      INNER JOIN [Grupos BOA] AS GruposBOA
        ON SOL.[Logistic Group] = GruposBOA.[Grupo Logistico]
      WHERE SOL.[Linea] = 'BOA'
        AND GruposBOA.[Grupo Logistico] IS NOT NULL
    `);

    await pool.request().query(`
      UPDATE SOL
      SET SOL.[Color Grupo] = GruposViper.[Color Grupo]
      FROM SOL
      INNER JOIN [Grupos Viper] AS GruposViper
        ON SOL.[Logistic Group] = GruposViper.[Grupo Logistico]
      WHERE SOL.[Linea] = 'VIPER'
        AND GruposViper.[Grupo Logistico] IS NOT NULL
    `);

    await pool.request().query(`
      UPDATE SOL
      SET SOL.[Color Grupo] = GruposCDU.[Color Grupo]
      FROM SOL
      INNER JOIN [Grupos CDU] AS GruposCDU
        ON SOL.[Logistic Group] = GruposCDU.[Grupo Logistico]
      WHERE SOL.[Linea] = 'CDU'
        AND GruposCDU.[Grupo Logistico] IS NOT NULL
    `);

    await pool.request().query(`
      DELETE s
      FROM SOL s
      WHERE s.[Logistic Group] IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM [Grupos BOA] gb
          WHERE gb.[Grupo Logistico] = s.[Logistic Group]
        )
        AND NOT EXISTS (
          SELECT 1
          FROM [Grupos Viper] gv
          WHERE gv.[Grupo Logistico] = s.[Logistic Group]
        )
        AND NOT EXISTS (
          SELECT 1
          FROM [Grupos CDU] gc
          WHERE gc.[Grupo Logistico] = s.[Logistic Group]
        );
    `);

    await pool.request().query(`
      UPDATE [SOL]
      SET [TRAVEL NAME] = CONCAT(
        CAST([Work Order] AS VARCHAR),
        ' ',
        CAST([Logistic Group] AS VARCHAR),
        ' ',
        CAST([Supply Area] AS VARCHAR)
      )
      WHERE [LG Color ID] IS NOT NULL
        AND [Color Grupo] IS NOT NULL
    `);

    await pool.request().query(`
      UPDATE [SOL]
      SET [TRAVEL NAME] = CONCAT(
        CAST([TRAVEL NAME] AS VARCHAR),
        ' ',
        CAST([Color Grupo] AS VARCHAR)
      )
    `);

    await pool.request().query('DELETE FROM [Valores Unicos Gpo_Log]');

    await pool.request().query(`
      INSERT INTO [Valores Unicos Gpo_Log] ([Logistic Group], [Work Order], [Linea], [Color Grupo], [Travel Name], [Supply Area])
      SELECT DISTINCT [Logistic Group], [Work Order], [Linea], [Color Grupo], [TRAVEL NAME], [Supply Area]
      FROM [SOL]
    `);

    const result = await pool.request().query(
      'SELECT COUNT(DISTINCT [Travel Name]) AS count FROM [Valores Unicos Gpo_Log] WHERE [Travel Name] IS NOT NULL'
    );
    const count = result.recordset?.[0]?.count ?? 0;

    const listResult = await pool.request().query(
      "SELECT [Travel Name] AS travelName FROM [Valores Unicos Gpo_Log] WHERE [Travel Name] IS NOT NULL ORDER BY [Travel Name]"
    );
    const travelers = (listResult.recordset || []).map((row: any) => row.travelName).filter((name: string) => name);

    return res.status(200).json({ count, travelers });
  } catch (error) {
    console.error('Error checking Travelers SOL:', error);
    return res.status(500).json({
      error: 'Error al verificar la base de datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
