import { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await poolPromise;

    await pool.request().query('DELETE FROM [Tabla Verde BOA]');
    await pool.request().query('DELETE FROM [Tabla Azul BOA]');
    await pool.request().query('DELETE FROM [Tabla Amarillo BOA]');
    await pool.request().query('DELETE FROM [Tabla Verde VIPER]');
    await pool.request().query('DELETE FROM [Tabla Rosa VIPER]');
    await pool.request().query('DELETE FROM [Tabla Amarillo VIPER]');
    await pool.request().query('DELETE FROM [Tabla Celeste CDU]');
    await pool.request().query('DELETE FROM [Tabla Verde CDU]');

    const baseInsert = `
      [Work Order],
      [Child Material],
      [Child Description],
      [Qty],
      [Logistic Group],
      [Packing],
      [TRAVEL NAME],
      [Linea],
      [BalloonNumber],
      [Color Grupo],
      [Doc Name]
    `;

    const baseSelect = `
      SELECT
        [Work Order],
        [Child Material],
        [Child Description],
        [Qty],
        [Logistic Group],
        [Packing],
        [TRAVEL NAME],
        [Linea],
        [BalloonNumber],
        [Color Grupo],
        [Semana]
      FROM [SOL]
    `;

    await pool.request().query(`
      INSERT INTO [Tabla Verde BOA] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'BOA' AND [Color Grupo] = 'Verde'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Amarillo BOA] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'BOA' AND [Color Grupo] = 'Amarillo'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Azul BOA] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'BOA' AND [Color Grupo] = 'Azul'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Rosa VIPER] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'VIPER' AND [Color Grupo] = 'Rosa'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Amarillo VIPER] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'VIPER' AND [Color Grupo] = 'Amarillo'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Verde VIPER] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'VIPER' AND [Color Grupo] = 'Verde'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Rosa VIPER] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'CDU' AND [Color Grupo] = 'Rosa'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Amarillo VIPER] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'CDU' AND [Color Grupo] = 'Celeste'
    `);

    await pool.request().query(`
      INSERT INTO [Tabla Verde VIPER] (${baseInsert})
      ${baseSelect}
      WHERE [Linea] = 'CDU' AND [Color Grupo] = 'Verde'
    `);

    await pool.request().query(`
      UPDATE [Tabla Rosa VIPER]
      SET [Kanban] = (
        SELECT [Tipo]
        FROM [Kanban]
        WHERE [Kanban].[Numero de Parte] = [Tabla Rosa VIPER].[Child Material]
      )
      WHERE EXISTS (
        SELECT 1
        FROM [Kanban]
        WHERE [Kanban].[Numero de Parte] = [Tabla Rosa VIPER].[Child Material]
      )
    `);

    await pool.request().query(`
      UPDATE [Tabla Amarillo VIPER]
      SET [Kanban] = (
        SELECT [Tipo]
        FROM [Kanban]
        WHERE [Kanban].[Numero de Parte] = [Tabla Amarillo VIPER].[Child Material]
      )
      WHERE EXISTS (
        SELECT 1
        FROM [Kanban]
        WHERE [Kanban].[Numero de Parte] = [Tabla Amarillo VIPER].[Child Material]
      )
    `);

    await pool.request().query(`
      UPDATE [Tabla Verde VIPER]
      SET [Kanban] = (
        SELECT [Tipo]
        FROM [Kanban]
        WHERE [Kanban].[Numero de Parte] = [Tabla Verde VIPER].[Child Material]
      )
      WHERE EXISTS (
        SELECT 1
        FROM [Kanban]
        WHERE [Kanban].[Numero de Parte] = [Tabla Verde VIPER].[Child Material]
      )
    `);

    await pool.request().query(`
      UPDATE [Tabla Rosa VIPER]
      SET [Kanban] = 'Ensamble'
      WHERE [Kanban] = 'ASSY';

      UPDATE [Tabla Amarillo VIPER]
      SET [Kanban] = 'Ensamble'
      WHERE [Kanban] = 'ASSY';

      UPDATE [Tabla Verde VIPER]
      SET [Kanban] = 'Ensamble'
      WHERE [Kanban] = 'ASSY';
    `);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error preparing travelers tables:', error);
    return res.status(500).json({
      error: 'Error al preparar tablas de travelers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
