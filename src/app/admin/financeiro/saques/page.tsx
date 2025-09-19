'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  ArrowDownToLine, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Check,
  X,
  Pause,
  CreditCard,
  Building2,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useWalletManagement } from '@/hooks/useAdmin';

interface WithdrawalRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  requestDate: string;
  processedDate?: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  withdrawalMethod: 'pix' | 'ted' | 'bank_transfer' | 'crypto';
  bankAccount?: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'checking' | 'savings';
    holderName: string;
    holderDocument: string;
  };
  pixKey?: string;
  reason?: string;
  notes?: string;
  approvedBy?: string;
  rejectionReason?: string;
  walletBalance: number;
  riskLevel: 'low' | 'medium' | 'high';
  kycStatus: 'approved' | 'pending' | 'rejected';
  previousWithdrawals: number;
  monthlyWithdrawn: number;
  dailyLimit: number;
  monthlyLimit: number;
}

interface WithdrawalSummary {
  totalRequests: number;
  pendingRequests: number;
  totalAmount: number;
  pendingAmount: number;
  averageAmount: number;
  processingTime: number;
  approvalRate: number;
  dailyVolume: number;
}

// Dados mockados removidos - agora usando dados reais do Supabase via useWalletManagement

function getStatusBadge(status: WithdrawalRequest['status']) {
  switch (status) {
    case 'pending':
      return <AdminBadge variant="secondary">Pendente</AdminBadge>;
    case 'approved':
      return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Aprovado</AdminBadge>;
    case 'processing':
      return <AdminBadge variant="outline" className="bg-yellow-100 text-yellow-800">Processando</AdminBadge>;
    case 'completed':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Concluído</AdminBadge>;
    case 'rejected':
      return <AdminBadge variant="destructive">Rejeitado</AdminBadge>;
    case 'failed':
      return <AdminBadge variant="destructive">Falhou</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getPriorityBadge(priority: WithdrawalRequest['priority']) {
  switch (priority) {
    case 'urgent':
      return <AdminBadge variant="destructive">Urgente</AdminBadge>;
    case 'high':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Alta</AdminBadge>;
    case 'normal':
      return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Normal</AdminBadge>;
    case 'low':
      return <AdminBadge variant="outline" className="bg-gray-100 text-gray-800">Baixa</AdminBadge>;
    default:
      return <AdminBadge variant="outline">-</AdminBadge>;
  }
}

function getMethodBadge(method: WithdrawalRequest['withdrawalMethod']) {
  const methods = {
    pix: { label: 'PIX', color: 'bg-green-100 text-green-800' },
    ted: { label: 'TED', color: 'bg-blue-100 text-blue-800' },
    bank_transfer: { label: 'Transferência', color: 'bg-purple-100 text-purple-800' },
    crypto: { label: 'Crypto', color: 'bg-yellow-100 text-yellow-800' }
  };
  
  const methodInfo = methods[method];
  return (
    <AdminBadge variant="outline" className={methodInfo.color}>
      {methodInfo.label}
    </AdminBadge>
  );
}

function getRiskBadge(risk: WithdrawalRequest['riskLevel']) {
  switch (risk) {
    case 'low':
      return <AdminBadge variant="outline" className="bg-green-100 text-green-800">Baixo</AdminBadge>;
    case 'medium':
      return <AdminBadge variant="outline" className="bg-yellow-100 text-yellow-800">Médio</AdminBadge>;
    case 'high':
      return <AdminBadge variant="destructive">Alto</AdminBadge>;
    default:
      return <AdminBadge variant="outline">-</AdminBadge>;
  }
}

export default function SaquesPage() {
  const { withdrawals, summary, loading, error, processWithdrawal } = useWalletManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const handleApprove = async (id: string) => {
    try {
      await processWithdrawal(id, 'approve');
    } catch (error) {
      console.error('Erro ao aprovar saque:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await processWithdrawal(id, 'reject');
    } catch (error) {
      console.error('Erro ao rejeitar saque:', error);
    }
  };

  const filteredWithdrawals = (withdrawals?.data || []).filter(withdrawal => {
    const matchesSearch = withdrawal.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando saques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Erro ao carregar saques: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[80%] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Solicitações de Saque</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e processe todas as solicitações de saque dos clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 dias
          </AdminButton>
          <AdminButton variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </AdminButton>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Solicitações</p>
              <p className="text-2xl font-bold text-foreground">{summary?.totalRequests || 0}</p>
              <p className="text-sm text-orange-600 mt-1">{summary?.pendingRequests || 0} pendentes</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowDownToLine className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.totalAmount || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">Valor médio: {formatCurrency(summary?.averageAmount || 0)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo de Processamento</p>
              <p className="text-2xl font-bold text-foreground">{summary?.processingTime || 0}h</p>
              <p className="text-sm text-green-600 mt-1">{summary?.approvalRate || 0}% aprovação</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary?.pendingAmount || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">Volume diário: {formatCurrency(summary?.dailyVolume || 0)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filtros */}
      <AdminCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <AdminInput
                placeholder="Buscar por nome, email, documento ou ID da solicitação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="rejected">Rejeitado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Métodos</option>
              <option value="pix">PIX</option>
              <option value="ted">TED</option>
              <option value="bank_transfer">Transferência</option>
              <option value="crypto">Crypto</option>
            </select>
            
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
              <option value="low">Baixa</option>
            </select>
            
            <select 
              value={riskFilter} 
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Riscos</option>
              <option value="low">Baixo</option>
              <option value="medium">Médio</option>
              <option value="high">Alto</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de Solicitações */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Solicitações</h2>
          <p className="text-sm text-muted-foreground">
            {filteredWithdrawals.length} de {withdrawals?.data?.length || 0} solicitações
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Data</AdminTableHead>
                <AdminTableHead>Cliente</AdminTableHead>
                <AdminTableHead>Valor</AdminTableHead>
                <AdminTableHead>Taxa</AdminTableHead>
                <AdminTableHead>Líquido</AdminTableHead>
                <AdminTableHead>Método</AdminTableHead>
                <AdminTableHead>Prioridade</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Risco</AdminTableHead>
                <AdminTableHead>Saldo Carteira</AdminTableHead>
                <AdminTableHead>Ações</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <AdminTableRow key={withdrawal.id} className="hover:bg-accent/50">
                  <AdminTableCell className="font-medium">
                    <div>
                      <p>{formatDate(withdrawal.requested_at)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{withdrawal.id}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{withdrawal.tenant_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.tenant_id}</p>
                      <p className="text-xs text-muted-foreground">{withdrawal.bank_details?.pix_key || 'N/A'}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold">
                    {formatCurrency(withdrawal.amount)}
                  </AdminTableCell>
                  <AdminTableCell className="text-orange-600">
                    {formatCurrency(withdrawal.fee_amount || 0)}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold text-green-600">
                    {formatCurrency(withdrawal.net_amount)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <AdminBadge variant="outline">PIX</AdminBadge>
                      {withdrawal.bank_details?.pix_key && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{withdrawal.bank_details.pix_key}</p>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="outline">Normal</AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.processed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(withdrawal.processed_at)}
                        </p>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Baixo
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell className="font-medium">
                    {formatCurrency(0)} {/* Saldo será implementado quando disponível */}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <AdminButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </AdminButton>
                      {withdrawal.status === 'pending' && (
                        <>
                          <AdminButton 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600"
                            onClick={() => handleApprove(withdrawal.id)}
                          >
                            <Check className="h-4 w-4" />
                          </AdminButton>
                          <AdminButton 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleReject(withdrawal.id)}
                          >
                            <X className="h-4 w-4" />
                          </AdminButton>
                        </>
                      )}
                      {withdrawal.status === 'approved' && (
                        <AdminButton variant="ghost" size="sm" className="text-orange-600">
                          <Pause className="h-4 w-4" />
                        </AdminButton>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma solicitação encontrada com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}