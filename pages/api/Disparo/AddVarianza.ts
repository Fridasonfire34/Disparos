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

interface AddVarianzaRequest {
  iposaVarianzaECN: string;
  tipoCambio: string;
  secuencia: string;
  partNumber: string;
  componente?: string;
  qty?: number;
  dibujo?: string;
  startDate?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      iposaVarianzaECN,
      tipoCambio,
      secuencia,
      partNumber,
      componente,
      qty,
      dibujo,
      startDate,
    } = req.body as AddVarianzaRequest;

    if (!iposaVarianzaECN || !tipoCambio || !secuencia || !partNumber) {
      return res.status(400).json({ 
        message: 'IposaVarianzaECN, TipoCambio, Secuencia y PartNumber son requeridos' 
      });
    }

    const pool = await poolPromise;

    const qtyValue = qty || 0;
    const codigo = `${secuencia}-${partNumber}-${qtyValue}`;

    const request = pool.request();

    request.input('IposaVarianzaECN', sql.NVarChar(100), iposaVarianzaECN);
    request.input('TipoCambio', sql.NVarChar(50), tipoCambio);
    request.input('Secuencia', sql.NVarChar(50), secuencia);
    request.input('PartNumber', sql.NVarChar(50), partNumber);
    request.input('Componente', sql.NVarChar(100), componente || '');
    request.input('Qty', sql.Float, qtyValue);
    request.input('Dibujo', sql.NVarChar(100), dibujo || '');
    request.input('StartDate', sql.DateTime, startDate ? new Date(startDate) : null);
    request.input('Codigo', sql.NVarChar(200), codigo);

    await request.query(`
      INSERT INTO [BD_Varianzas] (
        [ID],
        [Iposa/Varianza/ECN],
        [Tipo de Cambio],
        [Secuencia],
        [PartNumber],
        [Componente],
        [Qty],
        [Dibujo],
        [Start Date],
        [Codigo]
      )
      VALUES (
        NEWID(),
        @IposaVarianzaECN,
        @TipoCambio,
        @Secuencia,
        @PartNumber,
        @Componente,
        @Qty,
        @Dibujo,
        @StartDate,
        @Codigo
      )
    `);

    return res.status(201).json({ 
      message: 'Varianza agregada exitosamente'
    });
  } catch (error: any) {
    console.error('Error adding varianza:', error);
    return res.status(500).json({ 
      message: 'Error al agregar varianza', 
      error: error.message 
    });
  }
}
