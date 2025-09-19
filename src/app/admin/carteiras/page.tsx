'use client';

import { useState, useEffect } from 'react';
import { AdminCard, AdminCardContent, AdminCardDescription, AdminCardHeader, AdminCardTitle } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminLabel } from '@/components/admin/ui/label';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminDialog, AdminDialogContent, AdminDialogDescription, AdminDialogFooter, AdminDialogHeader, AdminDialogTitle, AdminDialogTrigger } from '@/components/admin/ui/dialog';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { AdminSelect, AdminSelectContent, AdminSelectItem, AdminSelectTrigger, AdminSelectValue } from '@/components/admin/ui/select';
import { AdminTextarea } from '@/components/admin/ui/textarea';
import { AdminAlert, AdminAlertDescription } from '@/components/admin/ui/alert';
import { CheckCircle, XCircle, Clock, AlertCircle, Wallet, TrendingUp, TrendingDown, Users, Search, Filter, Eye, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  tenant_id: string;
  user_id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  external_id?: string;
  tenant_name?: string;
  user_name?: string;
}

interface WalletStats {
  total_balance: number;
  total_pending_withdrawals: number;
  total_completed_withdrawals: number;
  total_fees_collected: number;
  active_tenants: number;
}

export default function AdminWalletsPage() {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadWithdrawalRequests();
    loadWalletStats();
  }, [currentPage, statusFilter]);

  const loadWithdrawalRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/withdrawals?${params}`, {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        setWithdrawalRequests(result.data.items);
        setTotalPages(Math.ceil(result.data.total / 10));
      } else {
        toast.error('Erro ao carregar solicitações de saque');
      }
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadWalletStats = async () => {
    try {
      // Mock data for now - replace with actual API call
      setWalletStats({
        total_balance: 125000000, // R$ 1,250,000.00 in cents
        total_pending_withdrawals: 45000000, // R$ 450,000.00 in cents
        total_completed_withdrawals: 890000000, // R$ 8,900,000.00 in cents
        total_fees_collected: 12500000, // R$ 125,000.00 in cents
        active_tenants: 42
      });
    } catch (error) {
      console.error('Error loading wallet stats:', error);
    }
  };

  const processWithdrawal = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessing(requestId);
    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...(reason && { rejection_reason: reason })
        }),
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Solicitação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso!`);
        loadWithdrawalRequests();
        loadWalletStats();
        setShowProcessDialog(false);
        setSelectedRequest(null);
        setRejectionReason('');
      } else {
        toast.error(result.error || `Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} solicitação`);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessClick = (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setProcessAction(action);
    setShowProcessDialog(true);
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovada';
      case 'rejected':
        return 'Rejeitada';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluída';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'approved':
      case 'processing':
        return 'default';
      case 'rejected':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPixKeyTypeText = (type: string) => {
    switch (type) {
      case 'cpf':
        return 'CPF';
      case 'cnpj':
        return 'CNPJ';
      case 'email':
        return 'E-mail';
      case 'phone':
        return 'Telefone';
      case 'random':
        return 'Chave Aleatória';
      default:
        return type;
    }
  };

  const filteredRequests = withdrawalRequests.filter(request => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.tenant_name?.toLowerCase().includes(searchLower) ||
        request.user_name?.toLowerCase().includes(searchLower) ||
        request.pix_key.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Carteiras</h1>
          <p className="text-muted-foreground">
            Gerencie solicitações de saque e monitore carteiras dos tenants
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      {walletStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <AdminCard>
            <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <AdminCardTitle className="text-sm font-medium">Saldo Total</AdminCardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-bold">{formatCurrency(walletStats.total_balance)}</div>
              <p className="text-xs text-muted-foreground">Todos os tenants</p>
            </AdminCardContent>
          </AdminCard>
          <AdminCard>
            <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <AdminCardTitle className="text-sm font-medium">Saques Pendentes</AdminCardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-bold">{formatCurrency(walletStats.total_pending_withdrawals)}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </AdminCardContent>
          </AdminCard>
          <AdminCard>
            <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <AdminCardTitle className="text-sm font-medium">Saques Concluídos</AdminCardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-bold">{formatCurrency(walletStats.total_completed_withdrawals)}</div>
              <p className="text-xs text-muted-foreground">Total processado</p>
            </AdminCardContent>
          </AdminCard>
          <AdminCard>
            <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <AdminCardTitle className="text-sm font-medium">Taxas Coletadas</AdminCardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-bold">{formatCurrency(walletStats.total_fees_collected)}</div>
              <p className="text-xs text-muted-foreground">Receita de taxas</p>
            </AdminCardContent>
          </AdminCard>
          <AdminCard>
            <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <AdminCardTitle className="text-sm font-medium">Tenants Ativos</AdminCardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </AdminCardHeader>
            <AdminCardContent>
              <div className="text-2xl font-bold">{walletStats.active_tenants}</div>
              <p className="text-xs text-muted-foreground">Com carteiras ativas</p>
            </AdminCardContent>
          </AdminCard>
        </div>
      )}

      {/* Filtros e Busca */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Solicitações de Saque</AdminCardTitle>
          <AdminCardDescription>
            Gerencie e aprove solicitações de saque dos tenants
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <AdminInput
                  placeholder="Buscar por tenant, usuário ou chave PIX..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <AdminSelect value={statusFilter} onValueChange={setStatusFilter}>
              <AdminSelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <AdminSelectValue placeholder="Filtrar por status" />
              </AdminSelectTrigger>
              <AdminSelectContent>
                <AdminSelectItem value="all">Todos os status</AdminSelectItem>
                <AdminSelectItem value="pending">Pendente</AdminSelectItem>
                <AdminSelectItem value="approved">Aprovada</AdminSelectItem>
                <AdminSelectItem value="rejected">Rejeitada</AdminSelectItem>
                <AdminSelectItem value="processing">Processando</AdminSelectItem>
                <AdminSelectItem value="completed">Concluída</AdminSelectItem>
                <AdminSelectItem value="failed">Falhou</AdminSelectItem>
              </AdminSelectContent>
            </AdminSelect>
            <AdminButton onClick={loadWithdrawalRequests} disabled={loading}>
              {loading ? 'Carregando...' : 'Atualizar'}
            </AdminButton>
          </div>

          {/* Lista de Solicitações */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação encontrada</p>
                <p className="text-sm">Tente ajustar os filtros ou aguarde novas solicitações</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <AdminCard key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AdminBadge variant={getStatusVariant(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {getStatusText(request.status)}
                          </div>
                        </AdminBadge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.requested_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium">Tenant</p>
                          <p className="text-sm text-muted-foreground">{request.tenant_name || request.tenant_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Usuário</p>
                          <p className="text-sm text-muted-foreground">{request.user_name || request.user_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Chave PIX</p>
                          <p className="text-sm text-muted-foreground">
                            {getPixKeyTypeText(request.pix_key_type)}: {request.pix_key}
                          </p>
                        </div>
                      </div>
                      
                      {request.description && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Descrição</p>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                      )}
                      
                      {request.rejection_reason && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-600">Motivo da Rejeição</p>
                          <p className="text-sm text-red-600">{request.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="space-y-1">
                        <p className="text-lg font-bold">{formatCurrency(request.net_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          Bruto: {formatCurrency(request.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Taxa: {formatCurrency(request.fee_amount)}
                        </p>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <AdminButton
                            size="sm"
                            variant="default"
                            onClick={() => handleProcessClick(request, 'approve')}
                            disabled={processing === request.id}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </AdminButton>
                          <AdminButton
                            size="sm"
                            variant="destructive"
                            onClick={() => handleProcessClick(request, 'reject')}
                            disabled={processing === request.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </AdminButton>
                        </div>
                      )}
                    </div>
                  </div>
                </AdminCard>
              ))
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </AdminButton>
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </AdminButton>
              </div>
            </div>
          )}
        </AdminCardContent>
      </AdminCard>

      {/* Dialog de Processamento */}
      <AdminDialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <AdminDialogContent>
          <AdminDialogHeader>
            <AdminDialogTitle>
              {processAction === 'approve' ? 'Aprovar' : 'Rejeitar'} Solicitação de Saque
            </AdminDialogTitle>
            <AdminDialogDescription>
              {processAction === 'approve'
                ? 'Confirme a aprovação desta solicitação de saque. O PIX será processado automaticamente.'
                : 'Informe o motivo da rejeição desta solicitação de saque.'}
            </AdminDialogDescription>
          </AdminDialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <AdminAlert>
                <Info className="h-4 w-4" />
                <AdminAlertDescription>
                  <div className="space-y-1">
                    <p><strong>Tenant:</strong> {selectedRequest.tenant_name || selectedRequest.tenant_id}</p>
                    <p><strong>Valor líquido:</strong> {formatCurrency(selectedRequest.net_amount)}</p>
                    <p><strong>Chave PIX:</strong> {selectedRequest.pix_key}</p>
                  </div>
                </AdminAlertDescription>
              </AdminAlert>
              
              {processAction === 'reject' && (
                <div className="space-y-2">
                  <AdminLabel htmlFor="rejection-reason">Motivo da Rejeição</AdminLabel>
                  <AdminTextarea
                    id="rejection-reason"
                    placeholder="Descreva o motivo da rejeição..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          
          <AdminDialogFooter>
            <AdminButton variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancelar
            </AdminButton>
            <AdminButton
              onClick={() => {
                if (selectedRequest) {
                  processWithdrawal(
                    selectedRequest.id,
                    processAction,
                    processAction === 'reject' ? rejectionReason : undefined
                  );
                }
              }}
              disabled={processing === selectedRequest?.id || (processAction === 'reject' && !rejectionReason.trim())}
              variant={processAction === 'approve' ? 'default' : 'destructive'}
            >
              {processing === selectedRequest?.id
                ? 'Processando...'
                : processAction === 'approve'
                ? 'Confirmar Aprovação'
                : 'Confirmar Rejeição'}
            </AdminButton>
          </AdminDialogFooter>
        </AdminDialogContent>
      </AdminDialog>
    </div>
  );
}