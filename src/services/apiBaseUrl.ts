// src/services/apiBaseUrl.ts

/**
 * Devuelve la base URL de la API según entorno y variable de entorno.
 * Usa REACT_APP_API_URL si está definida, si no, detecta por hostname.
 */
export function getApiBaseUrl(): string {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    if (window.location.hostname === 'vitalmapeuti.onrender.com') {
      return 'https://vitalmapeuti-back.onrender.com/api';
    }
    // Fallback para otros entornos
    return `https://${window.location.hostname}/api`;
  }
  // SSR fallback
  return 'http://localhost:3001/api';
}
