'use client';

import { useState, useEffect } from 'react';
import { UserOnboardingStatus, OnboardingStep, ONBOARDING_STEPS } from '@/types/onboarding';
import { useTenantId } from './useTenantId';
import { supabase } from '@/lib/supabase/client';

export function useOnboarding() {
  const { tenantId } = useTenantId();
  const [onboardingStatus, setOnboardingStatus] = useState<UserOnboardingStatus | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>(ONBOARDING_STEPS);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);

  // Calcular progresso geral
  const calculateProgress = (status: UserOnboardingStatus): number => {
    const completedSteps = [
      status.personalDataCompleted,
      status.companyDataCompleted,
      status.financialConfigCompleted,
      status.verificationCompleted
    ].filter(Boolean).length;
    
    return Math.round((completedSteps / 4) * 100);
  };

  // Verificar se pode acessar funcionalidades de pagamento
  const canAccessPayments = (status: UserOnboardingStatus): boolean => {
    return status.personalDataCompleted && status.companyDataCompleted;
  };

  // Verificar se pode acessar saques
  const canAccessWithdrawals = (status: UserOnboardingStatus): boolean => {
    return status.personalDataCompleted && 
           status.companyDataCompleted && 
           status.financialConfigCompleted && 
           status.verificationCompleted;
  };

  // Buscar próximo passo não completado
  const getNextStep = (status: UserOnboardingStatus): OnboardingStep | null => {
    if (!status.personalDataCompleted) {
      return steps.find(s => s.id === 'personal-data') || null;
    }
    if (!status.companyDataCompleted) {
      return steps.find(s => s.id === 'company-data') || null;
    }
    if (!status.financialConfigCompleted) {
      return steps.find(s => s.id === 'financial-config') || null;
    }
    if (!status.verificationCompleted) {
      return steps.find(s => s.id === 'verification') || null;
    }
    return null;
  };

  // Carregar status do onboarding
  const loadOnboardingStatus = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      
      // Buscar dados do usuário e empresa
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar dados pessoais na tabela users
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // Verificar dados da empresa na tabela tenants
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      // Calcular status baseado nos dados existentes
      const personalDataCompleted = !!(userData?.full_name && userData?.phone && userData?.cpf);
      const companyDataCompleted = !!(tenantData?.cnpj && tenantData?.razao_social && tenantData?.endereco);
      const financialConfigCompleted = !!(tenantData?.chave_pix && tenantData?.dados_bancarios);
      const verificationCompleted = !!(userData?.email_confirmed && tenantData?.verification_status === 'approved');

      const status: UserOnboardingStatus = {
        userId: user.id,
        tenantId,
        personalDataCompleted,
        companyDataCompleted,
        financialConfigCompleted,
        verificationCompleted,
        overallProgress: 0,
        canAccessPayments: false,
        canAccessWithdrawals: false,
        lastUpdated: new Date().toISOString()
      };

      status.overallProgress = calculateProgress(status);
      status.canAccessPayments = canAccessPayments(status);
      status.canAccessWithdrawals = canAccessWithdrawals(status);

      setOnboardingStatus(status);
      
      // Atualizar steps com status de completude
      const updatedSteps = steps.map(step => ({
        ...step,
        completed: 
          (step.id === 'personal-data' && personalDataCompleted) ||
          (step.id === 'company-data' && companyDataCompleted) ||
          (step.id === 'financial-config' && financialConfigCompleted) ||
          (step.id === 'verification' && verificationCompleted)
      }));
      
      setSteps(updatedSteps);
      setCurrentStep(getNextStep(status));
      
    } catch (error) {
      console.error('Erro ao carregar status do onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar passo como completado
  const completeStep = async (stepId: string) => {
    if (!onboardingStatus) return;

    const updatedStatus = { ...onboardingStatus };
    
    switch (stepId) {
      case 'personal-data':
        updatedStatus.personalDataCompleted = true;
        break;
      case 'company-data':
        updatedStatus.companyDataCompleted = true;
        break;
      case 'financial-config':
        updatedStatus.financialConfigCompleted = true;
        break;
      case 'verification':
        updatedStatus.verificationCompleted = true;
        break;
    }

    updatedStatus.overallProgress = calculateProgress(updatedStatus);
    updatedStatus.canAccessPayments = canAccessPayments(updatedStatus);
    updatedStatus.canAccessWithdrawals = canAccessWithdrawals(updatedStatus);
    updatedStatus.lastUpdated = new Date().toISOString();

    setOnboardingStatus(updatedStatus);
    
    // Atualizar steps
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    setSteps(updatedSteps);
    setCurrentStep(getNextStep(updatedStatus));
  };

  // Recarregar dados
  const refresh = () => {
    loadOnboardingStatus();
  };

  useEffect(() => {
    if (tenantId) {
      loadOnboardingStatus();
    }
  }, [tenantId]);

  return {
    onboardingStatus,
    steps,
    currentStep,
    isLoading,
    isComplete: onboardingStatus?.overallProgress === 100,
    canAccessPayments: onboardingStatus?.canAccessPayments || false,
    canAccessWithdrawals: onboardingStatus?.canAccessWithdrawals || false,
    overallProgress: onboardingStatus?.overallProgress || 0,
    nextStep: currentStep ? {
      action: () => {
        // Navegar para a página correspondente ao step atual
        if (currentStep.id === 'personal-data') {
          window.location.href = '/configuracoes?section=pessoal';
        } else if (currentStep.id === 'company-data') {
          window.location.href = '/configuracoes?section=empresa';
        } else if (currentStep.id === 'financial-config') {
          window.location.href = '/carteira';
        } else if (currentStep.id === 'verification') {
          window.location.href = '/verificacao';
        }
      }
    } : null,
    completeStep,
    refresh
  };
}