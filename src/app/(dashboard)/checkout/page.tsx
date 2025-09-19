'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, Activity, TrendingUp, Settings } from 'lucide-react';

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    // Simular obtenção do tenant_id
    setTimeout(() => {
      setTenantId('demo-tenant-123');
      setIsLoading(false);
    }, 1000);
  }, []);

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
          <h2 className="text-3xl font-bold tracking-tight">Checkout</h2>
          <p className="text-gray-600">
            Configure e gerencie seus checkouts • Tenant: {tenantId || 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Checkout
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="dashboard-stats-grid">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Checkouts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhum checkout criado</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhum checkout ativo</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Taxa de conversão</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="secondary">Ativo</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Sistema operacional</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Filtros e Pesquisa Checkouts</CardTitle>
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Input
              type="text"
              placeholder="Pesquisar checkouts..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Checkouts */}
      <Card className="dashboard-card">
        <CardContent className="p-12">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-lg font-medium mb-2">
              Seus checkouts aparecerão aqui quando você começar a usar o sistema
            </CardTitle>
            <CardDescription className="mb-6">
              Crie seu primeiro checkout para começar a receber pagamentos
            </CardDescription>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Checkout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* URLs públicas para seus checkouts */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">URLs públicas para seus checkouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                URL Base
              </label>
              <Input
                type="text"
                value="https://checkout.pagtracker.com/"
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Exemplo de Checkout
              </label>
              <Input
                type="text"
                value="https://checkout.pagtracker.com/exemplo"
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}