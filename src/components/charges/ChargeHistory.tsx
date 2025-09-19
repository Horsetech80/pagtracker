/**
 * Charge History Component - PagTracker v4.0
 * 
 * Componente simples para exibir histórico de cobranças com sincronização
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

interface Charge {
  id: string;
  txid: string;
  amount: number;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  pix_copy_paste?: string;
}

interface ChargeHistoryProps {
  tenantId?: string;
}

export function ChargeHistory({ tenantId }: ChargeHistoryProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Carregar cobranças
  const loadCharges = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/charges', {
        headers: tenantId ? { 'x-tenant-id': tenantId } : {},
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar cobranças');
      }
      
      const data = await response.json();
      setCharges(data.charges || []);
      
    } catch (error) {
      console.error('Erro ao carregar cobranças:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de cobranças',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar status PIX
  const syncPixStatus = async () => {
    try {
      setSyncing(true);
      
      const response = await fetch('/api/pix/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId ? { 'x-tenant-id': tenantId } : {})
        },
        body: JSON.stringify({ tenant_id: tenantId }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Sincronização concluída',
        description: result.message
      });
      
      // Recarregar cobranças após sincronização
      await loadCharges();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar o status das cobranças',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  // Carregar cobranças ao montar o componente
  useEffect(() => {
    loadCharges();
  }, [tenantId]);

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paga':
      case 'concluida':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ativa':
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expirada':
      case 'cancelada':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Função para obter cor do badge do status
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paga':
      case 'concluida':
        return 'default'; // Verde
      case 'ativa':
      case 'pendente':
        return 'secondary'; // Amarelo
      case 'expirada':
      case 'cancelada':
        return 'destructive'; // Vermelho
      default:
        return 'outline'; // Cinza
    }
  };

  // Formatar valor
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Histórico de Cobranças PIX
        </CardTitle>
        <Button
          onClick={syncPixStatus}
          disabled={syncing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando...</span>
          </div>
        ) : charges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma cobrança encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {charges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(charge.status)}
                    <span className="font-medium text-foreground">
                      {formatAmount(charge.amount)}
                    </span>
                    <Badge variant={getStatusBadgeVariant(charge.status)}>
                      {charge.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {charge.description && (
                    <p className="text-sm text-muted-foreground">
                      {charge.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>TXID: {charge.txid}</span>
                    <span>Criado: {formatDate(charge.created_at)}</span>
                    {charge.updated_at !== charge.created_at && (
                      <span>Atualizado: {formatDate(charge.updated_at)}</span>
                    )}
                  </div>
                </div>
                
                {charge.pix_copy_paste && charge.status.toLowerCase() === 'ativa' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(charge.pix_copy_paste!);
                      toast({
                        title: 'Copiado!',
                        description: 'Código PIX copiado para a área de transferência'
                      });
                    }}
                  >
                    Copiar PIX
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}