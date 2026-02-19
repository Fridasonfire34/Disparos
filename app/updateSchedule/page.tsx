'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from './updateSchedule.module.css';

interface ScheduleData {
  ID: string;
  Linea: string;
  Semana: string;
  WO: string;
  FechaProduccion: string;
  Ano: string;
}

export default function UpdateSchedulePage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [filteredData, setFilteredData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchWO, setSearchWO] = useState('');
  const [selectedRow, setSelectedRow] = useState<ScheduleData | null>(null);

  const [filterLinea, setFilterLinea] = useState('');
  const [filterSemana, setFilterSemana] = useState('');
  const [filterWO, setFilterWO] = useState('');
  const [filterAno, setFilterAno] = useState('');
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  
  const [editLinea, setEditLinea] = useState('');
  const [editOrdenProduccion, setEditOrdenProduccion] = useState('');
  const [editSemana, setEditSemana] = useState('');
  const [editFechaProduccion, setEditFechaProduccion] = useState('');
  const [editID, setEditID] = useState('');

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [semanaActual, setSemanaActual] = useState('');

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
    fetchScheduleData();
    fetchSemanaActual();
  }, []);

  useEffect(() => {
    if (selectedRow) {
      setEditID(selectedRow.ID);
      setEditLinea(selectedRow.Linea);
      setEditOrdenProduccion(selectedRow.WO);
      setEditSemana(selectedRow.Semana);
      setEditFechaProduccion(formatFechaProduccion(selectedRow.FechaProduccion));
    } else {
      setEditID('');
      setEditLinea('');
      setEditOrdenProduccion('');
      setEditSemana('');
      setEditFechaProduccion('');
    }
  }, [selectedRow]);

  useEffect(() => {
    const filtered = scheduleData.filter(item =>
      (!filterLinea || item.Linea === filterLinea) &&
      (!filterSemana || item.Semana === filterSemana) &&
      (!filterWO || item.WO === filterWO) &&
      (!filterAno || item.Ano === filterAno) &&
      (!searchWO || item.WO.includes(searchWO.trim()))
    );
    setFilteredData(filtered);
  }, [scheduleData, filterLinea, filterSemana, filterWO, filterAno, searchWO]);

  useEffect(() => {
    if (!activeFilterColumn) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setActiveFilterColumn(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeFilterColumn]);

  const formatFechaProduccion = (value: string) => {
    if (!value) {
      return '';
    }

    const normalized = value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAnoFromFecha = (value: string) => {
    if (!value) {
      return '';
    }

    const normalized = value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.getFullYear().toString();
  };

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/GetScheduleProduction');
      if (response.ok) {
        const data = await response.json();
        const scheduleList: ScheduleData[] = data.data.map((item: any) => {
          const fechaProduccion = item.FechaProduccion || item['Fecha Produccion CMX'] || item.FechaProduccionCMX || item.Fecha_Produccion_CMX || '';
          const anoValue = item.Año ?? item.Ano ?? item['AÑO'] ?? item['ANO'];

          return {
            ID: item.ID?.toString() || item.Id?.toString() || '',
            Linea: item.Linea || item.LINEA || '',
            Semana: item.Semana || item.SEMANA || '',
            WO: item.WO || item.WorkOrder || '',
            FechaProduccion: fechaProduccion,
            Ano: (anoValue !== undefined && anoValue !== null && anoValue !== '')
              ? anoValue.toString()
              : getAnoFromFecha(fechaProduccion)
          };
        });
        setScheduleData(scheduleList);
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchWO = (value: string) => {
    setSearchWO(value);
    if (!value.trim()) {
      setSelectedRow(null);
      return;
    }
    // Buscar todos los registros que contengan el valor
    const found = scheduleData.filter(item => item.WO.includes(value.trim()));
    if (found.length > 0) {
      // Seleccionar el primero si hay múltiples coincidencias
      setSelectedRow(found[0]);
    } else {
      setSelectedRow(null);
    }
  };

  const handleRowClick = (row: ScheduleData) => {
    setSelectedRow(selectedRow?.ID === row.ID ? null : row);
  };

  const handleDeleteSemana = async () => {
    if (!filterSemana || !filterAno) {
      alert('Por favor selecciona una Semana y un Año');
      return;
    }

    const confirmResult = window.confirm(
      `¿Estás seguro de que deseas eliminar esta semana?`
    );

    if (!confirmResult) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/DeleteScheduleProduction', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semana: filterSemana,
          ano: filterAno
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.rowsAffected1 > 0 || data.rowsAffected2 > 0) {
          alert('Semana eliminada exitosamente.');
          fetchScheduleData();
          fetchSemanaActual();
          setFilterSemana('');
          setFilterAno('');
        } else {
          alert('No se encontró la semana a eliminar en ninguna tabla.');
        }
      } else {
        alert('Error al eliminar la semana: ' + (data.details || data.error));
      }
    } catch (error) {
      console.error('Error deleting semana:', error);
      alert('Error al eliminar la semana: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) {
      return '';
    }

    const normalized = dateString.includes(' ') && !dateString.includes('T') 
      ? dateString.replace(' ', 'T') 
      : dateString;
    const parsed = new Date(normalized);
    
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(parsed);
  };

  const fetchSemanaActual = async () => {
    try {
      const response = await fetch('/api/Disparo/GetSemanaActual');
      const data = await response.json();
      if (response.ok && data.semana) {
        setSemanaActual(data.semana);
      } else {
        setSemanaActual('No disponible');
      }
    } catch (error) {
      console.error('Error fetching semana actual:', error);
      setSemanaActual('Error');
    }
  };

  const handleRegresar = () => {
    router.push('/disparo');
  };

  const parseDateToSqlFormat = (dateString: string): Date | null => {
    if (!dateString) return null;

    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      const dateObj = new Date(`${year}-${month}-${day}`);
      if (!isNaN(dateObj.getTime())) {
        return dateObj;
      }
    }

    const normalized = dateString.includes(' ') && !dateString.includes('T')
      ? dateString.replace(' ', 'T')
      : dateString;
    const dateObj = new Date(normalized);
    if (!isNaN(dateObj.getTime())) {
      return dateObj;
    }

    return null;
  };

  const handleSaveChanges = async () => {
    if (!editLinea.trim() || !editSemana.trim() || !editOrdenProduccion.trim() || !editFechaProduccion.trim()) {
      alert('Por favor, no dejes ningún campo vacío');
      return;
    }

    const fechaProduccion = parseDateToSqlFormat(editFechaProduccion);
    if (!fechaProduccion) {
      alert('La fecha ingresada no es válida. Por favor, ingrese una fecha en formato MM/dd/yyyy.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/UpdateScheduleProduction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editID,
          linea: editLinea.trim(),
          semana: editSemana.trim(),
          wo: editOrdenProduccion.trim(),
          fechaProduccionCMX: fechaProduccion.toISOString()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Los datos se actualizaron correctamente');
        fetchScheduleData();
        fetchSemanaActual();
        setSelectedRow(null);
      } else {
        alert('Error al actualizar: ' + (data.details || data.error));
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error al guardar los cambios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!editID) {
      alert('Por favor, selecciona una secuencia para eliminar');
      return;
    }

    const confirmResult = window.confirm('¿Estás seguro de que deseas eliminar la secuencia?');
    if (!confirmResult) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/DeleteScheduleRecord', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editID })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.rowsAffected > 0) {
          alert('Secuencia eliminada exitosamente');
          fetchScheduleData();
          fetchSemanaActual();
          setSelectedRow(null);
        } else {
          alert('No se encontró la secuencia a eliminar');
        }
      } else {
        alert('Error al eliminar la secuencia: ' + (data.details || data.error));
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar la secuencia: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdateModal = () => {
    setShowUpdateModal(true);
    setImportFileName('');
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setImportFileName('');
    setImportFile(null);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFileName(file.name);
      setImportFile(file);
    }
  };

  const handleUpdateScheduleProduction = async () => {
    if (!importFile) {
      alert('Por favor, selecciona un archivo');
      return;
    }

    try {
      setLoading(true);
      
      const fileContent = await importFile.text();

      const response = await fetch('/api/Disparo/ImportScheduleProduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: fileContent,
          fileName: importFile.name
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchScheduleData();
        fetchSemanaActual();
        handleCloseUpdateModal();
      } else {
        alert('Error al importar archivo: ' + (data.details || data.error));
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error al importar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };


  const lineaOptions = Array.from(
    new Set(scheduleData.map(item => item.Linea).filter(Boolean))
  ).sort();

  const semanaOptions = Array.from(
    new Set(scheduleData.map(item => item.Semana).filter(Boolean))
  ).sort();

  const woOptions = Array.from(
    new Set(scheduleData.map(item => item.WO).filter(Boolean))
  ).sort();

  const anoOptions = Array.from(
    new Set(scheduleData.map(item => item.Ano).filter(Boolean))
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const getFilteredOptions = (column: string) => {
    const dataToFilter = scheduleData.filter(item => {
      if (column !== 'Linea' && filterLinea && item.Linea !== filterLinea) return false;
      if (column !== 'Semana' && filterSemana && item.Semana !== filterSemana) return false;
      if (column !== 'WO' && filterWO && item.WO !== filterWO) return false;
      if (column !== 'Ano' && filterAno && item.Ano !== filterAno) return false;
      return true;
    });

    if (column === 'Linea') {
      return Array.from(new Set(dataToFilter.map(item => item.Linea).filter(Boolean))).sort();
    } else if (column === 'Semana') {
      return Array.from(new Set(dataToFilter.map(item => item.Semana).filter(Boolean))).sort();
    } else if (column === 'WO') {
      return Array.from(new Set(dataToFilter.map(item => item.WO).filter(Boolean))).sort();
    } else if (column === 'Ano') {
      return Array.from(new Set(dataToFilter.map(item => item.Ano).filter(Boolean))).sort((a, b) => parseInt(b) - parseInt(a));
    }
    return [];
  };

  const dynamicLineaOptions = getFilteredOptions('Linea');
  const dynamicSemanaOptions = getFilteredOptions('Semana');
  const dynamicWOOptions = getFilteredOptions('WO');
  const dynamicAnoOptions = getFilteredOptions('Ano');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Schedule Production</h1>
        <div className={styles.semanaActualLabel}>
          <span>Semana Actual:</span>
          <span className={styles.semanaValue}>{semanaActual}</span>
        </div>
        <button className={styles.updateButton} onClick={handleOpenUpdateModal}>
          Update Schedule Production
        </button>
        <button onClick={handleRegresar} className={styles.regresarButton}>
          Regresar
        </button>
      </div>

      <div className={styles.mainContent}>
        {/* Lado Izquierdo */}
        <div className={styles.leftSection}>
          <div className={styles.optionsTitle}>Opciones</div>

          <div className={styles.searchAndDeleteRow}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="searchWO">Buscar WO:</label>
              <input
                id="searchWO"
                type="text"
                value={searchWO}
                onChange={(e) => handleSearchWO(e.target.value)}
                placeholder="Ingresa el WO"
                className={styles.searchInput}
              />
            </div>
            <button
              className={styles.deleteButton}
              onClick={handleDeleteSemana}
              disabled={!filterSemana || !filterAno}
              title={!filterSemana || !filterAno ? 'Selecciona una Semana y Año' : 'Eliminar semana'}
            >
              🗑️ Borrar semana
            </button>
          </div>

          <div className={styles.tableContainer}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>
            ) : (
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeader}>
                      <div className={styles.headerContent}>
                        <span>Linea</span>
                        <div
                          className={styles.filterButtonContainer}
                          ref={activeFilterColumn === 'Linea' ? filterDropdownRef : null}
                        >
                          <button
                            className={`${styles.filterButton} ${activeFilterColumn === 'Linea' ? styles.active : ''}`}
                            onClick={() => setActiveFilterColumn(activeFilterColumn === 'Linea' ? null : 'Linea')}
                            title="Filtrar por Linea"
                          >
                            ▼
                          </button>
                          {activeFilterColumn === 'Linea' && (
                            <div className={styles.filterDropdown}>
                              <select
                                value={filterLinea}
                                onChange={(e) => setFilterLinea(e.target.value)}
                                className={styles.filterDropdownSelect}
                              >
                                <option value="">Todas</option>
                                {dynamicLineaOptions.map((value, index) => (
                                  <option key={`${value}-${index}`} value={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                    <th className={styles.tableHeader}>
                      <div className={styles.headerContent}>
                        <span>Semana</span>
                        <div
                          className={styles.filterButtonContainer}
                          ref={activeFilterColumn === 'Semana' ? filterDropdownRef : null}
                        >
                          <button
                            className={`${styles.filterButton} ${activeFilterColumn === 'Semana' ? styles.active : ''}`}
                            onClick={() => setActiveFilterColumn(activeFilterColumn === 'Semana' ? null : 'Semana')}
                            title="Filtrar por Semana"
                          >
                            ▼
                          </button>
                          {activeFilterColumn === 'Semana' && (
                            <div className={styles.filterDropdown}>
                              <select
                                value={filterSemana}
                                onChange={(e) => setFilterSemana(e.target.value)}
                                className={styles.filterDropdownSelect}
                              >
                                <option value="">Todas</option>
                                {dynamicSemanaOptions.map((value, index) => (
                                  <option key={`${value}-${index}`} value={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                    <th className={styles.tableHeader}>
                      <div className={styles.headerContent}>
                        <span>WO</span>
                        <div
                          className={styles.filterButtonContainer}
                          ref={activeFilterColumn === 'WO' ? filterDropdownRef : null}
                        >
                          <button
                            className={`${styles.filterButton} ${activeFilterColumn === 'WO' ? styles.active : ''}`}
                            onClick={() => setActiveFilterColumn(activeFilterColumn === 'WO' ? null : 'WO')}
                            title="Filtrar por WO"
                          >
                            ▼
                          </button>
                          {activeFilterColumn === 'WO' && (
                            <div className={styles.filterDropdown}>
                              <select
                                value={filterWO}
                                onChange={(e) => setFilterWO(e.target.value)}
                                className={styles.filterDropdownSelect}
                              >
                                <option value="">Todos</option>
                                {dynamicWOOptions.map((value, index) => (
                                  <option key={`${value}-${index}`} value={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                    <th className={styles.tableHeader}>Fecha Produccion CMX</th>
                    <th className={styles.tableHeader}>
                      <div className={styles.headerContent}>
                        <span>Año</span>
                        <div
                          className={styles.filterButtonContainer}
                          ref={activeFilterColumn === 'Ano' ? filterDropdownRef : null}
                        >
                          <button
                            className={`${styles.filterButton} ${activeFilterColumn === 'Ano' ? styles.active : ''}`}
                            onClick={() => setActiveFilterColumn(activeFilterColumn === 'Ano' ? null : 'Ano')}
                            title="Filtrar por Año"
                          >
                            ▼
                          </button>
                          {activeFilterColumn === 'Ano' && (
                            <div className={styles.filterDropdown}>
                              <select
                                value={filterAno}
                                onChange={(e) => setFilterAno(e.target.value)}
                                className={styles.filterDropdownSelect}
                              >
                                <option value="">Todos</option>
                                {dynamicAnoOptions.map((value, index) => (
                                  <option key={`${value}-${index}`} value={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(row => (
                    <tr
                      key={row.ID}
                      onClick={() => handleRowClick(row)}
                      className={selectedRow?.ID === row.ID ? styles.selected : ''}
                    >
                      <td>{row.Linea}</td>
                      <td>{row.Semana}</td>
                      <td>{row.WO}</td>
                      <td>{formatFechaProduccion(row.FechaProduccion)}</td>
                      <td>{row.Ano}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Lado Derecho */}
        <div className={styles.rightSection}>
          <div className={styles.editTitle}>Editar información de secuencia:</div>

          {selectedRow ? (
            <>
              <div className={styles.editFormGroup}>
                <label>Línea:</label>
                <input
                  type="text"
                  value={editLinea}
                  onChange={(e) => setEditLinea(e.target.value)}
                  placeholder="Ej: LRTN"
                />
              </div>

              <div className={styles.editFormGroup}>
                <label>Orden de Producción:</label>
                <input
                  type="text"
                  value={editOrdenProduccion}
                  onChange={(e) => setEditOrdenProduccion(e.target.value)}
                  placeholder="Número de WO"
                />
              </div>

              <div className={styles.editFormGroup}>
                <label>Semana:</label>
                <input
                  type="text"
                  value={editSemana}
                  onChange={(e) => setEditSemana(e.target.value)}
                  placeholder="Ej: WK 01 FS"
                />
              </div>

              <div className={styles.editFormGroup}>
                <label>Fecha Producción CMX:</label>
                <input
                  type="text"
                  value={editFechaProduccion}
                  onChange={(e) => setEditFechaProduccion(e.target.value)}
                  placeholder="MM/dd/yyyy"
                />
              </div>

              <div className={styles.dateDisplay}>
                {formatDateDisplay(editFechaProduccion)}
              </div>

              <div className={styles.buttonRow}>
                <button className={styles.editButtonLarge} onClick={handleSaveChanges} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button className={styles.deleteButtonLarge} onClick={handleDeleteRecord} disabled={loading}>
                  {loading ? 'Eliminando...' : '🗑️ Borrar secuencia'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
              Selecciona una fila de la tabla o busca por WO
            </div>
          )}
        </div>
      </div>

      {/* Modal Update Schedule Production */}
      {showUpdateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Cargar nueva semana:</h2>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalFormGroup}>
                <label htmlFor="importFile">Importar archivo</label>
                <div className={styles.fileInputContainer}>
                  <input
                    id="importFile"
                    type="file"
                    onChange={handleImportFile}
                    className={styles.fileInput}
                    accept=".xlsx,.xls,.csv"
                  />
                  <span className={styles.fileName}>
                    {importFileName || '(Nombre del archivo)'}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButtonCancel}
                onClick={handleCloseUpdateModal}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={styles.modalButtonAccept}
                onClick={handleUpdateScheduleProduction}
                disabled={!importFile || loading}
              >
                {loading ? 'Procesando...' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

