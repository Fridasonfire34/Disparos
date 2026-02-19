import sql from 'mssql';

const config = {
  user: 'sa',
  password: 'TMPdb1124',
  database: 'TMP',
  server: 'HPC-050',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tipo } = req.query;

  if (!tipo || (tipo !== 'Ms' && tipo !== 'Viper' && tipo !== 'BOA' && tipo !== 'CDU')) {
    return res.status(400).json({ error: 'Invalid or missing tipo parameter. Must be "Ms", "Viper", "BOA" or "CDU"' });
  }

  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    let selectQuery;
    const request = pool.request();

    if (tipo === 'Ms') {
      selectQuery = `
        SELECT * FROM DISPARO 
        WHERE (Estatus <> 'ENVIADO' OR (Estatus = 'ENVIADO' AND Cambios = 'OK')) 
        AND Tipo IS NULL 
        ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, Secuencia ASC
      `;
    } else {
      selectQuery = `
        SELECT * FROM DISPARO 
        WHERE (Estatus <> 'ENVIADO' OR (Estatus = 'ENVIADO' AND Cambios = 'OK')) 
        AND Tipo = @Tipo 
        ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, Secuencia ASC
      `;
      request.input('Tipo', sql.NVarChar, tipo);
    }
    
    const result = await request.query(selectQuery);
    await pool.close();

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
