import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    estamento: '',
    correo: '',
    contraseña: '',
    confirmarContraseña: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // Solo estamentos permitidos para registro público (excluye Administrador por seguridad)
  const estamentos = ['Kinesiología', 'Enfermería', 'Medicina', 'Auxiliares', 'TENS'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    } else if (formData.nombres.trim().length < 2) {
      newErrors.nombres = 'Los nombres deben tener al menos 2 caracteres';
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    } else if (formData.apellidos.trim().length < 2) {
      newErrors.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
    }

    if (!formData.estamento) {
      newErrors.estamento = 'El estamento es requerido';
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'Ingresa un correo electrónico válido';
    }

    if (!formData.contraseña) {
      newErrors.contraseña = 'La contraseña es requerida';
    } else if (formData.contraseña.length < 6) {
      newErrors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmarContraseña) {
      newErrors.confirmarContraseña = 'Confirma tu contraseña';
    } else if (formData.contraseña !== formData.confirmarContraseña) {
      newErrors.confirmarContraseña = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const registerData = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        estamento: formData.estamento,
        correo: formData.correo.trim(),
        contraseña: formData.contraseña,
      };

      await authService.register(registerData);
      setSuccess(true);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error.response?.data?.errors) {
        // Errores de validación del backend
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          if (err.path) {
            backendErrors[err.path] = err.message;
          }
        });
        setErrors(backendErrors);
      } else {
        setErrors({
          submit: error.response?.data?.error || 'Error al crear la cuenta. Inténtalo de nuevo.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Cuenta creada exitosamente!
              </h2>
              <p className="text-gray-600 mb-4">
                Tu cuenta ha sido creada correctamente. Hemos enviado un correo electrónico con tu nombre de usuario y contraseña. Serás redirigido al login en unos segundos.
              </p>
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Ir al login ahora
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Únete a VitalMape
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed px-4">
              Sistema de gestión para Unidad de Terapia Intensiva
            </p>
          </div>
        </div>

        {/* Formulario en la parte inferior */}
        <div className="bg-white rounded-t-3xl px-6 pt-8 pb-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Crear cuenta</h2>
          <div className="max-w-sm mx-auto">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombres
                </label>
                <input
                  id="nombres"
                  name="nombres"
                  type="text"
                  required
                  value={formData.nombres}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.nombres ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                  placeholder="Ingresa tus nombres"
                />
                {errors.nombres && (
                  <p className="mt-2 text-sm text-red-600">{errors.nombres}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  ℹ️ Tu nombre de usuario se generará automáticamente y te será enviado por email.
                </p>
              </div>

              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  required
                  value={formData.apellidos}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.apellidos ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                  placeholder="Ingresa tus apellidos"
                />
                {errors.apellidos && (
                  <p className="mt-2 text-sm text-red-600">{errors.apellidos}</p>
                )}
              </div>

              <div>
                <label htmlFor="estamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Estamento
                </label>
                <select
                  id="estamento"
                  name="estamento"
                  required
                  value={formData.estamento}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.estamento ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                >
                  <option value="">Selecciona tu estamento</option>
                  {estamentos.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
                {errors.estamento && (
                  <p className="mt-2 text-sm text-red-600">{errors.estamento}</p>
                )}
              </div>

              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.correo ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                  placeholder="Ingresa tu correo electrónico"
                />
                {errors.correo && (
                  <p className="mt-2 text-sm text-red-600">{errors.correo}</p>
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
                  autoComplete="new-password"
                  required
                  value={formData.contraseña}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.contraseña ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                  placeholder="Crea una contraseña"
                />
                {errors.contraseña && (
                  <p className="mt-2 text-sm text-red-600">{errors.contraseña}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmarContraseña" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmarContraseña"
                  name="confirmarContraseña"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmarContraseña}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.confirmarContraseña ? 'border-red-300' : 'border-gray-300'
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-gray-50`}
                  placeholder="Confirma tu contraseña"
                />
                {errors.confirmarContraseña && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmarContraseña}</p>
                )}
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
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  ¿Ya tienes una cuenta?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50 border-primary-600"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Diseño desktop - Mantener diseño original */}
      <div className="hidden lg:block w-full max-w-4xl h-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-2 h-auto">
            {/* Columna izquierda - Branding */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 flex flex-col justify-between text-center">
              <div className="flex flex-col items-center">
                <img 
                  src="/logodefinitivo4.png" 
                  alt="VitalMape Logo" 
                  className="h-20 mb-8 mx-auto"
                />
                <h1 className="text-4xl font-bold text-white mb-4">
                  Únete a VitalMape
                </h1>
                <p className="text-blue-100 text-xl leading-relaxed">
                  Sistema de gestión para Unidad de Terapia Intensiva
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
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Crear cuenta</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="nombres-desktop" className="block text-sm font-medium text-gray-700">
                      Nombres
                    </label>
                    <div className="mt-2">
                      <input
                        id="nombres-desktop"
                        name="nombres"
                        type="text"
                        required
                        value={formData.nombres}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.nombres ? 'border-red-300' : 'border-gray-300'
                        } rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                        placeholder="Ingresa tus nombres"
                      />
                      {errors.nombres && (
                        <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      ℹ️ Tu nombre de usuario se generará automáticamente y te será enviado por email.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="apellidos-desktop" className="block text-sm font-medium text-gray-700">
                      Apellidos
                    </label>
                    <div className="mt-2">
                      <input
                        id="apellidos-desktop"
                        name="apellidos"
                        type="text"
                        required
                        value={formData.apellidos}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.apellidos ? 'border-red-300' : 'border-gray-300'
                        } rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                        placeholder="Ingresa tus apellidos"
                      />
                      {errors.apellidos && (
                        <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="estamento-desktop" className="block text-sm font-medium text-gray-700">
                      Estamento
                    </label>
                    <div className="mt-2">
                      <select
                        id="estamento-desktop"
                        name="estamento"
                        required
                        value={formData.estamento}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.estamento ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                      >
                        <option value="">Selecciona tu estamento</option>
                        {estamentos.map(est => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                      {errors.estamento && (
                        <p className="mt-1 text-sm text-red-600">{errors.estamento}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="correo-desktop" className="block text-sm font-medium text-gray-700">
                      Correo Electrónico
                    </label>
                    <div className="mt-2">
                      <input
                        id="correo-desktop"
                        name="correo"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.correo}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.correo ? 'border-red-300' : 'border-gray-300'
                        } rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                        placeholder="Ingresa tu correo electrónico"
                      />
                      {errors.correo && (
                        <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
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
                        autoComplete="new-password"
                        required
                        value={formData.contraseña}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.contraseña ? 'border-red-300' : 'border-gray-300'
                        } rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                        placeholder="Crea una contraseña"
                      />
                      {errors.contraseña && (
                        <p className="mt-1 text-sm text-red-600">{errors.contraseña}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmarContraseña-desktop" className="block text-sm font-medium text-gray-700">
                      Confirmar Contraseña
                    </label>
                    <div className="mt-2">
                      <input
                        id="confirmarContraseña-desktop"
                        name="confirmarContraseña"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmarContraseña}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.confirmarContraseña ? 'border-red-300' : 'border-gray-300'
                        } rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
                        placeholder="Confirma tu contraseña"
                      />
                      {errors.confirmarContraseña && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmarContraseña}</p>
                      )}
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
                          Creando cuenta...
                        </>
                      ) : (
                        'Crear cuenta'
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
                        ¿Ya tienes una cuenta?
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      to="/login"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50 border-primary-600"
                    >
                      Iniciar sesión
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Register;