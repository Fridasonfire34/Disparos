import type { NextApiRequest, NextApiResponse } from 'next';
import { ConnectionPool } from 'mssql';
import sql from 'mssql';

const poolPromise = new ConnectionPool({
  server: 'HPC-050',
  database: 'TMP',
  user: 'sa',
  password: 'TMPdb1124',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableKeepAlive: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
}).connect();

interface VarianzaData {
  ID: string;
  IposaVarianzaECN: string;
  TipoCambio: string;
  Secuencia: string;
  PartNumber: string;
  Componente: string;
  Qty: number;
  Dibujo: string;
  StartDate: string;
  StartDateReal: string;
  FechaConfirmacionTMP: string;
  Comentarios: string;
  Estatus: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request().query<VarianzaData>(`
     SELECT
     [ID], 
     [Iposa/Varianza/ECN] AS IposaVarianzaECN, 
     [Tipo de cambio] AS TipoCambio, 
     [Secuencia] AS Secuencia, 
     [PartNumber], 
     [Componente], 
     [Qty], 
     [Dibujo], 
     [Start date] AS StartDate, 
     [Start Date Real] AS StartDateReal, 
     [Estatus] AS Estatus, 
     [Fecha de Confirmacion TMP] AS FechaConfirmacionTMP, 
     [Comentarios] 
     FROM [BD_Varianzas]
    `);

    return res.status(200).json({ varianzas: result.recordset });
  } catch (error: any) {
    console.error('Error fetching varianzas:', error);
    return res.status(500).json({ 
      message: 'Error al obtener varianzas', 
      error: error.message 
    });
  }
}
