import { ConnectionPool } from 'mssql';

const travelersPool = new ConnectionPool({
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

interface TravelerPDFData {
  travelName: string;
  linea: 'BOA' | 'CDU';
  docName: string;
  tableData: Array<{
    childMaterial: string;
    workOrder: string;
    qty: number;
    packing: string;
    kanban: string;
  }>;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await travelersPool;

    // Obtener todos los TRAVEL NAME únicos
    const travelNamesResult = await pool.request().query(
      "SELECT DISTINCT [TRAVEL NAME] AS travelName FROM SOL WHERE [TRAVEL NAME] IS NOT NULL ORDER BY [TRAVEL NAME]"
    );
    
    const travelNames = (travelNamesResult.recordset || []).map((row: any) => row.travelName);

    if (travelNames.length === 0) {
      return res.status(200).json({ travelers: [] });
    }

    // Para cada travel name, obtener los datos completos
    const travelers: TravelerPDFData[] = [];

    for (const travelName of travelNames) {
      // Extraer color del travelName
      const colors = ['Verde', 'Azul', 'Amarillo', 'Rosa', 'Celeste'];
      let color = 'Verde'; // default
      for (const c of colors) {
        if (travelName.includes(c)) {
          color = c;
          break;
        }
      }

      // Obtener linea desde SOL primero
      const lineaResult = await pool
        .request()
        .input('TravelName', travelName)
        .query(`SELECT TOP 1 [Linea] FROM SOL WHERE [TRAVEL NAME] = @TravelName`);
      
      const linea = (lineaResult.recordset?.[0]?.Linea || 'BOA') as 'BOA' | 'CDU';

      // Determinar la tabla correcta según color y línea
      let tableName = '';
      if (linea === 'BOA') {
        tableName = `Tabla ${color} BOA`;
      } else if (linea === 'VIPER') {
        tableName = `Tabla ${color} VIPER`;
      } else if (linea === 'CDU') {
        // CDU usa tablas VIPER con colores mapeados
        if (color === 'Celeste') {
          tableName = 'Tabla Amarillo VIPER';
        } else {
          tableName = `Tabla ${color} VIPER`;
        }
      }

      // Consultar datos desde la tabla específica que ya tiene Kanban actualizado
      const dataResult = await pool
        .request()
        .input('TravelName', travelName)
        .query(`
          SELECT 
            [TRAVEL NAME] AS travelName,
            [Linea] AS linea,
            [Child Material] AS childMaterial,
            [Work Order] AS workOrder,
            [Qty] AS qty,
            [Packing] AS packing,
            [Kanban] AS kanban,
            [Doc Name] AS docName
          FROM [${tableName}]
          WHERE [TRAVEL NAME] = @TravelName
          ORDER BY [Child Material]
        `);

      const rows = dataResult.recordset || [];
      if (rows.length > 0) {
        const docName = rows[0].docName || travelName;

        const tableData = rows.map((row: any) => ({
          childMaterial: row.childMaterial || '',
          workOrder: row.workOrder || '',
          qty: parseInt(row.qty) || 0,
          packing: row.packing || '',
          kanban: row.kanban || ''
        }));

        travelers.push({
          travelName,
          linea,
          docName,
          tableData
        });
      }
    }

    return res.status(200).json({ travelers });
  } catch (error) {
    console.error('Error fetching travelers complete data:', error);
    return res.status(500).json({
      error: 'Error al obtener datos de travelers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
