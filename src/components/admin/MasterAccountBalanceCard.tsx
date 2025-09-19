/**
 * Master Account Balance Card Component
 * 
 * Componente para exibir o saldo da conta master EfiPay no painel administrativo
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { AdminCard as Card, AdminCardContent as CardContent, AdminCardHeader as CardHeader, AdminCardTitle as CardTitle } from '@/components/admin/ui/card';
import { AdminButton as Button } from '@/components/admin/ui/button';
import { AdminBadge as Badge } from '@/components/admin/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
  Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ================================================================
// INTERFACES E TIPOS
// ================================================================

interface MasterAccountBalance {
  saldo: string; // Saldo disponível em formato string (ex: "100.00")
  bloqueios?: {
    judicial: string; // Saldo bloqueado por ação judicial
    med: string; // Saldo bloqueado por MED (Medida de Emergência)
    total: string; // Total de saldos bloqueados
  };
  consultadoEm: string;
  status: 'active' | 'inactive' | 'error';
}

interface MasterAccountBalanceCardProps {
  className?: string;
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
  showBlockedBalances?: boolean; // Mostrar saldos bloqueados
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export function MasterAccountBalanceCard({
  className,
  showRefreshButton = true,
  autoRefresh = false,
  refreshInterval = 300, // 5 minutos
  showBlockedBalances = true
}: MasterAccountBalanceCardProps) {
  const [balance, setBalance] = useState<MasterAccountBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showValues, setShowValues] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  // Using sonner toast for consistency with other admin components

  // ================================================================
  // FUNÇÕES DE CARREGAMENTO
  // ================================================================

  const loadMasterBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏦 [ADMIN] Carregando saldo da conta master...');

      const response = await fetch(`/api/admin/master-balance?bloqueios=${showBlockedBalances}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar saldo da conta master');
      }

      setBalance({
        saldo: result.data.saldo,
        bloqueios: result.data.bloqueios,
        consultadoEm: result.data.consultadoEm,
        status: 'active'
      });

      setLastRefresh(new Date());
      console.log('✅ [ADMIN] Saldo da conta master carregado com sucesso');

    } catch (error: any) {
      console.error('❌ [ADMIN] Erro ao carregar saldo da conta master:', error);
      setError(error.message);
      setBalance(prev => prev ? { ...prev, status: 'error' } : null);
      
      toast.error("Erro ao carregar saldo", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // EFEITOS
  // ================================================================

  // Carregamento inicial
  useEffect(() => {
    loadMasterBalance();
  }, [showBlockedBalances]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMasterBalance();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // ================================================================
  // FUNÇÕES AUXILIARES
  // ================================================================

  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  // ================================================================
  // RENDERIZAÇÃO
  // ================================================================

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          Saldo Conta Master EfiPay
        </CardTitle>
        <div className="flex items-center gap-2">
          {balance && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", getStatusColor(balance.status))}
            >
              {getStatusIcon(balance.status)}
              {getStatusText(balance.status)}
            </Badge>
          )}
          {showRefreshButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMasterBalance}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && !balance ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
            {showBlockedBalances && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            )}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : balance ? (
          <div className="space-y-4">
            {/* Saldo Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Saldo Disponível</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowValues(!showValues)}
                    className="h-6 w-6 p-0"
                  >
                    {showValues ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-green-600">
                {showValues ? formatCurrency(balance.saldo) : '••••••'}
              </div>
            </div>

            {/* Saldos Bloqueados */}
            {showBlockedBalances && balance.bloqueios && (
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">Saldos Bloqueados</h4>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Judicial:</span>
                    <span className="font-medium text-red-600">
                      {showValues ? formatCurrency(balance.bloqueios.judicial) : '••••••'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MED:</span>
                    <span className="font-medium text-orange-600">
                      {showValues ? formatCurrency(balance.bloqueios.med) : '••••••'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total Bloqueado:</span>
                    <span className="font-bold text-red-600">
                      {showValues ? formatCurrency(balance.bloqueios.total) : '••••••'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Última atualização:</span>
                <span>{lastRefresh?.toLocaleTimeString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Consultado em:</span>
                <span>{new Date(balance.consultadoEm).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Gateway:</span>
                <span>EfiPay</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}