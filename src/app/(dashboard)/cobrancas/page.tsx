'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter,
  CreditCard,
  DollarSign,
  Calendar,
  Activity,
  Loader2
} from 'lucide-react';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { supabase } from '@/lib/supabase/client';

interface Charge {
  id: string;
  valor: number;
  descricao: string;
  status: string;
  txid: string;
  created_at: string;
  expires_at?: string;
  customer_name?: string;
  qr_code?: string;
}

export default function CobrancasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(true);
  const { tenantId, tenant, isLoading } = useTenantId();

  // Buscar cobranças da API
  useEffect(() => {
    const fetchCharges = async () => {
      try {
        setLoadingCharges(true);
        
        // Obter token de autenticação do Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Erro de autenticação:', userError);
          return;
        }

        const response = await fetch('/api/charges', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'x-tenant-id': tenantId || ''
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCharges(data.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar cobranças:', error);
      } finally {
        setLoadingCharges(false);
      }
    };

    fetchCharges();
  }, []);

  // Filtrar cobranças baseado no termo de busca
  const filteredCharges = charges.filter(charge => 
    (charge.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (charge.txid || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estatísticas
  const totalCharges = charges.length;
  const totalValue = charges.reduce((sum, charge) => sum + charge.valor, 0);
  const pendingCharges = charges.filter(charge => charge.status === 'pendente').length;
  const paidCharges = charges.filter(charge => charge.status === 'pago').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="default" className="bg-green-500">Pago</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'expirado':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
          <h2 className="text-3xl font-bold tracking-tight">Cobranças</h2>
          <p className="text-muted-foreground">
            Gerencie suas cobranças e transações • Tenant: {tenant?.name || tenantId || 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/cobrancas/nova" passHref>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Cobrança
            </Button>
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="dashboard-stats-grid">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingCharges ? '-' : totalCharges}</div>
            <p className="text-xs text-muted-foreground">
              {totalCharges === 0 ? 'Nenhuma cobrança registrada' : `${totalCharges} cobrança${totalCharges > 1 ? 's' : ''} registrada${totalCharges > 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingCharges ? '-' : formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {totalValue === 0 ? 'Nenhum valor registrado' : 'Valor total das cobranças'}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingCharges ? '-' : pendingCharges}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCharges === 0 ? 'Nenhuma cobrança pendente' : `${pendingCharges} cobrança${pendingCharges > 1 ? 's' : ''} pendente${pendingCharges > 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingCharges ? '-' : paidCharges}</div>
            <p className="text-xs text-muted-foreground">
              {paidCharges === 0 ? 'Nenhuma cobrança paga' : `${paidCharges} cobrança${paidCharges > 1 ? 's' : ''} paga${paidCharges > 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busque e filtre suas cobranças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cobranças..."
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

      {/* Lista de Cobranças */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Cobranças Recentes</CardTitle>
          <CardDescription>
            {loadingCharges ? 'Carregando cobranças...' : `${filteredCharges.length} cobrança${filteredCharges.length !== 1 ? 's' : ''} encontrada${filteredCharges.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCharges ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carregando cobranças...</p>
            </div>
          ) : filteredCharges.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma cobrança encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {charges.length === 0 ? 'Comece criando sua primeira cobrança para ver os dados aqui' : 'Tente ajustar os filtros de busca'}
              </p>
              <Link href="/cobrancas/nova" passHref>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {charges.length === 0 ? 'Criar Primeira Cobrança' : 'Nova Cobrança'}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                           <span className="font-medium">{charge.descricao || 'Sem descrição'}</span>
                           {getStatusBadge(charge.status)}
                         </div>
                         <div className="text-sm text-muted-foreground">
                           <span className="font-mono">{charge.txid || 'N/A'}</span> • Criada em {formatDate(charge.created_at)}
                           {charge.expires_at && ` • Expira em ${formatDate(charge.expires_at)}`}
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-lg font-bold">{formatCurrency(charge.valor)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Link href={`/cobrancas/${charge.id}`} passHref>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}