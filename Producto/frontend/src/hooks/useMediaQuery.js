import { useState, useEffect } from 'react'

/**
 * useMediaQuery - Hook para detectar cambios en breakpoints
 * 
 * Permite reaccionar a cambios de resolución de pantalla
 * Uso:
 *   const isMobile = useMediaQuery('(max-width: 768px)')
 *   const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)')
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Evitar SSR issues
    setIsLoaded(true)

    // Crear media query
    const media = window.matchMedia(query)
    
    // Establecer estado inicial
    setMatches(media.matches)

    // Listener para cambios
    const listener = (e) => {
      setMatches(e.matches)
    }

    // Soportar navegadores modernos y antiguos
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      // Fallback para navegadores antiguos
      media.addListener(listener)
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        // Fallback para navegadores antiguos
        media.removeListener(listener)
      }
    }
  }, [query])

  return isLoaded ? matches : false
}
