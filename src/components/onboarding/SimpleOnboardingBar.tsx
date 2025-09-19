'use client';

import { useState } from 'react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Circle, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleOnboardingBarProps {
  className?: string;
}

export function SimpleOnboardingBar({ className }: SimpleOnboardingBarProps) {
  const { onboardingStatus, isLoading, overallProgress, nextStep } = useOnboarding();
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading || overallProgress === 100) {
    return null;
  }

  const steps = [
    {
      id: 'personal_data',
      title: 'Dados Pessoais',
      completed: onboardingStatus?.personalDataCompleted || false,
      description: 'Complete suas informações pessoais para continuar'
    },
    {
      id: 'company_data',
      title: 'Dados da Empresa',
      completed: onboardingStatus?.companyDataCompleted || false,
      description: 'Adicione as informações da sua empresa'
    },
    {
      id: 'financial_settings',
      title: 'Configurações Financeiras',
      completed: onboardingStatus?.financialConfigCompleted || false,
      description: 'Configure suas preferências financeiras'
    },
    {
      id: 'verification',
      title: 'Verificação',
      completed: onboardingStatus?.verificationCompleted || false,
      description: 'Verifique e confirme suas informações'
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const currentStep = steps.find(step => !step.completed);

  return (
    <Card className={cn("p-4 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Progresso do Onboarding
            </h3>
            <span className="text-sm text-muted-foreground">
              {completedSteps} de {steps.length} etapas concluídas
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-2" />
            
            {currentStep && (
              <p className="text-sm text-muted-foreground">
                Próximo: <span className="font-medium text-foreground">{currentStep.title}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Ver Detalhes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Progresso do Onboarding</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {overallProgress}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {completedSteps} de {steps.length} etapas concluídas
                  </p>
                  <Progress value={overallProgress} className="mt-2" />
                </div>

                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm",
                          step.completed ? "text-green-700 dark:text-green-400" : "text-foreground"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {nextStep && (
            <Button size="sm" onClick={() => nextStep.action()}>
              Continuar
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}