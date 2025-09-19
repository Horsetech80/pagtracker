'use client';

import { useState, useEffect } from 'react';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminCard, AdminCardContent, AdminCardDescription, AdminCardHeader, AdminCardTitle } from '@/components/admin/ui/card';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminLabel } from '@/components/admin/ui/label';
import { AdminSelect, AdminSelectContent, AdminSelectItem, AdminSelectTrigger, AdminSelectValue } from '@/components/admin/ui/select';
import { AdminDialog, AdminDialogContent, AdminDialogDescription, AdminDialogFooter, AdminDialogHeader, AdminDialogTitle, AdminDialogTrigger } from '@/components/admin/ui/dialog';
import { AdminTextarea } from '@/components/admin/ui/textarea';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Filter,
  Search,
  RefreshCw,
  Download,
  User,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';

interface WithdrawalData {
  id: string;
  user_id: string;
  tenant_id: string;
  amount_cents: number;
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  recipient_name: string;
  recipient_document: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'failed';
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  efipay_txid?: string;
  efipay_end_to_end_id?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  users?: {
    id: string;
    nome: string;
    email: string;
  };
  tenants?: {
    id: string;
    nome: string;
  };
  admin_users?: {
    id: string;
    nome: string;
  };
}

interface WithdrawalStatistics {
  total_withdrawals: number;
  pending_count: number;
  approved_count: number;
  completed_count: number;
  rejected_count: number;
  total_amount: number;
  pending_amount: number;
}

interface WithdrawalApprovalProps {
  adminId: string;
}

export function WithdrawalApproval({ adminId }: WithdrawalApprovalProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [statistics, setStatistics] = useState<WithdrawalStatistics>({
    total_withdrawals: 0,
    pending_count: 0,
    approved_count: 0,
    completed_count: 0,
    rejected_count: 0,
    total_amount: 0,
    pending_amount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    tenant_id: '',
    user_id: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  
  // Paginação
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Função para buscar saques
  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.tenant_id && { tenant_id: filters.tenant_id }),
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      });

      const response = await fetch(`/api/admin/withdrawals?${params}`, {
        headers: {
          'x-admin-id': adminId
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar saques');
      }

      const data = await response.json();
      setWithdrawals(data.withdrawals);
      setStatistics(data.statistics);
      setPagination(data.pagination);
      
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
      toast.error('Erro ao carregar saques');
    } finally {
      setLoading(false);
    }
  };

  // Função para aprovar/rejeitar saque
  const handleApprovalAction = async () => {
    if (!selectedWithdrawal) return;
    
    try {
      setProcessing(true);
      
      const response = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify({
          withdrawal_id: selectedWithdrawal.id,
          action: approvalAction,
          admin_notes: adminNotes,
          rejection_reason: approvalAction === 'reject' ? rejectionReason : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao processar solicitação');
      }

      const result = await response.json();
      
      toast.success(
        approvalAction === 'approve' 
          ? 'Saque aprovado com sucesso!' 
          : 'Saque rejeitado com sucesso!'
      );
      
      // Fechar modal e limpar estados
      setShowApprovalModal(false);
      setSelectedWithdrawal(null);
      setAdminNotes('');
      setRejectionReason('');
      
      // Recarregar lista
      fetchWithdrawals();
      
    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setProcessing(false);
    }
  };

  // Função para formatar moeda
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'processing': return 'Processando';
      case 'completed': return 'Concluído';
      case 'rejected': return 'Rejeitado';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchWithdrawals();
  }, [pagination.page, filters]);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Total de Saques</AdminCardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">{statistics.total_withdrawals}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.total_amount * 100)}
            </p>
          </AdminCardContent>
        </AdminCard>
        
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Pendentes</AdminCardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending_count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.pending_amount * 100)}
            </p>
          </AdminCardContent>
        </AdminCard>
        
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Aprovados</AdminCardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.approved_count}</div>
          </AdminCardContent>
        </AdminCard>
        
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Rejeitados</AdminCardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.rejected_count}</div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Filtros */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <AdminLabel htmlFor="status">Status</AdminLabel>
              <AdminSelect value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <AdminSelectTrigger>
                  <AdminSelectValue placeholder="Todos" />
                </AdminSelectTrigger>
                <AdminSelectContent>
                  <AdminSelectItem value="">Todos</AdminSelectItem>
                  <AdminSelectItem value="pending">Pendente</AdminSelectItem>
                  <AdminSelectItem value="approved">Aprovado</AdminSelectItem>
                  <AdminSelectItem value="processing">Processando</AdminSelectItem>
                  <AdminSelectItem value="completed">Concluído</AdminSelectItem>
                  <AdminSelectItem value="rejected">Rejeitado</AdminSelectItem>
                  <AdminSelectItem value="failed">Falhou</AdminSelectItem>
                </AdminSelectContent>
              </AdminSelect>
            </div>
            
            <div>
              <AdminLabel htmlFor="date_from">Data Inicial</AdminLabel>
              <AdminInput
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>
            
            <div>
              <AdminLabel htmlFor="date_to">Data Final</AdminLabel>
              <AdminInput
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end">
              <AdminButton onClick={fetchWithdrawals} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </AdminButton>
            </div>
            
            <div className="flex items-end">
              <AdminButton variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </AdminButton>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Lista de Saques */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Solicitações de Saque</AdminCardTitle>
          <AdminCardDescription>
            Gerencie as solicitações de saque dos clientes
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando...</span>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação de saque encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <AdminBadge className={getStatusColor(withdrawal.status)}>
                          {getStatusText(withdrawal.status)}
                        </AdminBadge>
                        <span className="font-semibold text-lg">
                          {formatCurrency(withdrawal.amount_cents)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {withdrawal.users?.nome || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {withdrawal.tenants?.nome || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(withdrawal.created_at)}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium">PIX:</span> {withdrawal.pix_key} ({withdrawal.pix_key_type})
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </AdminButton>
                      
                      {withdrawal.status === 'pending' && (
                        <>
                          <AdminButton
                            size="sm"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setApprovalAction('approve');
                              setShowApprovalModal(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </AdminButton>
                          
                          <AdminButton
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setApprovalAction('reject');
                              setShowApprovalModal(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </AdminButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex items-center gap-2">
                <AdminButton
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </AdminButton>
                <AdminButton
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Próxima
                </AdminButton>
              </div>
            </div>
          )}
        </AdminCardContent>
      </AdminCard>

      {/* Modal de Detalhes */}
      <AdminDialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <AdminDialogContent className="max-w-2xl">
          <AdminDialogHeader>
            <AdminDialogTitle>Detalhes do Saque</AdminDialogTitle>
            <AdminDialogDescription>
              Informações completas da solicitação de saque
            </AdminDialogDescription>
          </AdminDialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <AdminLabel>Valor</AdminLabel>
                  <div className="font-semibold text-lg">
                    {formatCurrency(selectedWithdrawal.amount_cents)}
                  </div>
                </div>
                <div>
                  <AdminLabel>Status</AdminLabel>
                  <AdminBadge className={getStatusColor(selectedWithdrawal.status)}>
                    {getStatusText(selectedWithdrawal.status)}
                  </AdminBadge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <AdminLabel>Cliente</AdminLabel>
                  <div>{selectedWithdrawal.users?.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedWithdrawal.users?.email}
                  </div>
                </div>
                <div>
                  <AdminLabel>Empresa</AdminLabel>
                  <div>{selectedWithdrawal.tenants?.nome}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <AdminLabel>Chave PIX</AdminLabel>
                  <div>{selectedWithdrawal.pix_key}</div>
                  <div className="text-sm text-muted-foreground">
                    Tipo: {selectedWithdrawal.pix_key_type}
                  </div>
                </div>
                <div>
                  <AdminLabel>Destinatário</AdminLabel>
                  <div>{selectedWithdrawal.recipient_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedWithdrawal.recipient_document}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <AdminLabel>Criado em</AdminLabel>
                  <div>{formatDate(selectedWithdrawal.created_at)}</div>
                </div>
                <div>
                  <AdminLabel>Atualizado em</AdminLabel>
                  <div>{formatDate(selectedWithdrawal.updated_at)}</div>
                </div>
              </div>
              
              {selectedWithdrawal.admin_notes && (
                <div>
                  <AdminLabel>Observações do Admin</AdminLabel>
                  <div className="p-3 bg-muted rounded-md">
                    {selectedWithdrawal.admin_notes}
                  </div>
                </div>
              )}
              
              {selectedWithdrawal.rejected_reason && (
                <div>
                  <AdminLabel>Motivo da Rejeição</AdminLabel>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                    {selectedWithdrawal.rejected_reason}
                  </div>
                </div>
              )}
            </div>
          )}
        </AdminDialogContent>
      </AdminDialog>

      {/* Modal de Aprovação/Rejeição */}
      <AdminDialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <AdminDialogContent>
          <AdminDialogHeader>
            <AdminDialogTitle>
              {approvalAction === 'approve' ? 'Aprovar Saque' : 'Rejeitar Saque'}
            </AdminDialogTitle>
            <AdminDialogDescription>
              {approvalAction === 'approve' 
                ? 'Confirme a aprovação desta solicitação de saque'
                : 'Informe o motivo da rejeição desta solicitação'
              }
            </AdminDialogDescription>
          </AdminDialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-semibold">
                  {formatCurrency(selectedWithdrawal.amount_cents)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Para: {selectedWithdrawal.recipient_name} - {selectedWithdrawal.pix_key}
                </div>
              </div>
              
              <div>
                <AdminLabel htmlFor="admin_notes">Observações (opcional)</AdminLabel>
                <AdminTextarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta decisão..."
                  rows={3}
                />
              </div>
              
              {approvalAction === 'reject' && (
                <div>
                  <AdminLabel htmlFor="rejection_reason">Motivo da Rejeição *</AdminLabel>
                  <AdminTextarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Informe o motivo da rejeição..."
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
          )}
          
          <AdminDialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
              disabled={processing}
            >
              Cancelar
            </AdminButton>
            <AdminButton
              onClick={handleApprovalAction}
              disabled={processing || (approvalAction === 'reject' && !rejectionReason.trim())}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : approvalAction === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {processing 
                ? 'Processando...' 
                : approvalAction === 'approve' 
                  ? 'Aprovar Saque' 
                  : 'Rejeitar Saque'
              }
            </AdminButton>
          </AdminDialogFooter>
        </AdminDialogContent>
      </AdminDialog>
    </div>
  );
}