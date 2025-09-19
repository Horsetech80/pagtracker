'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/lib/hooks/useOnboarding';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  route: string;
  completed: boolean;
  current?: boolean;
}

interface OnboardingProgressTrackerProps {
  variant?: 'sidebar' | 'header' | 'card';
  showDetails?: boolean;
  className?: string;
}

export function OnboardingProgressTracker({ 
  variant = 'card', 
  showDetails = true, 
  className = '' 
}: OnboardingProgressTrackerProps) {
  const router = useRouter();
  const { onboardingStatus, isLoading, refresh } = useOnboarding();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (onboardingStatus) {
      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'personal-data',
          title: 'Dados Pessoais',
          description: 'CPF, telefone e endereço',
          route: '/onboarding/dados-pessoais',
          completed: onboardingStatus.personalDataCompleted || false
        },
        {
          id: 'company-data',
          title: 'Dados da Empresa',
          description: 'CNPJ, razão social e endereço',
          route: '/onboarding/dados-empresa',
          completed: onboardingStatus.companyDataCompleted || false
        },
        {
          id: 'financial-config',
          title: 'Configurações Financeiras',
          description: 'Dados bancários e chaves PIX',
          route: '/onboarding/configuracoes-financeiras',
          completed: onboardingStatus.financialConfigCompleted || false
        },
        {
          id: 'verification',
          title: 'Verificação',
          description: 'Validação dos dados enviados',
          route: '/onboarding/verificacao',
          completed: onboardingStatus.verificationCompleted || false
        }
      ];

      // Encontrar o índice da etapa atual
      const currentIndex = onboardingSteps.findIndex(step => !step.completed);
      const actualCurrentIndex = currentIndex === -1 ? onboardingSteps.length - 1 : currentIndex;
      
      // Marcar a etapa atual
      onboardingSteps.forEach((step, index) => {
        step.current = index === actualCurrentIndex;
      });

      setSteps(onboardingSteps);
      setCurrentStepIndex(actualCurrentIndex);
      
      // Calcular progresso
      const completedSteps = onboardingSteps.filter(step => step.completed).length;
      const progressPercentage = (completedSteps / onboardingSteps.length) * 100;
      setProgress(progressPercentage);
    }
  }, [onboardingStatus]);

  const handleStepClick = (step: OnboardingStep, index: number) => {
    // Só permite navegar para a etapa atual ou etapas já completadas
    if (step.completed || index === currentStepIndex) {
      router.push(step.route);
    }
  };

  const getStepIcon = (step: OnboardingStep, index: number) => {
    if (step.completed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (step.current) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    } else {
      return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStepStatus = (step: OnboardingStep) => {
    if (step.completed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
    } else if (step.current) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Atual</Badge>;
    } else {
      return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>
    );
  }

  // Variante para header (compacta)
  if (variant === 'header') {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">
              Onboarding {Math.round(progress)}% concluído
            </span>
            <span className="text-xs text-muted-foreground">
              {steps.filter(s => s.completed).length}/{steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        {progress < 100 && (
          <Button 
            size="sm" 
            onClick={() => handleStepClick(steps[currentStepIndex], currentStepIndex)}
            className="whitespace-nowrap"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  // Variante para sidebar (vertical)
  if (variant === 'sidebar') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Progresso do Onboarding</h3>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            {steps.filter(s => s.completed).length} de {steps.length} etapas concluídas
          </p>
        </div>
        
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                step.completed || step.current 
                  ? 'hover:bg-accent hover:text-accent-foreground' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => handleStepClick(step, index)}
            >
              {getStepIcon(step, index)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{step.title}</p>
                {showDetails && (
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Variante padrão (card)
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Progresso do Onboarding</span>
          <Badge variant={progress === 100 ? "default" : "secondary"}>
            {Math.round(progress)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {steps.filter(s => s.completed).length} de {steps.length} etapas concluídas
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                step.completed || step.current 
                  ? 'border-border hover:border-accent-foreground cursor-pointer hover:bg-accent' 
                  : 'border-muted bg-muted/30 cursor-not-allowed'
              }`}
              onClick={() => handleStepClick(step, index)}
            >
              {getStepIcon(step, index)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                  {getStepStatus(step)}
                </div>
                {showDetails && (
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                )}
              </div>
              {(step.completed || step.current) && (
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {progress < 100 && (
          <div className="pt-2">
            <Button 
              onClick={() => handleStepClick(steps[currentStepIndex], currentStepIndex)}
              className="w-full"
            >
              Continuar Onboarding
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {progress === 100 && (
          <div className="pt-2">
            <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Onboarding Concluído!
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  Agora você pode acessar todas as funcionalidades da plataforma.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}