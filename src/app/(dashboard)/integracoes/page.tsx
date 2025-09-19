'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Webhook, Zap } from 'lucide-react';
import WebhooksSettings from '@/components/settings/WebhooksSettings';

export default function IntegracoesPage() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section') || 'webhooks';

  const renderSection = () => {
    switch (activeSection) {
      case 'webhooks':
        return <WebhooksSettings />;
      default:
        return <WebhooksSettings />;
    }
  };

  return (
    <div className="container-responsive space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Integrações</h2>
          <p className="text-muted-foreground">
            Configure webhooks e outras integrações para automatizar seu fluxo de trabalho.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* Cards de resumo das integrações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Ativos</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Nenhum webhook configurado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrações</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Webhooks disponível
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo da seção ativa */}
      <div className="grid gap-4">
        {renderSection()}
      </div>
    </div>
  );
}