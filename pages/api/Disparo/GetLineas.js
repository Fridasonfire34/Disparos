import sql from 'mssql';

const connectionString = {
  server: 'HPC-050',
  database: 'TMP',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'TMPdb1124'
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tipo } = req.query;

  if (!tipo || !['Ms', 'Viper', 'BOA'].includes(tipo)) {
    return res.status(400).json({ error: 'Invalid tipo parameter' });
  }

  try {
    // Create a new connection pool
    const pool = new sql.ConnectionPool(connectionString);
    await pool.connect();

    let query;
    if (tipo === 'Ms') {
      query = `SELECT DISTINCT [Linea] FROM DISPARO WHERE [Tipo] IS NULL ORDER BY [Linea]`;
    } else {
      query = `SELECT DISTINCT [Linea] FROM DISPARO WHERE [Tipo] = @Tipo ORDER BY [Linea]`;
    }

    const request = pool.request();
    if (tipo !== 'Ms') {
      request.input('Tipo', sql.NVarChar, tipo);
    }

    const result = await request.query(query);
    await pool.close();

    const lineas = result.recordset.map((row) => row.Linea).filter((v) => v != null);
    res.status(200).json(lineas);
  } catch (error) {
    console.error('Error fetching lineas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
