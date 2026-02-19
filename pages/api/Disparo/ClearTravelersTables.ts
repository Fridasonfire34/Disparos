import { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await travelersPool;

    await pool.request().query('DELETE FROM [SOL]');
    await pool.request().query('DELETE FROM [Valores Unicos Gpo_Log]');
    await pool.request().query('DELETE FROM [Doc Escaner]');
    await pool.request().query('DELETE FROM [Tabla Amarillo VIPER]');
    await pool.request().query('DELETE FROM [TABLA Rosa Viper]');
    await pool.request().query('DELETE FROM [TABLA Verde VIPER]');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error clearing travelers tables:', error);
    return res.status(500).json({
      error: 'Error al limpiar tablas de travelers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
