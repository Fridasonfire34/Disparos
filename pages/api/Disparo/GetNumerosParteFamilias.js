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

  const { linea } = req.query;

  if (!linea || typeof linea !== 'string') {
    return res.status(400).json({ message: 'Parámetro linea requerido' });
  }

  try {
    const pool = new sql.ConnectionPool(connectionString);
    await pool.connect();
    
    const result = await pool.request()
      .input('Seleccion', sql.NVarChar, linea)
      .query("SELECT DISTINCT [Numero de Parte] FROM Familias WHERE Linea LIKE '%' + @Seleccion + '%' ORDER BY [Numero de Parte]");

    await pool.close();
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al obtener números de parte:', error);
    res.status(500).json({ message: 'Error al obtener números de parte', error: error.message });
  }
}
