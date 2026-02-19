'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import cdStyles from './controlDisparos.module.css';

interface ControlDisparo {
  [key: string]: any;
}

interface ColumnFilter {
  [column: string]: Set<string>;
}

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

export default function ControlDisparosPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [controlDisparosData, setControlDisparosData] = useState<ControlDisparo[]>([]);
  const [controlDisparosLoading, setControlDisparosLoading] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

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

  // Cargar datos al montar el componente
  useEffect(() => {
    loadControlDisparos();
  }, []);

  // Detectar click fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setActiveFilterColumn(null);
      }
    };

    if (activeFilterColumn) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeFilterColumn]);

  const loadControlDisparos = async (viewAll: boolean = false) => {
    try {
      setControlDisparosLoading(true);
      const response = await fetch(`/api/Disparo/GetControlDisparos?showAll=${viewAll}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert('Error al cargar datos: ' + result.error);
        setControlDisparosLoading(false);
        return;
      }

      setControlDisparosData(result.data || []);
      setColumnFilters({});
      setShowAll(viewAll);
      setControlDisparosLoading(false);
    } catch (error) {
      console.error('Error loading control disparos:', error);
      alert('Error al cargar datos');
      setControlDisparosLoading(false);
    }
  };

  const getUniqueValues = (column: string): string[] => {
    const values = new Set<string>();
    controlDisparosData.forEach(row => {
      const value = row[column];
      if (value !== null && value !== undefined) {
        if (column === 'Hora' && value) {
          const formattedDate = new Date(value);
          const formatted = formattedDate.toLocaleString('es-ES', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          values.add(formatted);
        } else {
          values.add(value.toString());
        }
      }
    });
    return Array.from(values).sort();
  };

  const handleFilterChange = (column: string, value: string, checked: boolean) => {
    const newFilters = { ...columnFilters };
    if (!newFilters[column]) {
      newFilters[column] = new Set();
    }

    if (checked) {
      newFilters[column].add(value);
    } else {
      newFilters[column].delete(value);
    }

    if (newFilters[column].size === 0) {
      delete newFilters[column];
    }

    setColumnFilters(newFilters);
  };

  const getFilteredData = () => {
    if (Object.keys(columnFilters).length === 0) {
      return controlDisparosData;
    }

    return controlDisparosData.filter(row => {
      for (const [column, values] of Object.entries(columnFilters)) {
        let rowValue: string;
        
        if (column === 'Hora' && row[column]) {
          const formattedDate = new Date(row[column]);
          rowValue = formattedDate.toLocaleString('es-ES', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        } else {
          rowValue = row[column]?.toString() || '';
        }
        
        if (!values.has(rowValue)) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredData = getFilteredData();
  const columns = controlDisparosData.length > 0 ? Object.keys(controlDisparosData[0]) : [];

  return (
    <div className={cdStyles.container}>
      <div className={cdStyles.header}>
        <div className={cdStyles.headerLeft}>
          <h1>Control de Disparos</h1>
          <div className={cdStyles.viewAllContainer}>
            <input 
              type="checkbox" 
              id="viewAll"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            <label htmlFor="viewAll">Ver todo</label>
            <button 
              onClick={() => loadControlDisparos(showAll)}
              className={cdStyles.viewButton}
              title="Cargar datos"
            >
              Ver
            </button>
          </div>
        </div>
        <button 
          onClick={() => {
            if (window.opener) {
              window.close();
            } else {
              router.back();
            }
          }}
          className={cdStyles.backButton}
        >
          ← Volver
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className={cdStyles.toolbar}>
        <span className={cdStyles.recordCount}>
          {filteredData.length > 0 && `${filteredData.length} registros`}
        </span>
      </div>

      {/* Tabla */}
      <div className={cdStyles.tableContainer}>
        {controlDisparosLoading ? (
          <div className={cdStyles.loadingMessage}>
            <p>⏳ Cargando datos...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <p className={cdStyles.emptyMessage}>No hay datos para mostrar</p>
        ) : (
          <table className={cdStyles.table}>
            <thead className={cdStyles.tableHead}>
              <tr>
                {columns.map(col => (
                  <th key={col} className={cdStyles.tableHeader}>
                    <div className={cdStyles.headerContent}>
                      <span>{col}</span>
                      <div className={cdStyles.filterButtonContainer} ref={activeFilterColumn === col ? filterDropdownRef : null}>
                        <button 
                          className={`${cdStyles.filterButton} ${activeFilterColumn === col ? cdStyles.active : ''}`}
                          onClick={() => setActiveFilterColumn(activeFilterColumn === col ? null : col)}
                          title="Filtrar por este campo"
                        >
                          ☰
                        </button>
                        {activeFilterColumn === col && (
                          <div className={cdStyles.filterDropdown}>
                            <div className={cdStyles.filterSearch}>
                              <input 
                                type="checkbox"
                                id={`${col}-select-all`}
                                checked={getUniqueValues(col).every(val => columnFilters[col]?.has(val))}
                                onChange={(e) => {
                                  const newFilters = { ...columnFilters };
                                  if (e.target.checked) {
                                    newFilters[col] = new Set(getUniqueValues(col));
                                  } else {
                                    newFilters[col] = new Set();
                                  }
                                  if (newFilters[col].size === 0) {
                                    delete newFilters[col];
                                  }
                                  setColumnFilters(newFilters);
                                }}
                              />
                              <label htmlFor={`${col}-select-all`}>Seleccionar todo</label>
                            </div>
                            <div className={cdStyles.filterOptions}>
                              {getUniqueValues(col).map(value => (
                                <label key={value} className={cdStyles.filterOption}>
                                  <input 
                                    type="checkbox"
                                    checked={columnFilters[col]?.has(value) || false}
                                    onChange={(e) => handleFilterChange(col, value, e.target.checked)}
                                  />
                                  <span>{value}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cdStyles.tableBody}>
              {filteredData.map((row, idx) => (
                <tr key={idx} className={cdStyles.tableRow}>
                  {columns.map(col => (
                    <td key={col} className={cdStyles.tableCell}>
                      {col === 'Hora' && row[col] ? new Date(row[col]).toLocaleString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
