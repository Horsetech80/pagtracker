'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Activity,
  DollarSign,
  Users
} from 'lucide-react';
import { useTenantId } from '@/lib/hooks/useTenantId';

export default function RelatoriosPage() {
  const { tenantId, tenant, isLoading } = useTenantId();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-lg">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">
            Analytics e relatórios detalhados • Tenant: {tenant?.name || tenantId || 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="dashboard-stats-grid">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total ativo
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Média mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Disponíveis */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Relatório de Vendas
            </CardTitle>
            <CardDescription>
              Análise detalhada de vendas e receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Visualize tendências de vendas, receita por período e análise de produtos.
              </p>
              <Button size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Relatório de Clientes
            </CardTitle>
            <CardDescription>
              Análise de comportamento e segmentação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Entenda o comportamento dos clientes e segmentação por valor.
              </p>
              <Button size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Análise de Performance
            </CardTitle>
            <CardDescription>
              Métricas de performance e conversão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Analise taxas de conversão, performance de campanhas e ROI.
              </p>
              <Button size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Relatório Financeiro
            </CardTitle>
            <CardDescription>
              Análise financeira e fluxo de caixa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Visualize fluxo de caixa, receitas, despesas e projeções.
              </p>
              <Button size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Relatório de Crescimento
            </CardTitle>
            <CardDescription>
              Análise de crescimento e tendências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Identifique tendências de crescimento e oportunidades.
              </p>
              <Button size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Relatório Mensal
            </CardTitle>
            <CardDescription>
              Crie relatórios personalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Configure relatórios específicos para suas necessidades.
              </p>
              <Button size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* APIs Disponíveis */}
      <Card className="rounded-xl border-0 shadow-sm bg-card">
        <CardHeader>
          <CardTitle>APIs de Relatórios</CardTitle>
          <CardDescription>
            Endpoints para acessar dados de relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">GET /api/reports/sales</p>
                <p className="text-sm text-muted-foreground">Relatório de vendas</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">GET /api/reports/customers</p>
                <p className="text-sm text-muted-foreground">Relatório de clientes</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">GET /api/reports/financial</p>
                <p className="text-sm text-muted-foreground">Relatório financeiro</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">GET /api/reports/performance</p>
                <p className="text-sm text-muted-foreground">Relatório de performance</p>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}