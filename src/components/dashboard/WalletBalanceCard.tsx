/**
 * Wallet Balance Card Component
 * 
 * Componente para exibir o saldo da carteira interna no dashboard
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
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// ================================================================
// INTERFACES E TIPOS
// ================================================================

interface WalletBalance {
  available: number; // em centavos
  processing: number; // em centavos
  total: number; // em centavos
  lastUpdated: string;
}

interface WalletBalanceCardProps {
  className?: string;
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
  showProcessingBalance?: boolean; // Mostrar saldo em processamento
  // ✅ NOVO: Props para receber dados externos (evita chamadas duplicadas)
  externalBalance?: WalletBalance | null;
  externalLoading?: boolean;
  externalError?: string | null;
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export function WalletBalanceCard({ 
  className,
  showRefreshButton = true,
  autoRefresh = false,
  refreshInterval = 300, // 5 minutos
  showProcessingBalance = true,
  externalBalance = null,
  externalLoading = false,
  externalError = null
}: WalletBalanceCardProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
      
      const response = await fetch('/api/wallet/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id,
          'x-user-id': user.id
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar saldo da carteira');
      }
      
      if (data.success && data.data) {
        setBalance({
          available: data.data.available || 0,
          processing: data.data.processing || 0,
          total: (data.data.available || 0) + (data.data.processing || 0),
          lastUpdated: new Date().toISOString()
        });
        setLastUpdate(new Date());
        
        if (showToast) {
          toast({
            title: "Saldo atualizado",
            description: "Saldo da carteira consultado com sucesso",
            variant: "default"
          });
        }
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (err: any) {
      console.error('Erro ao consultar saldo da carteira:', err);
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

  // ✅ OTIMIZAÇÃO: Usar dados externos quando disponíveis
  useEffect(() => {
    if (externalBalance) {
      setBalance(externalBalance);
      setLoading(false);
      setError(null);
      setLastUpdate(new Date());
    } else if (externalLoading) {
      setLoading(true);
      setError(null);
    } else if (externalError) {
      setError(externalError);
      setLoading(false);
    } else if (!balance && !loading) {
      // Apenas buscar se não há dados externos e não há dados locais
      fetchBalance();
    }
  }, [externalBalance, externalLoading, externalError, balance, loading]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      fetchBalance();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // ================================================================
  // RENDER
  // ================================================================

  // ✅ OTIMIZAÇÃO: Usar loading externo quando disponível
  if (loading || externalLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Saldo da Carteira
          </CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ OTIMIZAÇÃO: Usar erro externo quando disponível  
  if (error || externalError) {
    return (
      <Card className={cn("w-full border-destructive", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-destructive">
            Saldo da Carteira
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {error || externalError}
            </p>
            {showRefreshButton && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchBalance(true)}
                disabled={refreshing}
                className="w-full"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full rounded-responsive shadow-responsive", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 spacing-responsive-sm">
        <CardTitle className="text-responsive-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Saldo da Carteira</span>
          <span className="sm:hidden">Carteira</span>
        </CardTitle>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowValues(!showValues)}
            className="h-8 w-8 p-0"
          >
            {showValues ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          {showRefreshButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchBalance(true)}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="spacing-responsive-sm">
        <div className="space-y-3">
          {/* Saldo Disponível */}
          <div className="space-y-1">
            <div className="text-responsive-lg font-bold text-foreground">
              {showValues ? formatCurrency(balance?.available || 0) : '••••••'}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <Badge variant="secondary" className="text-xs w-fit">
                <CheckCircle className="h-3 w-3 mr-1" />
                Disponível
              </Badge>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(lastUpdate)}
                </span>
              )}
            </div>
          </div>

          {/* Saldo em Processamento */}
          {showProcessingBalance && balance && balance.processing > 0 && (
            <div className="space-y-1 pt-2 border-t">
              <div className="text-responsive-sm text-muted-foreground">
                Em processamento:
              </div>
              <div className="text-responsive-base font-semibold text-yellow-600">
                {showValues ? formatCurrency(balance.processing) : '••••••'}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link href="/carteira" className="flex-1">
              <Button variant="outline" size="sm" className="w-full btn-responsive-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Extrato
              </Button>
            </Link>
            <Link href="/saques" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Sacar
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletBalanceCard;