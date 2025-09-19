'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/lib/hooks/use-toast';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <TenantProvider>
          <ToastProvider>
            {children}
            <Toaster 
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </ToastProvider>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}