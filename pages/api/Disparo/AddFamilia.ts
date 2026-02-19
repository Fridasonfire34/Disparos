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

  const { linea, piezas } = req.body;

  if (!linea || !piezas || !Array.isArray(piezas) || piezas.length === 0) {
    return res.status(400).json({ 
      message: 'Se requiere linea y un array de piezas válido' 
    });
  }

  try {
    const pool = new sql.ConnectionPool(connectionString);
    await pool.connect();
    
    let insertedCount = 0;
    const errors = [];

    for (const pieza of piezas) {
      try {
        await pool.request()
          .input('Linea', sql.NVarChar, linea)
          .input('Numero_de_Parte', sql.NVarChar, pieza)
          .query('INSERT INTO Familias (Linea, [Numero de Parte]) VALUES (@Linea, @Numero_de_Parte)');
        
        insertedCount++;
      } catch (error) {
        console.error(`Error al insertar pieza ${pieza}:`, error);
        errors.push({ pieza, error: error.message });
      }
    }

    await pool.close();

    if (insertedCount === piezas.length) {
      res.status(200).json({ 
        message: 'Familia guardada correctamente',
        insertedCount 
      });
    } else if (insertedCount > 0) {
      res.status(207).json({ 
        message: 'Algunas piezas no se pudieron guardar',
        insertedCount,
        totalPiezas: piezas.length,
        errors 
      });
    } else {
      res.status(500).json({ 
        message: 'No se pudo guardar ninguna pieza',
        errors 
      });
    }
  } catch (error) {
    console.error('Error al guardar familia:', error);
    res.status(500).json({ 
      message: 'Error al guardar familia', 
      error: error.message 
    });
  }
}
