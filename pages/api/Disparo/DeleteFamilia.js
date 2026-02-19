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

const CORRECT_PASSWORD = 'EMBARQUES2024';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { numeroParte, password } = req.body;

  if (!numeroParte) {
    return res.status(400).json({ message: 'Número de parte requerido' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Contraseña requerida' });
  }

  if (password !== CORRECT_PASSWORD) {
    return res.status(401).json({ message: 'Contraseña incorrecta' });
  }

  try {
    const pool = new sql.ConnectionPool(connectionString);
    await pool.connect();
    
    const result = await pool.request()
      .input('PartNumber', sql.NVarChar, numeroParte)
      .query('DELETE FROM Familias WHERE [Numero de Parte] = @PartNumber');

    await pool.close();

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Familia no encontrada' });
    }

    res.status(200).json({ message: 'Familia eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar familia:', error);
    res.status(500).json({ message: 'Error al eliminar familia', error: error.message });
  }
}
