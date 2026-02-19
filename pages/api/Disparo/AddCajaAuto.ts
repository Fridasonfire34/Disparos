import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'TMP',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);
    
    // Get all existing cajas
    const result = await pool
      .request()
      .query('SELECT [Nombre caja] FROM CAJAS');

    const cajas = result.recordset.map(row => row['Nombre caja']);
    
    // Find highest number
    let highestNumber = 0;
    const regex = /Caja (\d+)$/;
    
    cajas.forEach(caja => {
      const match = caja.match(regex);
      if (match) {
        const numero = parseInt(match[1]);
        if (numero > highestNumber) {
          highestNumber = numero;
        }
      }
    });

    const nuevaCaja = `Caja ${highestNumber + 1}`;

    // Insert new caja
    await pool
      .request()
      .input('nombreCaja', sql.NVarChar, nuevaCaja)
      .query('INSERT INTO CAJAS ([Nombre caja]) VALUES (@nombreCaja)');

    await pool.close();

    return res.status(200).json({ 
      message: `Se agregó ${nuevaCaja} correctamente.`,
      nombreCaja: nuevaCaja
    });
  } catch (error) {
    console.error('Error adding caja:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al agregar la nueva caja' });
  }
}
