/**
 * Gateway Balance Card Component
 * 
 * Componente para exibir o saldo do gateway EfiPay no dashboard
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase/client';

// ================================================================
// INTERFACES E TIPOS
// ================================================================

interface GatewayBalance {
  provider: 'efipay';
  saldo: {
    disponivel: number; // em centavos
    bloqueado: number; // em centavos
    total: number; // em centavos
  };
  consultadoEm: string;
  status: 'active' | 'inactive' | 'error';
}

interface GatewayBalanceCardProps {
  className?: string;
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
  showBlockedBalances?: boolean; // Mostrar saldos bloqueados
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export function GatewayBalanceCard({ 
  className,
  showRefreshButton = true,
  autoRefresh = false,
  refreshInterval = 300, // 5 minutos
  showBlockedBalances = false
}: GatewayBalanceCardProps) {
  const [balance, setBalance] = useState<GatewayBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [includeBlocked, setIncludeBlocked] = useState(showBlockedBalances);
  
  const { toast } = useToast();
  const { tenant } = useTenant();

  // ================================================================
  // FUNÇÕES AUXILIARES
  // ================================================================

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'agora mesmo';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min atrás`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d atrás`;
    }
  };

  // ================================================================
  // FUNÇÕES DE CONSULTA
  // ================================================================

  const fetchBalance = async (showToast = false) => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Obter usuário atual do Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !tenant?.id) {
        throw new Error('Usuário não autenticado ou tenant não encontrado');
      }
      
      // Construir URL
      const url = `/api/gateway/balance${includeBlocked ? '?includeBlocked=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id,
          'x-user-id': user.id
        },
        credentials: 'include' // Incluir cookies de autenticação do Supabase
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar saldo do gateway');
      }
      
      if (data.success && data.data?.gateway) {
        setBalance(data.data.gateway);
        setLastUpdate(new Date());
        
        if (showToast) {
          toast({
            title: "Saldo atualizado",
            description: "Saldo do gateway consultado com sucesso",
            variant: "default"
          });
        }
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (err: any) {
      console.error('Erro ao consultar saldo do gateway:', err);
      setError(err.message);
      
      if (showToast) {
        toast({
          title: "Erro ao atualizar",
          description: err.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ================================================================
  // EFFECTS
  // ================================================================

  // Carregar saldo inicial
  useEffect(() => {
    fetchBalance();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      fetchBalance();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // ================================================================
  // FUNÇÕES AUXILIARES
  // ================================================================



  // ================================================================
  // RENDER
  // ================================================================

  if (loading) {
    return (
      <Card className={cn("w-full rounded-responsive shadow-responsive", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 spacing-responsive-sm">
          <CardTitle className="text-responsive-sm font-medium">
            <span className="hidden sm:inline">Saldo do Gateway</span>
            <span className="sm:hidden">Gateway</span>
          </CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-destructive rounded-responsive shadow-responsive", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 spacing-responsive-sm">
          <CardTitle className="text-responsive-sm font-medium text-destructive">
            <span className="hidden sm:inline">Saldo do Gateway</span>
            <span className="sm:hidden">Gateway</span>
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          <div className="space-y-2">
            <p className="text-responsive-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchBalance(true)}
              disabled={refreshing}
              className="btn-responsive-sm"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Tentar novamente</span>
              <span className="sm:hidden">Tentar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full rounded-responsive shadow-responsive", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 spacing-responsive-sm">
        <CardTitle className="text-responsive-sm font-medium">
          <span className="hidden sm:inline">Saldo Disponível</span>
          <span className="sm:hidden">Disponível</span>
        </CardTitle>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowValues(!showValues)}
            className="h-6 w-6 p-0"
          >
            {showValues ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
          
          {showRefreshButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchBalance(true)}
              disabled={refreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 spacing-responsive-sm">
        <div className="text-responsive-lg font-bold text-green-600">
          {showValues ? (
            formatCurrency(balance?.saldo.disponivel || 0)
          ) : (
            "••••••"
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GatewayBalanceCard;