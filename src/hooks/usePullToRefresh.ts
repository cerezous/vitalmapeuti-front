import { useEffect, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  enabled?: boolean;
  threshold?: number; // Distancia en píxeles antes de activar el refresh
}

/**
 * Hook personalizado para implementar pull-to-refresh en dispositivos móviles
 * Similar al comportamiento nativo de iOS/Android
 * Funciona en navegador y en modo PWA standalone
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
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Detectar si está en modo PWA standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://');

    // Usar el contenedor principal (#root) o body como fallback
    const rootElement = document.getElementById('root') || window.document.body;
    containerRef.current = rootElement;
    
    // También escuchar en window para capturar eventos en modo standalone
    const element = isStandalone ? window : rootElement;

    const handleTouchStart = (e: TouchEvent) => {
      // Solo activar si estamos en la parte superior de la página
      const scrollTop = window.pageYOffset || 
                       document.documentElement.scrollTop || 
                       (rootElement ? rootElement.scrollTop : 0) || 
                       0;
      
      // En modo standalone de iOS, verificar también el scroll del contenedor
      const containerScroll = (rootElement && rootElement.scrollTop) || 0;
      const totalScroll = scrollTop + containerScroll;
      
      // En modo standalone, ser más permisivo con el scroll
      if (totalScroll > (isStandalone ? 10 : 0)) return;

      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
      console.log('🔽 Pull-to-refresh iniciado', { isStandalone, scrollTop, containerScroll });
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

        // Mostrar indicador visual (en modo standalone, usar el contenedor root)
        const scrollPercentage = Math.min(pullDistance.current / threshold, 1);
        
        // Crear o actualizar indicador visual
        let indicator = document.getElementById('pull-to-refresh-indicator');
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.id = 'pull-to-refresh-indicator';
          indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            font-size: 14px;
            color: #666;
            opacity: ${scrollPercentage};
            pointer-events: none;
          `;
          indicator.innerHTML = scrollPercentage >= 1 ? '↻ Soltar para actualizar' : '↻ ↓ Arrastra para actualizar';
          document.body.appendChild(indicator);
        } else {
          indicator.style.opacity = String(scrollPercentage);
          indicator.innerHTML = scrollPercentage >= 1 ? '↻ Soltar para actualizar' : '↻ ↓ Arrastra para actualizar';
        }
        
        if (isStandalone && rootElement) {
          rootElement.style.transform = `translateY(${pullDistance.current * 0.5}px)`;
          rootElement.style.transition = 'none';
        } else {
          document.body.style.transform = `translateY(${pullDistance.current * 0.5}px)`;
          document.body.style.transition = 'none';
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing.current) return;

      isPulling.current = false;

      // Si superamos el threshold, ejecutar refresh
      if (pullDistance.current >= threshold) {
        isRefreshing.current = true;

        // Ocultar indicador
        const indicator = document.getElementById('pull-to-refresh-indicator');
        if (indicator) {
          indicator.style.opacity = '0';
          setTimeout(() => indicator?.remove(), 300);
        }
        
        // Resetear transformación
        if (isStandalone && rootElement) {
          rootElement.style.transform = '';
          rootElement.style.transition = 'transform 0.3s ease-out';
        } else {
          document.body.style.transform = '';
          document.body.style.transition = 'transform 0.3s ease-out';
        }

        try {
          await onRefresh();
          console.log('✅ Pull-to-refresh completado');
        } catch (error) {
          console.error('❌ Error al refrescar:', error);
        } finally {
          isRefreshing.current = false;
        }
      } else {
        // Ocultar indicador si no se activó
        const indicator = document.getElementById('pull-to-refresh-indicator');
        if (indicator) {
          indicator.style.opacity = '0';
          setTimeout(() => indicator?.remove(), 300);
        }
        
        // Animación de vuelta
        const transition = 'transform 0.3s ease-out';
        if (isStandalone && rootElement) {
          rootElement.style.transition = transition;
          rootElement.style.transform = '';
          setTimeout(() => {
            rootElement.style.transition = '';
          }, 300);
        } else {
          document.body.style.transition = transition;
          document.body.style.transform = '';
          setTimeout(() => {
            document.body.style.transition = '';
          }, 300);
        }
      }

      pullDistance.current = 0;
    };

    // Agregar event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      if (element === window) {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      } else {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
      // Limpiar indicador visual
      const indicator = document.getElementById('pull-to-refresh-indicator');
      if (indicator) indicator.remove();
      
      // Resetear estilos
      if (rootElement) {
        rootElement.style.transform = '';
        rootElement.style.transition = '';
      }
      document.body.style.transform = '';
      document.body.style.transition = '';
    };
  }, [enabled, onRefresh, threshold]);
};

