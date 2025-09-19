'use client';

import { useEffect, useState } from 'react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, User, Building2, CreditCard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStepStatus {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
}

export function OnboardingIntegration() {
  const { onboardingStatus } = useOnboarding();
  const [steps, setSteps] = useState<OnboardingStepStatus[]>([]);

  useEffect(() => {
    if (onboardingStatus) {
      const stepStatuses: OnboardingStepStatus[] = [
        {
          id: 'personal-data',
          title: 'Dados Pessoais',
          description: 'CPF, telefone e informações pessoais',
          completed: onboardingStatus.personalDataCompleted,
          icon: User,
          section: 'dados-pessoais'
        },
        {
          id: 'company-data',
          title: 'Dados da Empresa',
          description: 'CNPJ, razão social e endereço',
          completed: onboardingStatus.companyDataCompleted,
          icon: Building2,
          section: 'dados-empresa'
        },
        {
          id: 'financial-config',
          title: 'Configurações Financeiras',
          description: 'PIX, dados bancários e configurações',
          completed: onboardingStatus.financialConfigCompleted,
          icon: CreditCard,
          section: 'configuracoes-financeiras'
        },
        {
          id: 'verification',
          title: 'Verificação',
          description: 'Confirmação de email e aprovação',
          completed: onboardingStatus.verificationCompleted,
          icon: Shield,
          section: 'verificacao'
        }
      ];
      setSteps(stepStatuses);
    }
  }, [onboardingStatus]);

  if (!onboardingStatus) {
    return (
      <Card className="settings-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Card className="settings-card">
      <CardHeader className="settings-card-header">
        <CardTitle className="settings-card-title-lg">
          Status do Onboarding
        </CardTitle>
        <CardDescription className="settings-card-description">
          Acompanhe o progresso do seu cadastro e configurações
        </CardDescription>
      </CardHeader>
      <CardContent className="settings-card-content">
        {/* Progresso Geral */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Progresso Geral
            </span>
            <span className="text-sm text-muted-foreground">
              {completedSteps} de {totalSteps} etapas
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-center">
            <Badge 
              variant={progressPercentage === 100 ? "default" : "secondary"}
              className="text-xs"
            >
              {Math.round(progressPercentage)}% Concluído
            </Badge>
          </div>
        </div>

        {/* Lista de Etapas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Etapas do Onboarding
          </h4>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center p-3 rounded-lg border transition-colors",
                  step.completed
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : "bg-muted/30 border-border hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg mr-3",
                  step.completed
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    step.completed
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h5 className="text-sm font-medium text-foreground">
                      {step.title}
                    </h5>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <Badge 
                  variant={step.completed ? "default" : "outline"}
                  className="text-xs"
                >
                  {step.completed ? "Concluído" : "Pendente"}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Ações Disponíveis */}
        {onboardingStatus.canAccessPayments && onboardingStatus.canAccessWithdrawals ? (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Onboarding Completo!
              </span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Você já pode acessar todas as funcionalidades da plataforma.
            </p>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Onboarding em Andamento
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Complete todas as etapas para acessar todas as funcionalidades.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}