'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Copy, Download, Share2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import QRCodeViewer from '@/components/checkout/QRCodeViewer';
import { toast } from 'sonner';
import { useTenantId } from '@/lib/hooks/useTenantId';

interface Charge {
  id: string;
  txid: string;
  valor: number;
  descricao: string;
  status: 'pendente' | 'pago' | 'expirado' | 'cancelado' | 'estornado';
  cliente_nome?: string;
  cliente_email?: string;
  cliente_documento?: string;
  qr_code?: string;
  qr_code_image?: string;
  expires_at: string;
  created_at: string;
  paid_at?: string;
}

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  expirado: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-100 text-gray-800',
  estornado: 'bg-purple-100 text-purple-800'
};

const statusLabels = {
  pendente: 'Pendente',
  pago: 'Pago',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
  estornado: 'Estornado'
};

export default function ChargeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenantId = useTenantId();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Extrair o ID da URL de forma mais robusta
  const chargeId = React.useMemo(() => {
    console.log('Params:', params);
    console.log('Pathname:', pathname);
    
    // Primeiro tentar pelos params do Next.js
    if (params.id && typeof params.id === 'string') {
      console.log('ID encontrado nos params:', params.id);
      return params.id;
    }
    
    // Se não funcionar, extrair do pathname
    const pathSegments = pathname.split('/');
    console.log('Path segments:', pathSegments);
    const cobrancasIndex = pathSegments.findIndex(segment => segment === 'cobrancas');
    if (cobrancasIndex !== -1 && pathSegments[cobrancasIndex + 1]) {
      const idFromPath = pathSegments[cobrancasIndex + 1];
      console.log('ID encontrado no pathname:', idFromPath);
      return idFromPath;
    }
    
    console.log('ID não encontrado');
    return null;
  }, [params.id, pathname]);

  // Usar useCallback para evitar recriação da função a cada render
  const fetchChargeDetails = React.useCallback(async () => {
    console.log('fetchChargeDetails chamado com:', { chargeId, tenantId });
    
    if (!chargeId) {
      setError('ID da cobrança não encontrado na URL');
      setLoading(false);
      return;
    }
    
    if (!tenantId?.tenantId) {
      setError('Tenant não encontrado');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fazendo requisição para:', `/api/charges/${chargeId}`);
      
      const response = await fetch(`/api/charges/${chargeId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Resposta da API:', result);

      if (result.success && result.charge) {
        setCharge(result.charge);
      } else {
        throw new Error(result.message || 'Erro ao carregar cobrança');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da cobrança:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [chargeId, tenantId?.tenantId]); // Dependências do useCallback

  useEffect(() => {
    console.log('useEffect executado com:', { chargeId, tenantId });
    if (chargeId && tenantId?.tenantId) {
      fetchChargeDetails();
    }
  }, [chargeId, tenantId?.tenantId, fetchChargeDetails]); // Incluir fetchChargeDetails nas dependências

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Primeiro, sincronizar status com a EfiPay usando o serviço direto
      if (chargeId && tenantId?.tenantId && charge?.txid) {
        console.log('🔄 Sincronizando status com EfiPay...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            // Chamar o serviço EfiPay diretamente via API
            const syncResponse = await fetch(`/api/efipay/charges/${charge.txid}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id,
                'x-tenant-id': tenantId.tenantId
              },
              credentials: 'include'
            });
            
            if (syncResponse.ok) {
              const efiData = await syncResponse.json();
              
              // Mapear status da EfiPay para nosso sistema
              const statusMap: Record<string, string> = {
                'ATIVA': 'pendente',
                'CONCLUIDA': 'pago',
                'REMOVIDA_PELO_USUARIO_RECEBEDOR': 'cancelado',
                'REMOVIDA_PELO_PSP': 'expirado'
              };
              
              const newStatus = statusMap[efiData.status] || 'pendente';
              
              // Verificar se o status mudou
              if (newStatus !== charge.status) {
                console.log(`✅ Status atualizado: ${charge.status} -> ${newStatus}`);
                
                // Atualizar no banco de dados
                const { error } = await supabase
                  .from('charges')
                  .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                    ...(newStatus === 'pago' && !charge.paid_at ? { paid_at: new Date().toISOString() } : {})
                  })
                  .eq('id', chargeId)
                  .eq('tenant_id', tenantId.tenantId);
                
                if (!error) {
                  toast.success('Status atualizado com sucesso!');
                } else {
                  console.error('Erro ao atualizar status no banco:', error);
                }
              } else {
                console.log('ℹ️ Status já está atualizado');
              }
            } else {
              console.warn('⚠️ Erro ao consultar EfiPay, continuando com refresh normal');
            }
          } catch (syncError) {
            console.warn('⚠️ Erro na sincronização:', syncError);
          }
        }
      }
      
      // Depois, buscar dados atualizados
      await fetchChargeDetails();
    } catch (error) {
      console.error('Erro durante refresh:', error);
      // Mesmo com erro na sincronização, tentar buscar dados
      await fetchChargeDetails();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyPixCode = () => {
    if (charge?.qr_code) {
      navigator.clipboard.writeText(charge.qr_code);
      toast.success('Código PIX copiado para a área de transferência!');
    }
  };

  const handleShare = () => {
    if (navigator.share && charge) {
      navigator.share({
        title: 'Cobrança PIX',
        text: `Cobrança de ${formatCurrency(charge.valor)} - ${charge.descricao}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">Erro</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => router.push('/cobrancas')}>Voltar para Cobranças</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!charge) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Detalhes da Cobrança</h2>
            <p className="text-gray-600">ID: {charge.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações da Cobrança */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Cobrança</CardTitle>
            <CardDescription>Detalhes da transação PIX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <Badge className={statusColors[charge.status]}>
                {statusLabels[charge.status]}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Valor</span>
              <span className="text-lg font-bold">{formatCurrency(charge.valor)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Descrição</span>
              <span className="text-sm text-right max-w-[200px] truncate">{charge.descricao}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">TXID</span>
              <span className="text-sm font-mono text-right max-w-[200px] truncate">{charge.txid}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Criado em</span>
              <span className="text-sm">{formatDate(charge.created_at)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Expira em</span>
              <span className="text-sm">{formatDate(charge.expires_at)}</span>
            </div>
            
            {charge.paid_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Pago em</span>
                <span className="text-sm">{formatDate(charge.paid_at)}</span>
              </div>
            )}
            
            {charge.cliente_nome && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Informações do Cliente</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Nome</span>
                    <span className="text-sm">{charge.cliente_nome}</span>
                  </div>
                  {charge.cliente_email && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">E-mail</span>
                      <span className="text-sm">{charge.cliente_email}</span>
                    </div>
                  )}
                  {charge.cliente_documento && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">CPF</span>
                      <span className="text-sm">{charge.cliente_documento}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code PIX</CardTitle>
            <CardDescription>
              {charge.status === 'pendente' 
                ? 'Escaneie o código ou copie o código PIX' 
                : 'Cobrança não está mais disponível para pagamento'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {charge.qr_code && charge.status === 'pendente' ? (
              <>
                <div className="flex justify-center mb-4">
                  <QRCodeViewer 
                    qrCodeBase64={charge.qr_code_image || ''} 
                    codigoPix={charge.qr_code}
                  />
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={handleCopyPixCode} 
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  QR Code não disponível para esta cobrança
                </p>
                {charge.status === 'pendente' && (
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Recarregar
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}