'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  X
} from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { OnboardingStep } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  onStepClick?: (stepId: string) => void;
  showMinimized?: boolean;
  onMinimize?: () => void;
}

const stepIcons = {
  'personal-data': User,
  'company-data': Building2,
  'financial-config': CreditCard,
  'verification': Shield
};

export function OnboardingProgress({ 
  onStepClick, 
  showMinimized = false,
  onMinimize 
}: OnboardingProgressProps) {
  const { 
    onboardingStatus, 
    steps, 
    currentStep, 
    isLoading, 
    isComplete,
    canAccessPayments,
    canAccessWithdrawals
  } = useOnboarding();
  
  const [isMinimized, setIsMinimized] = useState(showMinimized);

  if (isLoading || !onboardingStatus) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Carregando progresso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Parabéns! Seu cadastro está completo
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Você já pode acessar todas as funcionalidades da plataforma
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              100% Completo
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Complete seu cadastro ({onboardingStatus.overallProgress}%)
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  {currentStep?.title} pendente
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsMinimized(false)}
            >
              Expandir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Complete seu cadastro
            </CardTitle>
            <CardDescription>
              Finalize todas as etapas para acessar todas as funcionalidades
            </CardDescription>
          </div>
          {onMinimize && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setIsMinimized(true);
                onMinimize();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de Progresso Geral */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progresso Geral</span>
            <span className="text-muted-foreground">{onboardingStatus.overallProgress}%</span>
          </div>
          <Progress value={onboardingStatus.overallProgress} className="h-2" />
        </div>

        {/* Lista de Etapas */}
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = stepIcons[step.id as keyof typeof stepIcons] || User;
            const isCurrentStep = currentStep?.id === step.id;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  step.completed 
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                    : isCurrentStep 
                    ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800" 
                    : "bg-muted border-border",
                  onStepClick && !step.completed && "cursor-pointer hover:bg-accent"
                )}
                onClick={() => {
                  if (onStepClick && !step.completed) {
                    onStepClick(step.id);
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full",
                    step.completed 
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : isCurrentStep 
                      ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isCurrentStep ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div>
                    <p className={cn(
                      "font-medium text-sm",
                      step.completed 
                        ? "text-green-800 dark:text-green-200"
                        : isCurrentStep 
                        ? "text-orange-800 dark:text-orange-200"
                        : "text-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className={cn(
                      "text-xs",
                      step.completed 
                        ? "text-green-600 dark:text-green-400"
                        : isCurrentStep 
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-muted-foreground"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {step.completed ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      Completo
                    </Badge>
                  ) : isCurrentStep ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                      Atual
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Pendente
                    </Badge>
                  )}
                  
                  {onStepClick && !step.completed && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status de Acesso */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Acesso a Pagamentos:</span>
            <Badge variant={canAccessPayments ? "secondary" : "outline"}>
              {canAccessPayments ? "Liberado" : "Bloqueado"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Acesso a Saques:</span>
            <Badge variant={canAccessWithdrawals ? "secondary" : "outline"}>
              {canAccessWithdrawals ? "Liberado" : "Bloqueado"}
            </Badge>
          </div>
        </div>

        {/* Botão de Ação */}
        {currentStep && onStepClick && (
          <Button 
            onClick={() => onStepClick(currentStep.id)}
            className="w-full"
          >
            Continuar: {currentStep.title}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}