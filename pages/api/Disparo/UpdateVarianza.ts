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

interface UpdateVarianzaRequest {
  id: string;
  iposaVarianzaECN: string;
  tipoCambio: string;
  secuencia: string;
  partNumber: string;
  componente: string;
  qty: number;
  dibujo: string;
  startDate: string;
  startDateReal: string;
  fechaConfirmacionTMP: string;
  comentarios: string;
  estatus: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      id,
      iposaVarianzaECN,
      tipoCambio,
      secuencia,
      partNumber,
      componente,
      qty,
      dibujo,
      startDate,
      startDateReal,
      fechaConfirmacionTMP,
      comentarios,
      estatus,
    } = req.body as UpdateVarianzaRequest;

    // Validation
    if (!id) {
      return res.status(400).json({ message: 'ID es requerido' });
    }

    if (!iposaVarianzaECN || !tipoCambio || !secuencia || !partNumber) {
      return res.status(400).json({ 
        message: 'IposaVarianzaECN, TipoCambio, Secuencia y PartNumber son requeridos' 
      });
    }

    const pool = await poolPromise;

    // Generar Codigo como: Secuencia-PartNumber-Qty
    const qtyValue = qty || 0;
    const codigo = `${secuencia}-${partNumber}-${qtyValue}`;

    // Update varianza
    const request = pool.request();

    request.input('ID', sql.NVarChar(50), id);
    request.input('IposaVarianzaECN', sql.NVarChar(100), iposaVarianzaECN);
    request.input('TipoCambio', sql.NVarChar(50), tipoCambio);
    request.input('Secuencia', sql.NVarChar(50), secuencia);
    request.input('PartNumber', sql.NVarChar(50), partNumber);
    request.input('Componente', sql.NVarChar(100), componente || '');
    request.input('Qty', sql.Float, qtyValue);
    request.input('Dibujo', sql.NVarChar(100), dibujo || '');
    request.input('StartDate', sql.DateTime, startDate ? new Date(startDate) : null);
    request.input('StartDateReal', sql.DateTime, startDateReal ? new Date(startDateReal) : null);
    request.input('FechaConfirmacionTMP', sql.DateTime, fechaConfirmacionTMP ? new Date(fechaConfirmacionTMP) : null);
    request.input('Comentarios', sql.NVarChar(sql.MAX), comentarios || '');
    request.input('Estatus', sql.NVarChar(50), estatus || '');
    request.input('Codigo', sql.NVarChar(200), codigo);

    await request.query(`
      UPDATE [BD_Varianzas]
      SET 
        [Iposa/Varianza/ECN] = @IposaVarianzaECN,
        [Tipo de Cambio] = @TipoCambio,
        [Secuencia] = @Secuencia,
        [PartNumber] = @PartNumber,
        [Componente] = @Componente,
        [Qty] = @Qty,
        [Dibujo] = @Dibujo,
        [Start Date] = @StartDate,
        [Start Date Real] = @StartDateReal,
        [Estatus] = @Estatus,
        [Fecha de Confirmacion TMP] = @FechaConfirmacionTMP,
        [Comentarios] = @Comentarios,
        [Codigo] = @Codigo
      WHERE [ID] = @ID
    `);

    return res.status(200).json({ message: 'Varianza actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error updating varianza:', error);
    return res.status(500).json({ 
      message: 'Error al actualizar varianza', 
      error: error.message 
    });
  }
}
