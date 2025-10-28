import React from 'react';

interface ModalBloquearCamaProps {
  numeroCama: number;
  estaBloqueada: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ModalBloquearCama: React.FC<ModalBloquearCamaProps> = ({
  numeroCama,
  estaBloqueada,
  onClose,
  onConfirm
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {estaBloqueada ? 'Desbloquear Cama' : 'Bloquear Cama'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            {estaBloqueada ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">
              {estaBloqueada ? (
                <>
                  ¿Está seguro que desea <span className="font-semibold text-green-600">desbloquear</span> la cama <span className="font-bold">{numeroCama}</span>?
                </>
              ) : (
                <>
                  ¿Está seguro que desea <span className="font-semibold text-orange-600">bloquear</span> la cama <span className="font-bold">{numeroCama}</span>?
                </>
              )}
            </p>
            <p className="text-sm text-gray-500">
              {estaBloqueada ? (
                'La cama volverá a estar disponible para asignar pacientes.'
              ) : (
                'La cama no estará disponible para asignar nuevos pacientes hasta que se desbloquee.'
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              estaBloqueada
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {estaBloqueada ? 'Desbloquear' : 'Bloquear'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBloquearCama;

