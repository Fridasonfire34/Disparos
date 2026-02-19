import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';

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

const colorMap: { [key: string]: string } = {
  'Red': 'FFFF0000',
  'Blue': 'FF0033CC',
  'Orange': 'FFED7D31',
  'Light Pink': 'FFFFC0C0',
  'Neon Pink': 'FFFF80FF',
  'Melon': 'FFFF8080',
  'Light Blue': 'FFBDD7EE',
  'Beige': 'FFFFE0C0',
  'White': 'FFFFFFFF',
  'Soft Pink': 'FFFF99CC',
  'Black13': 'FF0D0D0D',
  'Green142': 'FF8ED973',
  'Grey166': 'FFA6A6A6',
  'W242': 'FFF2F2F2',
  'Grey89': 'FF595959',
  'Grey217': 'FFD9D9D9',
  'Gray': 'FF808080',
  'Green78': 'FF4EA72E',
  'Grey191': 'FFBFBFBF',
  'Pink206': 'FFF2CEEF',
  'Orange169': 'FFF1A983',
  'Blue179': 'FF44B3E1',
  'Pink158': 'FFE49EDD',
  'BlackB': 'FF000000',
  'Pink109': 'FFD86DCD',
  'Grey64': 'FF404040',
  'Green211': 'FF47D359',
  'Y153': 'FFFFFF99',
  'Cyan': 'FF00FFFF',
  'PP660': 'FF6600FF',
  'Red204': 'FFCC0000',
  'PP102': 'FF660066',
  'Blue51': 'FF3333FF',
  'Pink147': 'FFD60093',
  'GreenCCC0': 'FFCCCC00',
  'Blue33CCC': 'FF33CCCC',
  'PP6699': 'FF666635',
  'BROWN': 'FF993300',
  'Teal': 'FF008080',
  'Purple160': 'FFA02B93'
};

const statusColorMap: { [key: string]: string } = {
  'RTS': 'FFFFFF00',
  'LISTO PARA ENVIAR': 'FFFFFF00',
  'ENVIADO': 'FF00B050',
  'ENVIADO PENDIENTE': 'FF00B050'
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = await poolPromise;

    // Validar configuración SMTP
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ 
        error: 'SMTP credentials not configured',
        message: 'Please set SMTP_USER and SMTP_PASS environment variables'
      });
    }

    // 1. Eliminar datos antiguos
    await pool.request().query(`DELETE FROM Cambios`);
    await pool.request().query(`DELETE FROM ENVIADOS`);

    // 2. Insertar datos actualizados (Cambios = 'OK')
    await pool.request().query(`
      INSERT INTO Cambios ([ID], [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Comentarios], [Colors], [TIPO])
      SELECT DISTINCT [ID], [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Comentarios], [Colors], [Tipo]
      FROM DISPARO
      WHERE Cambios = 'OK'
      ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, [Secuencia] ASC
    `);

    // 3. Insertar datos no ENVIADOS en Cambios
    await pool.request().query(`
      INSERT INTO Cambios ([ID], [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Comentarios], [Colors], [TIPO])
      SELECT DISTINCT [ID], [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Comentarios], [Colors], [Tipo]
      FROM DISPARO
      WHERE Estatus <> 'ENVIADO'
      ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, [Secuencia] ASC
    `);

    // 4. Insertar datos ENVIADOS en ENVIADOS tabla
    await pool.request().query(`
      INSERT INTO ENVIADOS ([ID], [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Comentarios], [Colors], [Tipo])
      SELECT DISTINCT [ID], [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Comentarios], [Colors], [Tipo]
      FROM DISPARO
      WHERE Estatus = 'ENVIADO'
        AND [Entrega] >= DATEADD(WEEK, -2, GETDATE())
      ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, [Secuencia] ASC
    `);

    // 5. Obtener datos para Excel
    const data39MActualizado = await pool.request().query(`
      SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors]
      FROM Cambios
      WHERE TIPO IS NULL
      ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, [Secuencia] ASC
    `);

    const data39MEnviado = await pool.request().query(`
      SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors]
      FROM ENVIADOS
      WHERE Tipo IS NULL
      ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, [Secuencia] ASC
    `);

    const dataViperActualizado = await pool.request().query(`
      SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors]
      FROM Cambios
      WHERE Tipo = 'Viper'
      ORDER BY Entrega ASC, [Orden Produccion] ASC, [Secuencia] ASC, [Linea] ASC
    `);

    const dataViperEnviados = await pool.request().query(`
      SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors]
      FROM ENVIADOS
      WHERE Tipo = 'Viper'
      ORDER BY Entrega ASC, [Orden Produccion] ASC, [Secuencia] ASC, [Linea] ASC
    `);

    const dataBoaActualizado = await pool.request().query(`
      SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors]
      FROM Cambios
      WHERE TIPO = 'BOA'
      ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, [Secuencia] ASC
    `);

    const dataBoaEnviados = await pool.request().query(`
      SELECT DISTINCT [Linea], [Entrega], [Secuencia], [Qty], [Orden Produccion], [Estatus], [Comentarios], [Fecha CMX], [WK], [Numero de caja enviada], [Hora de envio], [Colors]
      FROM ENVIADOS
      WHERE Tipo = 'BOA'
      ORDER BY Entrega ASC, Linea ASC, [Fecha CMX] ASC, [Secuencia] ASC
    `);

    // 6. Crear Excel
    const workbook = new ExcelJS.Workbook();

    const addWorksheet = (worksheetName: string, data: any[]) => {
      const worksheet = workbook.addWorksheet(worksheetName);
      
      const headers = ['Linea', 'Entrega', 'Secuencia', 'Qty', 'Orden Produccion', 'Estatus', 'Comentarios', 'Fecha CMX', 'WK', 'Numero de caja enviada', 'Hora de envio'];
      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC000' }
      };
      headerRow.font = { bold: true, size: 14, name: 'Arial' };
      headerRow.alignment = { horizontal: 'center', vertical: 'center' };

      data.forEach((row) => {
        const rowData = [
          row.Linea,
          row.Entrega ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(row.Entrega)) : '',
          row.Secuencia,
          row.Qty,
          row['Orden Produccion'],
          row.Estatus === 'SIN ESTATUS' ? '' : row.Estatus,
          row.Comentarios,
          row['Fecha CMX'] ? new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(row['Fecha CMX'])) : 'REVISION CON PLANEACION',
          row.WK,
          row['Numero de caja enviada'],
          row['Hora de envio'] ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(row['Hora de envio'])) : ''
        ];

        const rowObj = worksheet.addRow(rowData);
        rowObj.alignment = { horizontal: 'center', vertical: 'center' };
        rowObj.font = { bold: true, size: 12, name: 'Arial Black' };

        const statusColor = statusColorMap[row.Estatus?.toUpperCase()];
        const bgColor = colorMap[row.Colors] || (statusColor ? statusColor : 'FFFFFFFF');

        rowObj.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      worksheet.columns = [
        { width: 50 },
        { width: 35 },
        { width: 19 },
        { width: 30 },
        { width: 30 },
        { width: 45 },
        { width: 102 },
        { width: 38 },
        { width: 12 },
        { width: 26 },
        { width: 26 }
      ];

      worksheet.getRow(1).height = 50;
    };

    addWorksheet('39M ACTUALIZADO', data39MActualizado.recordset);
    addWorksheet('39M ENVIADO', data39MEnviado.recordset);
    addWorksheet('VIPER ACTUALIZADO', dataViperActualizado.recordset);
    addWorksheet('VIPER ENVIADOS', dataViperEnviados.recordset);
    addWorksheet('BOA ACTUALIZADO', dataBoaActualizado.recordset);
    addWorksheet('BOA ENVIADOS', dataBoaEnviados.recordset);

    // 7. Generar buffer Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toLocaleString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/[/:]/g, '');
    const filename = `DISPARO ${timestamp}.xlsx`;

    // 8. Obtener correos
    const emailsResult = await pool
      .request()
      .query(`SELECT [Correo] FROM [Correos Disparo] WHERE [Disparo Actualizado] = 'TRUE'`);

    const recipients = emailsResult.recordset.map((row: any) => row.Correo).filter((email: string) => email);

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients configured' });
    }

    // 9. Enviar correo
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: smtpFromEmail,
      to: recipients.join('; '),
      subject: filename,
      text: 'Team\n\nAqui les anexo Disparo Actualizado',
      attachments: [
        {
          filename: filename,
          content: buffer
        }
      ]
    });

    // 10. Reset Cambios flag
    await pool.request().query(`
      UPDATE DISPARO
      SET Cambios = NULL
      WHERE Cambios = 'OK'
    `);

    return res.status(200).json({ 
      message: 'Email sent successfully',
      recipients: recipients.length,
      filename: filename
    });
  } catch (error) {
    console.error('Error sending email and generating Excel:', error);
    return res.status(500).json({ 
      error: 'Error processing request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
