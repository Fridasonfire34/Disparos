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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { numeroDeParte } = req.body;

  if (!numeroDeParte) {
    return res.status(400).json({ message: 'numeroDeParte requerido' });
  }

  try {
    const pool = new sql.ConnectionPool(connectionString);
    await pool.connect();
    
    const result = await pool.request()
      .input('Numero_de_Parte', sql.NVarChar, numeroDeParte)
      .query('SELECT Linea FROM Familias WHERE [Numero de Parte] = @Numero_de_Parte');

    await pool.close();

    if (result.recordset.length > 0) {
      res.status(200).json({
        existe: true,
        linea: result.recordset[0].Linea
      });
    } else {
      res.status(200).json({
        existe: false
      });
    }
  } catch (error) {
    console.error('Error al verificar pieza:', error);
    res.status(500).json({ message: 'Error al verificar pieza', error: error.message });
  }
}
