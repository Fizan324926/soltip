import React, {
  type FC,
  type ReactNode,
  useEffect,
} from 'react';
import { useUiStore } from '../stores/uiStore';

// ============================================================
// Props
// ============================================================
interface ThemeProviderProps {
  children: ReactNode;
}

// ============================================================
// ThemeProvider
//
// Reads the theme from uiStore and applies it as a class on
// <html> (document.documentElement).  Tailwind's `darkMode: 'class'`
// config picks this up automatically.
//
// The theme preference is already persisted to localStorage by
// uiStore (via zustand/middleware/persist), so it survives page
// reloads without a flash-of-wrong-theme if this provider is
// rendered early in the tree.
// ============================================================
export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Also set color-scheme so native browser UI (scrollbars, inputs)
    // respects the theme
    root.style.colorScheme = theme;
  }, [theme]);

  // Render children unconditionally – the class update on <html> is a
  // side-effect; no wrapper element needed.
  return <>{children}</>;
};

export default ThemeProvider;
