'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Clock, History, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

interface WalletData {
  available_balance: number;
  pending_balance: number;
  total_received: number;
  last_updated: string;
}

interface WalletBalanceProps {
  onWithdrawClick?: () => void;
}

export function WalletBalance({ onWithdrawClick }: WalletBalanceProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { tenant } = useTenant();

  const fetchWalletBalance = async () => {
    if (!user || !tenant) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/wallet/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id,
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar saldo da carteira');
      }

      const data = await response.json();
      setWalletData(data);
    } catch (err) {
      console.error('Erro ao buscar saldo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, [user, tenant]);

  if (loading) {
    return (
      <Card className="w-full rounded-responsive shadow-responsive">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 spacing-responsive-sm">
          <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
            <span className="hidden sm:inline">Carteira Virtual</span>
            <span className="sm:hidden">Carteira</span>
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive rounded-responsive shadow-responsive">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 spacing-responsive-sm">
          <CardTitle className="text-responsive-sm font-medium text-destructive">
            Erro na Carteira
          </CardTitle>
          <Wallet className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent className="spacing-responsive-sm">
          <p className="text-responsive-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchWalletBalance}
            className="mt-2 btn-responsive-sm"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-responsive shadow-responsive">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 spacing-responsive-sm">
        <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
          <span className="hidden sm:inline">Carteira Virtual</span>
          <span className="sm:hidden">Carteira</span>
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="spacing-responsive-sm">
        <div className="space-y-4">
          {/* Saldo Principal */}
          <div>
            <div className="text-responsive-lg font-bold text-foreground">
              {formatCurrency(walletData?.available_balance || 0)}
            </div>
            <p className="text-responsive-xs text-muted-foreground">
              Saldo disponível para saque
            </p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-responsive-xs text-muted-foreground">Em processamento</span>
              </div>
              <div className="text-responsive-sm font-medium text-foreground">
                {formatCurrency(walletData?.pending_balance || 0)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-responsive-xs text-muted-foreground">Total recebido</span>
              </div>
              <div className="text-responsive-sm font-medium text-foreground">
                {formatCurrency(walletData?.total_received || 0)}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={onWithdrawClick}
              disabled={!walletData?.available_balance || walletData.available_balance <= 0}
              className="flex-1"
            >
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Sacar PIX
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchWalletBalance}
            >
              <History className="h-3 w-3" />
            </Button>
          </div>

          {/* Última atualização */}
          {walletData?.last_updated && (
            <p className="text-xs text-muted-foreground text-center">
              Atualizado em {new Date(walletData.last_updated).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}