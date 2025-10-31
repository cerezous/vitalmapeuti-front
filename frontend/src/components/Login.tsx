import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ModalForgotPassword from './ModalForgotPassword';

const Login = () => {
  const [formData, setFormData] = useState({
    usuario: '',
    contraseña: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    
    // Convertir a minúsculas solo para el campo usuario
    const processedValue = name === 'usuario' ? value.toLowerCase() : value;
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: processedValue,
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.usuario.trim()) {
      newErrors.usuario = 'El nombre de usuario es requerido';
    }

    if (!formData.contraseña) {
      newErrors.contraseña = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await login(formData.usuario, formData.contraseña);
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrors({
        submit: error.response?.data?.error || 'Error al iniciar sesión. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 lg:flex lg:items-center lg:justify-center lg:py-4 lg:px-8">
      {/* Diseño móvil - App nativa */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col">
        {/* Header con logo */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 pt-16 pb-8">
          <div className="text-center">
            <img 
              src="/logodefinitivo4.png" 
              alt="VitalMape Logo" 
              className="h-24 mx-auto mb-6"
            />
            <h1 className="text-3xl font-bold text-white mb-3">
              Bienvenido/a
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed px-4">
              Donde los datos se convierten en decisiones inteligentes
            </p>
          </div>
        </div>

        {/* Formulario en la parte inferior */}
        <div className="bg-white rounded-t-3xl px-6 pt-8 pb-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Iniciar sesión</h2>
          <div className="max-w-sm mx-auto">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.usuario}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.usuario ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                  placeholder="Ingresa tu nombre de usuario"
                />
                {errors.usuario && (
                  <p className="mt-2 text-sm text-red-600">{errors.usuario}</p>
                )}
              </div>

              <div>
                <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="contraseña"
                  name="contraseña"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.contraseña}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.contraseña ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                  placeholder="Ingresa tu contraseña"
                />
                {errors.contraseña && (
                  <p className="mt-2 text-sm text-red-600">{errors.contraseña}</p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-500 hover:underline focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              {errors.submit && (
                <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">
                    ¿No tienes una cuenta?
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-3 px-4 border border-blue-600 rounded-xl shadow-sm text-base font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diseño desktop - Mantener diseño original */}
      <div className="hidden lg:block w-full max-w-4xl h-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-2 h-auto">
            {/* Columna izquierda - Branding (solo desktop) */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 flex-col justify-between text-center">
              <div className="flex flex-col items-center">
                <img 
                  src="/logodefinitivo4.png" 
                  alt="VitalMape Logo" 
                  className="h-20 mb-8 mx-auto"
                />
                <h1 className="text-4xl font-bold text-white mb-4">
                  Bienvenido/a
                </h1>
                <p className="text-blue-100 text-xl leading-relaxed">
                  Donde los datos se convierten en decisiones inteligentes
                </p>
              </div>
              <div className="flex justify-between items-center text-blue-200 text-sm mt-8">
                <span>Versión 1.0.0</span>
                <span>By: Matias Cerezo Prado</span>
              </div>
            </div>

            {/* Columna derecha - Formulario */}
            <div className="p-12 flex flex-col justify-center">
              <div className="w-full max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Iniciar sesión</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="usuario-desktop" className="block text-sm font-medium text-gray-700">
                      Usuario
                    </label>
                    <div className="mt-2">
                      <input
                        id="usuario-desktop"
                        name="usuario"
                        type="text"
                        autoComplete="username"
                        required
                        value={formData.usuario}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.usuario ? 'border-red-300' : 'border-gray-300'
                        } rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                        placeholder="Ingresa tu nombre de usuario"
                      />
                      {errors.usuario && (
                        <p className="mt-1 text-sm text-red-600">{errors.usuario}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contraseña-desktop" className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
                    <div className="mt-2">
                      <input
                        id="contraseña-desktop"
                        name="contraseña"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={formData.contraseña}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.contraseña ? 'border-red-300' : 'border-gray-300'
                        } rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                        placeholder="Ingresa tu contraseña"
                      />
                      {errors.contraseña && (
                        <p className="mt-1 text-sm text-red-600">{errors.contraseña}</p>
                      )}
                    </div>
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(true)}
                        className="text-sm text-primary-600 hover:text-primary-500 hover:underline focus:outline-none"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{errors.submit}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Iniciando sesión...
                        </>
                      ) : (
                        'Iniciar Sesión'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        ¿No tienes una cuenta?
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      to="/register"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50 border-primary-600"
                    >
                      Crear cuenta
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para recuperar contraseña */}
      <ModalForgotPassword
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
};

export default Login;