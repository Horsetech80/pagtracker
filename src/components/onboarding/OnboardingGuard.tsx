'use client';

import { ReactNode } from 'react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { OnboardingBlocker } from './OnboardingBlocker';

interface OnboardingGuardProps {
  children: ReactNode;
  requiresPayments?: boolean;
  requiresWithdrawals?: boolean;
  requiresComplete?: boolean;
  fallback?: ReactNode;
  onContinue?: (stepId: string) => void;
}

export function OnboardingGuard({ 
  children, 
  requiresPayments = false,
  requiresWithdrawals = false,
  requiresComplete = false,
  fallback,
  onContinue
}: OnboardingGuardProps) {
  const { 
    isLoading, 
    canAccessPayments, 
    canAccessWithdrawals, 
    onboardingStatus 
  } = useOnboarding();

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // Verificar se precisa bloquear por saques
  if (requiresWithdrawals && !canAccessWithdrawals) {
    return fallback || (
      <OnboardingBlocker 
        feature="withdrawals" 
        onContinue={onContinue}
      />
    );
  }

  // Verificar se precisa bloquear por pagamentos
  if (requiresPayments && !canAccessPayments) {
    return fallback || (
      <OnboardingBlocker 
        feature="payments" 
        onContinue={onContinue}
      />
    );
  }

  // Verificar se precisa cadastro completo
  if (requiresComplete && onboardingStatus?.overallProgress !== 100) {
    return fallback || (
      <OnboardingBlocker 
        feature="full" 
        onContinue={onContinue}
      />
    );
  }

  // Se passou em todas as verificações, mostrar o conteúdo
  return <>{children}</>;
}