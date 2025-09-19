'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Building2, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Info,
  Star,
  Zap
} from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { OnboardingStep } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onStepComplete: (stepId: string) => void;
}

const stepIcons = {
  'personal-data': User,
  'company-data': Building2,
  'financial-config': CreditCard,
  'verification': Shield
};

const stepBenefits = {
  'personal-data': [
    'Validação de identidade para segurança',
    'Proteção contra fraudes',
    'Conformidade com regulamentações'
  ],
  'company-data': [
    'Emissão de notas fiscais automáticas',
    'Relatórios fiscais completos',
    'Integração com contabilidade'
  ],
  'financial-config': [
    'Recebimento instantâneo via PIX',
    'Transferências automáticas',
    'Controle total do fluxo de caixa'
  ],
  'verification': [
    'Acesso completo à plataforma',
    'Limites de transação aumentados',
    'Suporte prioritário'
  ]
};

const stepTips = {
  'personal-data': 'Dica: Tenha seu CPF e telefone em mãos para agilizar o processo.',
  'company-data': 'Dica: Você pode consultar os dados da empresa pelo CNPJ automaticamente.',
  'financial-config': 'Dica: Configure sua chave PIX para receber pagamentos instantaneamente.',
  'verification': 'Dica: A verificação é automática e leva apenas alguns minutos.'
};

export function OnboardingWizard({ isOpen, onClose, onStepComplete }: OnboardingWizardProps) {
  const { steps, currentStep, onboardingStatus } = useOnboarding();
  const [currentWizardStep, setCurrentWizardStep] = useState(0);
  const [showBenefits, setShowBenefits] = useState(false);

  const availableSteps = steps.filter(step => !step.completed);
  const currentStepData = availableSteps[currentWizardStep];

  useEffect(() => {
    if (currentStep && availableSteps.length > 0) {
      const stepIndex = availableSteps.findIndex(step => step.id === currentStep.id);
      if (stepIndex >= 0) {
        setCurrentWizardStep(stepIndex);
      }
    }
  }, [currentStep, availableSteps]);

  const handleNext = () => {
    if (currentWizardStep < availableSteps.length - 1) {
      setCurrentWizardStep(currentWizardStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentWizardStep > 0) {
      setCurrentWizardStep(currentWizardStep - 1);
    }
  };

  const handleStartStep = () => {
    if (currentStepData) {
      onStepComplete(currentStepData.id);
      onClose();
    }
  };

  if (!currentStepData || !onboardingStatus) {
    return null;
  }

  const Icon = stepIcons[currentStepData.id as keyof typeof stepIcons] || User;
  const benefits = stepBenefits[currentStepData.id as keyof typeof stepBenefits] || [];
  const tip = stepTips[currentStepData.id as keyof typeof stepTips] || '';
  const progressPercentage = ((currentWizardStep + 1) / availableSteps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            Vamos configurar: {currentStepData.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do Wizard</span>
              <span>{currentWizardStep + 1} de {availableSteps.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Description */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Por que esta etapa é importante?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {currentStepData.description}
              </p>
              
              {/* Benefits */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBenefits(!showBenefits)}
                  className="p-0 h-auto font-medium text-primary"
                >
                  <Star className="h-4 w-4 mr-1" />
                  {showBenefits ? 'Ocultar' : 'Ver'} benefícios desta etapa
                </Button>
                
                {showBenefits && (
                  <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tip */}
              {tip && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">{tip}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Progress Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Seu Progresso Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Progresso Geral</span>
                  <div className="flex items-center gap-2">
                    <Progress value={onboardingStatus.overallProgress} className="h-2 flex-1" />
                    <Badge variant="outline">{onboardingStatus.overallProgress}%</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Etapas Restantes</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{availableSteps.length}</span>
                    <span className="text-muted-foreground">de {steps.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentWizardStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              {currentWizardStep < availableSteps.length - 1 && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={handleStartStep} className="bg-primary">
                <Icon className="h-4 w-4 mr-2" />
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}