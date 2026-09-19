import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, radius, type ThemeTokens } from '@fitcupons/shared';

export type AppTheme = ThemeTokens & {
  scheme: 'light' | 'dark';
  radius: typeof radius;
  danger: string;
  amber: string;
  amberSoft: string;
};

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tokens = scheme === 'dark' ? darkTheme : lightTheme;
  const value: AppTheme = {
    ...tokens,
    scheme,
    radius,
    danger: scheme === 'dark' ? '#F2A3A3' : '#B42318',
    amber: scheme === 'dark' ? '#E8B86D' : '#C4872A',
    amberSoft: scheme === 'dark' ? '#3A2E1A' : '#F8EED9',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}
