'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter,
  Webhook,
  Activity,
  Settings,
  Globe
} from 'lucide-react';
import { useTenantId } from '@/lib/hooks/useTenantId';

export default function WebhooksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { tenantId, tenant, isLoading } = useTenantId();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[80%] mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Webhooks</h2>
          <p className="text-muted-foreground">
            Configure e gerencie seus webhooks • Tenant: {tenantId || 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Webhook
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Webhooks</CardTitle>
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
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Nenhum webhook ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="default">Ativo</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sistema operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busque e filtre seus webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar webhooks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
          <CardDescription>
            Seus webhooks aparecerão aqui quando você começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Webhook className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum webhook encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Configure webhooks para receber notificações em tempo real
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Configurar Primeiro Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* URLs de Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>URLs de Webhook</CardTitle>
          <CardDescription>
            URLs para receber webhooks de diferentes provedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-600 mb-2">Webhook Unificado:</p>
              <p className="font-mono text-sm">https://webhook-hml.pagtracker.com/api/webhooks/unified</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-600 mb-2">Efi Bank:</p>
              <p className="font-mono text-sm">https://webhook-hml.pagtracker.com/api/webhooks/efibank</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-600 mb-2">Stripe:</p>
              <p className="font-mono text-sm">https://webhook-hml.pagtracker.com/api/webhooks/stripe</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* APIs Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>APIs de Webhook</CardTitle>
          <CardDescription>
            Endpoints para gerenciar webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">POST /api/webhooks/unified</p>
                <p className="text-sm text-muted-foreground">Webhook unificado</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">POST /api/webhooks/efibank</p>
                <p className="text-sm text-muted-foreground">Webhook Efi Bank</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">POST /api/webhooks/stripe</p>
                <p className="text-sm text-muted-foreground">Webhook Stripe</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">GET /api/webhooks/logs</p>
                <p className="text-sm text-muted-foreground">Logs de webhooks</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}