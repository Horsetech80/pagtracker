'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  AlertTriangle, 
  User, 
  Building2, 
  CreditCard, 
  Shield,
  ArrowRight
} from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';


interface OnboardingBlockerProps {
  feature: 'payments' | 'withdrawals' | 'full';
  title?: string;
  description?: string;
  onContinue?: (stepId: string) => void;
  showProgress?: boolean;
}

const featureConfig = {
  payments: {
    title: 'Acesso a Pagamentos Bloqueado',
    description: 'Para criar cobranças e receber pagamentos, você precisa completar seus dados pessoais e da empresa.',
    icon: CreditCard,
    requiredSteps: ['personal-data', 'company-data']
  },
  withdrawals: {
    title: 'Acesso a Saques Bloqueado',
    description: 'Para realizar saques, você precisa completar todas as etapas do cadastro e ter sua conta verificada.',
    icon: Shield,
    requiredSteps: ['personal-data', 'company-data', 'financial-config', 'verification']
  },
  full: {
    title: 'Cadastro Incompleto',
    description: 'Complete todas as etapas do seu cadastro para acessar todas as funcionalidades da plataforma.',
    icon: Lock,
    requiredSteps: ['personal-data', 'company-data', 'financial-config', 'verification']
  }
};

const stepIcons = {
  'personal-data': User,
  'company-data': Building2,
  'financial-config': CreditCard,
  'verification': Shield
};

export function OnboardingBlocker({ 
  feature, 
  title, 
  description, 
  onContinue,
  showProgress = true 
}: OnboardingBlockerProps) {
  const { 
    onboardingStatus, 
    steps, 
    currentStep, 
    isLoading,
    canAccessPayments,
    canAccessWithdrawals
  } = useOnboarding();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Verificando permissões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar se o usuário já tem acesso
  if (feature === 'payments' && canAccessPayments) return null;
  if (feature === 'withdrawals' && canAccessWithdrawals) return null;
  if (feature === 'full' && onboardingStatus?.overallProgress === 100) return null;

  const config = featureConfig[feature];
  const Icon = config.icon;
  
  // Encontrar próximo passo necessário
  const nextRequiredStep = config.requiredSteps.find(stepId => {
    const step = steps.find(s => s.id === stepId);
    return step && !step.completed;
  });

  const nextStep = nextRequiredStep ? steps.find(s => s.id === nextRequiredStep) : null;
  const NextStepIcon = nextStep ? stepIcons[nextStep.id as keyof typeof stepIcons] : ArrowRight;

  return (
    <div className="space-y-6">
      {/* Alerta Principal */}
      <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Atenção:</strong> Esta funcionalidade está temporariamente bloqueada. 
          Complete as etapas pendentes do seu cadastro para continuar.
        </AlertDescription>
      </Alert>

      {/* Card Principal */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl text-orange-800 dark:text-orange-200">
            {title || config.title}
          </CardTitle>
          <CardDescription className="text-orange-600 dark:text-orange-400">
            {description || config.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Próximo Passo */}
          {nextStep && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <NextStepIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Próximo passo:</p>
                  <p className="text-sm text-muted-foreground">{nextStep.title}</p>
                </div>
              </div>
              
              {onContinue && (
                <Button 
                  onClick={() => onContinue(nextStep.id)}
                  className="w-full"
                >
                  Continuar: {nextStep.title}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Progresso Detalhado */}
          {showProgress && (
            <div className="border-t pt-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Complete seu cadastro usando a barra de progresso no topo da página.
                </p>
              </div>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Por que preciso completar o cadastro?
            </h4>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              {feature === 'payments' && (
                <>
                  <li>• Validação de identidade para segurança das transações</li>
                  <li>• Conformidade com regulamentações financeiras</li>
                  <li>• Proteção contra fraudes e lavagem de dinheiro</li>
                </>
              )}
              {feature === 'withdrawals' && (
                <>
                  <li>• Verificação de dados bancários para transferências</li>
                  <li>• Validação de documentos para compliance</li>
                  <li>• Aprovação manual para segurança adicional</li>
                </>
              )}
              {feature === 'full' && (
                <>
                  <li>• Acesso completo a todas as funcionalidades</li>
                  <li>• Maior limite de transações</li>
                  <li>• Suporte prioritário</li>
                </>
              )}
            </ul>
          </div>

          {/* Estatísticas de Progresso */}
          {onboardingStatus && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">
                  {onboardingStatus.overallProgress}%
                </p>
                <p className="text-xs text-muted-foreground">Progresso Geral</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">
                  {steps.filter(s => s.completed).length}/{steps.length}
                </p>
                <p className="text-xs text-muted-foreground">Etapas Completas</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}