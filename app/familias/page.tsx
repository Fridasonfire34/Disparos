'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './familias.module.css';
import formStyles from './addFamilyForm.module.css';

interface Familia {
  Linea: string;
  'Numero de Parte': string;
  [key: string]: any;
}

export default function FamiliasDisparo() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [lineas, setLineas] = useState<string[]>([]);
  const [numerosParte, setNumerosParte] = useState<string[]>([]);
  const [selectedLinea, setSelectedLinea] = useState<string>('');
  const [selectedNumeroParte, setSelectedNumeroParte] = useState<string>('');
  
  const [selectedLineaFamily, setSelectedLineaFamily] = useState<string>('');
  const [manualFamiliaName, setManualFamiliaName] = useState<string>('');
  const [numeroPiezaInput, setNumeroPiezaInput] = useState<string>('');
  const [piezasAgregadas, setPiezasAgregadas] = useState<string[]>([]);

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
    fetchLineas();
  }, []);

  useEffect(() => {
    if (selectedLinea) {
      fetchNumerosParte(selectedLinea);
    } else {
      setNumerosParte([]);
      setSelectedNumeroParte('');
    }
  }, [selectedLinea]);

  const fetchLineas = async () => {
    try {
      const response = await fetch('/api/Disparo/GetLineasFamilias');
      const data = await response.json();
      setLineas(data.map((item: any) => item.Linea));
    } catch (error) {
      console.error('Error al cargar líneas:', error);
      alert('Error al cargar las líneas');
    }
  };

  const fetchNumerosParte = async (linea: string) => {
    try {
      const response = await fetch(`/api/Disparo/GetNumerosParteFamilias?linea=${encodeURIComponent(linea)}`);
      const data = await response.json();
      setNumerosParte(data.map((item: any) => item['Numero de Parte']));
      setSelectedNumeroParte('');
    } catch (error) {
      console.error('Error al cargar números de parte:', error);
      alert('Error al cargar los números de parte');
    }
  };

  const handleDelete = async () => {
    let numeroParte: string | null = null;
    let linea: string | null = null;

    if (selectedLinea && selectedNumeroParte) {
      numeroParte = selectedNumeroParte;
      linea = selectedLinea;
    } else {
      alert('Por favor elige una línea y una pieza de las listas desplegables.');
      return;
    }

    const confirmResult = confirm(`¿Seguro que deseas eliminar la pieza ${numeroParte} de la familia ${linea}?`);
    if (!confirmResult) return;

    const password = prompt('Introduce la contraseña para continuar:');
    if (!password) return;

    try {
      const response = await fetch('/api/Disparo/DeleteFamilia', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numeroParte, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('La pieza se eliminó correctamente.');
        setSelectedLinea('');
        setSelectedNumeroParte('');
      } else if (response.status === 401) {
        alert('Contraseña incorrecta. No se puede realizar la eliminación.');
      } else {
        alert(data.message || 'Error al eliminar la familia');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la familia');
    }
  };

  const handleAgregarPieza = () => {
    if (!numeroPiezaInput.trim()) {
      alert('Por favor ingresa un número de pieza.');
      return;
    }

    if (!selectedLineaFamily && !manualFamiliaName.trim()) {
      alert('Por favor selecciona una línea o ingresa un nombre de familia.');
      return;
    }

    setPiezasAgregadas([...piezasAgregadas, numeroPiezaInput.trim()]);
    setNumeroPiezaInput('');
  };

  const handleGuardar = async () => {
    if (piezasAgregadas.length === 0) {
      alert('Por favor agrega al menos una pieza.');
      return;
    }

    const familiaName = selectedLineaFamily || manualFamiliaName;

    if (!familiaName || familiaName.trim() === '') {
      alert('Por favor selecciona o ingresa la familia.');
      return;
    }

    const piezasAGuardar: string[] = [];
    const piezasExistentes: { pieza: string; linea: string }[] = [];

    try {
      for (const numeroDeParte of piezasAgregadas) {
        try {
          const checkResponse = await fetch('/api/Disparo/CheckPieza', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeroDeParte }),
          });

          const checkData = await checkResponse.json();

          if (checkData.existe) {
            piezasExistentes.push({
              pieza: numeroDeParte,
              linea: checkData.linea,
            });
          } else {
            piezasAGuardar.push(numeroDeParte);
          }
        } catch (error) {
          console.error(`Error al verificar pieza ${numeroDeParte}:`, error);
        }
      }

      if (piezasExistentes.length > 0) {
        const mensaje = piezasExistentes
          .map((item) => `La pieza ${item.pieza} ya existe en la Familia: ${item.linea}`)
          .join('\n');
        alert(mensaje);
      }

      if (piezasAGuardar.length === 0) {
        if (piezasExistentes.length === piezasAgregadas.length) {
          return;
        }
        alert('No hay piezas nuevas para guardar.');
        return;
      }

      const response = await fetch('/api/Disparo/AddFamilia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linea: familiaName.trim(),
          piezas: piezasAGuardar,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (piezasExistentes.length > 0) {
          alert(`Se guardaron ${piezasAGuardar.length} pieza(s). ${piezasExistentes.length} pieza(s) no se guardaron porque ya existen.`);
        } else {
          alert('Familia guardada correctamente.');
        }
        
        await fetchLineas();
        
        if (selectedLinea) {
          await fetchNumerosParte(selectedLinea);
        }
        
        setSelectedLineaFamily('');
        setManualFamiliaName('');
        setNumeroPiezaInput('');
        setPiezasAgregadas([]);
      } else {
        alert(data.message || 'Error al guardar la familia');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la familia');
    }
  };

  const handleRemovePieza = (index: number) => {
    setPiezasAgregadas(piezasAgregadas.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Familias de Disparo</h1>
        <button 
          onClick={() => router.push('/disparo')}
          className={styles.backButton}
        >
          ← Volver
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.comboContainer}>
          <label htmlFor="linea">Línea:</label>
          <select
            id="linea"
            value={selectedLinea}
            onChange={(e) => setSelectedLinea(e.target.value)}
            className={styles.comboBox}
          >
            <option value="">-- Seleccionar Línea --</option>
            {lineas.map((linea, index) => (
              <option key={index} value={linea}>
                {linea}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.comboContainer}>
          <label htmlFor="numeroParte">Número de Parte:</label>
          <select
            id="numeroParte"
            value={selectedNumeroParte}
            onChange={(e) => setSelectedNumeroParte(e.target.value)}
            className={styles.comboBox}
            disabled={!selectedLinea}
          >
            <option value="">-- Seleccionar Número de Parte --</option>
            {numerosParte.map((numero, index) => (
              <option key={index} value={numero}>
                {numero}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDelete}
          className={styles.deleteButton}
          disabled={!selectedLinea || !selectedNumeroParte}
        >
          Eliminar
        </button>
      </div>

      <div className={styles.subHeader}>
        <h2>Agregar nueva Familia al Disparo</h2>
      </div>

      <div className={formStyles.addFamilyForm}>
        <div className={formStyles.formRow}>
          <div className={formStyles.formGroup}>
            <label htmlFor="lineaFamily">Nombre de la familia:</label>
            <select
              id="lineaFamily"
              value={selectedLineaFamily}
              onChange={(e) => setSelectedLineaFamily(e.target.value)}
              className={styles.comboBox}
            >
              <option value="">-- Seleccionar Línea --</option>
              {lineas.map((linea, index) => (
                <option key={index} value={linea}>
                  {linea}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.divider}>O</div>

          <div className={formStyles.formGroup}>
            <label htmlFor="manualFamilia">Nombre:</label>
            <input
              id="manualFamilia"
              type="text"
              value={manualFamiliaName}
              onChange={(e) => setManualFamiliaName(e.target.value)}
              className={formStyles.textInput}
              disabled={!!selectedLineaFamily}
              placeholder="Ingresa un nombre"
            />
          </div>
        </div>

        <div className={formStyles.formRow}>
          <div className={formStyles.formGroup}>
            <label htmlFor="numeroPieza">Número de pieza:</label>
            <input
              id="numeroPieza"
              type="text"
              value={numeroPiezaInput}
              onChange={(e) => setNumeroPiezaInput(e.target.value)}
              className={formStyles.textInput}
              placeholder="Ingresa el número de pieza"
            />
          </div>

          <button
            onClick={handleAgregarPieza}
            className={formStyles.addButton}
          >
            Agregar
          </button>
        </div>

        {piezasAgregadas.length > 0 && (
          <div className={formStyles.piezasContainer}>
            <label>Piezas agregadas:</label>
            <div className={formStyles.listbox}>
              {piezasAgregadas.map((pieza, index) => (
                <div key={index} className={formStyles.listboxItem}>
                  <span>{pieza}</span>
                  <button
                    onClick={() => handleRemovePieza(index)}
                    className={formStyles.removeButton}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGuardar}
          className={formStyles.saveButton}
          disabled={piezasAgregadas.length === 0}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
