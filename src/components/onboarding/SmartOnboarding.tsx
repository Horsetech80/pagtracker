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
  X,
  Sparkles,
  MessageCircle,
  HelpCircle,
  Rocket,
  Target
} from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { OnboardingStep } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { OnboardingWizard } from './OnboardingWizard';

interface SmartOnboardingProps {
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

const stepMessages = {
  'personal-data': {
    title: '👋 Olá! Vamos começar com seus dados pessoais',
    message: 'Precisamos validar sua identidade para garantir a segurança das transações. É rápido e seguro!',
    action: 'Validar Identidade'
  },
  'company-data': {
    title: '🏢 Agora vamos cadastrar sua empresa',
    message: 'Com os dados da empresa, você poderá emitir notas fiscais e ter relatórios completos.',
    action: 'Cadastrar Empresa'
  },
  'financial-config': {
    title: '💰 Configure suas informações financeiras',
    message: 'Configure seu PIX e dados bancários para receber pagamentos instantaneamente.',
    action: 'Configurar PIX'
  },
  'verification': {
    title: '✅ Última etapa: verificação',
    message: 'Vamos verificar seus dados automaticamente. Em poucos minutos você terá acesso completo!',
    action: 'Iniciar Verificação'
  }
};

const motivationalMessages = [
  '🚀 Você está quase lá! Cada etapa te aproxima do sucesso.',
  '⭐ Parabéns pelo progresso! Continue assim.',
  '🎯 Foco no objetivo! Sua empresa digital está tomando forma.',
  '💪 Excelente! Você está construindo algo incrível.'
];

export function SmartOnboarding({ 
  onStepClick, 
  showMinimized = false,
  onMinimize 
}: SmartOnboardingProps) {
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
  const [showWizard, setShowWizard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (isLoading || !onboardingStatus) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Carregando seu progresso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Rocket className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">
                  🎉 Parabéns! Sua empresa está pronta!
                </h3>
                <p className="text-green-600 dark:text-green-300">
                  Agora você pode acessar todas as funcionalidades da plataforma e começar a vender!
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
              ✨ 100% Completo
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Continue seu cadastro ({onboardingStatus.overallProgress}%)
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Próximo: {currentStep?.title}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowWizard(true)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Guia
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsMinimized(false)}
              >
                Expandir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepMessage = currentStep ? stepMessages[currentStep.id as keyof typeof stepMessages] : null;
  const motivationalMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <>
      <Card className="border-l-4 border-l-orange-500 overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Configuração Inteligente
                </CardTitle>
                <CardDescription>
                  {motivationalMessage}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
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
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Current Step Message */}
          {currentStepMessage && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium text-primary">
                      {currentStepMessage.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {currentStepMessage.message}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => currentStep && onStepClick?.(currentStep.id)}
                        className="bg-primary"
                      >
                        {currentStepMessage.action}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowWizard(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Ver Guia Completo
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{onboardingStatus.overallProgress}%</div>
                <div className="text-sm text-muted-foreground">Progresso Geral</div>
                <Progress value={onboardingStatus.overallProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {steps.filter(s => s.completed).length}
                </div>
                <div className="text-sm text-muted-foreground">Etapas Completas</div>
                <div className="text-xs text-green-600 mt-1">de {steps.length} total</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {steps.filter(s => !s.completed).length}
                </div>
                <div className="text-sm text-muted-foreground">Restantes</div>
                <div className="text-xs text-orange-600 mt-1">para finalizar</div>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          {showHelp && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  💡 Por que preciso completar o cadastro?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Validação de identidade para segurança das transações</li>
                  <li>• Conformidade com regulamentações financeiras</li>
                  <li>• Proteção contra fraudes e lavagem de dinheiro</li>
                  <li>• Acesso a todas as funcionalidades da plataforma</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowWizard(true)}
              className="bg-primary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Abrir Guia Inteligente
            </Button>
            
            {currentStep && onStepClick && (
              <Button 
                variant="outline"
                onClick={() => onStepClick(currentStep.id)}
              >
                Continuar: {currentStep.title}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Access Status */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>💳 Pagamentos:</span>
              <Badge variant={canAccessPayments ? "default" : "secondary"}>
                {canAccessPayments ? "✅ Liberado" : "🔒 Bloqueado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>💰 Saques:</span>
              <Badge variant={canAccessWithdrawals ? "default" : "secondary"}>
                {canAccessWithdrawals ? "✅ Liberado" : "🔒 Bloqueado"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wizard Modal */}
      <OnboardingWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onStepComplete={(stepId) => {
          onStepClick?.(stepId);
          setShowWizard(false);
        }}
      />
    </>
  );
}