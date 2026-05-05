// ─────────────────────────────────────────────────────────────────
// Contexto de Tema (claro / oscuro)
// Persiste la preferencia del usuario en localStorage y aplica
// la clase CSS correspondiente al elemento raíz del documento.
// ─────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react'

const ContextoTema = createContext(null)

// Clave para guardar la preferencia de tema
const CLAVE_TEMA = 'studymind_theme'

export function ThemeProvider({ children }) {
  // Inicializar con la preferencia guardada o el tema del sistema operativo
  const [oscuro, setOscuro] = useState(() => {
    const guardado = localStorage.getItem(CLAVE_TEMA)
    if (guardado !== null) return guardado === 'dark'
    // Detectar preferencia del sistema si no hay valor guardado
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Aplicar la clase al <html> y guardar en localStorage cada vez que cambie
  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
    localStorage.setItem(CLAVE_TEMA, oscuro ? 'dark' : 'light')
  }, [oscuro])

  const alternarTema = () => setOscuro(prev => !prev)

  return (
    <ContextoTema.Provider value={{ isDark: oscuro, toggleTheme: alternarTema }}>
      {children}
    </ContextoTema.Provider>
  )
}

// Hook para usar el contexto de tema en cualquier componente
export const useTheme = () => useContext(ContextoTema)
