'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from '../disparo/page.module.css';

interface DisparoData {
  [key: string]: any;
}

export default function DisparoScreen() {
  const router = useRouter();
  const [data, setData] = useState<DisparoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [numeroEmpleadoActual, setNumeroEmpleadoActual] = useState<number | null>(null);
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [activeType, setActiveType] = useState<'Ms' | 'Viper' | 'BOA' | 'CDU' | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [availableLineas, setAvailableLineas] = useState<string[]>([]);
  const [selectedLineas, setSelectedLineas] = useState<Set<string>>(new Set());
  const [lineasSearchValue, setLineasSearchValue] = useState('');
  const [selectAllLineas, setSelectAllLineas] = useState(false);
  const [selectedEstatus, setSelectedEstatus] = useState<Set<string>>(new Set());
  const [estatusSearchValue, setEstatusSearchValue] = useState('');
  const [selectAllEstatus, setSelectAllEstatus] = useState(false);
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: Set<string> }>({});
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [columnFilterData, setColumnFilterData] = useState<{ [key: string]: string[] }>({});
  const [filterHeaderPosition, setFilterHeaderPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<DisparoData[]>([]);
  const [editEstatus, setEditEstatus] = useState('');
  const [editCaja, setEditCaja] = useState('');
  const [editFechaEnvio, setEditFechaEnvio] = useState('');
  const [editHoraEnvio, setEditHoraEnvio] = useState('');
  const [editMinutoEnvio, setEditMinutoEnvio] = useState('');
  const [editAmPm, setEditAmPm] = useState('AM');
  const [editComentarios, setEditComentarios] = useState('');
  const [editNuevoEstatus, setEditNuevoEstatus] = useState('');
  const [editBackgroundColor, setEditBackgroundColor] = useState('#ffffff');
  const [availableCajas, setAvailableCajas] = useState<string[]>([]);
  const [showAddCajaModal, setShowAddCajaModal] = useState(false);
  const [showAddCajaNombreModal, setShowAddCajaNombreModal] = useState(false);
  const [newCajaNombre, setNewCajaNombre] = useState('');
  const [showShippedSequencesModal, setShowShippedSequencesModal] = useState(false);
  const [shippedSequencesData, setShippedSequencesData] = useState<DisparoData[]>([]);
  const [shippedSequencesLoading, setShippedSequencesLoading] = useState(false);
  const [selectedShippedSequenceRows, setSelectedShippedSequenceRows] = useState<Set<number>>(new Set());
  const [downloadingShippedSequences, setDownloadingShippedSequences] = useState(false);
  const [showAddSequenceModal, setShowAddSequenceModal] = useState(false);
  const [showAddMsSequenceModal, setShowAddMsSequenceModal] = useState(false);
  const [msLinea, setMsLinea] = useState('');
  const [msEntrega, setMsEntrega] = useState('');
  const [msHoraEnvio, setMsHoraEnvio] = useState('');
  const [msMinutoEnvio, setMsMinutoEnvio] = useState('');
  const [msAmPm, setMsAmPm] = useState('AM');
  const [msSecuencia, setMsSecuencia] = useState('');
  const [msCantidad, setMsCantidad] = useState('');
  const [msOrdenProduccion, setMsOrdenProduccion] = useState('');
  const [msEstatus, setMsEstatus] = useState('');
  const [showAddViperBoaModal, setShowAddViperBoaModal] = useState(false);
  const [viperBoaTipo, setViperBoaTipo] = useState('');
  const [viperBoaGrupoLogistico, setViperBoaGrupoLogistico] = useState('');
  const [viperBoaEntrega, setViperBoaEntrega] = useState('');
  const [viperBoaHora, setViperBoaHora] = useState('');
  const [viperBoaMinuto, setViperBoaMinuto] = useState('');
  const [viperBoaAmPm, setViperBoaAmPm] = useState('AM');
  const [viperBoaSupplyArea, setViperBoaSupplyArea] = useState('');
  const [viperBoaCantidad, setViperBoaCantidad] = useState('');
  const [viperBoaOrdenProduccion, setViperBoaOrdenProduccion] = useState('');
  const [viperBoaEstatus, setViperBoaEstatus] = useState('');
  const [viperBoaRows, setViperBoaRows] = useState<any[]>([]);
  const [showBasesPrintModal, setShowBasesPrintModal] = useState(false);
  const [basesData, setBasesData] = useState<any[]>([]);
  const [basesLoading, setBasesLoading] = useState(false);
  const [showTubeSheetsPrintModal, setShowTubeSheetsPrintModal] = useState(false);
  const [tubeSheetsData, setTubeSheetsData] = useState<any[]>([]);
  const [tubeSheetsLoading, setTubeSheetsLoading] = useState(false);
  const [showFilterTracksPrintModal, setShowFilterTracksPrintModal] = useState(false);
  const [filterTracksData, setFilterTracksData] = useState<any[]>([]);
  const [filterTracksLoading, setFilterTracksLoading] = useState(false);
  const [showPrioridadMsBoa, setShowPrioridadMsBoa] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNuevoDisparoModal, setShowNuevoDisparoModal] = useState(false);
  const [nuevoDisparoEmpleado, setNuevoDisparoEmpleado] = useState('');
  const [nuevoDisparoEmpleadoValidated, setNuevoDisparoEmpleadoValidated] = useState(false);
  const [nuevoDisparoValidating, setNuevoDisparoValidating] = useState(false);
  const [nuevoDisparoProcessing, setNuevoDisparoProcessing] = useState(false);
  const [nuevoDisparoProgress, setNuevoDisparoProgress] = useState(0);
  const [showPreviewTarjetasModal, setShowPreviewTarjetasModal] = useState(false);
  const [previewTarjetas, setPreviewTarjetas] = useState<string[]>([]);
  const [previewTarjetasLoading, setPreviewTarjetasLoading] = useState(false);
  const [previewTarjetasError, setPreviewTarjetasError] = useState<string | null>(null);
  const [previewTableData, setPreviewTableData] = useState<any[]>([]);
  const [previewTableLoading, setPreviewTableLoading] = useState(false);
  const [previewTableError, setPreviewTableError] = useState<string | null>(null);
  const [selectedTarjeta, setSelectedTarjeta] = useState<string | null>(null);
  const [previewExporting, setPreviewExporting] = useState(false);
  const [showCorreoModal, setShowCorreoModal] = useState(false);
  const [showEmailsModal, setShowEmailsModal] = useState(false);
  const [emailsData, setEmailsData] = useState<string[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [showDisparoEmailsModal, setShowDisparoEmailsModal] = useState(false);
  const [disparoEmailsData, setDisparoEmailsData] = useState<string[]>([]);
  const [disparoEmailsLoading, setDisparoEmailsLoading] = useState(false);
  const [showTravelersCountModal, setShowTravelersCountModal] = useState(false);
  const [travelersSolCount, setTravelersSolCount] = useState<number | null>(null);
  const [travelersList, setTravelersList] = useState<string[]>([]);
  const [travelersLoading, setTravelersLoading] = useState(false);
  const [showTarjetasModal, setShowTarjetasModal] = useState(false);
  const [tarjetasProgress, setTarjetasProgress] = useState(0);
  const [showEmailsTarjetasModal, setShowEmailsTarjetasModal] = useState(false);
  const [emailsTarjetasData, setEmailsTarjetasData] = useState<string[]>([]);
  const [emailsTarjetasLoading, setEmailsTarjetasLoading] = useState(false);
  const [showColorPickerModal, setShowColorPickerModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const columnFilterRef = useRef<HTMLTableCellElement>(null);
  const optionsEnabled = activeType !== null;
  const currentMatchRow = currentMatchIndex >= 0 ? searchMatches[currentMatchIndex] : null;

  const formatDate = (dateString: any, format: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (format === 'dd MMMM h:mm tt') {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      }).format(date);
    } else if (format === 'dd/MM/yyyy') {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(date);
    }
    return dateString;
  };

  useEffect(() => {
    if (!nuevoDisparoProcessing) {
      setNuevoDisparoProgress(0);
      return;
    }

    setNuevoDisparoProgress(10);
    const intervalId = setInterval(() => {
      setNuevoDisparoProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 800);

    return () => {
      clearInterval(intervalId);
    };
  }, [nuevoDisparoProcessing]);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
      return null;
    };

    const checkAuth = () => {
      console.log('=== Verificando autenticación ===');
      
      let numeroEmpleado = getCookie('numeroEmpleado');
      let tipo = getCookie('tipo');
      console.log('Cookie numeroEmpleado:', numeroEmpleado);
      console.log('Cookie tipo:', tipo);
      
      if (!numeroEmpleado) {
        numeroEmpleado = localStorage.getItem('numeroEmpleado');
        tipo = localStorage.getItem('tipo');
        console.log('localStorage numeroEmpleado:', numeroEmpleado);
        console.log('localStorage tipo:', tipo);
      }
      
      if (!numeroEmpleado) {
        numeroEmpleado = sessionStorage.getItem('numeroEmpleado');
        tipo = sessionStorage.getItem('tipo');
        console.log('sessionStorage numeroEmpleado:', numeroEmpleado);
        console.log('sessionStorage tipo:', tipo);
      }
      
      if (numeroEmpleado) {
        console.log('✅ Autenticado como:', numeroEmpleado, 'Tipo:', tipo);
        
        const nombreEmpleado = getCookie('nombreEmpleado') || localStorage.getItem('nombreEmpleado') || '';
        
        sessionStorage.setItem('numeroEmpleado', numeroEmpleado);
        sessionStorage.setItem('nombreEmpleado', nombreEmpleado);
        sessionStorage.setItem('tipo', tipo || '');
        
        setNumeroEmpleadoActual(Number(numeroEmpleado));
        setUserType(tipo || 'User');
        setAuthenticated(true);
      } else {
        console.log('❌ No autenticado, redirigiendo al login...');
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };

    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptionsMenu]);

  useEffect(() => {
    if (!optionsEnabled) {
      setShowOptionsMenu(false);
    }
  }, [optionsEnabled]);

  useEffect(() => {
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  }, [data, activeType]);

  useEffect(() => {
    setColumnFilters({});
    setOpenFilterColumn(null);
    
    if (data.length === 0) {
      setColumnFilterData({});
      return;
    }

    const hiddenCols = [
      'ID', 'Colors', 'Cambios', 'Tipo', 'ID_CONS', 'Tipo Viper',
      'Paneles', 'Metalicas', 'ETA', 'Status Viper', 'Status BOA'
    ];

    const visibleCols = getVisibleColumns();
    const newFilterData: { [key: string]: string[] } = {};

    visibleCols.forEach((col) => {
      if (!hiddenCols.includes(col)) {
        const uniqueValues = Array.from(
          new Set(
            data
              .map((row) => {
                const value = row[col];
                if ((col === 'Entrega' || col === 'Hora de Envio' || col === 'Hora de envio') && value) {
                  return formatDate(value, 'dd MMMM h:mm tt');
                }
                return String(value ?? '');
              })
              .filter((v) => v.trim() !== '')
          )
        ).sort();
        newFilterData[col] = uniqueValues;
      }
    });

    setColumnFilterData(newFilterData);
  }, [data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const sidebarToggle = (event.target as HTMLElement).closest(`.${styles.sidebarToggle}`);
        if (!sidebarToggle) {
          setShowSidebar(false);
        }
      }
    };

    if (showSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSidebar]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isClickInFilterButton = target.closest('[class*="filterHeaderButton"]');
      const isClickInFilterDropdown = target.closest('[class*="ColumnFilterDropdownFixed"]') || target.closest('[class*="columnFilterDropdown"]');
      
      if (!isClickInFilterButton && !isClickInFilterDropdown) {
        setOpenFilterColumn(null);
        setFilterHeaderPosition(null);
      }
    };

    if (openFilterColumn) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilterColumn]);

  useEffect(() => {
    if (searchValue.trim() === '') {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      setLastSearchTerm('');
    }
  }, [searchValue]);

  useEffect(() => {
    if (currentMatchRow === null || !tableWrapperRef.current) return;
    const row = tableWrapperRef.current.querySelector(
      `tr[data-row-index="${currentMatchRow}"]`
    ) as HTMLTableRowElement | null;

    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchRow]);

  useEffect(() => {
    if (!showFilterModal || !activeType) return;

    const fetchLineas = async () => {
      try {
        const response = await fetch(`/api/Disparo/GetLineas?tipo=${activeType}`);
        if (!response.ok) {
          throw new Error('Failed to fetch lineas');
        }
        const result = await response.json();
        setAvailableLineas(result);
        setSelectedLineas(new Set());
        setLineasSearchValue('');
        setSelectAllLineas(false);
        setSelectedEstatus(new Set());
        setEstatusSearchValue('');
        setSelectAllEstatus(false);
      } catch (err) {
        console.error('Error fetching lineas:', err);
      }
    };

    fetchLineas();
  }, [showFilterModal, activeType]);

  const columnsToHide = [
    'ID',
    'Colors',
    'Cambios',
    'Tipo',
    'ID_CONS',
    'Tipo Viper',
    'Paneles',
    'Metalicas',
    'ETA',
    'Status Viper',
    'Status BOA'
  ];

  const availableEstatus = [
    'Sin Estatus',
    'ENVIADO',
    'ENVIADO PENDIENTE',
    '*EN PROCESO DE TRASPALEO',
    'LISTO PARA ENVIAR - Falta de carro adecuado',
    'LISTO PARA ENVIAR - Por subir a caja',
    'RTS',
    '*PANEL TRASPALEADO',
    '*METAL TRASPALEADO',
    '*PANEL Y *METAL TRASPALEADO',
    '*PANEL Y METAL TRASPALEADO',
    'PANEL Y *METAL TRASPALEADO'
  ];

  const editableColumns = ['Comentarios', 'CheckboxColumn_BOA', 'Prioridad'];

  const availableColors = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Orange', hex: '#FF8000' },
    { name: 'Light Pink', hex: '#FFC0C0' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Melon', hex: '#FF8080' },
    { name: 'Light Blue', hex: '#BDDEE6' },
    { name: 'Beige', hex: '#FFE0C0' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Soft Pink', hex: '#FF99CC' },
    { name: 'Black13', hex: '#0D0D0D' },
    { name: 'Green142', hex: '#8ED973' },
    { name: 'Grey166', hex: '#A6A6A6' },
    { name: 'W242', hex: '#F2F2F2' },
    { name: 'Grey89', hex: '#595959' },
    { name: 'Grey217', hex: '#D9D9D9' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Green78', hex: '#4EA72E' },
    { name: 'Grey191', hex: '#BFBFBF' },
    { name: 'Pink206', hex: '#F2CEEF' },
    { name: 'Orange169', hex: '#F1A983' },
    { name: 'Blue179', hex: '#44B3E1' },
    { name: 'Pink158', hex: '#E49EDD' },
    { name: 'BlackB', hex: '#000000' },
    { name: 'Pink109', hex: '#D86DCD' },
    { name: 'Grey64', hex: '#404040' },
    { name: 'Green211', hex: '#47D359' },
    { name: 'Y153', hex: '#FFFF99' },
    { name: 'Cyan', hex: '#00FFFF' },
    { name: 'PP660', hex: '#6600FF' },
    { name: 'Red204', hex: '#CC0000' },
    { name: 'PP102', hex: '#660066' },
    { name: 'Blue51', hex: '#3333FF' },
    { name: 'Pink147', hex: '#D60093' },
    { name: 'GreenCCC0', hex: '#CCCC00' },
    { name: 'Blue33CCC', hex: '#33CCCC' },
    { name: 'PP6699', hex: '#666635' },
    { name: 'BROWN', hex: '#993300' },
    { name: 'Teal', hex: '#008080' },
    { name: 'PP160', hex: '#A02B93' },
  ];

  const fetchData = async (tipo?: 'Ms' | 'Viper' | 'BOA' | 'CDU') => {
    if (!tipo) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/Disparo/NuevoDisparo?tipo=${tipo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
      setActiveType(tipo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrioridadSort = () => {
    if (activeType !== 'Viper') return;

    setData((prev) => {
      const sorted = [...prev];

      const normalize = (value: unknown) => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };

      sorted.sort((a, b) => {
        const aVal = normalize(a.Prioridad);
        const bVal = normalize(b.Prioridad);

        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        return aVal - bVal;
      });

      return sorted;
    });
  };

  const handleTypeClick = (tipo: 'Ms' | 'Viper' | 'BOA' | 'CDU') => {
    fetchData(tipo);
  };

  const getVisibleColumns = () => {
    if (data.length === 0) return [];
    const allColumns = Object.keys(data[0]).filter(col => !columnsToHide.includes(col));
    
    const orderedColumns = [];
    let columnOrder;

    if (activeType === 'Viper') {
      columnOrder = ['Linea', 'Entrega', 'Secuencia', 'Qty', 'Orden Produccion', 'Estatus', 'Comentarios', 'Prioridad', 'Fecha CMX', 'WK', 'Caja', 'Hora de Envio'];
    } else if ((activeType === 'Ms' || activeType === 'BOA' || activeType === 'CDU') && showPrioridadMsBoa) {
      columnOrder = ['Linea', 'Entrega', 'Secuencia', 'Qty', 'Orden Produccion', 'Estatus', 'Comentarios', 'Prioridad', 'Fecha CMX', 'WK', 'Caja', 'Hora de Envio'];
    } else {
      columnOrder = ['Linea', 'Entrega', 'Secuencia', 'Qty', 'Orden Produccion', 'Estatus', 'Comentarios', 'Fecha CMX', 'WK', 'Caja', 'Hora de Envio'];
    }
    
    for (const col of columnOrder) {
      if (allColumns.includes(col)) {
        orderedColumns.push(col);
      }
    }
    
    for (const col of allColumns) {
      if (!orderedColumns.includes(col) && (activeType === 'Viper' || showPrioridadMsBoa || col !== 'Prioridad')) {
        orderedColumns.push(col);
      }
    }
    
    return orderedColumns;
  };

  const getColumnDisplayName = (columnName: string): string => {
    const nameMap: { [key: string]: string } = {
      'Hora de Envio': 'Envio',
      'Caja': 'Caja'
    };
    return nameMap[columnName] || columnName;
  };

  const getRowStyle = (estatus: string) => {
    if (estatus === 'Sin Estatus') {
      return '';
    } else if (estatus === 'ENVIADO') {
      return styles.greenRow;
    } else if (estatus && estatus.includes('LISTO PARA ENVIAR')) {
      return styles.yellowRow;
    }
    return '';
  };

  const getRowBackgroundColor = (estatus: string, colorRgb: string | null) => {
    // Don't override preset styles for ENVIADO, LISTO PARA ENVIAR
    if (estatus === 'ENVIADO' || (estatus && estatus.includes('LISTO PARA ENVIAR'))) {
      return {};
    }

    // Apply RGB color if available
    if (colorRgb) {
      try {
        const [r, g, b] = colorRgb.split(',').map(v => v.trim());
        return { backgroundColor: `rgb(${r}, ${g}, ${b})` };
      } catch {
        return {};
      }
    }

    return {};
  };

  const getCellStyle = (columnName: string, value: any) => {
    if (columnName === 'Comentarios') {
      return styles.blueCellText;
    }
    if (columnName === 'Estatus') {
      if (value === 'Disparo Nuevo') {
        return styles.pinkCell;
      }
      if (value === 'Sin Estatus') {
        return styles.blankCell;
      }
    }
    return '';
  };

  const getFilteredData = (): DisparoData[] => {
    if (Object.keys(columnFilters).length === 0) {
      return data;
    }

    return data.filter((row) => {
      for (const [col, selectedValues] of Object.entries(columnFilters)) {
        if (selectedValues.size === 0) continue;
        
        let rowValue;
        if ((col === 'Entrega' || col === 'Hora de Envio' || col === 'Hora de envio') && row[col]) {
          rowValue = formatDate(row[col], 'dd MMMM h:mm tt');
        } else {
          rowValue = String(row[col] ?? '');
        }
        
        if (!selectedValues.has(rowValue)) {
          return false;
        }
      }
      return true;
    });
  };

  const handleCellChange = (rowIndex: number, columnName: string, value: any) => {
    const newData = [...data];
    newData[rowIndex][columnName] = value;
    setData(newData);

    const newEditedRows = new Set(editedRows);
    newEditedRows.add(rowIndex);
    setEditedRows(newEditedRows);
  };

  const handleRowSelect = (rowIndex: number) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowIndex)) {
      newSelectedRows.delete(rowIndex);
    } else {
      newSelectedRows.add(rowIndex);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleEditRows = () => {
    if (selectedRows.size === 0) return;
    
    const selectedData = Array.from(selectedRows).map(index => data[index]);
    
    const today = new Date();
    const fechaActual = today.toISOString().split('T')[0];
    
    const hora = today.getHours();
    const minutos = today.getMinutes();
    const horaFormato12 = hora === 0 ? 12 : hora > 12 ? hora - 12 : hora;
    const amPm = hora >= 12 ? 'PM' : 'AM';
    
    setEditModalData(selectedData);
    setEditEstatus('');
    setEditCaja('');
    setEditFechaEnvio(fechaActual);
    setEditHoraEnvio(String(horaFormato12).padStart(2, '0'));
    setEditMinutoEnvio(String(minutos).padStart(2, '0'));
    setEditAmPm(amPm);
    setEditComentarios('');
    setEditNuevoEstatus('');
    setEditBackgroundColor('#ffffff');
    setShowEditModal(true);
    
    loadCajas();
  };

  const loadCajas = async () => {
    try {
      const response = await fetch('/api/Disparo/GetCajas');
      if (response.ok) {
        const data = await response.json();
        setAvailableCajas(data.cajas || []);
      }
    } catch (error) {
      console.error('Error loading cajas:', error);
    }
  };

  const handleAddCajaAuto = async () => {
    try {
      const response = await fetch('/api/Disparo/AddCajaAuto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowAddCajaModal(false);
        loadCajas();
        setEditCaja(data.nombreCaja);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al agregar la caja');
      }
    } catch (error) {
      alert('Error al agregar la caja');
    }
  };

  const handleAddCajaCustom = async () => {
    if (!newCajaNombre.trim()) {
      alert('Por favor ingresa el nombre de la nueva caja.');
      return;
    }

    try {
      const response = await fetch('/api/Disparo/AddCajaCustom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCaja: newCajaNombre })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowAddCajaNombreModal(false);
        setShowAddCajaModal(false);
        setNewCajaNombre('');
        loadCajas();
        setEditCaja(data.nombreCaja);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al agregar la caja');
      }
    } catch (error) {
      alert('Error al agregar la caja');
    }
  };

  const handleSaveEditChanges = async () => {
    if (!numeroEmpleadoActual) {
      alert('Error: Número de empleado no disponible. Por favor inicia sesión de nuevo.');
      return;
    }

    let estatus = editEstatus;
    if (editEstatus === 'Nuevo Estatus') {
      if (!editNuevoEstatus.trim()) {
        alert('Por favor escribe el nuevo Estatus en el cuadro de texto.');
        return;
      }
      estatus = editNuevoEstatus;
    } else if (!editEstatus) {
      estatus = 'Sin Estatus';
    }

    if (estatus === 'ENVIADO') {
      if (!editCaja) {
        alert('Por favor selecciona una caja.');
        return;
      }
      if (!editFechaEnvio || !editHoraEnvio || !editMinutoEnvio) {
        alert('Por favor ingresa la fecha y hora de envío');
        return;
      }
    }

    const horaCompleta = `${editHoraEnvio}:${editMinutoEnvio}`;

    // Convert hex color to RGB string format
    const hexToRgb = (hex: string): string | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return null;
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r},${g},${b}`;
    };

    const colorRgb = editBackgroundColor ? hexToRgb(editBackgroundColor) : null;

    try {
      const response = await fetch('/api/Disparo/SaveEditChanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numEmpleado: numeroEmpleadoActual,
          estatus,
          caja: editCaja,
          fechaEnvio: editFechaEnvio,
          horaEnvio: horaCompleta,
          amPm: editAmPm,
          comentarios: editComentarios,
          color: colorRgb,
          rows: editModalData,
          tipo: activeType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar cambios');
      }

      alert('Cambios aplicados correctamente.');
      setShowEditModal(false);
      setSelectedRows(new Set());
      if (activeType) {
        fetchData(activeType);
      }
    } catch (err) {
      alert('Error al guardar los cambios: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteSequences = async () => {
    if (!numeroEmpleadoActual) {
      alert('Error: Número de empleado no disponible. Por favor inicia sesión de nuevo.');
      return;
    }

    const confirmResult = confirm('¿Seguro que deseas eliminar las secuencias?');
    if (!confirmResult) return;

    const password = prompt('Ingresa la contraseña:', '');
    if (password !== 'NUEVOEMBARQUES2024') {
      alert('Contraseña incorrecta.');
      return;
    }

    try {
      const response = await fetch('/api/Disparo/DeleteSequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numEmpleado: numeroEmpleadoActual,
          rows: editModalData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar secuencias');
      }

      alert('Las secuencias han sido eliminadas correctamente.');
      setShowEditModal(false);
      setSelectedRows(new Set());
      if (activeType) {
        fetchData(activeType);
      }
    } catch (err) {
      alert('Error al eliminar las secuencias: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };
  const handleOptionClick = (option: string) => {
    setShowOptionsMenu(false);
    if (option === 'Filtros') {
      setShowFilterModal(true);
    } else if (option === 'Ver secuencias embarcadas') {
      loadShippedSequences();
    } else if (option === 'Agregar secuencia') {
      setShowAddSequenceModal(true);
    } else if (option === 'Imprimir Bases') {
      loadBases();
    } else if (option === 'Imprimir TubeSheets') {
      loadTubeSheets();
    } else if (option === 'Imprimir Filter Tracks') {
      loadFilterTracks();
    } else if (option === 'Agregar Prioridad') {
      setShowPrioridadMsBoa(true);
    } else if (option === 'Ver Disparo Completo') {
      router.push('/disparoCompleto');
    } else if (option === 'Control de Disparos') {
      router.push('/controlDisparos');
    } else if (option === 'Familias del Disparo') {
      router.push('/familias');
    } else {
      alert(`Opción seleccionada: ${option}`);
    }
  };

  const handleNuevoDisparo = async () => {
    if (!numeroEmpleadoActual) {
      alert('Error: Número de empleado no disponible. Por favor inicia sesión de nuevo.');
      return;
    }

    try {
      setNuevoDisparoValidating(true);
      const response = await fetch('/api/Disparo/ValidateEmployee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numEmpleado: numeroEmpleadoActual }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        window.alert('El número de empleado no existe o no está registrado para ejecutar un nuevo disparo.');
        setNuevoDisparoValidating(false);
        return;
      }

      setNuevoDisparoEmpleado(String(numeroEmpleadoActual));
      setNuevoDisparoEmpleadoValidated(true);
      setShowNuevoDisparoModal(true);
      setNuevoDisparoValidating(false);
    } catch (error) {
      window.alert('Error al validar empleado.');
      console.error(error);
      setNuevoDisparoValidating(false);
    }
  };

  const resetNuevoDisparoModal = () => {
    setShowNuevoDisparoModal(false);
    setNuevoDisparoEmpleadoValidated(false);
    setNuevoDisparoEmpleado('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseNuevoDisparoModal = () => {
    if (nuevoDisparoProcessing) return;
    resetNuevoDisparoModal();
  };

  const loadPreviewTarjetas = async () => {
    try {
      setPreviewTarjetasLoading(true);
      setPreviewTarjetasError(null);
      const response = await fetch('/api/Disparo/GetPreviewTarjetas');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Error al cargar tarjetas');
      }

      setPreviewTarjetas(result?.data || []);
      setSelectedTarjeta(null);
      setPreviewTableData([]);
      setPreviewTableError(null);
      setShowPreviewTarjetasModal(true);
    } catch (error) {
      setPreviewTarjetasError(error instanceof Error ? error.message : 'Error al cargar tarjetas');
      setShowPreviewTarjetasModal(true);
    } finally {
      setPreviewTarjetasLoading(false);
    }
  };

  const loadDisparoPreliminar = async () => {
    setSelectedTarjeta(null);
    await loadPreviewTable('Disparo Preliminar');
  };

  const loadDisparoNuevo = async () => {
    setSelectedTarjeta(null);
    await loadPreviewTable('Disparo Nuevo');
  };

  const loadPreviewTable = async (source: string) => {
    try {
      setPreviewTableLoading(true);
      setPreviewTableError(null);
      const response = await fetch(`/api/Disparo/GetPreviewTable?source=${encodeURIComponent(source)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Error al cargar vista previa');
      }

      setPreviewTableData(result?.data || []);
    } catch (error) {
      setPreviewTableError(error instanceof Error ? error.message : 'Error al cargar vista previa');
      setPreviewTableData([]);
    } finally {
      setPreviewTableLoading(false);
    }
  };

  const handleTarjetaSelect = async (item: string) => {
    if (selectedTarjeta === item) {
      setSelectedTarjeta(null);
      setPreviewTableData([]);
      setPreviewTableError(null);
      return;
    }

    setSelectedTarjeta(item);
    await loadPreviewTable(item);
  };

  const handleAgregarCorreoOpen = () => {
    setShowCorreoModal(true);
  };

  const handleEliminarDisparo = async () => {
    const confirmResult = window.confirm(
      'La siguiente acción eliminará el Disparo que se acaba de crear, ¿Deseas continuar?'
    );

    if (!confirmResult) return;

    const numEmpleado = window.prompt('Ingresa tu número de empleado:', '');

    if (!numEmpleado || !numEmpleado.trim() || isNaN(Number(numEmpleado))) {
      window.alert('Número de empleado inválido.');
      return;
    }

    try {
      const validateResponse = await fetch('/api/Disparo/ValidateEmployee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numEmpleado: Number(numEmpleado) }),
      });

      const validateData = await validateResponse.json();
      if (!validateResponse.ok || !validateData.valid) {
        window.alert('El número de empleado no existe o no está registrado para ejecutar un nuevo disparo.');
        return;
      }

      const response = await fetch('/api/Disparo/DeleteNuevoDisparo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numEmpleado: Number(numEmpleado) }),
      });

      const data = await response.json();
      if (!response.ok) {
        window.alert(data?.error || 'Error al eliminar el Disparo');
        return;
      }

      window.alert('Se ha eliminado el Disparo');
      setShowPreviewTarjetasModal(false);
    } catch (error) {
      window.alert('Error al eliminar el Disparo');
      console.error(error);
    }
  };

  const handleEnviarGuardar = async () => {
    try {
      setPreviewExporting(true);
      const response = await fetch('/api/Disparo/ExportDisparoPreliminar');

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Error al exportar Disparo Preliminar');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'Disparo PRELIMINAR.xlsx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match) filename = match[1];
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const wantsCopyEmails = window.confirm(
        `${filename} guardado correctamente.\n\n¿Deseas copiar los correos?`
      );

      if (wantsCopyEmails) {
        // Cargar los correos si el usuario acepta
        setEmailsLoading(true);
        const emailsResponse = await fetch('/api/Disparo/GetCorreosPreliminar');
        const emailsResult = await emailsResponse.json();
        
        if (emailsResult.error) {
          window.alert('Error al cargar correos: ' + emailsResult.error);
          // Ir a tarjetas si hay error
          await handleExportTarjetas();
        } else {
          setEmailsData(emailsResult.emails || []);
          setShowEmailsModal(true);
        }
        setEmailsLoading(false);
      } else {
        // Si cancela, ir directamente a tarjetas
        await handleExportTarjetas();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Error al exportar Disparo Preliminar');
    } finally {
      setPreviewExporting(false);
    }
  };

  const handleCopyEmails = async () => {
    try {
      // Generar el texto de correos separados por punto y coma (formato Outlook)
      const emailText = emailsData.join('; ');
      
      // Copiar al portapapeles
      await navigator.clipboard.writeText(emailText);
      
      // Mostrar confirmación de copia
      window.alert('Correos copiados al portapapeles');
      
      setShowEmailsModal(false);
      // Continuar automáticamente con la descarga de tarjetas (sin importar respuesta del alert)
      await handleExportTarjetas();
    } catch (error) {
      window.alert('Error al copiar correos: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setShowEmailsModal(false);
      await handleExportTarjetas();
    }
  };

  const handleExportTarjetas = async () => {
    try {
      setShowTarjetasModal(true);
      setTarjetasProgress(0);
      
      // Obtener lista de tarjetas disponibles
      const listResponse = await fetch('/api/Disparo/ExportTarjetas');
      const listData = await listResponse.json();
      
      if (!listData.tarjetas || listData.tarjetas.length === 0) {
        throw new Error('No hay tarjetas disponibles');
      }

      const tarjetasList = listData.tarjetas;
      const totalTarjetas = tarjetasList.length;

      // Descargar cada tarjeta secuencialmente
      for (let i = 0; i < totalTarjetas; i++) {
        const tarjeta = tarjetasList[i];
        
        try {
          const response = await fetch(`/api/Disparo/ExportTarjetas?tarjeta=${tarjeta.nombre}`);
          
          if (!response.ok) {
            console.warn(`No hay datos para tarjeta ${tarjeta.nombre}`);
            continue;
          }

          const contentDisposition = response.headers.get('content-disposition');
          let filename = `${tarjeta.nombreArchivo}.xlsx`;
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+?)"/);
            if (match) filename = match[1];
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Actualizar progreso
          setTarjetasProgress(Math.round(((i + 1) / totalTarjetas) * 100));

          // Pequeño delay entre descargas para que el navegador no las bloquee
          if (i < totalTarjetas - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error descargando tarjeta ${tarjeta.nombre}:`, error);
        }
      }

      setTarjetasProgress(100);

      // Esperar un segundo y luego mostrar mensaje
      setTimeout(() => {
        setShowTarjetasModal(false);
        const tarjetasMsg = 'Tarjetas (Special Orders, Panther, Press Shop, MPC, Legacy, TSVPAC, Coil, Filter Track) creadas correctamente.';
        const wantsCopyEmails = window.confirm(`${tarjetasMsg}\n\n¿Deseas copiar los correos de tarjetas?`);

        if (wantsCopyEmails) {
          loadEmailsTarjetas();
        } else {
          downloadDisparo();
        }
      }, 1000);
    } catch (error) {
      setShowTarjetasModal(false);
      window.alert(error instanceof Error ? error.message : 'Error al exportar tarjetas');
    }
  };

  const loadEmailsTarjetas = async () => {
    try {
      setEmailsTarjetasLoading(true);
      const response = await fetch('/api/Disparo/GetCorreosTarjetas');
      const result = await response.json();
      
      if (result.error) {
        window.alert('Error al cargar correos de tarjetas: ' + result.error);
      } else {
        setEmailsTarjetasData(result.emails || []);
        setShowEmailsTarjetasModal(true);
      }
    } catch (error) {
      window.alert('Error al cargar correos: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setEmailsTarjetasLoading(false);
    }
  };

  const checkTravelersSolAndNavigate = async () => {
    try {
      const response = await fetch('/api/Disparo/CheckTravelersSol');
      const result = await response.json();

      if (!response.ok || typeof result?.count !== 'number') {
        throw new Error(result?.error || 'Error al verificar la base de datos');
      }

      setTravelersSolCount(result.count);
      setTravelersList(Array.isArray(result?.travelers) ? result.travelers : []);
      setShowPreviewTarjetasModal(false);
      setShowTravelersCountModal(true);
    } catch (error) {
      window.alert(
        'Error al verificar la base de datos: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const downloadDisparo = async () => {
    try {
      const response = await fetch('/api/Disparo/ExportDisparo');
      
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Error al exportar Disparo');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'DISPARO.xlsx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match) filename = match[1];
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const wantsCopyEmails = window.confirm(
        `${filename} descargado.\n\n¿Deseas copiar los correos?`
      );

      if (wantsCopyEmails) {
        setDisparoEmailsLoading(true);
        const emailsResponse = await fetch('/api/Disparo/GetShippedSequencesEmails');
        const emailsResult = await emailsResponse.json();

        if (!emailsResponse.ok || emailsResult?.error) {
          window.alert('Error al cargar correos: ' + (emailsResult?.error || 'Unknown error'));
          setDisparoEmailsLoading(false);
          await checkTravelersSolAndNavigate();
          return;
        }

        setDisparoEmailsData(emailsResult?.correos || []);
        setShowDisparoEmailsModal(true);
        setDisparoEmailsLoading(false);
      } else {
        await checkTravelersSolAndNavigate();
      }
    } catch (error) {
      window.alert('Error al exportar Disparo: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCopyDisparoEmails = async () => {
    try {
      const emailText = disparoEmailsData.join('; ');
      await navigator.clipboard.writeText(emailText);
      setShowDisparoEmailsModal(false);
      window.alert('Correos copiados al portapapeles');
      await checkTravelersSolAndNavigate();
    } catch (error) {
      window.alert('Error al copiar correos: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setShowDisparoEmailsModal(false);
      await checkTravelersSolAndNavigate();
    }
  };

  const handleTravelersCountConfirm = async () => {
    if ((travelersSolCount ?? 0) <= 0) {
      setShowTravelersCountModal(false);
      window.alert('No hay travelers de BOA para guardar.');
      return;
    }

    try {
      setTravelersLoading(true);

      // Obtener datos completos de los travelers
      const response = await fetch('/api/Disparo/GetTravelersCompleteData');
      const result = await response.json();

      if (!response.ok || !result.travelers) {
        throw new Error(result.error || 'Error al obtener datos de travelers');
      }

      // Llamar a GenerateTravelersZip con los datos
      const zipResponse = await fetch('/api/Disparo/GenerateTravelersZip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelers: result.travelers })
      });

      if (!zipResponse.ok) {
        const errorData = await zipResponse.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al generar ZIP');
      }

      // Descargar el ZIP
      const blob = await zipResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Travelers_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowTravelersCountModal(false);
      setTravelersLoading(false);
      window.alert('Travelers descargados correctamente.');
    } catch (error) {
      setTravelersLoading(false);
      window.alert(
        'Error al descargar travelers: ' +
          (error instanceof Error ? error.message : 'Error desconocido')
      );
    }
  };

  const handleCopyEmailsTarjetas = async () => {
    try {
      const emailText = emailsTarjetasData.join('; ');
      await navigator.clipboard.writeText(emailText);
      window.confirm('Correos copiados al portapapeles');
      
      setShowEmailsTarjetasModal(false);
      
      await downloadDisparo();
    } catch (error) {
      window.alert('Error al copiar correos: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setShowEmailsTarjetasModal(false);
      await downloadDisparo();
    }
  };

  const loadBases = async () => {
    try {
      setBasesLoading(true);
      const response = await fetch(`/api/Disparo/GetBases`);
      const result = await response.json();
      
      if (result.error) {
        alert('Error al cargar bases: ' + result.error);
        setBasesLoading(false);
        return;
      }

      setBasesData(result.data || []);
      setShowBasesPrintModal(true);
      setBasesLoading(false);
    } catch (error) {
      console.error('Error loading bases:', error);
      alert('Error al cargar bases');
      setBasesLoading(false);
    }
  };

  const loadTubeSheets = async () => {
    try {
      setTubeSheetsLoading(true);
      const response = await fetch(`/api/Disparo/GetTubeSheets`);
      const result = await response.json();
      
      if (result.error) {
        alert('Error al cargar tube sheets: ' + result.error);
        setTubeSheetsLoading(false);
        return;
      }

      setTubeSheetsData(result.data || []);
      setShowTubeSheetsPrintModal(true);
      setTubeSheetsLoading(false);
    } catch (error) {
      console.error('Error loading tube sheets:', error);
      alert('Error al cargar tube sheets');
      setTubeSheetsLoading(false);
    }
  };

  const loadFilterTracks = async () => {
    try {
      setFilterTracksLoading(true);
      const response = await fetch(`/api/Disparo/GetFilterTracks`);
      const result = await response.json();
      
      if (result.error) {
        alert('Error al cargar filter tracks: ' + result.error);
        setFilterTracksLoading(false);
        return;
      }

      setFilterTracksData(result.data || []);
      setShowFilterTracksPrintModal(true);
      setFilterTracksLoading(false);
    } catch (error) {
      console.error('Error loading filter tracks:', error);
      alert('Error al cargar filter tracks');
      setFilterTracksLoading(false);
    }
  };


  const handleAddSequenceTypeSelect = (type: string) => {
    setShowAddSequenceModal(false);
    if (type === "M's") {
      setMsLinea('');
      setMsEntrega('');
      setMsHoraEnvio('');
      setMsMinutoEnvio('');
      setMsAmPm('AM');
      setMsSecuencia('');
      setMsCantidad('');
      setMsOrdenProduccion('');
      setMsEstatus('');
      setShowAddMsSequenceModal(true);
    } else if (type === 'Viper / BOA') {
      setViperBoaTipo('');
      setViperBoaGrupoLogistico('');
      setViperBoaEntrega('');
      setViperBoaHora('');
      setViperBoaMinuto('');
      setViperBoaAmPm('AM');
      setViperBoaSupplyArea('');
      setViperBoaCantidad('');
      setViperBoaOrdenProduccion('');
      setViperBoaEstatus('');
      setViperBoaRows([]);
      setShowAddViperBoaModal(true);
    }
  };

  const handleAddViperBoaRow = () => {
    if (!viperBoaTipo || !viperBoaGrupoLogistico || !viperBoaEntrega || !viperBoaHora || !viperBoaMinuto || !viperBoaSupplyArea || !viperBoaCantidad || !viperBoaOrdenProduccion || !viperBoaEstatus) {
      alert('Por favor completa todos los campos');
      return;
    }

    const newRow = {
      Tipo: viperBoaTipo,
      Gpo_Log: viperBoaGrupoLogistico,
      Entrega: `${viperBoaEntrega} ${viperBoaHora}:${viperBoaMinuto} ${viperBoaAmPm}`,
      Secuencia: viperBoaSupplyArea,
      Cantidad: viperBoaCantidad,
      OP: viperBoaOrdenProduccion,
      Estatus: viperBoaEstatus
    };

    setViperBoaRows([...viperBoaRows, newRow]);
    
    setViperBoaGrupoLogistico('');
    setViperBoaSupplyArea('');
    setViperBoaCantidad('');
    setViperBoaOrdenProduccion('');
  };

  const handleSaveViperBoaSequences = async () => {
    if (viperBoaRows.length === 0) {
      alert('No hay secuencias para guardar');
      return;
    }

    const numEmpleado = prompt('Ingresa tu número de empleado:', '');
    if (!numEmpleado || !numEmpleado.trim() || isNaN(Number(numEmpleado))) {
      alert('Número de empleado inválido');
      return;
    }

    try {
      const response = await fetch('/api/Disparo/AddViperBoaSequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: viperBoaRows,
          numEmpleado: Number(numEmpleado)
        })
      });

      const result = await response.json();

      if (result.error) {
        alert('Error al guardar: ' + result.error);
      } else {
        alert('Datos guardados correctamente en la tabla DISPARO');
        setShowAddViperBoaModal(false);
        setViperBoaRows([]);
        if (activeType) {
          fetchData(activeType);
        }
      }
    } catch (error) {
      console.error('Error saving sequences:', error);
      alert('Error al guardar en base de datos');
    }
  };

  const handleSaveAddMsSequence = async () => {
    if (!msLinea || !msEntrega || !msHoraEnvio || !msMinutoEnvio || !msSecuencia || !msCantidad || !msOrdenProduccion || !msEstatus) {
      alert('Por favor completa todos los campos');
      return;
    }

    const hora = parseInt(msHoraEnvio);
    const minuto = parseInt(msMinutoEnvio);

    if (isNaN(hora) || hora < 0 || hora > 12) {
      alert('La hora debe estar entre 0 y 12');
      return;
    }

    if (isNaN(minuto) || minuto < 0 || minuto > 59) {
      alert('Los minutos deben estar entre 0 y 59');
      return;
    }

    const [year, month, day] = msEntrega.split('-');
    const dateTime = new Date(`${year}-${month}-${day}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`);

    if (isNaN(dateTime.getTime())) {
      alert('Fecha y hora de entrega inválidas');
      return;
    }

    const formattedDate = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(dateTime);

    const formattedTime = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dateTime);

    const confirmMessage = `Se va a guardar la siguiente secuencia: ${msSecuencia} con la fecha: ${formattedDate} y la hora: ${formattedTime}, ¿deseas continuar?`;
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      alert('Operación cancelada por el usuario');
      return;
    }

    const numEmpleado = prompt('Ingresa tu número de empleado:', '');
    if (!numEmpleado || !numEmpleado.trim() || isNaN(Number(numEmpleado))) {
      alert('Número de empleado inválido');
      return;
    }

    try {
      const response = await fetch('/api/Disparo/AddMsSequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linea: msLinea,
          entrega: dateTime.toISOString(),
          secuencia: msSecuencia,
          cantidad: msCantidad,
          ordenProduccion: msOrdenProduccion,
          estatus: msEstatus,
          numEmpleado: Number(numEmpleado)
        })
      });

      const result = await response.json();

      if (result.error) {
        alert('Error al guardar: ' + result.error);
      } else {
        alert('Datos guardados exitosamente');
        setShowAddMsSequenceModal(false);
        if (activeType) {
          fetchData(activeType);
        } else {
          fetchData('Ms');
        }
      }
    } catch (error) {
      console.error('Error saving sequence:', error);
      alert('Error al guardar los datos');
    }
  };

  const loadShippedSequences = async () => {
    try {
      setShippedSequencesLoading(true);
      const response = await fetch('/api/Disparo/GetShippedSequences');
      const result = await response.json();
      if (result.data) {
        setShippedSequencesData(result.data);
        setShowShippedSequencesModal(true);
      } else {
        alert('No se encontraron secuencias embarcadas');
      }
    } catch (error) {
      console.error('Error loading shipped sequences:', error);
      alert('Error al cargar las secuencias embarcadas');
    } finally {
      setShippedSequencesLoading(false);
    }
  };

  const handleUndoShippedSequenceChanges = async () => {
    if (selectedShippedSequenceRows.size === 0) {
      alert('Por favor selecciona al menos una fila');
      return;
    }

    const confirmed = window.confirm(
      `Esta acción restablecerá ${selectedShippedSequenceRows.size} secuencia(s) como 'Sin Estatus'. ¿Desea continuar?`
    );

    if (!confirmed) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const idx of selectedShippedSequenceRows) {
        const selectedRow = shippedSequencesData[idx];
        try {
          const response = await fetch('/api/Disparo/UndoShippedSequenceChanges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedRow.ID })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`${successCount} cambio(s) deshecho(s) correctamente${errorCount > 0 ? `. ${errorCount} error(es)` : ''}`);
        loadShippedSequences();
        setSelectedShippedSequenceRows(new Set());
        if (activeType) {
          fetchData(activeType);
        }
      } else {
        alert('Error al deshacer los cambios');
      }
    } catch (error) {
      console.error('Error undoing changes:', error);
      alert('Error al deshacer los cambios');
    }
  };

  const handleDownloadShippedSequences = async () => {
    try {
      setDownloadingShippedSequences(true);

      const response = await fetch('/api/Disparo/DownloadShippedSequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        alert('Error al procesar la solicitud');
        return;
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'DISPARO.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const wantsCopyEmails = window.confirm(`${filename} descargado.\n\n¿Deseas copiar los correos?`);
      if (wantsCopyEmails) {
        const emailsResponse = await fetch('/api/Disparo/GetShippedSequencesEmails');
        const emailsResult = await emailsResponse.json();

        if (!emailsResponse.ok || emailsResult?.error) {
          alert('Error al cargar correos: ' + (emailsResult?.error || 'Unknown error'));
        } else {
          const correos = Array.isArray(emailsResult?.correos) ? emailsResult.correos : [];
          if (correos.length === 0) {
            alert('No hay correos disponibles');
          } else {
            await navigator.clipboard.writeText(correos.join('; '));
            alert('Correos copiados al portapapeles');
          }
        }
      }

      loadShippedSequences();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setDownloadingShippedSequences(false);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const term = searchValue.trim();
    if (!term) return;

    const normalizedTerm = term.toLowerCase();
    const shouldRecompute = normalizedTerm !== lastSearchTerm || searchMatches.length === 0;

    if (shouldRecompute) {
      const matches = data
        .map((row, index) => {
          const value = row['Orden Produccion'];
          const normalizedValue = String(value ?? '').toLowerCase();
          return normalizedValue.includes(normalizedTerm) ? index : -1;
        })
        .filter((index) => index >= 0);

      if (matches.length === 0) {
        alert('No se encontro esta Secuencia.');
        setSearchMatches([]);
        setCurrentMatchIndex(-1);
        setLastSearchTerm(normalizedTerm);
        return;
      }

      setSearchMatches(matches);
      setCurrentMatchIndex(0);
      setLastSearchTerm(normalizedTerm);
      return;
    }

    setCurrentMatchIndex((prev) => {
      if (searchMatches.length === 0) return -1;
      if (prev >= searchMatches.length - 1) {
        alert('no hay mas coincidencias');
        return prev;
      }
      return prev + 1;
    });
  };

  const handleSaveChanges = async () => {
    try {
      const editedData = Array.from(editedRows).map(index => data[index]);
      const response = await fetch('/api/Disparo/UpdateNuevoDisparo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      alert('Cambios guardados exitosamente');
      setEditedRows(new Set());
      if (activeType) {
        fetchData(activeType);
      }
    } catch (err) {
      alert('Error al guardar cambios: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const visibleColumns = getVisibleColumns();

  if (!authenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Verificando autenticación...
      </div>
    );
  }

  return (
    <div className={styles.disparoContainer}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : ''}`} ref={sidebarRef}>
        <div className={styles.sidebarHeader}>
          <h2>Menú</h2>
          <button 
            className={styles.sidebarCloseButton}
            onClick={() => setShowSidebar(false)}
          >
            ✕
          </button>
        </div>
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <button 
              className={styles.navCategory}
              onClick={() => setShowSidebar(false)}
            >
              Disparo
            </button>
            <div className={styles.navSubItems}>
              <button 
                className={`${styles.navSubItem} ${styles.navSubItemHighlight}`} 
                onClick={() => {
                  handleNuevoDisparo();
                  setShowSidebar(false);
                }}
                disabled={nuevoDisparoValidating}
              >
                Nuevo Disparo
              </button>
              <button 
                className={styles.navSubItem} 
                onClick={() => {
                  handleOptionClick('Familias del Disparo');
                  setShowSidebar(false);
                }}
                disabled={userType !== 'Administrador'}
                style={{
                  opacity: userType !== 'Administrador' ? 0.5 : 1,
                  cursor: userType !== 'Administrador' ? 'not-allowed' : 'pointer'
                }}
              >
                Familias del Disparo
              </button>
              <button 
                className={styles.navSubItem} 
                onClick={() => {
                  router.push('/secuenciasViperBoa');
                  setShowSidebar(false);
                }}
                disabled={userType !== 'Administrador'}
                style={{
                  opacity: userType !== 'Administrador' ? 0.5 : 1,
                  cursor: userType !== 'Administrador' ? 'not-allowed' : 'pointer'
                }}
              >
                Secuencias Boa-Viper
              </button>
              <button 
                className={styles.navSubItem} 
                onClick={() => {
                  router.push('/updateSchedule');
                  setShowSidebar(false);
                }}
                disabled={userType !== 'Administrador'}
                style={{
                  opacity: userType !== 'Administrador' ? 0.5 : 1,
                  cursor: userType !== 'Administrador' ? 'not-allowed' : 'pointer'
                }}
              >
                Ver y actualizar Schedule Production
              </button>
              <button 
                className={styles.navSubItem} 
                onClick={() => {
                  router.push('/varianzas');
                  setShowSidebar(false);
                }}
                disabled={userType !== 'Administrador'}
                style={{
                  opacity: userType !== 'Administrador' ? 0.5 : 1,
                  cursor: userType !== 'Administrador' ? 'not-allowed' : 'pointer'
                }}
              >
                Varianzas
              </button>
            </div>
          </div>
          <div className={styles.navSection}>
            <button 
              className={styles.navCategory}
              onClick={() => {
                router.push('/travelers');
                setShowSidebar(false);
              }}
            >
              Travelers
            </button>
          </div>
          <div className={styles.navSection}>
            <button 
              className={styles.navCategory}
              onClick={() => {
                handleOptionClick('Ver Disparo Completo');
                setShowSidebar(false);
              }}
            >
              Ver Disparo Completo
            </button>
            <button 
              className={styles.navCategory}
              onClick={() => {
                handleOptionClick('Control de Disparos');
                setShowSidebar(false);
              }}
            >
              Control de Disparos
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay para cerrar sidebar */}
      {showSidebar && (
        <div 
          className={styles.sidebarOverlay}
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className={styles.disparoHeader}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.sidebarToggle}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Abrir menú"
          >
            ☰
          </button>
          <h1>Disparo</h1>
          <div className={styles.optionsMenuContainer} ref={optionsMenuRef}>
            <button 
              className={`${styles.menuButton} ${!optionsEnabled ? styles.disabled : ''}`}
              onClick={() => {
                if (!optionsEnabled) return;
                setShowOptionsMenu(!showOptionsMenu);
              }}
              disabled={!optionsEnabled}
            >
              📋 Opciones {showOptionsMenu ? '▲' : '▼'}
            </button>
            {showOptionsMenu && optionsEnabled && (
              <div className={styles.optionsMenu}>
                <button onClick={() => handleOptionClick('Ver secuencias embarcadas')}>Ver secuencias embarcadas</button>
                <button onClick={() => handleOptionClick('Agregar secuencia')}>Agregar secuencia</button>
                <button onClick={() => handleOptionClick('Imprimir Bases')}>Imprimir Bases</button>
                <button onClick={() => handleOptionClick('Imprimir TubeSheets')}>Imprimir TubeSheets</button>
                <button onClick={() => handleOptionClick('Imprimir Filter Tracks')}>Imprimir Filter Tracks</button>
                {(activeType === 'Ms' || activeType === 'BOA' || activeType === 'CDU') && (
                  <button onClick={() => handleOptionClick('Agregar Prioridad')}>Agregar Prioridad</button>
                )}
              </div>
            )}
          </div>
          <button 
            className={`${styles.editButton} ${selectedRows.size === 0 ? styles.disabled : ''}`}
            onClick={handleEditRows}
            disabled={selectedRows.size === 0}
          >
            ✏️ Editar
          </button>
          <div className={styles.searchContainer}>
            <label className={styles.searchLabel} htmlFor="po-search">
              Buscar
            </label>
            <input
              id="po-search"
              ref={searchInputRef}
              className={styles.searchInput}
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchMatches.length > 0 && currentMatchIndex >= 0 && (
              <span className={styles.searchCounter}>
                {currentMatchIndex + 1}/{searchMatches.length}
              </span>
            )}
            {selectedRows.size > 0 && (
              <span className={styles.selectedLabel}>
                Filas Seleccionadas: {selectedRows.size}
              </span>
            )}
          </div>
        </div>

        <div className={styles.headerCenter}>
          <button 
            className={`${styles.categoryButton} ${activeType === 'Ms' ? styles.active : ''} ${activeType === 'Ms' ? styles.disabled : ''}`}
            onClick={() => handleTypeClick('Ms')}
            disabled={activeType === 'Ms'}
          >
            M's
          </button>
          <button 
            className={`${styles.categoryButton} ${activeType === 'Viper' ? styles.active : ''} ${activeType === 'Viper' ? styles.disabled : ''}`}
            onClick={() => handleTypeClick('Viper')}
            disabled={activeType === 'Viper'}
          >
            Viper
          </button>
          <button 
            className={`${styles.categoryButton} ${activeType === 'BOA' ? styles.active : ''} ${activeType === 'BOA' ? styles.disabled : ''}`}
            onClick={() => handleTypeClick('BOA')}
            disabled={activeType === 'BOA'}
          >
            Boa
          </button>
           <button 
            className={`${styles.categoryButton} ${activeType === 'CDU' ? styles.active : ''} ${activeType === 'CDU' ? styles.disabled : ''}`}
            onClick={() => handleTypeClick('CDU')}
            disabled={activeType === 'CDU'}
          >
            CDU
          </button>
        </div>

        <div className={styles.headerRight}>
          {Object.keys(columnFilters).some(key => columnFilters[key].size > 0) && (
            <button 
              className={styles.clearFiltersButton}
              onClick={() => {
                setColumnFilters({});
                setOpenFilterColumn(null);
              }}
              title="Limpiar todos los filtros de columnas"
            >
              ✕ Limpiar filtros
            </button>
          )}
          <button 
            className={styles.logoutButton}
            onClick={() => {
              // Limpiar sessionStorage
              sessionStorage.removeItem('numeroEmpleado');
              sessionStorage.removeItem('nombreEmpleado');
              sessionStorage.removeItem('tipo');
              
              // Limpiar localStorage
              localStorage.removeItem('numeroEmpleado');
              localStorage.removeItem('nombreEmpleado');
              localStorage.removeItem('tipo');
              
              // Limpiar cookies
              document.cookie = 'numeroEmpleado=; path=/; max-age=0';
              document.cookie = 'nombreEmpleado=; path=/; max-age=0';
              document.cookie = 'tipo=; path=/; max-age=0';
              
              // Redirigir al login
              router.push('/');
            }}
            title="Cerrar sesión"
          >
            Salir
          </button>
          
        </div>
      </div>



      {error && (
        <div className={styles.errorMessage}>
          Error: {error}
        </div>
      )}

      {!activeType && !loading ? (
        <div className={styles.loadingMessage}>
          Selecciona M's, Viper, Boa o CDU para ver los datos
        </div>
      ) : loading ? (
        <div className={styles.loadingMessage}>Cargando datos...</div>
      ) : (
        <>
          <div className={styles.tableWrapper} ref={tableWrapperRef}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxColumn}></th>
                  {visibleColumns.map((col) => (
                    <th key={col} ref={openFilterColumn === col ? columnFilterRef : null} className={styles.tableHeader}>
                      <div className={styles.headerContent}>
                        <div className={styles.headerLabel}>
                          {col === 'Prioridad' && (activeType === 'Viper' || showPrioridadMsBoa) ? (
                            <button
                              type="button"
                              className={styles.sortButton}
                              onClick={handlePrioridadSort}
                            >
                              <span>{getColumnDisplayName(col)}</span>
                              <span className={styles.sortArrow}>↑</span>
                            </button>
                          ) : (
                            getColumnDisplayName(col)
                          )}
                        </div>
                        <button
                          type="button"
                          className={`${styles.filterHeaderButton} ${columnFilters[col] && columnFilters[col].size > 0 ? styles.filterActive : ''}`}
                          onClick={(e) => {
                            if (openFilterColumn === col) {
                              setOpenFilterColumn(null);
                              setFilterHeaderPosition(null);
                            } else {
                              const button = e.currentTarget;
                              const rect = button.getBoundingClientRect();
                              setFilterHeaderPosition({
                                top: rect.bottom + 5,
                                left: rect.left,
                                width: 200
                              });
                              setOpenFilterColumn(col);
                            }
                          }}
                        >
                          🔽
                        </button>
                      </div>
                      {openFilterColumn === col && columnFilterData[col] && filterHeaderPosition && (
                        <div 
                          className={styles.columnFilterDropdownFixed}
                          style={{
                            top: `${filterHeaderPosition.top}px`,
                            left: `${filterHeaderPosition.left}px`,
                            minWidth: `${filterHeaderPosition.width}px`
                          }}
                        >
                          <div className={styles.filterDropdownHeader}>
                            <button
                              className={styles.clearFilterButton}
                              onClick={() => {
                                const newFilters = { ...columnFilters };
                                delete newFilters[col];
                                setColumnFilters(newFilters);
                              }}
                              title="Limpiar este filtro"
                            >
                              ✕
                            </button>
                          </div>
                          {columnFilterData[col].map((value) => (
                            <label key={value} className={styles.filterCheckItem}>
                              <input
                                type="checkbox"
                                checked={(columnFilters[col] && columnFilters[col].has(value)) || false}
                                onChange={(e) => {
                                  const newFilters = { ...columnFilters };
                                  if (!newFilters[col]) {
                                    newFilters[col] = new Set();
                                  }
                                  if (e.target.checked) {
                                    newFilters[col].add(value);
                                  } else {
                                    newFilters[col].delete(value);
                                  }
                                  setColumnFilters(newFilters);
                                }}
                              />
                              <span>{value}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getFilteredData().map((row, rowIndex) => {
                  const rowBgStyle = getRowBackgroundColor(row.Estatus, row.Colors as string | null);
                  return (
                  <tr 
                    key={rowIndex} 
                    data-row-index={rowIndex}
                    className={`${editedRows.has(rowIndex) ? styles.editedRow : ''} ${selectedRows.has(rowIndex) ? styles.selectedRow : ''} ${getRowStyle(row.Estatus)} ${currentMatchRow === rowIndex ? styles.searchMatchRow : ''}`}
                    style={rowBgStyle}
                  >
                    <td className={styles.checkboxColumn} style={rowBgStyle}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => handleRowSelect(rowIndex)}
                        className={styles.rowCheckbox}
                      />
                    </td>
                    {visibleColumns.map((col) => (
                      <td 
                        key={`${rowIndex}-${col}`} 
                        className={`${col === 'Prioridad' ? styles.priorityCell : ''} ${getCellStyle(col, row[col])}`}
                        style={rowBgStyle}
                      >
                        {editableColumns.includes(col) ? (
                          <input
                            type={col === 'CheckboxColumn_BOA' ? 'checkbox' : col === 'Prioridad' ? 'number' : 'text'}
                            value={col === 'CheckboxColumn_BOA' ? undefined : row[col] ?? ''}
                            checked={col === 'CheckboxColumn_BOA' ? row[col] : undefined}
                            onChange={(e) =>
                              handleCellChange(
                                rowIndex,
                                col,
                                col === 'CheckboxColumn_BOA' ? e.target.checked : e.target.value
                              )
                            }
                            className={col === 'Prioridad' ? styles.priorityInput : styles.editableInput}
                            min={col === 'Prioridad' ? '0' : undefined}
                          />
                        ) : (
                          <>
                            {col === 'Estatus' && row[col] === 'Sin Estatus'
                              ? ''
                              : col === 'Entrega'
                              ? formatDate(row[col], 'dd MMMM h:mm tt')
                              : col === 'Fecha CMX'
                              ? formatDate(row[col], 'dd/MM/yyyy')
                              : col === 'Hora de Envio' || col === 'Hora de envio'
                              ? formatDate(row[col], 'dd MMMM h:mm tt')
                              : row[col] ?? ''}
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          {editedRows.size > 0 && (
            <div className={styles.saveButtonContainer}>
              <button 
                className={styles.saveButton}
                onClick={handleSaveChanges}
              >
                💾 Guardar {editedRows.size} cambio(s)
              </button>
            </div>
          )}

          <div className={styles.tableInfo}>
            Total de registros: {getFilteredData().length}{data.length !== getFilteredData().length && ` (filtrados de ${data.length})`}
          </div>
        </>
      )}

      {showEditModal && (
        <div className={styles.editModalOverlay}>
          <div className={styles.editModalContent}>
            <div className={styles.editModalHeader}>
              <h2>Editar Secuencias ({editModalData.length})</h2>
              <button onClick={() => setShowEditModal(false)} className={styles.closeButton}>✕</button>
            </div>

            <div className={styles.editModalTable}>
              <table>
                <thead>
                  <tr>
                    <th>Linea</th>
                    <th>Entrega</th>
                    <th>Qty</th>
                    <th>Orden Produccion</th>
                    <th>Estatus</th>
                    <th>Comentarios</th>
                    {(activeType === 'Viper' || showPrioridadMsBoa) && <th>Prioridad</th>}
                  </tr>
                </thead>
                <tbody>
                  {editModalData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.Linea}</td>
                      <td>{formatDate(row.Entrega, 'dd MMMM h:mm tt')}</td>
                      <td>{row.Qty}</td>
                      <td>{row['Orden Produccion']}</td>
                      <td>{row.Estatus}</td>
                      <td>{row.Comentarios}</td>
                      {(activeType === 'Viper' || showPrioridadMsBoa) && <td>{row.Prioridad}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.editModalForm}>
              <div className={styles.formRow}>
                <label>Estatus:</label>
                <select value={editEstatus} onChange={(e) => setEditEstatus(e.target.value)}>
                  <option value="">Selecciona...</option>
                  <option value="Sin Estatus">Sin Estatus</option>
                  <option value="ENVIADO">ENVIADO</option>
                  <option value="ENVIADO PENDIENTE">ENVIADO PENDIENTE</option>
                  <option value="*EN PROCESO DE TRASPALEO">*EN PROCESO DE TRASPALEO</option>
                  <option value="LISTO PARA ENVIAR - Falta de carro adecuado">LISTO PARA ENVIAR - Falta de carro adecuado</option>
                  <option value="LISTO PARA ENVIAR - Por subir a caja">LISTO PARA ENVIAR - Por subir a caja</option>
                  <option value="RTS">RTS</option>
                  <option value="*PANEL TRASPALEADO">*PANEL TRASPALEADO</option>
                  <option value="*METAL TRASPALEADO">*METAL TRASPALEADO</option>
                  <option value="*PANEL Y *METAL TRASPALEADO">*PANEL Y *METAL TRASPALEADO</option>
                  <option value="*PANEL Y METAL TRASPALEADO">*PANEL Y METAL TRASPALEADO</option>
                  <option value="PANEL Y *METAL TRASPALEADO">PANEL Y *METAL TRASPALEADO</option>
                  <option value="Nuevo Estatus">Nuevo Estatus</option>
                </select>
              </div>

              {editEstatus === 'Nuevo Estatus' && (
                <div className={styles.formRow}>
                  <label>Nuevo Estatus:</label>
                  <input 
                    type="text" 
                    value={editNuevoEstatus} 
                    onChange={(e) => setEditNuevoEstatus(e.target.value)}
                    placeholder="Escribe el nuevo estatus..."
                  />
                </div>
              )}

              {editEstatus === 'ENVIADO' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className={styles.formRow}>
                      <label>Caja:</label>
                      <div>
                        <select value={editCaja} onChange={(e) => setEditCaja(e.target.value)}>
                          <option value="">Selecciona...</option>
                          {availableCajas.map((caja, idx) => (
                            <option key={idx} value={caja}>{caja}</option>
                          ))}
                        </select>
                        <div>
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); setShowAddCajaModal(true); }}
                            style={{ 
                              fontSize: '12px', 
                              marginTop: '5px', 
                              display: 'inline-block',
                              color: '#007bff',
                              textDecoration: 'underline'
                            }}
                          >
                            Agregar nueva caja
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className={styles.formRow}>
                      <label>Fecha envío:</label>
                      <input 
                        type="date" 
                        value={editFechaEnvio} 
                        onChange={(e) => setEditFechaEnvio(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <label>Hora envío:</label>
                    <div className={styles.timeInputs}>
                      <input 
                        type="number"
                        min="1"
                        max="12"
                        value={editHoraEnvio} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                            setEditHoraEnvio(val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val !== '' && !isNaN(parseInt(val))) {
                            setEditHoraEnvio(String(parseInt(val)).padStart(2, '0'));
                          }
                        }}
                        placeholder="HH"
                        style={{ width: '80px' }}
                      />
                      <span style={{ margin: '0 5px' }}>:</span>
                      <input 
                        type="number"
                        min="0"
                        max="59"
                        value={editMinutoEnvio} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                            setEditMinutoEnvio(val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val !== '' && !isNaN(parseInt(val))) {
                            setEditMinutoEnvio(String(parseInt(val)).padStart(2, '0'));
                          }
                        }}
                        placeholder="MM"
                        style={{ width: '80px' }}
                      />
                      <select value={editAmPm} onChange={(e) => setEditAmPm(e.target.value)} style={{ width: '80px', marginLeft: '10px' }}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className={styles.formRow}>
                <label>Comentarios:</label>
                <textarea 
                  value={editComentarios} 
                  onChange={(e) => setEditComentarios(e.target.value)}
                  rows={3}
                  placeholder="Comentarios adicionales..."
                />
              </div>

              <div className={styles.formRow}>
                <label>Color de fondo:</label>
                <button
                  onClick={() => setShowColorPickerModal(true)}
                  style={{
                    backgroundColor: editBackgroundColor,
                    border: '2px solid #999',
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                  title="Haz clic para seleccionar color"
                />
              </div>
            </div>

            <div className={styles.editModalButtons}>
              <button className={styles.saveEditButton} onClick={handleSaveEditChanges}>
                💾 Guardar Cambios
              </button>
              <button className={styles.deleteButton} onClick={handleDeleteSequences}>
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCajaModal && (
        <div className={styles.editModalOverlay}>
          <div className={styles.editModalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.editModalHeader}>
              <h2>Agregar Nueva Caja</h2>
              <button onClick={() => setShowAddCajaModal(false)} className={styles.closeButton}>✕</button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px' }}>¿Deseas agregar una nueva caja o escribir su nombre?</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button 
                  onClick={handleAddCajaAuto}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Agregar nueva caja (Auto-numerada)
                </button>
                
                <button 
                  onClick={() => setShowAddCajaNombreModal(true)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Escribir nombre de caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddCajaNombreModal && (
        <div className={styles.editModalOverlay}>
          <div className={styles.editModalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.editModalHeader}>
              <h2>Nuevo Nombre de Caja</h2>
              <button onClick={() => { setShowAddCajaNombreModal(false); setNewCajaNombre(''); }} className={styles.closeButton}>✕</button>
            </div>

            <div style={{ padding: '20px' }}>
              <div className={styles.formRow}>
                <label>Nombre de la caja:</label>
                <input 
                  type="text" 
                  value={newCajaNombre}
                  onChange={(e) => setNewCajaNombre(e.target.value)}
                  placeholder="Escribe el nombre de la caja..."
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={handleAddCajaCustom}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Guardar
                </button>
                <button 
                  onClick={() => { setShowAddCajaNombreModal(false); setNewCajaNombre(''); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShippedSequencesModal && (
        <div className={styles.editModalOverlay}>
          <div className={styles.editModalContent} style={{ maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className={styles.editModalHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Secuencias Actualizadas</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={handleUndoShippedSequenceChanges}
                  disabled={selectedShippedSequenceRows.size === 0 || downloadingShippedSequences}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    fontFamily: 'Poppins, sans-serif',
                    borderRadius: '4px',
                    cursor: (selectedShippedSequenceRows.size === 0 || downloadingShippedSequences) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: (selectedShippedSequenceRows.size === 0 || downloadingShippedSequences) ? 0.6 : 1
                  }}
                >
                  Deshacer cambios {selectedShippedSequenceRows.size > 0 && `(${selectedShippedSequenceRows.size})`}
                </button>
                <button 
                  onClick={handleDownloadShippedSequences}
                  disabled={downloadingShippedSequences}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#51cf66',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontFamily: 'Poppins, sans-serif',
                    cursor: downloadingShippedSequences ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: downloadingShippedSequences ? 0.6 : 1
                  }}
                >
                  {downloadingShippedSequences ? 'Descargando...' : 'Descargar'}
                </button>
                <button onClick={() => {
                  setShowShippedSequencesModal(false);
                  setSelectedShippedSequenceRows(new Set());
                }} className={styles.closeButton}>✕</button>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {shippedSequencesLoading ? (
                <p>Cargando...</p>
              ) : shippedSequencesData.length === 0 ? (
                <p>No hay secuencias actualizadas</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      {Object.keys(shippedSequencesData[0] || {})
                        .filter(col => ![
                          'ID', 'Prioridad', 'Tipo Viper', 'Paneles', 'Metalicas', 'ETA',
                          'Status Viper', 'Status BOA', 'ID_CONS', 'Colors', 'Tipo', 'Cambios'
                        ].includes(col))
                        .map(col => (
                          <th 
                            key={col}
                            style={{
                              padding: '8px',
                              textAlign: 'left',
                              fontWeight: 'bold',
                              borderRight: '1px solid #ddd'
                            }}
                          >
                            {col}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shippedSequencesData.map((row, idx) => (
                      <tr 
                        key={idx}
                        onClick={() => {
                          const newSelection = new Set(selectedShippedSequenceRows);
                          if (newSelection.has(idx)) {
                            newSelection.delete(idx);
                          } else {
                            newSelection.add(idx);
                          }
                          setSelectedShippedSequenceRows(newSelection);
                        }}
                        style={{
                          borderBottom: '1px solid #ddd',
                          backgroundColor: selectedShippedSequenceRows.has(idx) ? '#b8e0d2' : (idx % 2 === 0 ? '#fff' : '#f9f9f9'),
                          cursor: 'pointer'
                        }}
                      >
                        {Object.keys(row)
                          .filter(col => ![
                            'ID', 'Prioridad', 'Tipo Viper', 'Paneles', 'Metalicas', 'ETA',
                            'Status Viper', 'Status BOA', 'ID_CONS', 'Colors', 'Tipo', 'Cambios'
                          ].includes(col))
                          .map(col => {
                            let cellValue = row[col];
                            
                            if (col === 'Entrega' && cellValue) {
                              const date = new Date(cellValue);
                              cellValue = new Intl.DateTimeFormat('es-ES', {
                                day: '2-digit',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }).format(date);
                            }
                            
                            if (col === 'Fecha CMX' && cellValue) {
                              const date = new Date(cellValue);
                              cellValue = new Intl.DateTimeFormat('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }).format(date);
                            }

                            if (col === 'Hora de envio' && cellValue) {
                              const date = new Date(cellValue);
                              cellValue = new Intl.DateTimeFormat('es-ES', {
                                day: '2-digit',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }).format(date);
                            }

                            return (
                              <td 
                                key={`${idx}-${col}`}
                                style={{
                                  padding: '8px',
                                  borderRight: '1px solid #ddd',
                                  textAlign: col === 'Secuencia' || col === 'Entrega' ? 'center' : 'left'
                                }}
                              >
                                {cellValue?.toString() || '-'}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddSequenceModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Agregar Secuencia</h2>
              <button onClick={() => setShowAddSequenceModal(false)} className={styles.closeButton}>✕</button>
            </div>
            <p className={styles.modalSubtext}>Selecciona el tipo de secuencia a agregar:</p>
            <div className={styles.modalButtonGroup}>
              <button 
                className={styles.modalButton}
                onClick={() => handleAddSequenceTypeSelect("M's")}
              >
                M's
              </button>
              <button 
                className={styles.modalButton}
                onClick={() => handleAddSequenceTypeSelect("Viper / BOA")}
              >
                Viper / BOA
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMsSequenceModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Agregar Secuencia de M's</h2>
              <button onClick={() => setShowAddMsSequenceModal(false)} className={styles.closeButton}>✕</button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Linea:</label>
              <select 
                value={msLinea} 
                onChange={(e) => setMsLinea(e.target.value)}
                className={styles.formInput}
              >
                <option value="">Selecciona una línea...</option>
                <option>39L</option>
                <option>39L FILTER TRACK ASSY</option>
                <option>39L TS</option>
                <option>39M</option>
                <option>39M BASES</option>
                <option>39M FILTER TRACK ASSY</option>
                <option>39M TS</option>
                <option>39M+ / 39M++</option>
                <option>39M+ / 39M++ FILTER TRACK ASSY</option>
                <option>39M+ / 39M++ TS</option>
                <option>50X</option>
                <option>56OAHU02 RCD Other</option>
                <option>Coil Shop 1/2</option>
                <option>Coil Shop 1/2 TS</option>
                <option>Coil Shop 1/2 TS Legacy</option>
                <option>Coil Shop 3/8</option>
                <option>Coil Shop 3/8 CoilShop</option>
                <option>FanCoil Panther</option>
                <option>FanCoil TS Legacy</option>
                <option>LRTA MPC</option>
                <option>LRTA Press Shop</option>
                <option>LRTA Press Shop Techos094</option>
                <option>LRTA TS Legacy</option>
                <option>LRTN MPC</option>
                <option>LRTN TS Legacy</option>
                <option>TS Legacy</option>
                <option>TubeSheet</option>
                <option>VPAC</option>
                <option>VPAC TS VPAC</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Entrega:</label>
              <div className={styles.dateTimeGroup}>
                <input 
                  type="date"
                  value={msEntrega}
                  onChange={(e) => setMsEntrega(e.target.value)}
                  className={styles.formInput}
                  style={{ flex: 1 }}
                />
                <input 
                  type="number"
                  min="0"
                  max="12"
                  placeholder="HH"
                  value={msHoraEnvio}
                  onChange={(e) => setMsHoraEnvio(e.target.value)}
                  className={styles.formInput}
                  style={{ flex: 0.4 }}
                />
                <span style={{ padding: '0 5px' }}>:</span>
                <input 
                  type="number"
                  min="0"
                  max="59"
                  placeholder="MM"
                  value={msMinutoEnvio}
                  onChange={(e) => setMsMinutoEnvio(e.target.value)}
                  className={styles.formInput}
                  style={{ flex: 0.4 }}
                />
                <select 
                  value={msAmPm}
                  onChange={(e) => setMsAmPm(e.target.value)}
                  className={styles.formInput}
                  style={{ flex: 0.3 }}
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Secuencia:</label>
              <input 
                type="number"
                value={msSecuencia}
                onChange={(e) => setMsSecuencia(e.target.value)}
                className={styles.formInput}
                placeholder="Ingresa la secuencia"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cantidad:</label>
              <input 
                type="number"
                value={msCantidad}
                onChange={(e) => setMsCantidad(e.target.value)}
                className={styles.formInput}
                placeholder="Ingresa la cantidad"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Orden de Producción:</label>
              <input 
                type="text"
                value={msOrdenProduccion}
                onChange={(e) => setMsOrdenProduccion(e.target.value)}
                className={styles.formInput}
                placeholder="Ingresa la orden de producción"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Estatus:</label>
              <select 
                value={msEstatus}
                onChange={(e) => setMsEstatus(e.target.value)}
                className={styles.formInput}
              >
                <option value="">Selecciona un estatus...</option>
                <option>Disparo Nuevo</option>
                <option>Sin Estatus</option>
              </select>
            </div>

            <div className={styles.modalButtonGroup}>
              <button 
                className={styles.modalButton}
                onClick={handleSaveAddMsSequence}
              >
                Guardar
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowAddMsSequenceModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddViperBoaModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentLarge}>
            <div className={styles.modalHeader}>
              <h2>Agregar secuencia Viper / BOA</h2>
              <button onClick={() => setShowAddViperBoaModal(false)} className={styles.closeButton}>✕</button>
            </div>

            <div className={styles.viperBoaContainer}>
              <div className={styles.viperBoaForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Linea:</label>
                  <select 
                    value={viperBoaTipo} 
                    onChange={(e) => setViperBoaTipo(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">Selecciona...</option>
                    <option>Viper</option>
                    <option>BOA</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Grupo Logistico:</label>
                  <input 
                    type="text"
                    value={viperBoaGrupoLogistico}
                    onChange={(e) => setViperBoaGrupoLogistico(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Entrega:</label>
                  <div className={styles.dateTimeGroup}>
                    <input 
                      type="date"
                      value={viperBoaEntrega}
                      onChange={(e) => setViperBoaEntrega(e.target.value)}
                      className={styles.formInput}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="number"
                      min="0"
                      max="12"
                      placeholder="HH"
                      value={viperBoaHora}
                      onChange={(e) => setViperBoaHora(e.target.value)}
                      className={styles.formInput}
                      style={{ flex: 0.4 }}
                    />
                    <span style={{ padding: '0 5px' }}>:</span>
                    <input 
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={viperBoaMinuto}
                      onChange={(e) => setViperBoaMinuto(e.target.value)}
                      className={styles.formInput}
                      style={{ flex: 0.4 }}
                    />
                    <select 
                      value={viperBoaAmPm}
                      onChange={(e) => setViperBoaAmPm(e.target.value)}
                      className={styles.formInput}
                      style={{ flex: 0.3 }}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Supply Area:</label>
                  <input 
                    type="text"
                    value={viperBoaSupplyArea}
                    onChange={(e) => setViperBoaSupplyArea(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cantidad:</label>
                  <input 
                    type="number"
                    value={viperBoaCantidad}
                    onChange={(e) => setViperBoaCantidad(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Orden de Producción:</label>
                  <input 
                    type="number"
                    value={viperBoaOrdenProduccion}
                    onChange={(e) => setViperBoaOrdenProduccion(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estatus:</label>
                  <select 
                    value={viperBoaEstatus}
                    onChange={(e) => setViperBoaEstatus(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">Selecciona...</option>
                    <option>Sin Estatus</option>
                    <option>Disparo Nuevo</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <button 
                    className={styles.modalButton}
                    onClick={handleAddViperBoaRow}
                  >
                    Agregar
                  </button>
                  
                  <button 
                    className={styles.modalButton}
                    onClick={handleSaveViperBoaSequences}
                    disabled={viperBoaRows.length === 0}
                    style={{ 
                      opacity: viperBoaRows.length === 0 ? 0.5 : 1,
                      backgroundColor: '#28a745'
                    }}
                  >
                    Guardar ({viperBoaRows.length})
                  </button>
                </div>
              </div>

              <div className={styles.viperBoaTable}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontFamily: 'Poppins' }}>Secuencias a guardar</h3>
                <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5' }}>
                      <tr>
                        <th style={{ padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Tipo</th>
                        <th style={{ padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Gpo Log</th>
                        <th style={{ padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Entrega</th>
                        <th style={{ padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Supply Area</th>
                        <th style={{ padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Cantidad</th>
                        <th style={{ padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>OP</th>
                        <th style={{ padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viperBoaRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '8px' }}>{row.Tipo}</td>
                          <td style={{ padding: '8px' }}>{row.Gpo_Log}</td>
                          <td style={{ padding: '8px' }}>{row.Entrega}</td>
                          <td style={{ padding: '8px' }}>{row.Secuencia}</td>
                          <td style={{ padding: '8px' }}>{row.Cantidad}</td>
                          <td style={{ padding: '8px' }}>{row.OP}</td>
                          <td style={{ padding: '8px' }}>{row.Estatus}</td>
                        </tr>
                      ))}
                      {viperBoaRows.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            No hay secuencias agregadas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <button 
              className={styles.closeButton}
              onClick={() => setShowAddViperBoaModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal Imprimir Bases */}
      {showBasesPrintModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: '90%', maxWidth: '1100px', maxHeight: '90vh' }}>
            <div className={styles.modalHeader}>
              <h2>Imprimir Bases</h2>
              <button onClick={() => setShowBasesPrintModal(false)} className={styles.closeButton}>✕</button>
            </div>

            {basesLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Cargando datos...</p>
              </div>
            ) : (
              <>
                <div id="printableBasesContent" style={{ padding: '20px', backgroundColor: '#fff', overflow: 'auto', maxHeight: 'calc(90vh - 150px)' }}>
                  {basesData.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999' }}>No hay bases para imprimir</p>
                  ) : (
                    <BasesTable data={basesData} />
                  )}
                </div>
                <div style={{ padding: '15px', textAlign: 'center', borderTop: '1px solid #ddd' }}>
                  <button 
                    onClick={() => {
                      const printContent = document.getElementById('printableBasesContent');
                      if (printContent) {
                        const newWindow = window.open('', '', 'width=1100,height=800');
                        if (newWindow) {
                          newWindow.document.write(printContent.innerHTML);
                          newWindow.document.close();
                          newWindow.print();
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#1057db',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  >
                    🖨️ Imprimir
                  </button>
                  <button 
                    onClick={() => setShowBasesPrintModal(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Imprimir TubeSheets */}
      {showTubeSheetsPrintModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: '90%', maxWidth: '1100px', maxHeight: '90vh' }}>
            <div className={styles.modalHeader}>
              <h2>Imprimir TubeSheets</h2>
              <button onClick={() => setShowTubeSheetsPrintModal(false)} className={styles.closeButton}>✕</button>
            </div>

            {tubeSheetsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Cargando datos...</p>
              </div>
            ) : (
              <>
                <div id="printableTubeSheetsContent" style={{ padding: '20px', backgroundColor: '#fff', overflow: 'auto', maxHeight: 'calc(90vh - 150px)' }}>
                  {tubeSheetsData.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999' }}>No hay tube sheets para imprimir</p>
                  ) : (
                    <BasesTable data={tubeSheetsData} />
                  )}
                </div>
                <div style={{ padding: '15px', textAlign: 'center', borderTop: '1px solid #ddd' }}>
                  <button 
                    onClick={() => {
                      const printContent = document.getElementById('printableTubeSheetsContent');
                      if (printContent) {
                        const newWindow = window.open('', '', 'width=1100,height=800');
                        if (newWindow) {
                          newWindow.document.write(printContent.innerHTML);
                          newWindow.document.close();
                          newWindow.print();
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#1057db',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  >
                    🖨️ Imprimir
                  </button>
                  <button 
                    onClick={() => setShowTubeSheetsPrintModal(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Imprimir Filter Tracks */}
      {showFilterTracksPrintModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: '90%', maxWidth: '1100px', maxHeight: '90vh' }}>
            <div className={styles.modalHeader}>
              <h2>Imprimir Filter Tracks</h2>
              <button onClick={() => setShowFilterTracksPrintModal(false)} className={styles.closeButton}>✕</button>
            </div>

            {filterTracksLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Cargando datos...</p>
              </div>
            ) : (
              <>
                <div id="printableFilterTracksContent" style={{ padding: '20px', backgroundColor: '#fff', overflow: 'auto', maxHeight: 'calc(90vh - 150px)' }}>
                  {filterTracksData.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999' }}>No hay filter tracks para imprimir</p>
                  ) : (
                    <BasesTable data={filterTracksData} />
                  )}
                </div>
                <div style={{ padding: '15px', textAlign: 'center', borderTop: '1px solid #ddd' }}>
                  <button 
                    onClick={() => {
                      const printContent = document.getElementById('printableFilterTracksContent');
                      if (printContent) {
                        const newWindow = window.open('', '', 'width=1100,height=800');
                        if (newWindow) {
                          newWindow.document.write(printContent.innerHTML);
                          newWindow.document.close();
                          newWindow.print();
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#1057db',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  >
                    🖨️ Imprimir
                  </button>
                  <button 
                    onClick={() => setShowFilterTracksPrintModal(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showNuevoDisparoModal && nuevoDisparoEmpleadoValidated && (
        <div className={styles.modalOverlay} onClick={handleCloseNuevoDisparoModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nuevo Disparo</h2>
              <button 
                className={styles.closeButton}
                onClick={handleCloseNuevoDisparoModal}
                disabled={nuevoDisparoProcessing}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '5px 0' }}>
              <div style={{ marginTop: '1px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button 
                  className={styles.modalButton}
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  disabled={nuevoDisparoProcessing}
                >
                  {nuevoDisparoProcessing ? 'Procesando...' : '📁 Seleccionar Archivo'}
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNuevoDisparoProcessing(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('empleado', nuevoDisparoEmpleado);

                        const response = await fetch('/api/Disparo/ProcessCSVDisparo', {
                          method: 'POST',
                          body: formData,
                        });

                        const data = await response.json();

                        if (!response.ok) {
                          window.alert(data?.error || 'Error al procesar archivo');
                        } else {
                          window.alert(`Disparo procesado correctamente. ${data.message}`);
                          resetNuevoDisparoModal();
                          await loadPreviewTarjetas();
                        }
                      } catch (error) {
                        window.alert('Error al procesar archivo');
                        console.error(error);
                      } finally {
                        setNuevoDisparoProgress(100);
                        setNuevoDisparoProcessing(false);
                      }
                    }
                  }}
                />
              </div>
              {nuevoDisparoProcessing && (
                <div className={styles.processingStatus}>
                  <div className={styles.processingText}>Procesando archivo... {nuevoDisparoProgress}%</div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressBarFill} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPreviewTarjetasModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowPreviewTarjetasModal(false)}
        >
          <div className={`${styles.modalContent} ${styles.previewModalContent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Vista Previa</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowPreviewTarjetasModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.previewLayout}>
              <div className={styles.previewSidebar}>
                <button
                  className={styles.previewLink}
                  onClick={loadDisparoPreliminar}
                >
                  Disparo Preliminar
                </button>
                <div className={styles.previewSection}>
                  <div className={styles.modalSubtext}>Tarjetas:</div>
                  <div className={styles.previewChecklist}>
                    {previewTarjetasLoading ? (
                      <div className={styles.loadingMessage}>Cargando...</div>
                    ) : previewTarjetasError ? (
                      <div className={styles.errorMessage}>{previewTarjetasError}</div>
                    ) : previewTarjetas.length === 0 ? (
                      <div className={styles.loadingMessage}>No hay tarjetas disponibles</div>
                    ) : (
                      <div className={styles.previewChecklistItems}>
                        {previewTarjetas.map((item) => (
                          <label key={item} className={styles.previewChecklistItem}>
                            <input
                              type="checkbox"
                              checked={selectedTarjeta === item}
                              onChange={() => handleTarjetaSelect(item)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className={styles.previewLink}
                  onClick={loadDisparoNuevo}
                >
                  Disparo Nuevo
                </button>
                <button
                  className={styles.previewButton}
                  onClick={handleEnviarGuardar}
                  disabled={previewExporting}
                >
                  {previewExporting ? 'Procesando...' : 'Enviar y guardar'}
                </button>
                <button
                  className={styles.previewDangerButton}
                  onClick={handleEliminarDisparo}
                >
                  Eliminar Disparo
                </button>
              </div>
              <div className={styles.previewTableArea}>
                {previewTableLoading ? (
                  <div className={styles.loadingMessage}>Cargando...</div>
                ) : previewTableError ? (
                  <div className={styles.errorMessage}>{previewTableError}</div>
                ) : previewTableData.length === 0 ? (
                  <div className={styles.previewTablePlaceholder}>
                    Tabla de vista previa
                  </div>
                ) : (
                  <div className={styles.previewTableWrapper}>
                    <table className={styles.previewTable}>
                      <thead>
                        <tr>
                          {Object.keys(previewTableData[0] || {}).map((col) => (
                            <th key={col} className={styles.previewTableHeader}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewTableData.map((row, idx) => (
                          <tr key={idx}>
                            {Object.keys(previewTableData[0] || {}).map((col) => (
                              <td key={col} className={styles.previewTableCell}>
                                {col.toLowerCase().includes('fecha')
                                  ? formatDate(row[col], 'dd/MM/yyyy')
                                  : String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmailsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEmailsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Correos de Tarjetas</h2>
            
            {emailsLoading ? (
              <p>Cargando correos...</p>
            ) : emailsData.length === 0 ? (
              <p>No hay correos disponibles</p>
            ) : (
              <div className={styles.previewTableWrapper}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailsData.map((email, idx) => (
                      <tr key={idx}>
                        <td className={styles.previewTableCell}>{email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.previewButtonContainer}>
              <button
                className={styles.previewButton}
                onClick={handleCopyEmails}
                disabled={emailsLoading || emailsData.length === 0}
              >
                Copiar Correos
              </button>
              <button
                className={styles.previewButton}
                onClick={() => setShowEmailsModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisparoEmailsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDisparoEmailsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Correos de Disparo</h2>

            {disparoEmailsLoading ? (
              <p>Cargando correos...</p>
            ) : disparoEmailsData.length === 0 ? (
              <p>No hay correos disponibles</p>
            ) : (
              <div className={styles.previewTableWrapper}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disparoEmailsData.map((email, idx) => (
                      <tr key={idx}>
                        <td className={styles.previewTableCell}>{email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.previewButtonContainer}>
              <button
                className={styles.previewButton}
                onClick={handleCopyDisparoEmails}
                disabled={disparoEmailsLoading || disparoEmailsData.length === 0}
              >
                Copiar Correos
              </button>
              <button
                className={styles.previewButton}
                onClick={() => setShowDisparoEmailsModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTravelersCountModal && (
        <div className={styles.modalOverlay} onClick={!travelersLoading ? handleTravelersCountConfirm : undefined}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {travelersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h2 style={{ marginBottom: '20px' }}>Generando PDF de Travelers...</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      animation: 'pulse 1.5s infinite',
                      animationDelay: '0s'
                    }}
                  ></div>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      animation: 'pulse 1.5s infinite',
                      animationDelay: '0.3s'
                    }}
                  ></div>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      animation: 'pulse 1.5s infinite',
                      animationDelay: '0.6s'
                    }}
                  ></div>
                </div>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Por favor espera, esto puede tomar un momento...
                </p>
              </div>
            ) : (
              <>
                <h2>Travelers: Se generaron {travelersSolCount ?? 0}.</h2>
                {travelersList.length > 0 && (
                  <div className={styles.travelersListContainer}>
                    {travelersList.map((name, idx) => (
                      <div key={idx} className={styles.travelersListItem}>
                        {name}
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.previewButtonContainer}>
                  <button
                    className={styles.TravelButton}
                    onClick={handleTravelersCountConfirm}
                    disabled={travelersLoading}
                  >
                    Aceptar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
      `}</style>

      {showTarjetasModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Generando Tarjetas</h2>
            <p>Creando archivos de tarjetas...</p>
            
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar}
                style={{ width: `${tarjetasProgress}%` }}
              ></div>
            </div>
            <p>{tarjetasProgress}%</p>
          </div>
        </div>
      )}

      {showEmailsTarjetasModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEmailsTarjetasModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Correos de Tarjetas</h2>
            
            {emailsTarjetasLoading ? (
              <p>Cargando correos...</p>
            ) : emailsTarjetasData.length === 0 ? (
              <p>No hay correos disponibles</p>
            ) : (
              <div className={styles.previewTableWrapper}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailsTarjetasData.map((email, idx) => (
                      <tr key={idx}>
                        <td className={styles.previewTableCell}>{email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.previewButtonContainer}>
              <button
                className={styles.previewButton}
                onClick={handleCopyEmailsTarjetas}
                disabled={emailsTarjetasLoading || emailsTarjetasData.length === 0}
              >
                Copiar Correos
              </button>
              <button
                className={styles.previewButton}
                onClick={() => setShowEmailsTarjetasModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showColorPickerModal && (
        <div className={styles.modalOverlay} onClick={() => setShowColorPickerModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Seleccionar Color</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px', margin: '20px 0', padding: '15px' }}>
              {availableColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setEditBackgroundColor(color.hex);
                    setShowColorPickerModal(false);
                  }}
                  style={{
                    backgroundColor: color.hex,
                    border: editBackgroundColor === color.hex ? '3px solid #333' : '1px solid #ccc',
                    width: '35px',
                    height: '35px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={color.name}
                />
              ))}
            </div>

            <div className={styles.previewButtonContainer}>
              <button
                className={styles.cancelButtonModal}
                onClick={() => setShowColorPickerModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function BasesTable({ data }: { data: any[] }) {
  const ROWS_PER_TABLE = 40;
  
  const pages = [];
  for (let i = 0; i < data.length; i += ROWS_PER_TABLE * 2) {
    pages.push({
      left: data.slice(i, i + ROWS_PER_TABLE),
      right: data.slice(i + ROWS_PER_TABLE, i + ROWS_PER_TABLE * 2)
    });
  }

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as any,
    fontSize: '10px',
    fontFamily: 'Arial',
    border: '1px solid #000'
  };

  const cellStyle = {
    border: '1px solid #000',
    padding: '5px',
    textAlign: 'center' as const
  };

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold'
  };

  const renderTable = (tableData: any[]) => (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={headerCellStyle}>Linea</th>
          <th style={headerCellStyle}>Qty</th>
          <th style={headerCellStyle}>PO</th>
          <th style={headerCellStyle}>Fecha CMX</th>
        </tr>
      </thead>
      <tbody>
        {tableData.map((row, idx) => (
          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
            <td style={cellStyle}>{row.Linea}</td>
            <td style={cellStyle}>{row.Qty}</td>
            <td style={cellStyle}>{row['Orden Produccion']}</td>
            <td style={cellStyle}>
              {row['Fecha CMX'] ? new Date(row['Fecha CMX']).toLocaleDateString('es-ES') : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} style={{ display: 'flex', gap: '20px', marginBottom: '30px', pageBreakAfter: 'always', pageBreakInside: 'avoid' }}>
          {/* Tabla Izquierda */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {renderTable(page.left)}
          </div>

          {/* Tabla Derecha */}
          {page.right.length > 0 && (
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderTable(page.right)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
