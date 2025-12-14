import { createContext } from '@lit/context';

// Manages the global visual theme of the application.
// Provides: themeMode (string: 'light' | 'dark')
export const themeContext = createContext(Symbol('theme-context'));
