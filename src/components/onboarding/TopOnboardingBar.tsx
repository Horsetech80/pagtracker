'use client';

import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function TopOnboardingBar() {
  const { onboardingStatus, isLoading, steps, currentStep } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !onboardingStatus || onboardingStatus.overallProgress === 100 || dismissed) {
    return null;
  }

  const completedSteps = steps.filter(step => step.completed).length;

  return (
    <div className="bg-primary/10 border-b border-primary/20 py-2">
      <div className="container-responsive flex items-center text-left">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              Siga os pontos verdes para completar seu cadastro
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{completedSteps}/{steps.length} etapas</span>
            <Progress value={onboardingStatus.overallProgress} className="w-20 h-1" />
          </div>

          {currentStep && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>•</span>
              <span>Próximo: {currentStep.title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-3 text-xs bg-background/50 hover:bg-background"
              onClick={() => {
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
              }}
            >
              Continuar
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}