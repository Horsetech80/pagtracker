'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  Percent, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  Building2,
  Users,
  ArrowUpRight,
  TrendingUp,
  Calculator
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Commission {
  id: string;
  amount: number;
  percentage: number;
  baseAmount: number;
  recipient: string;
  recipientId: string;
  recipientType: 'partner' | 'affiliate' | 'reseller' | 'employee';
  transactionId: string;
  clientName: string;
  clientId: string;
  commissionType: 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'bonus' | 'meta';
  date: string;
  paymentDate?: string;
  status: 'calculated' | 'approved' | 'paid' | 'cancelled';
  tier: number;
  notes?: string;
}

interface CommissionSummary {
  totalCommissions: number;
  totalAmount: number;
  averageCommission: number;
  pendingAmount: number;
  topRecipient: string;
  topRecipientAmount: number;
  monthlyGrowth: number;
}

const mockCommissions: Commission[] = [
  {
    id: '1',
    amount: 1575.00,
    percentage: 10.0,
    baseAmount: 15750.00,
    recipient: 'João Silva',
    recipientId: 'part_001',
    recipientType: 'partner',
    transactionId: 'txn_abc123',
    clientName: 'Empresa ABC Ltda',
    clientId: 'emp_001',
    commissionType: 'pix',
    date: '2024-01-15T10:30:00Z',
    paymentDate: '2024-01-16T14:00:00Z',
    status: 'paid',
    tier: 1,
    notes: 'Comissão padrão PIX'
  },
  {
    id: '2',
    amount: 2210.00,
    percentage: 12.5,
    baseAmount: 17680.00,
    recipient: 'Maria Santos',
    recipientId: 'aff_002',
    recipientType: 'affiliate',
    transactionId: 'txn_def456',
    clientName: 'Tech Solutions',
    clientId: 'emp_004',
    commissionType: 'cartao_credito',
    date: '2024-01-15T09:15:00Z',
    status: 'approved',
    tier: 2,
    notes: 'Comissão tier 2 - cartão'
  },
  {
    id: '3',
    amount: 890.00,
    percentage: 8.0,
    baseAmount: 11125.00,
    recipient: 'Carlos Oliveira',
    recipientId: 'res_003',
    recipientType: 'reseller',
    transactionId: 'txn_ghi789',
    clientName: 'Comércio XYZ',
    clientId: 'emp_003',
    commissionType: 'pix',
    date: '2024-01-14T16:45:00Z',
    paymentDate: '2024-01-15T10:00:00Z',
    status: 'paid',
    tier: 1,
    notes: 'Comissão revendedor'
  },
  {
    id: '4',
    amount: 5000.00,
    percentage: 0,
    baseAmount: 0,
    recipient: 'Ana Costa',
    recipientId: 'emp_001',
    recipientType: 'employee',
    transactionId: 'bonus_001',
    clientName: 'Meta Mensal',
    clientId: 'meta_001',
    commissionType: 'bonus',
    date: '2024-01-14T14:20:00Z',
    status: 'calculated',
    tier: 0,
    notes: 'Bônus por atingir meta mensal'
  },
  {
    id: '5',
    amount: 1230.00,
    percentage: 15.0,
    baseAmount: 8200.00,
    recipient: 'Pedro Almeida',
    recipientId: 'part_004',
    recipientType: 'partner',
    transactionId: 'txn_jkl012',
    clientName: 'Mega Store',
    clientId: 'emp_002',
    commissionType: 'cartao_debito',
    date: '2024-01-14T11:10:00Z',
    status: 'approved',
    tier: 3,
    notes: 'Comissão tier 3 - débito'
  },
  {
    id: '6',
    amount: 750.00,
    percentage: 5.0,
    baseAmount: 15000.00,
    recipient: 'Lucia Ferreira',
    recipientId: 'aff_005',
    recipientType: 'affiliate',
    transactionId: 'txn_mno345',
    clientName: 'Loja Virtual 123',
    clientId: 'emp_005',
    commissionType: 'boleto',
    date: '2024-01-13T15:30:00Z',
    status: 'cancelled',
    tier: 1,
    notes: 'Cancelada por erro na transação'
  }
];

const mockSummary: CommissionSummary = {
  totalCommissions: 234,
  totalAmount: 156750.00,
  averageCommission: 669.87,
  pendingAmount: 23400.00,
  topRecipient: 'João Silva',
  topRecipientAmount: 45600.00,
  monthlyGrowth: 18.5
};

function getRecipientTypeLabel(type: Commission['recipientType']) {
  const types = {
    partner: 'Parceiro',
    affiliate: 'Afiliado',
    reseller: 'Revendedor',
    employee: 'Funcionário'
  };
  return types[type] || 'Desconhecido';
}

function getCommissionTypeLabel(type: Commission['commissionType']) {
  const types = {
    pix: 'PIX',
    cartao_credito: 'Cartão Crédito',
    cartao_debito: 'Cartão Débito',
    boleto: 'Boleto',
    bonus: 'Bônus',
    meta: 'Meta'
  };
  return types[type] || 'Desconhecido';
}

function getStatusBadge(status: Commission['status']) {
  switch (status) {
    case 'paid':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Paga</AdminBadge>;
    case 'approved':
      return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Aprovada</AdminBadge>;
    case 'calculated':
      return <AdminBadge variant="secondary">Calculada</AdminBadge>;
    case 'cancelled':
      return <AdminBadge variant="destructive">Cancelada</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getRecipientTypeBadge(type: Commission['recipientType']) {
  const colors = {
    partner: 'bg-purple-100 text-purple-800',
    affiliate: 'bg-blue-100 text-blue-800',
    reseller: 'bg-orange-100 text-orange-800',
    employee: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <AdminBadge variant="outline" className={colors[type]}>
      {getRecipientTypeLabel(type)}
    </AdminBadge>
  );
}

function getTierBadge(tier: number) {
  if (tier === 0) return null;
  
  const colors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-purple-100 text-purple-800'
  };
  
  return (
    <AdminBadge variant="outline" className={colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      Tier {tier}
    </AdminBadge>
  );
}

export default function ComissoesPage() {
  const [commissions, setCommissions] = useState<Commission[]>(mockCommissions);
  const [summary, setSummary] = useState<CommissionSummary>(mockSummary);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('30d');

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    const matchesType = typeFilter === 'all' || commission.commissionType === typeFilter;
    const matchesRecipientType = recipientTypeFilter === 'all' || commission.recipientType === recipientTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesRecipientType;
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [dateFilter]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[80%] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comissões Pagas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e monitore todas as comissões pagas a parceiros, afiliados e funcionários
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
              <p className="text-sm font-medium text-muted-foreground">Total de Comissões</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalCommissions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Percent className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Pago</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalAmount)}</p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +{summary.monthlyGrowth}%
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comissão Média</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.averageCommission)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendente Pagamento</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pendingAmount)}</p>
              <p className="text-sm text-muted-foreground mt-1">Aguardando aprovação</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
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
                placeholder="Buscar por beneficiário, cliente ou ID da transação..."
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
              <option value="paid">Paga</option>
              <option value="approved">Aprovada</option>
              <option value="calculated">Calculada</option>
              <option value="cancelled">Cancelada</option>
            </select>
            
            <select 
              value={recipientTypeFilter} 
              onChange={(e) => setRecipientTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Tipos</option>
              <option value="partner">Parceiro</option>
              <option value="affiliate">Afiliado</option>
              <option value="reseller">Revendedor</option>
              <option value="employee">Funcionário</option>
            </select>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todas as Origens</option>
              <option value="pix">PIX</option>
              <option value="cartao_credito">Cartão Crédito</option>
              <option value="cartao_debito">Cartão Débito</option>
              <option value="boleto">Boleto</option>
              <option value="bonus">Bônus</option>
              <option value="meta">Meta</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de Comissões */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Comissões</h2>
          <p className="text-sm text-muted-foreground">
            {filteredCommissions.length} de {commissions.length} comissões
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Data</AdminTableHead>
                <AdminTableHead>Beneficiário</AdminTableHead>
                <AdminTableHead>Tipo</AdminTableHead>
                <AdminTableHead>Cliente/Origem</AdminTableHead>
                <AdminTableHead>Valor Base</AdminTableHead>
                <AdminTableHead>%</AdminTableHead>
                <AdminTableHead>Comissão</AdminTableHead>
                <AdminTableHead>Tier</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Pago em</AdminTableHead>
                <AdminTableHead>ID Transação</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredCommissions.map((commission) => (
                <AdminTableRow key={commission.id} className="hover:bg-accent/50">
                  <AdminTableCell className="font-medium">
                    {formatDate(commission.date)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{commission.recipient}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRecipientTypeBadge(commission.recipientType)}
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="outline">
                      {getCommissionTypeLabel(commission.commissionType)}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{commission.clientName}</p>
                      <p className="text-sm text-muted-foreground">{commission.clientId}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {commission.baseAmount > 0 ? formatCurrency(commission.baseAmount) : '-'}
                  </AdminTableCell>
                  <AdminTableCell className="font-medium">
                    {commission.percentage > 0 ? `${commission.percentage}%` : '-'}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold text-green-600">
                    {formatCurrency(commission.amount)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getTierBadge(commission.tier)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getStatusBadge(commission.status)}
                  </AdminTableCell>
                  <AdminTableCell className="text-sm">
                    {commission.paymentDate ? formatDate(commission.paymentDate) : '-'}
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-sm">
                    {commission.transactionId}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredCommissions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma comissão encontrada com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}