import { createContext, useContext, useEffect, useState } from "react";

// Светлая / тёмная тема: класс "dark" на <html> (Tailwind darkMode: "class")
const ThemeContext = createContext({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("eventops_theme", dark ? "dark" : "light");
    } catch {
      /* без сохранения */
    }
  }, [dark]);

  return <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
