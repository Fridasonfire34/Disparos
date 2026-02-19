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

function mapTipoToTarjeta(tipo: string): string | null {
  if (tipo.includes('Special')) return 'Special Orders';
  if (tipo.includes('Panther')) return 'Panther';
  if (tipo.includes('MPC')) return 'MPCQ';
  if (tipo.includes('Press Shop')) return 'Press Shop';
  if (tipo.includes('CoilShop')) return 'CoilShop';
  if (tipo.includes('Legacy')) return 'Legacy';
  if (tipo.includes('TSVPAC')) return 'TSVPAC';
  if (tipo.includes('TRACK')) return 'FILTER TRACK';
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const selectQuery = `
      SELECT DISTINCT [Tipo]
      FROM [SOL TABLE]
      WHERE [Tipo] LIKE '%Special%'
         OR [Tipo] LIKE '%Panther%'
         OR [Tipo] LIKE '%MPC%'
         OR [Tipo] LIKE '%TSVPAC%'
         OR [Tipo] LIKE '%Legacy%'
         OR [Tipo] LIKE '%CoilShop%'
         OR [Tipo] LIKE '%TRACK%'
         OR [Tipo] LIKE '%Press Shop%'
    `;

    const result = await pool.request().query(selectQuery);
    const unique = new Set<string>();

    for (const row of result.recordset || []) {
      const tipo = String(row.Tipo || '');
      if (!tipo) continue;
      const mapped = mapTipoToTarjeta(tipo);
      if (mapped) {
        unique.add(mapped);
      }
    }

    await pool.close();

    return res.status(200).json({ data: Array.from(unique) });
  } catch (error) {
    console.error('Error loading preview tarjetas:', error);
    return res.status(500).json({
      error: 'Error al cargar tarjetas: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}
