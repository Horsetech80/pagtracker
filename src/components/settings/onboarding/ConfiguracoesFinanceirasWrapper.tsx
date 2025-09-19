'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Importação dinâmica para evitar problemas de SSR
const ConfiguracoesFinanceirasPage = dynamic(
  () => import('@/app/(dashboard)/onboarding/configuracoes-financeiras/page'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }
);

export function ConfiguracoesFinanceirasWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    }>
      <ConfiguracoesFinanceirasPage />
    </Suspense>
  );
}

export default ConfiguracoesFinanceirasWrapper;