'use client';

import { useOnboarding } from './useOnboarding';
import { ONBOARDING_NAVIGATION_MAPPING } from '@/components/onboarding/OnboardingIndicator';

export function useOnboardingIndicators() {
  const { onboardingStatus, isComplete } = useOnboarding();

  /**
   * Determina se deve mostrar indicador para um item de navegação
   * Implementa lógica inteligente para dropdowns: mostra no pai quando fechado, no filho quando aberto
   */
  const shouldShowIndicator = (href: string, isDropdownOpen?: boolean): boolean => {
    // Não mostrar se onboarding está completo
    if (isComplete || !onboardingStatus) return false;

    // Ordem das etapas do onboarding
    const stepOrder = ['personal_data', 'company_data', 'financial_settings', 'verification'];
    
    // Encontrar a primeira etapa não completada (próxima etapa)
    const nextStep = stepOrder.find(step => !getStepCompletionStatus(step));
    
    if (!nextStep) return false;

    const mapping = ONBOARDING_NAVIGATION_MAPPING[nextStep as keyof typeof ONBOARDING_NAVIGATION_MAPPING];
    if (!mapping) return false;

    // Lógica especial para etapas que requerem navegação em dropdown (personal_data e company_data)
    if (nextStep === 'personal_data') {
      // Se é o item pai (/configuracoes) e dropdown está fechado, mostrar indicador
      if (href === '/configuracoes' && !isDropdownOpen) {
        return true;
      }
      // Se é o item filho (/configuracoes?section=pessoal) e dropdown está aberto, mostrar indicador
      if (href === '/configuracoes?section=pessoal' && isDropdownOpen) {
        return true;
      }
      // Para outros casos relacionados a configurações, não mostrar
      if (href.startsWith('/configuracoes')) {
        return false;
      }
    }
    
    if (nextStep === 'company_data') {
      // Se é o item pai (/configuracoes) e dropdown está fechado, mostrar indicador
      if (href === '/configuracoes' && !isDropdownOpen) {
        return true;
      }
      // Se é o item filho (/configuracoes?section=empresa) e dropdown está aberto, mostrar indicador
      if (href === '/configuracoes?section=empresa' && isDropdownOpen) {
        return true;
      }
      // Para outros casos relacionados a configurações, não mostrar
      if (href.startsWith('/configuracoes')) {
        return false;
      }
    }

    // Para outras etapas, usar lógica padrão
    return (mapping.navigationItems as readonly string[]).includes(href);
  };

  /**
   * Determina se o indicador deve estar ativo (pulsando)
   * Implementa lógica inteligente para dropdowns: pulsa no pai quando fechado, no filho quando aberto
   */
  const shouldIndicatorBeActive = (href: string, isDropdownOpen?: boolean): boolean => {
    if (isComplete || !onboardingStatus) return false;

    // Ordem das etapas do onboarding
    const stepOrder = ['personal_data', 'company_data', 'financial_settings', 'verification'];
    
    // Encontrar a primeira etapa não completada
    const nextStep = stepOrder.find(step => !getStepCompletionStatus(step));
    
    if (!nextStep) return false;

    const mapping = ONBOARDING_NAVIGATION_MAPPING[nextStep as keyof typeof ONBOARDING_NAVIGATION_MAPPING];
    if (!mapping) return false;

    // Lógica especial para etapas que requerem navegação em dropdown (personal_data e company_data)
    if (nextStep === 'personal_data') {
      // Se é o item pai (/configuracoes) e dropdown está fechado, pulsar
      if (href === '/configuracoes' && !isDropdownOpen) {
        return true;
      }
      // Se é o item filho (/configuracoes?section=pessoal) e dropdown está aberto, pulsar
      if (href === '/configuracoes?section=pessoal' && isDropdownOpen) {
        return true;
      }
      // Para outros casos relacionados a configurações, não pulsar
      if (href.startsWith('/configuracoes')) {
        return false;
      }
    }
    
    if (nextStep === 'company_data') {
      // Se é o item pai (/configuracoes) e dropdown está fechado, pulsar
      if (href === '/configuracoes' && !isDropdownOpen) {
        return true;
      }
      // Se é o item filho (/configuracoes?section=empresa) e dropdown está aberto, pulsar
      if (href === '/configuracoes?section=empresa' && isDropdownOpen) {
        return true;
      }
      // Para outros casos relacionados a configurações, não pulsar
      if (href.startsWith('/configuracoes')) {
        return false;
      }
    }

    // Para outras etapas, usar lógica padrão
    return (mapping.navigationItems as readonly string[]).includes(href);
  };

  /**
   * Verifica se uma etapa específica está completa
   */
  const getStepCompletionStatus = (stepKey: string): boolean => {
    if (!onboardingStatus) return false;
    
    switch (stepKey) {
      case 'personal_data':
        return onboardingStatus.personalDataCompleted || false;
      case 'company_data':
        return onboardingStatus.companyDataCompleted || false;
      case 'financial_settings':
        return onboardingStatus.financialConfigCompleted || false;
      case 'verification':
        return onboardingStatus.verificationCompleted || false;
      default:
        return false;
    }
  };

  /**
   * Obtém informações sobre a próxima etapa do onboarding
   */
  const getNextStep = () => {
    if (isComplete || !onboardingStatus) return null;

    const stepOrder = ['personal_data', 'company_data', 'financial_settings', 'verification'];
    const nextStep = stepOrder.find(step => !getStepCompletionStatus(step));
    
    if (!nextStep) return null;

    const mapping = ONBOARDING_NAVIGATION_MAPPING[nextStep as keyof typeof ONBOARDING_NAVIGATION_MAPPING];
    return {
      stepKey: nextStep,
      title: mapping?.title,
      description: mapping?.description,
      navigationItems: mapping?.navigationItems || []
    };
  };

  /**
   * Calcula o progresso geral do onboarding
   */
  const getProgress = () => {
    if (!onboardingStatus) return 0;
    
    const steps = ['personal_data', 'company_data', 'financial_settings', 'verification'];
    const completedSteps = steps.filter(step => getStepCompletionStatus(step)).length;
    
    return Math.round((completedSteps / steps.length) * 100);
  };

  return {
    shouldShowIndicator,
    shouldIndicatorBeActive,
    getNextStep,
    getProgress,
    isComplete,
    isLoading: !onboardingStatus
  };
}