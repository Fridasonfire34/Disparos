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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rows = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    for (const row of rows) {
      if (!row.ID) {
        console.warn('Row without ID, skipping:', row);
        continue;
      }

      const updateQuery = `
        UPDATE DISPARO 
        SET 
          Comentarios = @Comentarios,
          CheckboxColumn_BOA = @CheckboxColumn_BOA,
          Prioridad = @Prioridad
        WHERE ID = @ID
      `;

      const request = pool.request();
      request.input('ID', sql.NVarChar, row.ID);
      request.input('Comentarios', sql.NVarChar, row.Comentarios || null);
      request.input('CheckboxColumn_BOA', sql.Bit, row.CheckboxColumn_BOA ? 1 : 0);
      request.input('Prioridad', sql.NVarChar, row.Prioridad || null);

      await request.query(updateQuery);
    }

    await pool.close();
    res.status(200).json({ message: 'Changes saved successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to save changes' });
  }
}
