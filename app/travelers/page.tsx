"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './travelers.module.css';

export default function TravelersPage() {
  const router = useRouter();
  const [showKanbanModal, setShowKanbanModal] = useState(false);
  const [showBOAModal, setShowBOAModal] = useState(false);
  const [showViperModal, setShowViperModal] = useState(false);
  const [kanbanRows, setKanbanRows] = useState<Array<{ numeroParte: string; tipo: string }>>([]);
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [kanbanError, setKanbanError] = useState<string | null>(null);
  const [selectedKanbanIndex, setSelectedKanbanIndex] = useState<number | null>(null);
  const [addNumeroParte, setAddNumeroParte] = useState('');
  const [addTipo, setAddTipo] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [listaPartes, setListaPartes] = useState<string[]>([]);
  const [guardandoKanban, setGuardandoKanban] = useState(false);
  const [boaRows, setBoaRows] = useState<Array<{ grupoLogistico: string; colorGrupo: string }>>([]);
  const [viperRows, setViperRows] = useState<Array<{ grupoLogistico: string; colorGrupo: string }>>([]);
  const [viperLoading, setViperLoading] = useState(false);
  const [boaLoading, setBoaLoading] = useState(false);
  const [viperError, setViperError] = useState<string | null>(null);
  const [boaError, setBoaError] = useState<string | null>(null);
  const [selectedViperIndex, setSelectedViperIndex] = useState<number | null>(null);
  const [selectedBoaIndex, setSelectedBoaIndex] = useState<number | null>(null);
  const [addGrupoLogistico, setAddGrupoLogistico] = useState('');
  const [addColorGrupo, setAddColorGrupo] = useState('');
  const [searchViperValue, setSearchViperValue] = useState('');
  const [searchViperResults, setSearchViperResults] = useState<number[]>([]);
  const [currentViperSearchIndex, setCurrentViperSearchIndex] = useState(-1);
  const [lastViperSearchTerm, setLastViperSearchTerm] = useState('');
  const [searchBOAValue, setSearchBOAValue] = useState('');
  const [searchBOAResults, setSearchBOAResults] = useState<number[]>([]);
  const [currentBOASearchIndex, setCurrentBOASearchIndex] = useState(-1);
  const [lastBOASearchTerm, setLastBOASearchTerm] = useState('');
  const [listaGrupos, setListaGrupos] = useState<string[]>([]);
  const [guardandoViper, setGuardandoViper] = useState(false);
  const [guardandoBOA, setGuardandoBOA] = useState(false);
  const [showTravelerTypeModal, setShowTravelerTypeModal] = useState(false);
  const [travelerType, setTravelerType] = useState<'disparo' | 'viper' | null>(null);
  const [showBuscarTravelers, setShowBuscarTravelers] = useState(false);
  const [semanas, setSemanas] = useState<string[]>([]);
  const [anos, setAnos] = useState<string[]>([]);
  const [selectedSemana, setSelectedSemana] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [anosDisparo, setAnosDisparo] = useState<string[]>([]);
  const [selectedAnoDisparo, setSelectedAnoDisparo] = useState('');
  const [selectedDia, setSelectedDia] = useState('');
  const [tiposDisparo, setTiposDisparo] = useState<string[]>([]);
  const [selectedTipoDisparo, setSelectedTipoDisparo] = useState('');
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingTravelers, setIsSavingTravelers] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [generatedTravelers, setGeneratedTravelers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Protección de ruta: verificar autenticación
  useEffect(() => {
    const numeroEmpleado = document.cookie
      .split('; ')
      .find(row => row.startsWith('numeroEmpleado='))
      ?.split('=')[1];

    if (!numeroEmpleado) {
      console.log('No hay usuario autenticado, redirigiendo al login...');
      router.push('/');
    }
  }, [router]);

  const fetchKanban = async () => {
    try {
      setKanbanLoading(true);
      setKanbanError(null);
      const response = await fetch('/api/Disparo/GetKanban');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Error al cargar Kanban');
      }

      const rows = (data.kanban || []).map((row: any) => ({
        numeroParte: row['Numero de Parte'] ?? '',
        tipo: row['Tipo'] ?? ''
      }));
      setKanbanRows(rows);
      setSelectedKanbanIndex(null);
      setAddNumeroParte('');
      setAddTipo('');
      setListaPartes([]);
    } catch (error) {
      setKanbanError(error instanceof Error ? error.message : 'Error al cargar Kanban');
    } finally {
      setKanbanLoading(false);
    }
  };

  const fetchViper = async () => {
    try {
      setViperLoading(true);
      setViperError(null);
      const response = await fetch('/api/Disparo/GetGruposViper');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Error al cargar Grupos Viper');
      }

      const rows = (data.gruposViper || []).map((row: any) => ({
        grupoLogistico: row['Grupo Logistico'] ?? '',
        colorGrupo: row['Color Grupo'] ?? ''
      }));
      setViperRows(rows);
      setSelectedViperIndex(null);
      setAddGrupoLogistico('');
      setAddColorGrupo('');
      setListaGrupos([]);
    } catch (error) {
      setViperError(error instanceof Error ? error.message : 'Error al cargar Grupos Viper');
    } finally {
      setViperLoading(false);
    }
  };

   const fetchBoa = async () => {
    try {
      setBoaLoading(true);
      setBoaError(null);
      const response = await fetch('/api/Disparo/GetGruposBoa');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Error al cargar Grupos Boa');
      }

      const rows = (data.gruposBoa || []).map((row: any) => ({
        grupoLogistico: row['Grupo Logistico'] ?? '',
        colorGrupo: row['Color Grupo'] ?? ''
      }));
      setBoaRows(rows);
      setSelectedBoaIndex(null);
      setAddGrupoLogistico('');
      setAddColorGrupo('');
      setListaGrupos([]);
    } catch (error) {
      setBoaError(error instanceof Error ? error.message : 'Error al cargar Grupos Boa');
    } finally {
      setBoaLoading(false);
    }
  };

  const fetchPackingFilters = async () => {
    try {
      const response = await fetch('/api/Disparo/GetPackingFilters');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Error al cargar filtros');
      }

      setAnos(data.anos || []);
    } catch (error) {
      console.error('Error fetching packing filters:', error);
    }
  };

  const fetchSemanasByAno = async (ano: string) => {
    if (!ano) {
      setSemanas([]);
      return;
    }
    try {
      const response = await fetch(`/api/Disparo/GetPackingFilters?ano=${encodeURIComponent(ano)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Error al cargar semanas');
      }

      setSemanas(data.semanas || []);
    } catch (error) {
      console.error('Error fetching semanas:', error);
      setSemanas([]);
    }
  };

  const fetchPackingBoaFilters = async () => {
    try {
      const response = await fetch('/api/Disparo/GetPackingBoaFilters');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Error al cargar filtros BOA');
      }

      setAnosDisparo(data.anos || []);
    } catch (error) {
      console.error('Error fetching packing BOA filters:', error);
    }
  };

  const fetchTiposByAnoAndFecha = async (ano: string, fecha: string) => {
    if (!ano || !fecha) {
      setTiposDisparo([]);
      return;
    }
    try {
      const response = await fetch(`/api/Disparo/GetPackingBoaTipos?ano=${encodeURIComponent(ano)}&fecha=${encodeURIComponent(fecha)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Error al cargar tipos');
      }

      setTiposDisparo(data.tipos || []);
    } catch (error) {
      console.error('Error fetching tipos:', error);
      setTiposDisparo([]);
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setGeneratedCount(null);
    setGeneratedTravelers([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/Disparo/ProcessCSVTravelers', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.error || 'Error al procesar archivo');
      }

      const checkResponse = await fetch('/api/Disparo/CheckTravelersSol');
      const checkData = await checkResponse.json().catch(() => null);

      if (!checkResponse.ok) {
        throw new Error(checkData?.error || 'Error al obtener travelers');
      }

      setGeneratedCount(checkData?.count ?? 0);
      setGeneratedTravelers(Array.isArray(checkData?.travelers) ? checkData.travelers : []);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error al procesar archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAllTravelers = async () => {
    if ((generatedCount ?? 0) <= 0) {
      window.alert('No hay travelers para guardar.');
      return;
    }

    try {
      setIsSavingTravelers(true);

      const prepareResponse = await fetch('/api/Disparo/PrepareTravelersTables', {
        method: 'POST'
      });
      const prepareData = await prepareResponse.json().catch(() => null);

      if (!prepareResponse.ok) {
        throw new Error(prepareData?.error || 'Error al preparar tablas de travelers');
      }

      const response = await fetch('/api/Disparo/GetTravelersCompleteData');
      const result = await response.json();

      if (!response.ok || !result.travelers) {
        throw new Error(result.error || 'Error al obtener datos de travelers');
      }

      const zipResponse = await fetch('/api/Disparo/GenerateTravelersZip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelers: result.travelers })
      });

      if (!zipResponse.ok) {
        const errorData = await zipResponse.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al generar ZIP');
      }

      const blob = await zipResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Travelers_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      window.alert('Travelers descargados correctamente.');
    } catch (error) {
      window.alert(
        'Error al descargar travelers: ' +
          (error instanceof Error ? error.message : 'Error desconocido')
      );
    } finally {
      setIsSavingTravelers(false);
    }
  };


  useEffect(() => {
    if (!showKanbanModal) return;
    fetchKanban();
  }, [showKanbanModal]);

  useEffect(() => {
    if (!showViperModal) return;
    fetchViper();
  }, [showViperModal]);

  useEffect(() => {
    if (!showBOAModal) return;
    fetchBoa();
  }, [showBOAModal]);

  const handleKanbanRowSelect = (index: number) => {
    if (selectedKanbanIndex === index) {
      setSelectedKanbanIndex(null);
      setAddNumeroParte('');
      setAddTipo('');
      return;
    }

    const selected = kanbanRows[index];
    setSelectedKanbanIndex(index);
    setAddNumeroParte(selected?.numeroParte ?? '');
    setAddTipo(selected?.tipo ?? '');
  };

  const handleViperRowSelect = (index: number) => {
    if (selectedViperIndex === index) {
      setSelectedViperIndex(null);
      setAddGrupoLogistico('');
      setAddColorGrupo('');
      return;
    }

    const selected = viperRows[index];
    setSelectedViperIndex(index);
    setAddGrupoLogistico(selected?.grupoLogistico ?? '');
    setAddColorGrupo(selected?.colorGrupo ?? '');
  };

  const handleBoaRowSelect = (index: number) => {
    if (selectedBoaIndex === index) {
      setSelectedBoaIndex(null);
      setAddGrupoLogistico('');
      setAddColorGrupo('');
      return;
    }

    const selected = boaRows[index];
    setSelectedBoaIndex(index);
    setAddGrupoLogistico(selected?.grupoLogistico ?? '');
    setAddColorGrupo(selected?.colorGrupo ?? '');
  };

  const handleAgregarParte = () => {
    if (!addNumeroParte.trim()) {
      window.alert('Por favor, escribe un numero de parte valido');
      return;
    }

    setListaPartes((prev) => [...prev, addNumeroParte.trim()]);
    setAddNumeroParte('');
  };

  const handleAgregarGrupo = () => {
    if (!addGrupoLogistico.trim()) {
      window.alert('Por favor, escribe un grupo logistico valido');
      return;
    }

    setListaGrupos((prev) => [...prev, addGrupoLogistico.trim()]);
    setAddGrupoLogistico('');
  };

  const handleRemoverParte = (index: number) => {
    setListaPartes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoverGrupo = (index: number) => {
    setListaGrupos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const term = searchValue.trim();
    if (!term) return;

    const normalizedTerm = term.toLowerCase();
    const shouldRecompute =
      normalizedTerm !== lastSearchTerm || currentSearchIndex === -1 || searchResults.length === 0;

    let results = searchResults;
    let index = currentSearchIndex;

    if (shouldRecompute) {
      results = kanbanRows
        .map((row, rowIndex) =>
          row.numeroParte.toLowerCase().includes(normalizedTerm) ? rowIndex : -1
        )
        .filter((rowIndex) => rowIndex >= 0);

      if (results.length === 0) {
        window.alert('No hay resultados');
        setSearchResults([]);
        setCurrentSearchIndex(-1);
        setLastSearchTerm(normalizedTerm);
        return;
      }

      index = 0;
      setSearchResults(results);
      setCurrentSearchIndex(index);
      setLastSearchTerm(normalizedTerm);
    }

    if (results.length > 0) {
      if (index >= results.length) {
        window.alert('No hay mas resultados');
        setSearchValue('');
        setSearchResults([]);
        setCurrentSearchIndex(-1);
        setSelectedKanbanIndex(null);
        setAddNumeroParte('');
        setAddTipo('');
        return;
      }

      const rowIndex = results[index];
      handleKanbanRowSelect(rowIndex);
      const rowEl = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
      if (rowEl instanceof HTMLElement) {
        rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      setCurrentSearchIndex(index + 1);
    } else {
      window.alert('No hay resultados');
    }
  };

  const handleViperSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const term = searchViperValue.trim();
    if (!term) return;

    const normalizedTerm = term.toLowerCase();
    const shouldRecompute =
      normalizedTerm !== lastViperSearchTerm || currentViperSearchIndex === -1 || searchViperResults.length === 0;

    let results = searchViperResults;
    let index = currentViperSearchIndex;

    if (shouldRecompute) {
      results = viperRows
        .map((row, rowIndex) =>
          row.grupoLogistico.toLowerCase().includes(normalizedTerm) ? rowIndex : -1
        )
        .filter((rowIndex) => rowIndex >= 0);

      if (results.length === 0) {
        window.alert('No hay resultados');
        setSearchViperResults([]);
        setCurrentViperSearchIndex(-1);
        setLastViperSearchTerm(normalizedTerm);
        return;
      }

      index = 0;
      setSearchViperResults(results);
      setCurrentViperSearchIndex(index);
      setLastViperSearchTerm(normalizedTerm);
    }

    if (results.length > 0) {
      if (index >= results.length) {
        window.alert('No hay mas resultados');
        setSearchViperValue('');
        setSearchViperResults([]);
        setCurrentViperSearchIndex(-1);
        setSelectedViperIndex(null);
        setAddGrupoLogistico('');
        setAddColorGrupo('');
        return;
      }

      const rowIndex = results[index];
      handleViperRowSelect(rowIndex);
      const rowEl = document.querySelector(`tr[data-viper-row-index="${rowIndex}"]`);
      if (rowEl instanceof HTMLElement) {
        rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      setCurrentViperSearchIndex(index + 1);
    } else {
      window.alert('No hay resultados');
    }
  };

  const handleBoaSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const term = searchBOAValue.trim();
    if (!term) return;

    const normalizedTerm = term.toLowerCase();
    const shouldRecompute =
      normalizedTerm !== lastBOASearchTerm || currentBOASearchIndex === -1 || searchBOAResults.length === 0;

    let results = searchBOAResults;
    let index = currentBOASearchIndex;

    if (shouldRecompute) {
      results = boaRows
        .map((row, rowIndex) =>
          row.grupoLogistico.toLowerCase().includes(normalizedTerm) ? rowIndex : -1
        )
        .filter((rowIndex) => rowIndex >= 0);

      if (results.length === 0) {
        window.alert('No hay resultados');
        setSearchBOAResults([]);
        setCurrentBOASearchIndex(-1);
        setLastBOASearchTerm(normalizedTerm);
        return;
      }

      index = 0;
      setSearchBOAResults(results);
      setCurrentBOASearchIndex(index);
      setLastBOASearchTerm(normalizedTerm);
    }

    if (results.length > 0) {
      if (index >= results.length) {
        window.alert('No hay mas resultados');
        setSearchBOAValue('');
        setSearchBOAResults([]);
        setCurrentBOASearchIndex(-1);
        setSelectedBoaIndex(null);
        setAddGrupoLogistico('');
        setAddColorGrupo('');
        return;
      }

      const rowIndex = results[index];
      handleBoaRowSelect(rowIndex);
      const rowEl = document.querySelector(`tr[data-boa-row-index="${rowIndex}"]`);
      if (rowEl instanceof HTMLElement) {
        rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      setCurrentBOASearchIndex(index + 1);
    } else {
      window.alert('No hay resultados');
    }
  };

  const handleGuardarKanban = async () => {
    if (listaPartes.length === 0) {
      window.alert('Por favor agrega al menos un numero de parte.');
      return;
    }

    if (!addTipo.trim()) {
      window.alert('Por favor selecciona un tipo.');
      return;
    }

    try {
      setGuardandoKanban(true);
      const response = await fetch('/api/Disparo/SaveKanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partes: listaPartes,
          tipo: addTipo.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.error || 'Error al guardar Kanban');
        return;
      }

      if (data?.message) {
        window.alert(data.message);
      }

      setListaPartes([]);
      setAddNumeroParte('');
      setAddTipo('');
      setSelectedKanbanIndex(null);
      setSearchValue('');
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setLastSearchTerm('');
      setShowKanbanModal(false);
    } catch (error) {
      window.alert('Error al guardar Kanban');
    } finally {
      setGuardandoKanban(false);
    }
  };

  const handleGuardarViper = async () => {
    if (listaGrupos.length === 0) {
      window.alert('Por favor agrega al menos un grupo logistico.');
      return;
    }

    if (!addColorGrupo.trim()) {
      window.alert('Por favor selecciona un color de grupo.');
      return;
    }

    try {
      setGuardandoViper(true);
      const response = await fetch('/api/Disparo/SaveGruposViper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupos: listaGrupos,
          color: addColorGrupo.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.error || 'Error al guardar Grupos Viper');
        return;
      }

      if (data?.message) {
        window.alert(data.message);
      }

      setListaGrupos([]);
      setAddGrupoLogistico('');
      setAddColorGrupo('');
      setSelectedViperIndex(null);
      setSearchViperValue('');
      setSearchViperResults([]);
      setCurrentViperSearchIndex(-1);
      setLastViperSearchTerm('');
      setShowViperModal(false);
    } catch (error) {
      window.alert('Error al guardar Grupos Viper');
    } finally {
      setGuardandoViper(false);
    }
  };

  const handleGuardarBoa = async () => {
    if (listaGrupos.length === 0) {
      window.alert('Por favor agrega al menos un grupo logistico.');
      return;
    }

    if (!addColorGrupo.trim()) {
      window.alert('Por favor selecciona un color de grupo.');
      return;
    }

    try {
      setGuardandoBOA(true);
      const response = await fetch('/api/Disparo/SaveGruposBoa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupos: listaGrupos,
          color: addColorGrupo.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.error || 'Error al guardar Grupos BOA');
        return;
      }

      if (data?.message) {
        window.alert(data.message);
      }

      setListaGrupos([]);
      setAddGrupoLogistico('');
      setAddColorGrupo('');
      setSelectedBoaIndex(null);
      setSearchBOAValue('');
      setSearchBOAResults([]);
      setCurrentBOASearchIndex(-1);
      setLastBOASearchTerm('');
      setShowBOAModal(false);
    } catch (error) {
      window.alert('Error al guardar Grupos BOA');
    } finally {
      setGuardandoBOA(false);
    }
  };

  const handleEliminarKanban = async () => {
    if (selectedKanbanIndex === null) return;

    const numeroParte = kanbanRows[selectedKanbanIndex]?.numeroParte ?? '';
    const confirmed = window.confirm(
      `Seguro que deseas eliminar el numero de Parte ${numeroParte}?`
    );

    if (!confirmed) {
      setShowKanbanModal(false);
      return;
    }

    try {
      const response = await fetch('/api/Disparo/DeleteKanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroParte })
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.error || 'Error al eliminar Kanban');
        return;
      }

      await fetchKanban();
      window.alert(`Se elimino correctamente el numero de parte ${numeroParte}`);
    } catch (error) {
      window.alert('Error al eliminar Kanban');
    }
  };

  const handleEliminarViper = async () => {
    if (selectedViperIndex === null) return;

    const grupoLogistico = viperRows[selectedViperIndex]?.grupoLogistico ?? '';
    const confirmed = window.confirm(
      `Seguro que deseas eliminar el grupo logistico ${grupoLogistico}?`
    );

    if (!confirmed) {
      setShowViperModal(false);
      return;
    }

    try {
      const response = await fetch('/api/Disparo/DeleteGruposViper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoLogistico })
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.error || 'Error al eliminar Grupos Viper');
        return;
      }

      await fetchViper();
      window.alert(`Se elimino correctamente el grupo logistico ${grupoLogistico}`);
    } catch (error) {
      window.alert('Error al eliminar Grupos Viper');
    }
  };

    const handleEliminarBoa = async () => {
    if (selectedBoaIndex === null) return;

    const grupoLogistico = boaRows[selectedBoaIndex]?.grupoLogistico ?? '';
    const confirmed = window.confirm(
      `Seguro que deseas eliminar el grupo logistico ${grupoLogistico}?`
    );

    if (!confirmed) {
      setShowBOAModal(false);
      return;
    }

    try {
      const response = await fetch('/api/Disparo/DeleteGruposBoa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoLogistico })
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.error || 'Error al eliminar Grupos Boa');
        return;
      }

      await fetchBoa();
      window.alert(`Se elimino correctamente el grupo logistico ${grupoLogistico}`);
    } catch (error) {
      window.alert('Error al eliminar Grupos Boa');
    }
  };


  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <header className={styles.header}>
          <div className={styles.topBar}>
            <button
              className={styles.backButton}
              onClick={() => router.push('/disparo')}
              type="button"
            >
              ← Volver
            </button>
          </div>
          <span className={styles.kicker}>Viper & BOA</span>
          <div className={styles.headerTitleWithActions}>
            <h1 className={styles.title}>Travelers</h1>
            <div className={styles.actions}>
              <button
                className={`${styles.primaryButton} ${styles.primaryButtonHighlight}`}
                type="button"
                onClick={() => setShowUploadSection(true)}
              >
                Generar nuevos travelers
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  setShowViperModal(false);
                  setShowKanbanModal(true);
                }}
              >
                Kanban
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  setShowKanbanModal(false);
                  setShowViperModal(true);
                }}
              >
                Grupos logisticos Viper
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  setShowKanbanModal(false);
                  setShowBOAModal(true);
                }}
              >
                Grupos logisticos BOA
              </button>
              <button
                className={`${styles.primaryButton} ${styles.primaryButtonHighlight}`}
                type="button"
                onClick={() => {
                  setShowTravelerTypeModal(true);
                }}
              >
                Buscar travelers anteriores
              </button>
            </div>
          </div>
        </header>
        {showUploadSection && (
          <div className={styles.uploadSection}>
            <div className={styles.uploadRow}>
              <button
                className={styles.uploadButton}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir archivo
              </button>
              <span className={styles.uploadFileName}>
                {selectedFileName || 'Ningun archivo seleccionado'}
              </span>
              {isUploading && <span className={styles.uploadLoading}>Cargando...</span>}
              <input
                ref={fileInputRef}
                className={styles.uploadInput}
                type="file"
                accept=".csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedFileName(file ? file.name : '');
                  if (file) {
                    handleUploadFile(file);
                  }
                }}
              />
            </div>
            {(uploadError || generatedCount !== null) && (
              <div className={styles.uploadResult}>
                {uploadError ? (
                  <span className={styles.uploadError}>{uploadError}</span>
                ) : (
                  <div className={styles.uploadResultHeader}>
                    <span className={styles.uploadSuccess}>
                      Se generaron {generatedCount ?? 0} Travelers.
                    </span>
                    {(generatedCount ?? 0) > 0 && (
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={handleSaveAllTravelers}
                        disabled={isSavingTravelers}
                      >
                        {isSavingTravelers ? 'Guardando...' : 'Guardar todos'}
                      </button>
                    )}
                  </div>
                )}
                {generatedTravelers.length > 0 && (
                  <div className={styles.uploadList}>
                    {generatedTravelers.map((name, idx) => (
                      <div key={`${name}-${idx}`} className={styles.uploadListItem}>
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {showBuscarTravelers && travelerType === 'viper' && (
          <div className={styles.filterSection}>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Año:</label>
                <select
                  className={styles.filterSelect}
                  value={selectedAno}
                  onChange={(e) => {
                    const ano = e.target.value;
                    setSelectedAno(ano);
                    setSelectedSemana('');
                    fetchSemanasByAno(ano);
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {anos.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Semana:</label>
                <select
                  className={styles.filterSelect}
                  value={selectedSemana}
                  onChange={(e) => setSelectedSemana(e.target.value)}
                  disabled={!selectedAno}
                >
                  <option value="">Seleccionar...</option>
                  {semanas.map((semana) => (
                    <option key={semana} value={semana}>
                      {semana}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className={styles.filterButton}
                type="button"
                onClick={() => {
                  if (!selectedSemana || !selectedAno) {
                    window.alert('Por favor selecciona Año y Semana');
                    return;
                  }
                  window.alert(`Buscando travelers VIPER de Semana ${selectedSemana}, Año ${selectedAno}`);
                }}
              >
                Buscar
              </button>
            </div>
          </div>
        )}
        {isSavingTravelers && (
          <div className={styles.modalOverlay}>
            <div className={styles.loadingModal}>
              <h2 className={styles.loadingTitle}>Descargando PDFs...</h2>
              <div className={styles.loadingDots}>
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
              </div>
              <p className={styles.loadingText}>Por favor espera, esto puede demorar.</p>
            </div>
          </div>
        )}
        {showBuscarTravelers && travelerType === 'disparo' && (
          <div className={styles.filterSection}>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Año:</label>
                <select
                  className={styles.filterSelect}
                  value={selectedAnoDisparo}
                  onChange={(e) => {
                    const ano = e.target.value;
                    setSelectedAnoDisparo(ano);
                    setSelectedTipoDisparo('');
                    setTiposDisparo([]);
                    if (ano && selectedDia) {
                      fetchTiposByAnoAndFecha(ano, selectedDia);
                    }
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {anosDisparo.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Día:</label>
                <input
                  type="date"
                  className={styles.filterSelect}
                  value={selectedDia}
                  onChange={(e) => {
                    const fecha = e.target.value;
                    setSelectedDia(fecha);
                    setSelectedTipoDisparo('');
                    setTiposDisparo([]);
                    if (selectedAnoDisparo && fecha) {
                      fetchTiposByAnoAndFecha(selectedAnoDisparo, fecha);
                    }
                  }}
                />
              </div>
              <div className={styles.filterField}>
                <label className={styles.filterLabel}>Tipo:</label>
                <select
                  className={styles.filterSelect}
                  value={selectedTipoDisparo}
                  onChange={(e) => setSelectedTipoDisparo(e.target.value)}
                  disabled={!selectedAnoDisparo || !selectedDia}
                >
                  <option value="">Seleccionar...</option>
                  {tiposDisparo.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className={styles.filterButton}
                type="button"
                onClick={() => {
                  if (!selectedAnoDisparo || !selectedDia || !selectedTipoDisparo) {
                    window.alert('Por favor selecciona Año, Día y Tipo');
                    return;
                  }
                  window.alert(`Buscando travelers DISPARO de Año ${selectedAnoDisparo}, Día ${selectedDia}, Tipo ${selectedTipoDisparo}`);
                }}
              >
                Buscar
              </button>
            </div>
          </div>
        )}
      </section>

      {showTravelerTypeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.typeSelectionModal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Seleccionar tipo de Travelers</h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setShowTravelerTypeModal(false);
                }}
                type="button"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className={styles.typeSelectionButtons}>
              <button
                className={styles.typeButton}
                type="button"
                onClick={() => {
                  setTravelerType('disparo');
                  setShowTravelerTypeModal(false);
                  setShowBuscarTravelers(true);
                  fetchPackingBoaFilters();
                }}
              >
                Travelers Disparo
              </button>
              <button
                className={styles.typeButton}
                type="button"
                onClick={() => {
                  setTravelerType('viper');
                  setShowTravelerTypeModal(false);
                  setShowBuscarTravelers(true);
                  fetchPackingFilters();
                }}
              >
                Travelers VIPER
              </button>
            </div>
          </div>
        </div>
      )}

      {showKanbanModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Kanban</h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setShowKanbanModal(false);
                }}
                type="button"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalLeft}>
                <div className={styles.searchRowLeft}>
                  <label className={styles.modalLabel}>Buscar Numero de Parte:</label>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
                <div className={styles.listTableWrap}>
                  <table className={styles.listTable}>
                    <thead>
                      <tr>
                        <th className={styles.indicatorHeader}></th>
                        <th>Numero de Parte</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kanbanLoading ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>Cargando...</td>
                          <td></td>
                        </tr>
                      ) : kanbanError ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>{kanbanError}</td>
                          <td></td>
                        </tr>
                      ) : kanbanRows.length === 0 ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>Sin registros</td>
                          <td>-</td>
                        </tr>
                      ) : (
                        kanbanRows.map((row, index) => (
                          <tr
                            className={`${styles.listRow} ${selectedKanbanIndex === index ? styles.listRowSelected : ''}`}
                            key={`${row.numeroParte}-${index}`}
                            onClick={() => handleKanbanRowSelect(index)}
                            data-row-index={index}
                          >
                            <td className={styles.rowIndicator}>
                              {selectedKanbanIndex === index ? '▶' : ''}
                            </td>
                            <td>{row.numeroParte}</td>
                            <td>{row.tipo}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.modalRight}>
                <div className={styles.rightActions}>
                  <button
                    className={`${styles.modalButton} ${styles.actionButton}`}
                    type="button"
                    disabled={selectedKanbanIndex === null}
                  >
                    Editar
                  </button>
                  <button
                    className={`${styles.iconButton} ${styles.actionButton}`}
                    type="button"
                    aria-label="Eliminar"
                    disabled={selectedKanbanIndex === null}
                    onClick={handleEliminarKanban}
                  >
                    🗑️
                  </button>
                </div>

                <div className={styles.sectionTitle}>Agregar Numero de Parte</div>
                <div className={`${styles.addRow} ${styles.addRowTight}`}>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={addNumeroParte}
                    onChange={(event) => setAddNumeroParte(event.target.value)}
                  />
                  <button
                    className={`${styles.modalButton} ${styles.addButton}`}
                    type="button"
                    onClick={handleAgregarParte}
                  >
                    Agregar
                  </button>
                </div>

                <div className={styles.addRow}>
                  <div className={styles.listBox}>
                    {listaPartes.length === 0 ? (
                      <div className={styles.listEmpty}>Sin elementos</div>
                    ) : (
                      <ul className={styles.listItems}>
                        {listaPartes.map((item, index) => (
                          <li 
                            key={`${item}-${index}`} 
                            className={styles.listItem}
                          >
                            <span>{item}</span>
                            <button
                              className={styles.listItemRemove}
                              onClick={() => handleRemoverParte(index)}
                              type="button"
                              aria-label="Eliminar"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.typeColumn}>
                    <label className={styles.modalLabel}>Tipo:</label>
                    <select
                      className={styles.modalSelect}
                      value={addTipo}
                      onChange={(event) => setAddTipo(event.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Kanban">Kanban</option>
                      <option value="ASSY">ASSY</option>
                    </select>
                    <button
                      className={`${styles.modalButton} ${styles.saveButton}`}
                      type="button"
                      onClick={handleGuardarKanban}
                      disabled={guardandoKanban}
                    >
                      {guardandoKanban ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViperModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Viper</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowViperModal(false)}
                type="button"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalLeft}>
                <div className={styles.searchRowLeft}>
                  <label className={styles.modalLabel}>Buscar Grupo Logistico:</label>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={searchViperValue}
                    onChange={(event) => setSearchViperValue(event.target.value)}
                    onKeyDown={handleViperSearchKeyDown}
                  />
                </div>
                <div className={styles.listTableWrap}>
                  <table className={styles.listTable}>
                    <thead>
                      <tr>
                        <th className={styles.indicatorHeader}></th>
                        <th>Grupo Logistico</th>
                        <th>Color Grupo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viperLoading ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>Cargando...</td>
                          <td></td>
                        </tr>
                      ) : viperError ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>{viperError}</td>
                          <td></td>
                        </tr>
                      ) : viperRows.length === 0 ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>Sin registros</td>
                          <td>-</td>
                        </tr>
                      ) : (
                        viperRows.map((row, index) => (
                          <tr
                            className={`${styles.listRow} ${selectedViperIndex === index ? styles.listRowSelected : ''}`}
                            key={`${row.grupoLogistico}-${index}`}
                            onClick={() => handleViperRowSelect(index)}
                            data-viper-row-index={index}
                          >
                            <td className={styles.rowIndicator}>
                              {selectedViperIndex === index ? '▶' : ''}
                            </td>
                            <td>{row.grupoLogistico}</td>
                            <td>{row.colorGrupo}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.modalRight}>
                <div className={styles.rightActions}>
                  <button
                    className={`${styles.modalButton} ${styles.actionButton}`}
                    type="button"
                    disabled={selectedViperIndex === null}
                  >
                    Editar
                  </button>
                  <button
                    className={`${styles.iconButton} ${styles.actionButton}`}
                    type="button"
                    aria-label="Eliminar"
                    disabled={selectedViperIndex === null}
                    onClick={handleEliminarViper}
                  >
                    🗑️
                  </button>
                </div>

                <div className={styles.sectionTitle}>Agregar Nuevo Grupo Logistico</div>
                <div className={`${styles.addRow} ${styles.addRowTight}`}>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={addGrupoLogistico}
                    onChange={(event) => setAddGrupoLogistico(event.target.value)}
                  />
                  <button
                    className={`${styles.modalButton} ${styles.addButton}`}
                    type="button"
                    onClick={handleAgregarGrupo}
                  >
                    Agregar
                  </button>
                </div>

                <div className={styles.addRow}>
                  <div className={styles.listBox}>
                    {listaGrupos.length === 0 ? (
                      <div className={styles.listEmpty}>Sin elementos</div>
                    ) : (
                      <ul className={styles.listItems}>
                        {listaGrupos.map((item, index) => (
                          <li 
                            key={`${item}-${index}`} 
                            className={styles.listItem}
                          >
                            <span>{item}</span>
                            <button
                              className={styles.listItemRemove}
                              onClick={() => handleRemoverGrupo(index)}
                              type="button"
                              aria-label="Eliminar"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.typeColumn}>
                    <label className={styles.modalLabel}>Color Grupo:</label>
                    <select
                      className={styles.modalSelect}
                      value={addColorGrupo}
                      onChange={(event) => setAddColorGrupo(event.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Rosa">Rosa</option>
                      <option value="Amarillo">Amarillo</option>
                      <option value="Verde">Verde</option>
                    </select>
                    <button
                      className={`${styles.modalButton} ${styles.saveButton}`}
                      type="button"
                      onClick={handleGuardarViper}
                      disabled={guardandoViper}
                    >
                      {guardandoViper ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBOAModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>BOA</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowBOAModal(false)}
                type="button"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalLeft}>
                <div className={styles.searchRowLeft}>
                  <label className={styles.modalLabel}>Buscar Grupo Logistico:</label>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={searchBOAValue}
                    onChange={(event) => setSearchBOAValue(event.target.value)}
                    onKeyDown={handleBoaSearchKeyDown}
                  />
                </div>
                <div className={styles.listTableWrap}>
                  <table className={styles.listTable}>
                    <thead>
                      <tr>
                        <th className={styles.indicatorHeader}></th>
                        <th>Grupo Logistico</th>
                        <th>Color Grupo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boaLoading ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>Cargando...</td>
                          <td></td>
                        </tr>
                      ) : boaError ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>{boaError}</td>
                          <td></td>
                        </tr>
                      ) : boaRows.length === 0 ? (
                        <tr className={styles.listRow}>
                          <td className={styles.rowIndicator}></td>
                          <td>Sin registros</td>
                          <td>-</td>
                        </tr>
                      ) : (
                        boaRows.map((row, index) => (
                          <tr
                            className={`${styles.listRow} ${selectedBoaIndex === index ? styles.listRowSelected : ''}`}
                            key={`${row.grupoLogistico}-${index}`}
                            onClick={() => handleBoaRowSelect(index)}
                            data-boa-row-index={index}
                          >
                            <td className={styles.rowIndicator}>
                              {selectedBoaIndex === index ? '▶' : ''}
                            </td>
                            <td>{row.grupoLogistico}</td>
                            <td>{row.colorGrupo}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.modalRight}>
                <div className={styles.rightActions}>
                  <button
                    className={`${styles.modalButton} ${styles.actionButton}`}
                    type="button"
                    disabled={selectedBoaIndex === null}
                  >
                    Editar
                  </button>
                  <button
                    className={`${styles.iconButton} ${styles.actionButton}`}
                    type="button"
                    aria-label="Eliminar"
                    disabled={selectedBoaIndex === null}
                    onClick={handleEliminarBoa}
                  >
                    🗑️
                  </button>
                </div>

                <div className={styles.sectionTitle}>Agregar Nuevo Grupo Logistico</div>
                <div className={`${styles.addRow} ${styles.addRowTight}`}>
                  <input
                    className={styles.modalInput}
                    type="text"
                    value={addGrupoLogistico}
                    onChange={(event) => setAddGrupoLogistico(event.target.value)}
                  />
                  <button
                    className={`${styles.modalButton} ${styles.addButton}`}
                    type="button"
                    onClick={handleAgregarGrupo}
                  >
                    Agregar
                  </button>
                </div>

                <div className={styles.addRow}>
                  <div className={styles.listBox}>
                    {listaGrupos.length === 0 ? (
                      <div className={styles.listEmpty}>Sin elementos</div>
                    ) : (
                      <ul className={styles.listItems}>
                        {listaGrupos.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className={styles.listItem}
                          >
                            <span>{item}</span>
                            <button
                              className={styles.listItemRemove}
                              onClick={() => handleRemoverGrupo(index)}
                              type="button"
                              aria-label="Eliminar"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.typeColumn}>
                    <label className={styles.modalLabel}>Color Grupo:</label>
                    <select
                      className={styles.modalSelect}
                      value={addColorGrupo}
                      onChange={(event) => setAddColorGrupo(event.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Rosa">Rosa</option>
                      <option value="Amarillo">Amarillo</option>
                      <option value="Verde">Verde</option>
                    </select>
                    <button
                      className={`${styles.modalButton} ${styles.saveButton}`}
                      type="button"
                      onClick={handleGuardarBoa}
                      disabled={guardandoBOA}
                    >
                      {guardandoBOA ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
