import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: 'sa',
  password: 'TMPdb1124',
  server: 'HPC-050',
  database: 'Travelers',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

interface SavePayload {
  partes: string[];
  tipo: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { partes, tipo } = req.body as SavePayload;

  if (!Array.isArray(partes) || partes.length === 0 || !tipo?.trim()) {
    return res.status(400).json({ error: 'Datos invalidos' });
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(sqlConfig);

    const normalizedTipo = tipo.trim();
    const normalizedPartes = partes.map((p) => p.trim()).filter((p) => p.length > 0);

    const duplicadosMismoTipo: string[] = [];

    for (const numeroParte of normalizedPartes) {
      const existing = await pool
        .request()
        .input('numeroParte', sql.VarChar, numeroParte)
        .query('SELECT [Tipo] FROM Kanban WHERE [Numero de Parte] = @numeroParte');

      if (existing.recordset.length > 0) {
        const tipoExistente = String(existing.recordset[0].Tipo ?? '').trim();
        if (tipoExistente.toLowerCase() === normalizedTipo.toLowerCase()) {
          duplicadosMismoTipo.push(numeroParte);
          continue;
        }

        await pool
          .request()
          .input('numeroParte', sql.VarChar, numeroParte)
          .input('tipo', sql.VarChar, normalizedTipo)
          .query('UPDATE Kanban SET [Tipo] = @tipo WHERE [Numero de Parte] = @numeroParte');
        continue;
      }

      await pool
        .request()
        .input('numeroParte', sql.VarChar, numeroParte)
        .input('tipo', sql.VarChar, normalizedTipo)
        .query('INSERT INTO Kanban ([Numero de Parte], [Tipo]) VALUES (@numeroParte, @tipo)');
    }

    await pool.close();

    if (duplicadosMismoTipo.length > 0) {
      return res.status(200).json({
        message:
          'Algunos numeros de parte ya estaban registrados con el tipo seleccionado. ' +
          'Se insertaron los que no existian.',
        duplicados: duplicadosMismoTipo
      });
    }

    return res.status(200).json({ message: 'Kanban guardado correctamente.' });
  } catch (error) {
    console.error('Error saving kanban:', error);
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
    return res.status(500).json({ error: 'Error al guardar Kanban' });
  }
}
