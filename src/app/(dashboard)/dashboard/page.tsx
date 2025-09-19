'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTenantId } from '@/lib/hooks/useTenantId';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
// Redis removido do cliente - usando apenas fetch
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

// ✅ OTIMIZAÇÃO: Importação dinâmica para componentes pesados (charts)
const SalesChart = lazy(() => import('@/components/dashboard/SalesChart').then(module => ({ default: module.SalesChart })));
const PaymentMethodChart = lazy(() => import('@/components/dashboard/PaymentMethodChart').then(module => ({ default: module.PaymentMethodChart })));


import { 
  DollarSign, 
  ShoppingCart, 
  BarChart3, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Wallet,
  Zap,
  FileText,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { tenantId, tenant, isLoading: tenantLoading } = useTenantId();
  const { onboardingStatus, isComplete, canAccessPayments } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalSales: 0,
    averageTicket: 0,
    conversionRate: 0,
    recentCharges: [],
    walletBalance: { available: 0, processing: 0 }
  });
  const [charges, setCharges] = useState([]);
  const [pixKeys, setPixKeys] = useState([]);

  // ✅ REDIS: Callback estável com cache distribuído
  const loadDashboardData = useCallback(async () => {
    if (!tenantId || tenantLoading) return;
    
    try {
      setIsLoading(true);
      
      // Fetch padrão sem Redis no cliente
      const [metricsData, chargesData, walletData, pixData] = await Promise.allSettled([
        fetch('/api/dashboard/metrics', { credentials: 'include' }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
        fetch('/api/charges?limit=5', { credentials: 'include' }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
        fetch('/api/wallet/balance', { credentials: 'include' }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
        fetch('/api/efipay/evp', { credentials: 'include' }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
      ]);
          
          // Processar dados das APIs
          if (metricsData.status === 'fulfilled') {
            const data = metricsData.value;
            if (data.success) {
              setMetrics(prev => ({
                ...prev,
                totalRevenue: data.data.totalRevenue || 0,
                totalSales: data.data.totalSales || 0,
                averageTicket: data.data.averageOrderValue || 0,
                conversionRate: data.data.conversionRate || 0
              }));
            }
          }
          
          if (chargesData.status === 'fulfilled') {
            const data = chargesData.value;
            if (data.success) {
              setCharges(data.data || []);
              setMetrics(prev => ({ ...prev, recentCharges: data.data || [] }));
            }
          }
          
          if (walletData.status === 'fulfilled') {
            const data = walletData.value;
            if (data.success) {
              setMetrics(prev => ({ ...prev, walletBalance: data.data }));
            }
          }
          
          if (pixData.status === 'fulfilled') {
            const data = pixData.value;
            if (data.success) {
              setPixKeys(data.data.chaves || []);
            }
          }
          
        } catch (error) {
          console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
          setIsLoading(false);
        }
    }, [tenantId, tenantLoading]);

  // ✅ OTIMIZAÇÃO: useEffect com dependência estável
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (tenantLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!tenantId || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tenant não encontrado</h2>
          <p className="text-gray-600 mb-4">Não foi possível identificar seu tenant.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Entre em contato com o administrador para obter acesso.
          </p>
          <Button asChild>
            <Link href="/login">Voltar ao Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Função para navegar para etapas do onboarding
  const handleOnboardingStep = (stepId: string) => {
    switch (stepId) {
      case 'personal-data':
        router.push('/onboarding/dados-pessoais');
        break;
      case 'company-data':
        router.push('/onboarding/dados-empresa');
        break;
      case 'financial-config':
        router.push('/onboarding/configuracoes-financeiras');
        break;
      case 'verification':
        router.push('/onboarding/verificacao');
        break;
      default:
        console.log('Etapa não encontrada:', stepId);
    }
  };

  // Debug removido - sistema funcionando

  return (
    <div className="dashboard-container-lg">
      {/* Header do Dashboard */}
      <DashboardHeader 
        userName={user?.nome} 
        tenantName={tenant?.name} 
      />



      {/* Métricas Principais */}
      <div className="dashboard-stats-grid">
        <MetricCard
          title="Total em vendas"
          value={`R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={{ value: "+20.1%", type: "positive" }}
          icon={DollarSign}
        />

        <MetricCard
          title="Pedidos pagos"
          value={metrics.totalSales}
          change={{ value: "+180.1%", type: "positive" }}
          icon={ShoppingCart}
        />

        <MetricCard
          title="Ticket médio"
          value={`R$ ${metrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={{ value: "+19%", type: "positive" }}
          icon={BarChart3}
        />
      </div>

      {/* ✅ OTIMIZAÇÃO: Charts com carregamento diferido */}
      <Suspense fallback={
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <SalesChart />
      </Suspense>

      <Suspense fallback={
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <PaymentMethodChart />
      </Suspense>

      {/* Seções Detalhadas por Método de Pagamento */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Vendas no Cartão */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 mr-3">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Vendas no cartão
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Valor em vendas no período
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                R$ 0,00
              </div>
              <p className="text-sm text-muted-foreground">
                Aumente suas vendas no cartão aplicando descontos e incentivos.
              </p>
              <div className="text-lg font-semibold text-blue-600">
                0%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendas no PIX */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950 mr-3">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              Vendas no PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-lg font-semibold text-green-600">
                0%
              </div>
              <div className="text-2xl font-bold">
                R$ 0,00
              </div>
              <p className="text-sm text-muted-foreground">
                Volume total: R$ 0,00
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vendas no Boleto */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950 mr-3">
                <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              Vendas no boleto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-lg font-semibold text-orange-600">
                0%
              </div>
              <div className="text-2xl font-bold">
                R$ 0,00
              </div>
              <p className="text-sm text-muted-foreground">
                Volume total: R$ 0,00
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Índices */}
      <Card className="dashboard-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base font-semibold">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 mr-3">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            Índices
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Boleto, PIX e chargebacks.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Boletos */}
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">0%</div>
              <p className="text-sm font-medium">Boletos</p>
              <p className="text-xs text-muted-foreground">Conversão</p>
            </div>
            
            {/* PIX */}
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0%</div>
              <p className="text-sm font-medium">PIX</p>
              <p className="text-xs text-muted-foreground">Conversão</p>
            </div>
            
            {/* Chargebacks */}
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">0%</div>
              <p className="text-sm font-medium">Chargebacks</p>
              <p className="text-xs text-muted-foreground">0 neste período</p>
            </div>
            
            {/* Pré-Chargebacks */}
            <div className="p-4 rounded-xl bg-muted/30">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">0%</div>
              <p className="text-sm font-medium">Pré-Chargebacks</p>
              <p className="text-xs text-muted-foreground">0 neste período</p>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Seções Adicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Parcelas no Cartão */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 mr-3">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Parcelas no Cartão
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Número de transações
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">
                Nenhuma transação parcelada no período
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Rastreio */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950 mr-3">
                <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              Taxa de Rastreio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Aguardando envio</span>
                <span className="text-sm font-medium">0 (0%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">A caminho</span>
                <span className="text-sm font-medium">0 (0%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Entregue</span>
                <span className="text-sm font-medium">0 (0%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}