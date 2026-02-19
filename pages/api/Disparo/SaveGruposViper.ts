import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'Travelers',
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

  const { grupos, color } = req.body;

  if (!Array.isArray(grupos) || grupos.length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un grupo logistico' });
  }

  if (!color || typeof color !== 'string' || color.trim() === '') {
    return res.status(400).json({ error: 'Selecciona un color para el grupo logistico' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);
    const insertedGrupos: string[] = [];
    const skippedGrupos: Array<{ grupo: string; colorExistente: string }> = [];

    for (const grupo of grupos) {
      const grupoTrimmed = grupo.trim();
      if (!grupoTrimmed) continue;

      // Check if grupo already exists
      const checkResult = await pool
        .request()
        .input('GrupoLogistico', sql.NVarChar, grupoTrimmed)
        .query(
          'SELECT [Grupo Logistico], [Color Grupo] FROM [Grupos Viper] WHERE [Grupo Logistico] = @GrupoLogistico'
        );

      if (checkResult.recordset && checkResult.recordset.length > 0) {
        const existingColor = checkResult.recordset[0]['Color Grupo'];
        skippedGrupos.push({ grupo: grupoTrimmed, colorExistente: existingColor });
        continue;
      }

      // Get max ID from both Viper and BOA tables
      const maxViperResult = await pool
        .request()
        .query('SELECT MAX([ID]) AS maxID FROM [Grupos Viper]');

      const maxBoaResult = await pool
        .request()
        .query('SELECT MAX([ID]) AS maxID FROM [Grupos BOA]');

      const idViper =
        maxViperResult.recordset[0]?.maxID != null
          ? parseInt(maxViperResult.recordset[0].maxID, 10)
          : 0;

      const idBoa =
        maxBoaResult.recordset[0]?.maxID != null
          ? parseInt(maxBoaResult.recordset[0].maxID, 10)
          : 0;

      const newID = Math.max(idViper, idBoa) + 1;

      // Insert new grupo
      await pool
        .request()
        .input('GrupoLogistico', sql.NVarChar, grupoTrimmed)
        .input('ColorGrupo', sql.NVarChar, color.trim())
        .input('ID', sql.Int, newID)
        .query(
          'INSERT INTO [Grupos Viper] ([Grupo Logistico], [Color Grupo], [ID]) VALUES (@GrupoLogistico, @ColorGrupo, @ID)'
        );

      insertedGrupos.push(grupoTrimmed);
    }

    await pool.close();

    let message = '';
    if (insertedGrupos.length > 0) {
      message += `Se agregaron ${insertedGrupos.length} grupo(s) logistico(s) correctamente.`;
    }

    if (skippedGrupos.length > 0) {
      if (message) message += '\n\n';
      message += 'Los siguientes grupos ya estaban registrados:\n';
      skippedGrupos.forEach((item) => {
        message += `- ${item.grupo} (Color: ${item.colorExistente})\n`;
      });
    }

    if (insertedGrupos.length === 0 && skippedGrupos.length > 0) {
      return res.status(400).json({ error: message });
    }

    return res.status(200).json({ message });
  } catch (error) {
    console.error('Error saving Grupos Viper:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al guardar Grupos Viper' });
  }
}
