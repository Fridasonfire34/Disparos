'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './varianzas.module.css';

interface VarianzaData {
  ID: string;
  IposaVarianzaECN?: string;
  TipoCambio?: string;
  Secuencia?: string;
  PartNumber?: string;
  Componente?: string;
  Qty?: number;
  Dibujo?: string;
  StartDate?: string;
  StartDateReal?: string;
  FechaConfirmacionTMP?: string;
  Comentarios?: string;
  Estatus?: string;
}

export default function VarianzasPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [varianzas, setVarianzas] = useState<VarianzaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVarianza, setSelectedVarianza] = useState<VarianzaData | null>(null);

  // Estados para edición
  const [editIposaVarianzaECN, setEditIposaVarianzaECN] = useState('');
  const [editTipoCambio, setEditTipoCambio] = useState('');
  const [editSecuencia, setEditSecuencia] = useState('');
  const [editPartNumber, setEditPartNumber] = useState('');
  const [editComponente, setEditComponente] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editDibujo, setEditDibujo] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartDateReal, setEditStartDateReal] = useState('');
  const [editFechaConfirmacion, setEditFechaConfirmacion] = useState('');
  const [editComentarios, setEditComentarios] = useState('');
  const [editEstatus, setEditEstatus] = useState('');

  // Estados para agregar nueva varianza
  const [newVarianza, setNewVarianza] = useState('');
  const [newTipoCambio, setNewTipoCambio] = useState('');
  const [newSecuencia, setNewSecuencia] = useState('');
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newComponente, setNewComponente] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newDibujo, setNewDibujo] = useState('');
  const [newStartDate, setNewStartDate] = useState('');

  // Estados para archivo
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [varianzasComprobadas, setVarianzasComprobadas] = useState(false);
  const [varianzasEncontradas, setVarianzasEncontradas] = useState<VarianzaData[]>([]);

  // Verificar autenticación
  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
      return null;
    };

    let numeroEmpleado = getCookie('numeroEmpleado');
    if (!numeroEmpleado) numeroEmpleado = localStorage.getItem('numeroEmpleado');
    if (!numeroEmpleado) numeroEmpleado = sessionStorage.getItem('numeroEmpleado');

    if (!numeroEmpleado) {
      router.push('/');
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    fetchVarianzas();
  }, []);

  useEffect(() => {
    if (selectedVarianza) {
      setEditIposaVarianzaECN(selectedVarianza.IposaVarianzaECN || '');
      setEditTipoCambio(selectedVarianza.TipoCambio || '');
      setEditSecuencia(selectedVarianza.Secuencia || '');
      setEditPartNumber(selectedVarianza.PartNumber || '');
      setEditComponente(selectedVarianza.Componente || '');
      setEditQty(selectedVarianza.Qty?.toString() || '');
      setEditDibujo(selectedVarianza.Dibujo || '');
      setEditStartDate(formatDateForInput(selectedVarianza.StartDate));
      setEditStartDateReal(formatDateForInput(selectedVarianza.StartDateReal));
      setEditFechaConfirmacion(formatDateForInput(selectedVarianza.FechaConfirmacionTMP));
      setEditComentarios(selectedVarianza.Comentarios || '');
      setEditEstatus(selectedVarianza.Estatus || '');
    }
  }, [selectedVarianza]);

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const fetchVarianzas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/GetVarianzas');
      const data = await response.json();
      if (response.ok) {
        setVarianzas(data.varianzas || []);
      } else {
        console.error('Error fetching varianzas:', data.error);
      }
    } catch (error) {
      console.error('Error fetching varianzas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (varianza: VarianzaData) => {
    setSelectedVarianza(selectedVarianza?.ID === varianza.ID ? null : varianza);
  };

  const handleSaveChanges = async () => {
    if (!selectedVarianza) return;

    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/UpdateVarianza', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedVarianza.ID,
          iposaVarianzaECN: editIposaVarianzaECN,
          tipoCambio: editTipoCambio,
          secuencia: editSecuencia,
          partNumber: editPartNumber,
          componente: editComponente,
          qty: parseFloat(editQty) || 0,
          dibujo: editDibujo,
          startDate: editStartDate,
          startDateReal: editStartDateReal,
          fechaConfirmacionTMP: editFechaConfirmacion,
          comentarios: editComentarios,
          estatus: editEstatus
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Cambios guardados correctamente');
        fetchVarianzas();
        setSelectedVarianza(null);
      } else {
        alert('Error al guardar: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error al guardar cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVarianza = async () => {
    if (!newVarianza.trim() || !newTipoCambio.trim() || !newSecuencia.trim() || !newPartNumber.trim()) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/AddVarianza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iposaVarianzaECN: newVarianza,
          tipoCambio: newTipoCambio,
          secuencia: newSecuencia,
          partNumber: newPartNumber,
          componente: newComponente,
          qty: parseFloat(newQty) || 0,
          dibujo: newDibujo,
          startDate: newStartDate
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Varianza agregada correctamente');
        fetchVarianzas();
        // Limpiar campos
        setNewVarianza('');
        setNewTipoCambio('');
        setNewSecuencia('');
        setNewPartNumber('');
        setNewComponente('');
        setNewQty('');
        setNewDibujo('');
        setNewStartDate('');
      } else {
        alert('Error al agregar: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error adding varianza:', error);
      alert('Error al agregar varianza');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleComprobarVarianzas = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setLoading(true);
      
      // Primero: procesar el archivo CSV y llenar la tabla FIRMES
      const fileContent = await selectedFile.text();
      const uploadResponse = await fetch('/api/Disparo/ComprobarVarianzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent,
          fileName: selectedFile.name
        })
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        alert('Error: ' + (uploadData.message || 'Error desconocido'));
        return;
      }

      // Segundo: comprobar varianzas y llenar la tabla SI VARIANZAS
      const checkResponse = await fetch('/api/Disparo/ComprobarVarianzas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const checkData = await checkResponse.json();
      if (checkResponse.ok) {
        // Guardar varianzas encontradas y marcar como comprobadas
        setVarianzasEncontradas(checkData.data || []);
        setVarianzasComprobadas(true);
        alert(
          `✅ Comprobación completada\n\n` +
          `Se encontraron ${checkData.coincidentes} varianzas con coincidencias`
        );
      } else {
        alert('Error: ' + (checkData.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error al procesar archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarVarianzas = async () => {
    if (varianzasEncontradas.length === 0) {
      alert('No hay varianzas para guardar');
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Paso 1: Guardar cada varianza encontrada en BD_Varianzas
      for (const varianza of varianzasEncontradas) {
        try {
          const response = await fetch('/api/Disparo/AddVarianza', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              iposaVarianzaECN: varianza.IposaVarianzaECN || '',
              tipoCambio: varianza.TipoCambio || '',
              secuencia: varianza.Secuencia || '',
              partNumber: varianza.PartNumber || '',
              componente: varianza.Componente || '',
              qty: varianza.Qty || 0,
              dibujo: varianza.Dibujo || '',
              startDate: varianza.StartDate || new Date().toISOString().split('T')[0]
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      // Paso 2: Exportar a Excel y limpiar tablas
      const exportResponse = await fetch('/api/Disparo/ExportarVarianzas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (exportResponse.ok) {
        const exportData = await exportResponse.json();
        
        if (exportData.data && exportData.data.length > 0) {
          // Generar Excel usando formato simple
          await generarExcel(exportData.data);
        }
      }

      // Paso 3: Limpiar estado y recargar varianzas
      setVarianzasComprobadas(false);
      setVarianzasEncontradas([]);
      setSelectedFile(null);
      setFileName('');
      
      await fetchVarianzas();

      alert(`✅ Guardado completado\n\nVarianzas guardadas: ${successCount}\nErrores: ${errorCount}\n\nArchivo Excel descargado.`);
    } catch (error) {
      console.error('Error saving varianzas:', error);
      alert('Error al guardar varianzas');
    } finally {
      setLoading(false);
    }
  };

  const generarExcel = async (datos: any[]) => {
    try {
      const ExcelJS = await import('exceljs');
      const Workbook = ExcelJS.Workbook;
      
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('DISPARO');

      // Configurar encabezados
      const headers = ['Secuencia', 'Numero de Parte', 'Cantidad Requerida', 'Iposa/Varianza/ECN', 'Tipo de Cambio'];
      
      const headerRow = worksheet.addRow(headers);
      
      // Estilo del encabezado: fondo naranja, bold, tamaño 14, centrado
      headerRow.height = 20;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' } // Naranja #FFC000
        };
        cell.font = {
          bold: true,
          size: 14,
          name: 'Arial'
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
      });

      datos.forEach((row) => {
        const dataRow = worksheet.addRow([
          row.Secuencia || '',
          row['Numero de Parte'] || '',
          row['Cantidad Requerida'] || '',
          row['Iposa/Varianza/ECN'] || '',
          row['Tipo de Cambio'] || ''
        ]);

        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.font = { bold: true };
        });
      });

      worksheet.autoFilter.from = 'A1';
      worksheet.autoFilter.to = `E${worksheet.rowCount}`;

      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Generar archivo y descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Varianzas.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error al generar archivo Excel');
    }
  };

  const handleSalir = () => {
    router.push('/disparo');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Varianzas</h1>
        <button className={styles.salirButton} onClick={handleSalir}>
          Salir
        </button>
      </div>

      <div className={styles.mainContent}>
        {/* Tabla izquierda */}
        <div className={styles.leftSection}>
          <div className={styles.tableContainer}>
            {loading ? (
              <div className={styles.loadingMessage}>Cargando...</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Iposa/Varianza/ECN</th>
                    <th>Tipo de cambio</th>
                    <th>Secuencia</th>
                    <th>PartNumber</th>
                    <th>Componente</th>
                  </tr>
                </thead>
                <tbody>
                  {varianzas.map((varianza) => (
                    <tr
                      key={varianza.ID}
                      onClick={() => handleRowClick(varianza)}
                      className={selectedVarianza?.ID === varianza.ID ? styles.selectedRow : ''}
                    >
                      <td>{varianza.IposaVarianzaECN}</td>
                      <td>{varianza.TipoCambio}</td>
                      <td>{varianza.Secuencia}</td>
                      <td>{varianza.PartNumber}</td>
                      <td>{varianza.Componente}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel central - Editar */}
        <div className={styles.centerSection}>
          <h2 className={styles.sectionTitle}>Editar informacion de Varianzas</h2>
          {selectedVarianza ? (
            <div className={styles.formContainer}>
              {/* Fila 1: IPOSA/Varianza/ECN | Tipo de Cambio */}
              <div className={styles.formRow2}>
                <div className={styles.formGroup}>
                  <label>IPOSA/Varianza/ECN:</label>
                  <input
                    type="text"
                    value={editIposaVarianzaECN}
                    onChange={(e) => setEditIposaVarianzaECN(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de Cambio:</label>
                  <select
                    value={editTipoCambio}
                    onChange={(e) => setEditTipoCambio(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="ADD">ADD</option>
                    <option value="ADD & UPDATE DRAWING">ADD & UPDATE DRAWING</option>
                    <option value="UPDATE DRAWING">UPDATE DRAWING</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>

              {/* Fila 2: Secuencia | Part Number */}
              <div className={styles.formRow2}>
                <div className={styles.formGroup}>
                  <label>Secuencia:</label>
                  <input
                    type="text"
                    value={editSecuencia}
                    onChange={(e) => setEditSecuencia(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Part Number:</label>
                  <input
                    type="text"
                    value={editPartNumber}
                    onChange={(e) => setEditPartNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Fila 3: Componente | Qty | Dibujo */}
              <div className={styles.formRow3}>
                <div className={styles.formGroup}>
                  <label>Componente:</label>
                  <input
                    type="text"
                    value={editComponente}
                    onChange={(e) => setEditComponente(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Qty:</label>
                  <input
                    type="number"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Dibujo:</label>
                  <input
                    type="text"
                    value={editDibujo}
                    onChange={(e) => setEditDibujo(e.target.value)}
                  />
                </div>
              </div>

              {/* Fila 4: Start Date | Start Date Real | Fecha de Confirmacion TMP */}
              <div className={styles.formRow3}>
                <div className={styles.formGroup}>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Start Date Real:</label>
                  <input
                    type="date"
                    value={editStartDateReal}
                    onChange={(e) => setEditStartDateReal(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Fecha de Confirmacion TMP:</label>
                  <input
                    type="date"
                    value={editFechaConfirmacion}
                    onChange={(e) => setEditFechaConfirmacion(e.target.value)}
                  />
                </div>
              </div>

              {/* Fila 5: Comentarios | Estatus | Botón */}
              <div className={styles.formRowLast}>
                <div className={styles.formGroup}>
                  <label>Comentarios:</label>
                  <input
                    type="text"
                    value={editComentarios}
                    onChange={(e) => setEditComentarios(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Estatus:</label>
                  <input
                    type="text"
                    value={editEstatus}
                    onChange={(e) => setEditEstatus(e.target.value)}
                  />
                </div>

                <button 
                  className={styles.saveButton} 
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              Selecciona una varianza de la tabla
            </div>
          )}
        </div>

        {/* Panel derecho - Agregar */}
        <div className={styles.rightSection}>
          <div>
            <h2 className={styles.sectionTitle}>Agregar nuevas Varianzas</h2>
            <div className={styles.formContainer}>
              {/* Fila 1: Varianza | Tipo de Cambio */}
              <div className={styles.formRow2}>
                <div className={styles.formGroup}>
                  <label>Varianza:</label>
                  <input
                    type="text"
                    value={newVarianza}
                    onChange={(e) => setNewVarianza(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de Cambio:</label>
                  <select
                    value={newTipoCambio}
                    onChange={(e) => setNewTipoCambio(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="ADD">ADD</option>
                    <option value="ADD & UPDATE DRAWING">ADD & UPDATE DRAWING</option>
                    <option value="UPDATE DRAWING">UPDATE DRAWING</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>

              {/* Fila 2: Secuencia | PartNumber */}
              <div className={styles.formRow2}>
                <div className={styles.formGroup}>
                  <label>Secuencia:</label>
                  <input
                    type="text"
                    value={newSecuencia}
                    onChange={(e) => setNewSecuencia(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>PartNumber:</label>
                  <input
                    type="text"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Fila 3: Componente | Qty | Dibujo */}
              <div className={styles.formRow3}>
                <div className={styles.formGroup}>
                  <label>Componente:</label>
                  <input
                    type="text"
                    value={newComponente}
                    onChange={(e) => setNewComponente(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Qty:</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Dibujo:</label>
                  <input
                    type="text"
                    value={newDibujo}
                    onChange={(e) => setNewDibujo(e.target.value)}
                  />
                </div>
              </div>

              {/* Fila 4: Start Date | Botón */}
              <div className={styles.formRowLast}>
                <div className={styles.formGroup}>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>

                <div></div>

                <button 
                  className={styles.addButton} 
                  onClick={handleAddVarianza}
                  disabled={loading}
                >
                  Agregar Varianzas
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className={styles.sectionTitle}>Varianzas Encontradas</h2>
            <div className={styles.fileSection}>
              {!varianzasComprobadas ? (
                <>
                  <div className={styles.fileInputContainer}>
                    <input
                      id="fileInput"
                      type="file"
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                      accept=".csv,.xlsx,.xls"
                    />
                    <label htmlFor="fileInput" className={styles.fileInputLabel}>
                      Cargar archivo
                    </label>
                    <span className={styles.fileName}>
                      {fileName || '(Nombre del Archivo)'}
                    </span>
                  </div>
                  <button 
                    className={styles.comprobarButton} 
                    onClick={handleComprobarVarianzas}
                    disabled={loading || !selectedFile}
                  >
                    Comprobar Varianzas
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                      Se encontraron {varianzasEncontradas.length} varianzas
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className={styles.comprobarButton} 
                      onClick={handleGuardarVarianzas}
                      disabled={loading}
                      style={{ backgroundColor: '#4CAF50', flex: 1 }}
                    >
                      Guardar Varianzas
                    </button>
                    <button 
                      className={styles.comprobarButton} 
                      onClick={() => {
                        setVarianzasComprobadas(false);
                        setVarianzasEncontradas([]);
                        setSelectedFile(null);
                        setFileName('');
                      }}
                      disabled={loading}
                      style={{ backgroundColor: '#2196F3', flex: 1 }}
                    >
                      Cargar Otra
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
