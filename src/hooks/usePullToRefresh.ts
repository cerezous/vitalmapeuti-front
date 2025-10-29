import { useEffect, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  enabled?: boolean;
  threshold?: number; // Distancia en píxeles antes de activar el refresh
}

/**
 * Hook personalizado para implementar pull-to-refresh en dispositivos móviles
 * Similar al comportamiento nativo de iOS/Android
 */
export const usePullToRefresh = ({
  onRefresh,
  enabled = true,
  threshold = 80
}: UsePullToRefreshOptions) => {
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const isRefreshing = useRef<boolean>(false);
  const pullDistance = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Usar window directamente para detectar pull-to-refresh
    const element = window.document.body;

    const handleTouchStart = (e: TouchEvent) => {
      // Solo activar si estamos en la parte superior de la página
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > 0) return;

      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing.current) return;

      touchCurrentY.current = e.touches[0].clientY;
      pullDistance.current = touchCurrentY.current - touchStartY.current;

      // Solo permitir pull hacia abajo
      if (pullDistance.current > 0) {
        // Prevenir scroll nativo mientras hacemos pull
        if (pullDistance.current > 10) {
          e.preventDefault();
        }

        // Mostrar indicador visual
        const scrollPercentage = Math.min(pullDistance.current / threshold, 1);
        document.body.style.transform = `translateY(${pullDistance.current * 0.5}px)`;
        document.body.style.opacity = `${1 - scrollPercentage * 0.2}`;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing.current) return;

      isPulling.current = false;

      // Si superamos el threshold, ejecutar refresh
      if (pullDistance.current >= threshold) {
        isRefreshing.current = true;

        // Resetear transformación
        document.body.style.transform = '';
        document.body.style.opacity = '1';

        try {
          await onRefresh();
        } catch (error) {
          console.error('Error al refrescar:', error);
        } finally {
          isRefreshing.current = false;
        }
      } else {
        // Animación de vuelta
        document.body.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        document.body.style.transform = '';
        document.body.style.opacity = '1';

        setTimeout(() => {
          document.body.style.transition = '';
        }, 300);
      }

      pullDistance.current = 0;
    };

    // Agregar event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      // Resetear estilos
      document.body.style.transform = '';
      document.body.style.opacity = '1';
      document.body.style.transition = '';
    };
  }, [enabled, onRefresh, threshold]);
};

