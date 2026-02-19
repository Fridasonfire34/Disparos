import type { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(
      "SELECT [Correo] FROM [Correos Disparo] WHERE [Tarjetas] = 'TRUE' ORDER BY [Correo] ASC"
    );
    await pool.close();

    const emails = result.recordset?.map((row: any) => row.Correo) || [];
    return res.status(200).json({ emails });
  } catch (error) {
    console.error('Error getting emails:', error);
    return res.status(500).json({
      error: 'Error al obtener correos: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}
