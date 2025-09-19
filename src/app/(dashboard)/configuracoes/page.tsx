'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { CoProducaoSettings } from '@/components/settings/CoProducaoSettings';
import { TaxasSettings } from '@/components/settings/TaxasSettings';
import { ChaveApiSettings } from '@/components/settings/ChaveApiSettings';
import { IpAutorizadoSettings } from '@/components/settings/IpAutorizadoSettings';
import { DocumentacaoApiSettings } from '@/components/settings/DocumentacaoApiSettings';
import { TwoFactorAuthSettings } from '@/components/settings/TwoFactorAuthSettings';
import { OnboardingIntegration } from '@/components/settings/OnboardingIntegration';
import { PerfilSettings } from '@/components/settings/PerfilSettings';
import { EmpresaSettings } from '@/components/settings/EmpresaSettings';


// Importar wrappers dos componentes de onboarding
import { DadosPessoaisWrapper } from '@/components/settings/onboarding/DadosPessoaisWrapper';
import { DadosEmpresaWrapper } from '@/components/settings/onboarding/DadosEmpresaWrapper';
import { ConfiguracoesFinanceirasWrapper } from '@/components/settings/onboarding/ConfiguracoesFinanceirasWrapper';
import { VerificacaoWrapper } from '@/components/settings/onboarding/VerificacaoWrapper';

function ConfiguracoesContent() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section') || 'coproducao';

  const renderContent = () => {
    switch (activeSection) {
  
      case 'coproducao':
        return <CoProducaoSettings />;
      case 'taxas':
        return <TaxasSettings />;
      case 'chave-api':
        return <ChaveApiSettings />;
      case 'ip-autorizado':
        return <IpAutorizadoSettings />;
      case 'documentacao-api':
        return <DocumentacaoApiSettings />;
      case '2fa':
        return <TwoFactorAuthSettings />;
      case 'pessoal':
        return <PerfilSettings />;
      case 'empresa':
        return <EmpresaSettings />;
      // Seções de onboarding integradas
      case 'dados-pessoais':
        return <DadosPessoaisWrapper />;
      case 'dados-empresa':
        return <DadosEmpresaWrapper />;
      case 'configuracoes-financeiras':
        return <ConfiguracoesFinanceirasWrapper />;
      case 'verificacao':
        return <VerificacaoWrapper />;
      default:
        return (
          <div className="space-y-6">
            {/* Status do Onboarding */}
            <OnboardingIntegration />
            
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Configurações
              </h2>
              <p className="text-muted-foreground">
                Selecione uma seção no menu lateral para configurar sua conta.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8">
      {renderContent()}
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    }>
      <ConfiguracoesContent />
    </Suspense>
  );
}