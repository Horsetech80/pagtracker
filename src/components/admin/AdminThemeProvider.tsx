'use client';

import * as React from 'react';
import { AdminThemeProvider as IsolatedThemeProvider } from './ui/theme-provider';
import { type ThemeProviderProps } from 'next-themes';

// PAINEL ADMINISTRATIVO - Provider de Tema
// Gerencia temas dark/light para o painel administrativo isolado
// Isolado do painel cliente para evitar conflitos

export function AdminThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <IsolatedThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </IsolatedThemeProvider>
  );
}