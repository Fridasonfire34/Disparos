'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './secuenciasViperBoa.module.css';

interface Secuencia {
  ID: string;
  Secuencia: string;
  Linea: string;
  Tipo: string;
}

export default function SecuenciasViperBoa() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [secuencias, setSecuencias] = useState<Secuencia[]>([]);
  const [filteredSecuencias, setFilteredSecuencias] = useState<Secuencia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecuencia, setSelectedSecuencia] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [secuenciaInput, setSecuenciaInput] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Viper');
  const [secuenciasAgregadas, setSecuenciasAgregadas] = useState<{ secuencia: string; tipo: string }[]>([]);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [editSecuenciaId, setEditSecuenciaId] = useState<string | null>(null);
  const [editSecuenciaInput, setEditSecuenciaInput] = useState('');
  const [editTipoSeleccionado, setEditTipoSeleccionado] = useState('Viper');

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
    fetchSecuencias();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredSecuencias(secuencias);
    } else {
      const filtered = secuencias.filter(
        (sec) =>
          sec.Secuencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sec.Linea.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSecuencias(filtered);
    }
  }, [searchTerm, secuencias]);

  const fetchSecuencias = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Disparo/GetViperBoaSequences');
      const data = await response.json();
      
      if (response.ok) {
        setSecuencias(data.data || []);
        setFilteredSecuencias(data.data || []);
      } else {
        alert('Error al cargar las secuencias');
      }
    } catch (error) {
      console.error('Error al cargar secuencias:', error);
      alert('Error al cargar las secuencias');
    } finally {
      setLoading(false);
    }
  };

  const handleRegresar = () => {
    router.push('/disparo');
  };

  const handleAgregarEditar = () => {
    setShowAgregarModal(true);
  };

  const handleEliminar = async () => {
    if (!selectedSecuencia) {
      alert('Por favor selecciona una secuencia para eliminar');
      return;
    }

    const confirmResult = window.confirm('¿Estás seguro de que deseas eliminar esta secuencia?');
    if (!confirmResult) return;

    try {
      const response = await fetch('/api/Disparo/DeleteViperBoaSequence', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSecuencia }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Secuencia eliminada exitosamente.');
        setSelectedSecuencia(null);
        fetchSecuencias();
      } else {
        alert(data.error || 'Error al eliminar la secuencia');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la secuencia');
    }
  };

  const handleAgregarSecuencia = () => {
    if (!secuenciaInput.trim()) {
      alert('Por favor, escribe una secuencia para agregar');
      return;
    }

    setSecuenciasAgregadas([
      ...secuenciasAgregadas,
      { secuencia: secuenciaInput.trim(), tipo: tipoSeleccionado }
    ]);
    setSecuenciaInput('');
  };

  const handleRemoveSecuencia = (index: number) => {
    setSecuenciasAgregadas(secuenciasAgregadas.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (secuenciasAgregadas.length === 0) {
      if (!secuenciaInput.trim() || !tipoSeleccionado) {
        alert('Por favor ingresa una secuencia y selecciona un tipo');
        return;
      }

      try {
        const checkResponse = await fetch('/api/Disparo/CheckSequence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secuencia: secuenciaInput.trim() }),
        });

        if (checkResponse.ok) {
          const { existe, linea } = await checkResponse.json();
          if (existe) {
            alert(`Esta secuencia ya se encuentra registrada en la tabla como ${linea}`);
            return;
          }
        }

        const insertResponse = await fetch('/api/Disparo/AddViperBoaSequence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secuencia: secuenciaInput.trim(),
            tipo: tipoSeleccionado,
          }),
        });

        if (insertResponse.ok) {
          alert('Secuencia guardada exitosamente.');
          setSecuenciaInput('');
          setTipoSeleccionado('Viper');
          fetchSecuencias(); // Recargar tabla
        } else {
          const errorData = await insertResponse.json();
          alert(errorData.error || 'Error al guardar secuencia');
        }
      } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar secuencia');
      }
    }
    else {
      const foundSequences: string[] = [];
      const notFoundSequences: { secuencia: string; tipo: string }[] = [];

      try {
        for (const item of secuenciasAgregadas) {
          const checkResponse = await fetch('/api/Disparo/CheckSequence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secuencia: item.secuencia }),
          });

          if (checkResponse.ok) {
            const { existe, linea } = await checkResponse.json();
            if (existe) {
              foundSequences.push(`${item.secuencia} (registrada como ${linea})`);
            } else {
              notFoundSequences.push(item);
            }
          }
        }

        if (foundSequences.length > 0) {
          const message = `Las siguientes secuencias ya están registradas en la tabla:\n${foundSequences.join('\n')}`;
          alert(message);
          return;
        }

        if (notFoundSequences.length > 0) {
          const insertResponse = await fetch('/api/Disparo/SaveViperBoaSequences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequences: notFoundSequences }),
          });

          if (insertResponse.ok) {
            alert('Secuencias guardadas exitosamente.');
            setSecuenciasAgregadas([]);
            fetchSecuencias();
          } else {
            const errorData = await insertResponse.json();
            alert(errorData.error || 'Error al guardar secuencias');
          }
        }
      } catch (error) {
        console.error('Error al guardar secuencias:', error);
        alert('Error al guardar secuencias');
      }
    }
  };

  const handleEditar = () => {
    if (!selectedSecuencia) {
      alert('Por favor selecciona una secuencia para editar');
      return;
    }

    const secuenciaParaEditar = filteredSecuencias.find((sec) => sec.ID === selectedSecuencia);
    
    if (secuenciaParaEditar) {
      setEditSecuenciaId(secuenciaParaEditar.ID);
      setEditSecuenciaInput(secuenciaParaEditar.Secuencia);
      setEditTipoSeleccionado(secuenciaParaEditar.Tipo);
      setShowEditarModal(true);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!editSecuenciaInput.trim()) {
      alert('Por favor ingresa un número de secuencia');
      return;
    }

    try {
      const response = await fetch('/api/Disparo/UpdateViperBoaSequence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editSecuenciaId,
          secuencia: editSecuenciaInput.trim(),
          tipo: editTipoSeleccionado
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Secuencia actualizada correctamente');
        setShowEditarModal(false);
        setEditSecuenciaId(null);
        fetchSecuencias();
      } else {
        alert(data.error || 'Error al actualizar la secuencia');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar la secuencia');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Secuencias Viper & BOA</h1>
        <button onClick={handleRegresar} className={styles.regresarButton}>
          Regresar
        </button>
      </div>

      <div className={styles.searchSection}>
        <label htmlFor="search">Buscar secuencia:</label>
        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          placeholder="Buscar por secuencia o línea..."
        />
      </div>

      <div className={styles.mainContent}>
        {/* Lado Izquierdo: Tabla */}
        <div className={styles.tableSection}>
          {loading ? (
            <div className={styles.loadingBar}>Cargando...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Secuencia</th>
                    <th>Línea</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSecuencias.map((sec, index) => (
                    <tr
                      key={`${sec.ID}-${index}`}
                      onClick={() => setSelectedSecuencia(selectedSecuencia === sec.ID ? null : sec.ID)}
                      className={selectedSecuencia === sec.ID ? styles.selected : ''}
                    >
                      <td>{sec.Secuencia}</td>
                      <td>{sec.Linea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSecuencias.length === 0 && !loading && (
                <p className={styles.noResults}>No se encontraron secuencias</p>
              )}
            </div>
          )}
        </div>

        {/* Lado Derecho: Controles */}
        <div className={styles.controlsSection}>
          <a onClick={handleAgregarEditar} className={styles.link}>
            Agregar o editar secuencias
          </a>

          {/* Formulario para agregar secuencias */}
          <div className={styles.formSection}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="secuencia">Secuencia</label>
                <input
                  id="secuencia"
                  type="number"
                  value={secuenciaInput}
                  onChange={(e) => setSecuenciaInput(e.target.value)}
                  className={styles.formInput}
                  placeholder="Ingresa secuencia"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tipo">Tipo</label>
                <select
                  id="tipo"
                  value={tipoSeleccionado}
                  onChange={(e) => setTipoSeleccionado(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="Viper">Viper</option>
                  <option value="BOA">BOA</option>
                </select>
              </div>

              <button onClick={handleAgregarSecuencia} className={styles.agregarButton}>
                Agregar
              </button>
            </div>

            {/* Listbox con secuencias agregadas */}
            {secuenciasAgregadas.length > 0 && (
              <div className={styles.listboxSection}>
                <label>Secuencias agregadas:</label>
                <div className={styles.listbox}>
                  {secuenciasAgregadas.map((item, index) => (
                    <div key={`item-${index}`} className={styles.listboxItem}>
                      <span>
                        {item.secuencia} - {item.tipo}
                      </span>
                      <button
                        onClick={() => handleRemoveSecuencia(index)}
                        className={styles.removeButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.buttonRow}>
            <button 
              onClick={handleGuardar}
              disabled={secuenciasAgregadas.length === 0 && (!secuenciaInput.trim() || !tipoSeleccionado)}
              className={styles.saveButton}
            >
              Guardar
            </button>
            <button 
              onClick={handleEditar}
              disabled={!selectedSecuencia}
              className={styles.editarButton}
            >
              Editar
            </button>
            <button 
              onClick={handleEliminar}
              disabled={!selectedSecuencia}
              className={styles.eliminarButton}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Modal Agregar */}
      {showAgregarModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAgregarModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar secuencia</h2>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowAgregarModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Para editar una secuencia o eliminar, selecciona la fila en la tabla y luego haz clic en editar</p>
            </div>
            <div className={styles.modalFooter}>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditarModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditarModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar Secuencia</h2>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowEditarModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="editSecuencia">Secuencia</label>
                  <input
                    id="editSecuencia"
                    type="number"
                    value={editSecuenciaInput}
                    onChange={(e) => setEditSecuenciaInput(e.target.value)}
                    className={styles.formInput}
                    placeholder="Ingresa secuencia"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="editTipo">Tipo</label>
                  <select
                    id="editTipo"
                    value={editTipoSeleccionado}
                    onChange={(e) => setEditTipoSeleccionado(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="Viper">Viper</option>
                    <option value="BOA">BOA</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={handleGuardarEdicion}
                className={styles.modalSaveButton}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
