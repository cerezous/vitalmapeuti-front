import React, { useState, useEffect } from 'react';

interface TimePickerProps {
  value: string; // Formato HH:MM
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  className = '', 
  disabled = false,
  required = false 
}) => {
  // Parsear el valor inicial (formato HH:MM)
  const parseTime = (timeString: string): [number, number] => {
    if (!timeString || timeString === '') return [0, 0];
    const parts = timeString.split(':');
    const hours = parseInt(parts[0] || '0', 10) || 0;
    const minutes = parseInt(parts[1] || '0', 10) || 0;
    return [hours, minutes];
  };

  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);

  // Actualizar cuando cambia el valor externo
  useEffect(() => {
    const [h, m] = parseTime(value);
    setHours(h);
    setMinutes(m);
  }, [value]);

  // Formatear tiempo en HH:MM
  const formatTime = (h: number, m: number): string => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Manejar cambio de horas
  const handleHoursChange = (newHours: number) => {
    const validHours = Math.max(0, Math.min(23, newHours));
    setHours(validHours);
    onChange(formatTime(validHours, minutes));
  };

  // Manejar cambio de minutos
  const handleMinutesChange = (newMinutes: number) => {
    const validMinutes = Math.max(0, Math.min(59, newMinutes));
    setMinutes(validMinutes);
    onChange(formatTime(hours, validMinutes));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Selector de Horas */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => handleHoursChange(hours + 1)}
          disabled={disabled || hours >= 23}
          className="w-12 h-8 md:w-14 md:h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-t-md border border-gray-300 transition-colors"
          aria-label="Incrementar horas"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <input
          type="number"
          min="0"
          max="23"
          value={hours}
          onChange={(e) => handleHoursChange(parseInt(e.target.value, 10) || 0)}
          disabled={disabled}
          required={required}
          className="w-12 h-10 md:w-14 md:h-12 text-center text-sm md:text-base font-semibold border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          aria-label="Horas"
        />
        <button
          type="button"
          onClick={() => handleHoursChange(hours - 1)}
          disabled={disabled || hours <= 0}
          className="w-12 h-8 md:w-14 md:h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-md border border-gray-300 transition-colors"
          aria-label="Decrementar horas"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <label className="text-xs text-gray-500 mt-1">Horas</label>
      </div>

      {/* Separador */}
      <div className="flex items-center pt-6">
        <span className="text-2xl font-bold text-gray-700">:</span>
      </div>

      {/* Selector de Minutos */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => handleMinutesChange(minutes + 1)}
          disabled={disabled || minutes >= 59}
          className="w-12 h-8 md:w-14 md:h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-t-md border border-gray-300 transition-colors"
          aria-label="Incrementar minutos"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <input
          type="number"
          min="0"
          max="59"
          value={minutes}
          onChange={(e) => handleMinutesChange(parseInt(e.target.value, 10) || 0)}
          disabled={disabled}
          required={required}
          className="w-12 h-10 md:w-14 md:h-12 text-center text-sm md:text-base font-semibold border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          aria-label="Minutos"
        />
        <button
          type="button"
          onClick={() => handleMinutesChange(minutes - 1)}
          disabled={disabled || minutes <= 0}
          className="w-12 h-8 md:w-14 md:h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-md border border-gray-300 transition-colors"
          aria-label="Decrementar minutos"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <label className="text-xs text-gray-500 mt-1">Minutos</label>
      </div>
    </div>
  );
};

export default TimePicker;

