import React, { useState, useEffect } from 'react';
import procedimientosSistemaAPI, { ProcedimientoSistema, ProcedimientoSistemaInput } from '../services/procedimientosSistemaAPI';

const GestionProcedimientosNueva: React.FC = () => {
  const [procedimientos, setProcedimientos] = useState<ProcedimientoSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProcedimiento, setEditingProcedimiento] = useState<ProcedimientoSistema | null>(null);
  const [formData, setFormData] = useState<ProcedimientoSistemaInput>({
    nombre: '',
    descripcion: '',
    estamento: 'Enfermería',
    tiempoEstimado: 0,
    activo: true,
    requierePaciente: true
  });
  const [filtroEstamento, setFiltroEstamento] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para mostrar todos los procedimientos
  const [totalProcedimientos, setTotalProcedimientos] = useState(0);

  const estamentos: ('Enfermería' | 'Kinesiología' | 'Medicina' | 'TENS' | 'Auxiliar')[] = ['Enfermería', 'Kinesiología', 'Medicina', 'TENS', 'Auxiliar'];


  useEffect(() => {
    cargarProcedimientos();
  }, []);

  // Recargar procedimientos cuando cambien los filtros
  useEffect(() => {
    cargarProcedimientos();
  }, [filtroEstamento, busqueda]);

  const cargarProcedimientos = async () => {
    try {
      setLoading(true);
      const response = await procedimientosSistemaAPI.obtenerProcedimientos({
        estamento: filtroEstamento !== 'todos' ? filtroEstamento : undefined,
        search: busqueda || undefined
      });
      setProcedimientos(response.procedimientos);
      setTotalProcedimientos(response.pagination.totalItems);
    } catch (error) {
      console.error('Error al cargar procedimientos:', error);
      alert('Error al cargar los procedimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProcedimiento) {
        // Actualizar procedimiento existente
        await procedimientosSistemaAPI.actualizarProcedimiento(editingProcedimiento.id, formData);
      } else {
        // Crear nuevo procedimiento
        await procedimientosSistemaAPI.crearProcedimiento(formData);
      }
      await cargarProcedimientos();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar procedimiento:', error);
      alert('Error al guardar el procedimiento');
    }
  };

  const handleEdit = (procedimiento: ProcedimientoSistema) => {
    setEditingProcedimiento(procedimiento);
    setFormData({
      nombre: procedimiento.nombre,
      descripcion: procedimiento.descripcion || '',
      estamento: procedimiento.estamento,
      tiempoEstimado: procedimiento.tiempoEstimado || 0,
      activo: procedimiento.activo,
      requierePaciente: procedimiento.requierePaciente
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este procedimiento?')) {
      try {
        await procedimientosSistemaAPI.eliminarProcedimiento(id);
        await cargarProcedimientos();
      } catch (error) {
        console.error('Error al eliminar procedimiento:', error);
        alert('Error al eliminar el procedimiento');
      }
    }
  };

  const handleToggleEstado = async (procedimiento: ProcedimientoSistema) => {
    try {
      await procedimientosSistemaAPI.toggleActivo(procedimiento.id);
      await cargarProcedimientos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del procedimiento');
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingProcedimiento(null);
    setFormData({
      nombre: '',
      descripcion: '',
      estamento: 'Enfermería',
      tiempoEstimado: 0,
      activo: true,
      requierePaciente: true
    });
  };


  // Recargar datos cuando cambian los filtros
  useEffect(() => {
    cargarProcedimientos();
  }, [filtroEstamento, busqueda]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Procedimientos</h2>
          <p className="text-gray-600">Administra los procedimientos del sistema UTI</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Procedimiento
        </button>
      </div>

      {/* Filtros y estadísticas */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Estamento
            </label>
            <select
              value={filtroEstamento}
              onChange={(e) => setFiltroEstamento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estamentos</option>
              {estamentos.map(estamento => (
                <option key={estamento} value={estamento}>{estamento}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="mb-2 sm:mb-0">
            <span className="font-medium text-gray-900">{totalProcedimientos}</span> procedimientos encontrados
            {filtroEstamento !== 'todos' && (
              <span className="ml-2 text-blue-600">• Filtrado por: {filtroEstamento}</span>
            )}
            {busqueda && (
              <span className="ml-2 text-blue-600">• Búsqueda: "{busqueda}"</span>
            )}
          </div>
          <div className="text-gray-500">
            {totalProcedimientos} procedimientos encontrados
          </div>
        </div>
      </div>

      {/* Tabla de procedimientos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estamento
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Estimado
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requiere Paciente
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {procedimientos.map((procedimiento) => (
                <tr key={procedimiento.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{procedimiento.nombre}</div>
                      {procedimiento.descripcion && (
                        <div className="text-sm text-gray-500 mt-1">{procedimiento.descripcion}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {procedimiento.estamento}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {procedimiento.tiempoEstimado ? `${procedimiento.tiempoEstimado} min` : 'No especificado'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      procedimiento.requierePaciente 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {procedimiento.requierePaciente ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleEstado(procedimiento)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        procedimiento.activo
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {procedimiento.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handleEdit(procedimiento)}
                        className="text-blue-600 hover:text-blue-900 text-left sm:text-center"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(procedimiento.id)}
                        className="text-red-600 hover:text-red-900 text-left sm:text-center"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {procedimientos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron procedimientos</p>
          </div>
        )}
      </div>

      {/* Información de resultados */}
      <div className="bg-white px-4 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{totalProcedimientos}</span> procedimientos en total
        </div>
      </div>

      {/* Modal para crear/editar procedimiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProcedimiento ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del procedimiento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción del procedimiento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estamento *
                </label>
                <select
                  required
                  value={formData.estamento}
                  onChange={(e) => setFormData({ ...formData, estamento: e.target.value as 'Enfermería' | 'Kinesiología' | 'Medicina' | 'TENS' | 'Auxiliar' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {estamentos.map(estamento => (
                    <option key={estamento} value={estamento}>{estamento}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo Estimado (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.tiempoEstimado}
                  onChange={(e) => setFormData({ ...formData, tiempoEstimado: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tiempo en minutos"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requierePaciente"
                  checked={formData.requierePaciente}
                  onChange={(e) => setFormData({ ...formData, requierePaciente: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requierePaciente" className="ml-2 block text-sm text-gray-900">
                  Requiere paciente específico
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                  Procedimiento activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProcedimiento ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionProcedimientosNueva;
