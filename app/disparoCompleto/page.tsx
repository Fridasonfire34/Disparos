'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dcStyles from './disparoCompleto.module.css';

interface DisparoRow {
  [key: string]: any;
}

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const hiddenColumns = ['ID', 'Colors', 'Cambios', 'Tipo', 'ID_CONS', 'Tipo Viper', 'Paneles', 'Metalicas', 'ETA', 'Status Viper', 'Status BOA'];

const formatDate = (date: any, format: string) => {
  if (!date) return '';
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  if (format === 'dd MMMM h:mm tt') {
    return formatter.format(d);
  } else if (format === 'dd/MM/yyyy') {
    return d.toLocaleDateString('es-ES');
  }
  return d.toString();
};

export default function DisparoCompletoPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const monthsDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
  const [isMonthsOpen, setIsMonthsOpen] = useState(false);
  const [disparoCompletoData, setDisparoCompletoData] = useState<DisparoRow[]>([]);
  const [disparoCompletoLoading, setDisparoCompletoLoading] = useState(false);
  const [disparoCompletoSearchValue, setDisparoCompletoSearchValue] = useState('');
  const [disparoCompletoSearchMatches, setDisparoCompletoSearchMatches] = useState<number[]>([]);
  const [disparoCompletoCurrentMatchIndex, setDisparoCompletoCurrentMatchIndex] = useState(-1);

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
    const currentYear = new Date().getFullYear().toString();
    setSelectedYear(currentYear);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthsDropdownRef.current && !monthsDropdownRef.current.contains(event.target as Node)) {
        setIsMonthsOpen(false);
      }
    };

    if (isMonthsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMonthsOpen]);

  const loadDisparoCompleto = async () => {
    try {
      setDisparoCompletoLoading(true);
      const monthsArray = Array.from(selectedMonths);
      
      const response = await fetch(`/api/Disparo/GetDisparoCompleto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: parseInt(selectedYear),
          months: monthsArray
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert('Error al cargar datos: ' + result.error);
        setDisparoCompletoLoading(false);
        return;
      }

      setDisparoCompletoData(result.data || []);
      setDisparoCompletoSearchValue('');
      setDisparoCompletoSearchMatches([]);
      setDisparoCompletoCurrentMatchIndex(-1);
      setDisparoCompletoLoading(false);
    } catch (error) {
      console.error('Error loading disparo completo:', error);
      alert('Error al cargar datos');
      setDisparoCompletoLoading(false);
    }
  };

  const handleToggleMonth = (monthNum: number) => {
    const newMonths = new Set(selectedMonths);
    if (newMonths.has(monthNum)) {
      newMonths.delete(monthNum);
    } else {
      newMonths.add(monthNum);
    }
    setSelectedMonths(newMonths);
  };

  const handleDisparoCompletoSearch = () => {
    if (!disparoCompletoSearchValue.trim()) {
      setDisparoCompletoSearchMatches([]);
      setDisparoCompletoCurrentMatchIndex(-1);
      return;
    }

    const matches: number[] = [];
    const searchTerm = disparoCompletoSearchValue.toLowerCase();
    
    disparoCompletoData.forEach((row, idx) => {
      const po = row['Orden Produccion']?.toString().toLowerCase();
      if (po && po.includes(searchTerm)) {
        matches.push(idx);
      }
    });

    setDisparoCompletoSearchMatches(matches);
    setDisparoCompletoCurrentMatchIndex(matches.length > 0 ? 0 : -1);
  };

  const handleDisparoCompletoDownload = async () => {
    if (disparoCompletoData.length === 0) {
      alert('No hay datos para descargar');
      return;
    }

    try {
      const ExcelJS = await import('exceljs');
      const Workbook = ExcelJS.default.Workbook;
      const workbook = new Workbook();

      const columnsToExport = ['Linea', 'Entrega', 'Secuencia', 'Qty', 'Orden Produccion', 'Estatus', 'Fecha CMX', 'WK', 'Numero de caja enviada', 'Hora de envio', 'Comentarios'];

      const sheetConfigs = [
        { name: '39M', filter: (row: any) => !row['Tipo'] || row['Tipo'] === null },
        { name: 'VIPER', filter: (row: any) => row['Tipo'] === 'Viper' },
        { name: 'BOA', filter: (row: any) => row['Tipo'] === 'BOA' }
      ];

      const formatCellValue = (value: any, columnName: string) => {
        if (columnName === 'Entrega' && value) {
          const date = new Date(value);
          return date;
        } else if (columnName === 'Fecha CMX' && !value) {
          return 'REVISION CON PLANEACION';
        } else if (columnName === 'Fecha CMX' && value) {
          return new Date(value);
        } else if (columnName === 'Hora de envio' && value) {
          return new Date(value);
        } else if (columnName === 'Orden Produccion' && value) {
          return value.toString().replace(/^0+/, '');
        }
        return value;
      };

      const getStatusColor = (estatus: string | null | undefined): string => {
        if (!estatus) return 'FFFFFFFF';
        
        const estatusUpper = estatus.toString().trim().toUpperCase();
        
        switch (estatusUpper) {
          case 'RTS':
          case 'LISTO PARA ENVIAR':
            return 'FFFFFF00'; // Amarillo
          case 'ENVIADO':
          case 'ENVIADO PENDIENTE':
            return 'FF00B050'; // Verde
          default:
            return 'FFFFFFFF'; // Blanco
        }
      };

      for (const config of sheetConfigs) {
        const filteredData = disparoCompletoData.filter(config.filter);
        
        if (filteredData.length > 0) {
          const worksheet = workbook.addWorksheet(config.name);

          const headerRow = worksheet.addRow(columnsToExport);
          
          headerRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC000' } // RGB(255, 192, 0)
            };
            cell.font = {
              bold: true,
              size: 14,
              name: 'Arial'
            };
            cell.alignment = {
              horizontal: 'center' as const,
              vertical: 'middle' as const,
              wrapText: true
            };
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
          });

          filteredData.forEach((row) => {
            const rowData = columnsToExport.map(col => formatCellValue(row[col], col));
            const newRow = worksheet.addRow(rowData);

            newRow.eachCell((cell, colNum) => {
              const columnName = columnsToExport[colNum - 1];
              
              if (columnName === 'Entrega' && cell.value) {
                cell.numFmt = 'dd mmmm h:mm AM/PM';
              } else if (columnName === 'Fecha CMX' && cell.value && cell.value !== 'REVISION CON PLANEACION') {
                cell.numFmt = 'dd/MM/yyyy';
              } else if (columnName === 'Hora de envio' && cell.value) {
                cell.numFmt = 'dd/MM/yyyy HH:mm';
              }

              const statusColor = getStatusColor(row['Estatus']);
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: statusColor }
              };

              cell.font = {
                bold: true,
                size: 12,
                name: 'Arial Black'
              };
              cell.alignment = {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true
              };
              cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
          });

          (worksheet.autoFilter as any) = `A1:K${filteredData.length + 1}`;

          const columnWidths = [50, 35, 19, 30, 30, 45, 38, 12, 26, 26, 102];
          worksheet.columns.forEach((col, idx) => {
            col.width = columnWidths[idx] || 20;
          });

          worksheet.getRow(1).height = 50;
        }
      }

      const now = new Date();
      const timestamp = now.toLocaleString('es-ES', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/[\/\s:]/g, '');
      
      const fileName = `DISPARO ${timestamp}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Archivo descargado exitosamente');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar archivo');
    }
  };

  return (
    <div className={dcStyles.container}>
      <div className={dcStyles.header}>
        <h1>Disparo Completo</h1>
        <button 
          onClick={() => {
            if (window.opener) {
              window.close();
            } else {
              router.back();
            }
          }}
          className={dcStyles.backButton}
        >
          ← Volver
        </button>
      </div>

      {/* Filtros */}
      <div className={dcStyles.filtersSection}>
        <div className={dcStyles.filtersGrid}>
          {/* Año */}
          <div className={dcStyles.filterGroup}>
            <label className={dcStyles.filterLabel}>Año:</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={dcStyles.filterSelect}
            >
              <option value="">Selecciona...</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
            </select>
          </div>

          {/* Meses */}
          <div className={dcStyles.filterGroup}>
            <label className={dcStyles.filterLabel} style={{ fontSize: '11px' }}>Meses</label>
            <div className={dcStyles.monthsDropdown} ref={monthsDropdownRef}>
              <button
                className={`${dcStyles.monthsDropdownButton} ${isMonthsOpen ? dcStyles.open : ''}`}
                onClick={() => setIsMonthsOpen(!isMonthsOpen)}
                type="button"
              >
                <span>Meses</span>
                <span className={`${dcStyles.monthsDropdownArrow} ${isMonthsOpen ? dcStyles.open : ''}`}>▼</span>
              </button>
              {isMonthsOpen && (
                <div className={dcStyles.monthsContainer}>
                  {months.map((month, idx) => (
                    <label key={idx} className={dcStyles.monthItem}>
                      <input 
                        type="checkbox"
                        checked={selectedMonths.has(idx + 1)}
                        onChange={() => handleToggleMonth(idx + 1)}
                      />
                      {month}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botón Buscar */}
          <button 
            onClick={loadDisparoCompleto}
            disabled={!selectedYear}
            className={dcStyles.searchButton}
            title="Cargar datos para el año y meses seleccionados"
          >
            🔍 Buscar
          </button>

          {/* Input Buscar PO */}
          <input 
            type="text"
            value={disparoCompletoSearchValue}
            onChange={(e) => setDisparoCompletoSearchValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleDisparoCompletoSearch();
            }}
            placeholder="Buscar PO..."
            className={dcStyles.searchInput}
            title="Presiona Enter para buscar"
          />

          {/* Botón Descargar */}
          <button 
            onClick={handleDisparoCompletoDownload}
            disabled={disparoCompletoData.length === 0}
            className={dcStyles.downloadButton}
            title="Descargar datos en Excel"
          >
            ⬇️ Descargar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className={dcStyles.tableContainer}>
        {disparoCompletoSearchMatches.length > 0 && (
          <div className={dcStyles.searchIndicator}>
            <span>🔍 {disparoCompletoSearchMatches.length} coincidencia{disparoCompletoSearchMatches.length !== 1 ? 's' : ''} encontrada{disparoCompletoSearchMatches.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {disparoCompletoLoading ? (
          <div className={dcStyles.loadingMessage}>
            <p>⏳ Cargando datos...</p>
          </div>
        ) : (
          <>
            {disparoCompletoData.length === 0 ? (
              <p className={dcStyles.emptyMessage}>No hay datos para mostrar</p>
            ) : (
              <table className={dcStyles.table}>
                <thead className={dcStyles.tableHead}>
                  <tr>
                    {Object.keys(disparoCompletoData[0]).filter(col => !hiddenColumns.includes(col)).map(col => (
                      <th key={col} className={dcStyles.tableHeader}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={dcStyles.tableBody}>
                  {(disparoCompletoSearchMatches.length > 0 
                    ? disparoCompletoData.filter((_, idx) => disparoCompletoSearchMatches.includes(idx))
                    : disparoCompletoData
                  ).map((row, displayIdx, filteredData) => {
                    const actualIdx = disparoCompletoData.indexOf(row);
                    const isCurrentMatch = actualIdx === disparoCompletoSearchMatches[disparoCompletoCurrentMatchIndex];
                    
                    const rowClass = isCurrentMatch 
                      ? dcStyles.currentMatchRow 
                      : disparoCompletoSearchMatches.length > 0
                      ? dcStyles.matchRow 
                      : dcStyles.tableRow;
                    
                    return (
                      <tr 
                        key={actualIdx}
                        className={rowClass}
                      >
                        {Object.keys(row).filter(col => !hiddenColumns.includes(col)).map(col => (
                          <td key={col} className={dcStyles.tableCell}>
                            {col === 'Entrega' && row[col] ? formatDate(row[col], 'dd MMMM h:mm tt') : col === 'Fecha CMX' && row[col] ? formatDate(row[col], 'dd/MM/yyyy') : row[col]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
