'use client';

import { cn } from '@/lib/utils';

interface OnboardingIndicatorProps {
  show: boolean;
  isActive?: boolean; // Indica se é a próxima etapa a ser completada
  className?: string;
}

export function OnboardingIndicator({ show, isActive = false, className }: OnboardingIndicatorProps) {
  if (!show) return null;

  return (
    <div 
      className={cn(
        "w-2 h-2 bg-green-500 rounded-full ml-auto flex-shrink-0",
        isActive && "animate-pulse",
        className
      )}
      aria-label="Configuração pendente"
    />
  );
}

// Mapeamento das etapas de onboarding para itens de navegação
// Ordem sequencial: personal_data -> company_data -> financial_settings -> verification
export const ONBOARDING_NAVIGATION_MAPPING = {
  // Etapa 1: Dados Pessoais -> Configurações > Pessoal
  'personal_data': {
    title: 'Dados Pessoais',
    navigationItems: ['/configuracoes', '/configuracoes?section=pessoal'],
    description: 'Complete seus dados pessoais'
  },
  
  // Etapa 2: Dados da Empresa -> Configurações > Empresa
  'company_data': {
    title: 'Dados da Empresa',
    navigationItems: ['/configuracoes', '/configuracoes?section=empresa'],
    description: 'Complete os dados da sua empresa'
  },
  
  // Etapa 3: Configurações Financeiras -> Carteira
  'financial_settings': {
    title: 'Configurações Financeiras',
    navigationItems: ['/carteira'],
    description: 'Configure suas informações financeiras'
  },
  
  // Etapa 4: Verificação -> Configurações (geral)
  'verification': {
    title: 'Verificação da Conta',
    navigationItems: ['/configuracoes'],
    description: 'Complete a verificação da sua conta'
  }
} as const;

export type OnboardingStepId = keyof typeof ONBOARDING_NAVIGATION_MAPPING;