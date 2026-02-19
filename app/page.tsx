'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!/^\d+$/.test(usuario)) {
      setError('El usuario debe ser numérico');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('La contraseña es requerida');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/Disparo/ValidateLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await response.json();
      console.log('Respuesta del API:', response.status, data);

      if (response.ok && data.success) {
        console.log('Login exitoso, guardando datos...');
        
        document.cookie = `numeroEmpleado=${data.numeroEmpleado}; path=/; max-age=86400`;
        document.cookie = `nombreEmpleado=${encodeURIComponent(data.nombreEmpleado)}; path=/; max-age=86400`;
        document.cookie = `tipo=${data.tipo}; path=/; max-age=86400`;
        
        localStorage.setItem('numeroEmpleado', data.numeroEmpleado);
        localStorage.setItem('nombreEmpleado', data.nombreEmpleado);
        localStorage.setItem('tipo', data.tipo);
        sessionStorage.setItem('numeroEmpleado', data.numeroEmpleado);
        sessionStorage.setItem('nombreEmpleado', data.nombreEmpleado);
        sessionStorage.setItem('tipo', data.tipo);
        
        console.log('Datos guardados, redirigiendo a /disparo...');
        
        window.location.href = '/disparo';
      } else {
        console.log('Login fallido:', data.error);
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.loginTitle}>Iniciar Sesión</h1>
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="usuario" className={styles.label}>
              Usuario
            </label>
            <input
              type="text"
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className={styles.input}
              placeholder="Ingrese su número de usuario"
              required
              autoFocus
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Ingrese su contraseña"
                required
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <Image
                  src={showPassword ? '/images/hide1.png' : '/images/see1.png'}
                  alt={showPassword ? 'Ocultar' : 'Mostrar'}
                  width={20}
                  height={18}
                />
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
