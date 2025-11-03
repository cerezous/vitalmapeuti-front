import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MenuCuestionariosBurnout from './MenuCuestionariosBurnout';
import GestionUsuarios from './GestionUsuarios';
import GestionProcedimientosNueva from './GestionProcedimientosNueva';

const MenuAdministrador: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cuestionarios');

  const esAdministrador = user?.estamento === 'Administrador';
  const esSupervisor = user?.estamento === 'Supervisor';

  // Verificar que el usuario sea administrador o supervisor
  if (!esAdministrador && !esSupervisor) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Acceso Restringido</h3>
            <p className="text-red-700">
              Solo los administradores y supervisores pueden acceder a esta sección.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Supervisor solo puede ver Cuestionarios Burnout, Administrador puede ver todo
  const tabs = [
    {
      id: 'cuestionarios',
      name: 'Cuestionarios Burnout',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      visible: true // Todos pueden ver esta pestaña
    },
    {
      id: 'usuarios',
      name: 'Gestión de Usuarios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      visible: esAdministrador // Solo administradores
    },
    {
      id: 'procedimientos',
      name: 'Procedimientos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      visible: esAdministrador // Solo administradores
    }
  ].filter(tab => tab.visible);

  // Si Supervisor intenta acceder a una pestaña no permitida, redirigir a cuestionarios
  useEffect(() => {
    if (esSupervisor && activeTab !== 'cuestionarios') {
      setActiveTab('cuestionarios');
    }
  }, [activeTab, esSupervisor]);

  const handleTabChange = (tabId: string) => {
    // Si Supervisor intenta cambiar a una pestaña no permitida, no hacer nada
    if (esSupervisor && tabId !== 'cuestionarios') {
      return;
    }
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    // Supervisor solo puede ver cuestionarios
    if (esSupervisor && activeTab !== 'cuestionarios') {
      return <MenuCuestionariosBurnout />;
    }

    switch (activeTab) {
      case 'cuestionarios':
        return <MenuCuestionariosBurnout />;
      case 'usuarios':
        return esAdministrador ? <GestionUsuarios /> : <MenuCuestionariosBurnout />;
      case 'procedimientos':
        return esAdministrador ? <GestionProcedimientosNueva /> : <MenuCuestionariosBurnout />;
      default:
        return <MenuCuestionariosBurnout />;
    }
  };

  return (
    <div className="space-y-6 pb-16 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestión y supervisión del sistema VitalMape UTI.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className={`mr-2 ${
                activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`}>
                {tab.icon}
              </div>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MenuAdministrador;
