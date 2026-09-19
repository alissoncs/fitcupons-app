export type ThemeTokens = {
  bg: string;
  surface: string;
  border: string;
  ink: string;
  inkMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
};

export const lightTheme: ThemeTokens = {
  bg: '#FBFAFD',
  surface: '#FFFFFF',
  border: '#E7E4EF',
  ink: '#17141F',
  inkMuted: '#6E697D',
  primary: '#5F4B8B',
  primarySoft: '#EFEBF7',
  accent: '#3E8E6B',
  accentSoft: '#E4F1EB',
};

export const darkTheme: ThemeTokens = {
  bg: '#141119',
  surface: '#1D1926',
  border: '#2E2839',
  ink: '#F2F0F7',
  inkMuted: '#A29DB2',
  primary: '#A38FD6',
  primarySoft: '#2A2338',
  accent: '#6DBF97',
  accentSoft: '#1C3329',
};

export const radius = { card: 12, button: 10 } as const;
