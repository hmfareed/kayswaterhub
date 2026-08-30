"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("kays_theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kays_theme") as Theme | null;
      if (saved === "dark" || saved === "light") {
        applyTheme(saved);
      } else {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const initialTheme: Theme = mediaQuery.matches ? "dark" : "light";
        applyTheme(initialTheme);

        const handleChange = (e: MediaQueryListEvent) => {
          const currentSaved = localStorage.getItem("kays_theme");
          if (!currentSaved) {
            applyTheme(e.matches ? "dark" : "light");
          }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      }
    } catch {}
    setMounted(true);
  }, [applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  const toggleDarkMode = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("kays_theme", nextTheme);
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.style.colorScheme = "dark";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "light";
        }
      } catch {}
      return nextTheme;
    });
  }, []);

  const isDarkMode = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
