import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  isLight: boolean;
  toggleTheme: () => void;
};

const STORAGE_KEY = "championsclub-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  return savedTheme === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isFirstThemeSync = useRef(true);

  useEffect(() => {
    const root = document.documentElement;

    if (!isFirstThemeSync.current) {
      root.classList.add("theme-transitioning");
    }

    root.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);

    if (isFirstThemeSync.current) {
      isFirstThemeSync.current = false;
      return;
    }

    const transitionTimeout = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 180);

    return () => {
      window.clearTimeout(transitionTimeout);
      root.classList.remove("theme-transitioning");
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isLight: theme === "light",
      toggleTheme: () => {
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
