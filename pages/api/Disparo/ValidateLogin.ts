import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import crypto from 'crypto';

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
    encrypt: false,
    trustServerCertificate: true
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { usuario, password } = req.body;
  //console.log('Valores recibidos en ValidateLogin:', { usuario, password });

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  // Validar que usuario sea numérico
  if (!/^\d+$/.test(usuario.toString())) {
    return res.status(400).json({ error: 'Usuario debe ser numérico' });
  }

  try {
    const pool = await sql.connect(config);
    
    // Obtener el usuario y su hash
    const userResult = await pool.request()
      .input('usuario', sql.NVarChar, usuario)
      .query(`
        SELECT [Numero Empleado], [Nombre Empleado], Tipo, Password
        FROM Usuarios
        WHERE [Numero Empleado] = @usuario
      `);

    await pool.close();

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    const user = userResult.recordset[0];
    const passwordFromDB = user.Password; // Este es un Buffer

    // Generar el hash SHA2_512 de la contraseña ingresada
    const generatedHash = crypto
      .createHash('sha512')
      .update(password)
      .digest();

    // Convertir ambos a hexadecimal para comparar
    const hashFromDBHex = passwordFromDB.toString('hex').toUpperCase();
    const generatedHashHex = generatedHash.toString('hex').toUpperCase();
    
   // console.log('Hash en BD (hex):', hashFromDBHex);
   // console.log('Hash generado (hex):', generatedHashHex);

    if (hashFromDBHex === generatedHashHex) {
      return res.status(200).json({ 
        success: true, 
        numeroEmpleado: user['Numero Empleado'],
        nombreEmpleado: user['Nombre Empleado'],
        tipo: user.Tipo
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

  } catch (error) {
    console.error('Error validando usuario:', error);
    return res.status(500).json({ 
      error: 'Error al validar credenciales',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
