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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const pool = new sql.ConnectionPool(connectionString);
    await pool.connect();
    
    const result = await pool.request()
      .query('SELECT DISTINCT Linea FROM Familias ORDER BY Linea');

    await pool.close();
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al obtener líneas de familias:', error);
    res.status(500).json({ message: 'Error al obtener líneas', error: error.message });
  }
}
