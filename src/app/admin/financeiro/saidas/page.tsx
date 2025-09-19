'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  TrendingDown, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  Building2,
  CreditCard,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ExitTransaction {
  id: string;
  amount: number;
  description: string;
  recipient: string;
  recipientId: string;
  type: 'saque' | 'estorno' | 'taxa_operacional' | 'multa_regulatoria' | 'despesa_administrativa' | 'outros';
  paymentMethod: 'pix' | 'ted' | 'doc' | 'boleto' | 'cartao';
  date: string;
  status: 'completed' | 'pending' | 'processing' | 'failed' | 'cancelled';
  transactionId: string;
  approvedBy?: string;
  reason: string;
}

interface ExitSummary {
  totalExits: number;
  totalAmount: number;
  averageAmount: number;
  pendingAmount: number;
  topRecipient: string;
  topRecipientAmount: number;
}

const mockExits: ExitTransaction[] = [
  {
    id: '1',
    amount: 25000.00,
    description: 'Saque solicitado pelo cliente',
    recipient: 'Empresa ABC Ltda',
    recipientId: 'emp_001',
    type: 'saque',
    paymentMethod: 'pix',
    date: '2024-01-15T10:30:00Z',
    status: 'completed',
    transactionId: 'out_abc123',
    approvedBy: 'admin_001',
    reason: 'Solicitação de saque regular'
  },
  {
    id: '2',
    amount: 1200.00,
    description: 'Estorno de transação PIX',
    recipient: 'Tech Solutions',
    recipientId: 'emp_004',
    type: 'estorno',
    paymentMethod: 'pix',
    date: '2024-01-15T09:15:00Z',
    status: 'completed',
    transactionId: 'out_def456',
    approvedBy: 'admin_002',
    reason: 'Erro na transação original'
  },
  {
    id: '3',
    amount: 5600.00,
    description: 'Taxa operacional mensal',
    recipient: 'Provedor de Serviços XYZ',
    recipientId: 'prov_001',
    type: 'taxa_operacional',
    paymentMethod: 'ted',
    date: '2024-01-14T16:45:00Z',
    status: 'completed',
    transactionId: 'out_ghi789',
    approvedBy: 'admin_001',
    reason: 'Pagamento mensal de infraestrutura'
  },
  {
    id: '4',
    amount: 15000.00,
    description: 'Saque pendente de aprovação',
    recipient: 'Mega Store',
    recipientId: 'emp_002',
    type: 'saque',
    paymentMethod: 'ted',
    date: '2024-01-14T14:20:00Z',
    status: 'pending',
    transactionId: 'out_jkl012',
    reason: 'Aguardando aprovação do limite'
  },
  {
    id: '5',
    amount: 3200.00,
    description: 'Multa regulatória BACEN',
    recipient: 'Banco Central do Brasil',
    recipientId: 'bacen_001',
    type: 'multa_regulatoria',
    paymentMethod: 'ted',
    date: '2024-01-14T11:10:00Z',
    status: 'processing',
    transactionId: 'out_mno345',
    reason: 'Infração regulatória identificada'
  },
  {
    id: '6',
    amount: 8750.00,
    description: 'Despesa administrativa',
    recipient: 'Escritório Contábil',
    recipientId: 'cont_001',
    type: 'despesa_administrativa',
    paymentMethod: 'pix',
    date: '2024-01-13T15:30:00Z',
    status: 'completed',
    transactionId: 'out_pqr678',
    approvedBy: 'admin_003',
    reason: 'Serviços contábeis mensais'
  },
  {
    id: '7',
    amount: 2100.00,
    description: 'Estorno de cartão cancelado',
    recipient: 'Loja Virtual 123',
    recipientId: 'emp_005',
    type: 'estorno',
    paymentMethod: 'cartao',
    date: '2024-01-13T12:00:00Z',
    status: 'failed',
    transactionId: 'out_stu901',
    reason: 'Falha na comunicação com adquirente'
  }
];

const mockSummary: ExitSummary = {
  totalExits: 89,
  totalAmount: 456750.00,
  averageAmount: 5131.46,
  pendingAmount: 23400.00,
  topRecipient: 'Empresa ABC Ltda',
  topRecipientAmount: 87500.00
};

function getTypeLabel(type: ExitTransaction['type']) {
  const types = {
    saque: 'Saque',
    estorno: 'Estorno',
    taxa_operacional: 'Taxa Operacional',
    multa_regulatoria: 'Multa Regulatória',
    despesa_administrativa: 'Despesa Admin.',
    outros: 'Outros'
  };
  return types[type] || 'Desconhecido';
}

function getPaymentMethodLabel(method: ExitTransaction['paymentMethod']) {
  const methods = {
    pix: 'PIX',
    ted: 'TED',
    doc: 'DOC',
    boleto: 'Boleto',
    cartao: 'Cartão'
  };
  return methods[method] || 'Desconhecido';
}

function getStatusBadge(status: ExitTransaction['status']) {
  switch (status) {
    case 'completed':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Concluída</AdminBadge>;
    case 'pending':
      return <AdminBadge variant="secondary">Pendente</AdminBadge>;
    case 'processing':
      return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Processando</AdminBadge>;
    case 'failed':
      return <AdminBadge variant="destructive">Falhou</AdminBadge>;
    case 'cancelled':
      return <AdminBadge variant="outline" className="bg-gray-100 text-gray-800">Cancelada</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getTypeBadge(type: ExitTransaction['type']) {
  const colors = {
    saque: 'bg-blue-100 text-blue-800',
    estorno: 'bg-orange-100 text-orange-800',
    taxa_operacional: 'bg-purple-100 text-purple-800',
    multa_regulatoria: 'bg-red-100 text-red-800',
    despesa_administrativa: 'bg-gray-100 text-gray-800',
    outros: 'bg-slate-100 text-slate-800'
  };
  
  return (
    <AdminBadge variant="outline" className={colors[type]}>
      {getTypeLabel(type)}
    </AdminBadge>
  );
}

function getRiskLevel(type: ExitTransaction['type'], amount: number) {
  if (type === 'multa_regulatoria' || amount > 50000) {
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
  if (type === 'saque' && amount > 20000) {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
  return null;
}

export default function SaidasPage() {
  const [exits, setExits] = useState<ExitTransaction[]>(mockExits);
  const [summary, setSummary] = useState<ExitSummary>(mockSummary);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('30d');

  const filteredExits = exits.filter(exit => {
    const matchesSearch = exit.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exit.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exit.status === statusFilter;
    const matchesType = typeFilter === 'all' || exit.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
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
          <h1 className="text-3xl font-bold text-foreground">Saídas Financeiras</h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie todas as saídas e despesas da plataforma
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
              <p className="text-sm font-medium text-muted-foreground">Total de Saídas</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalExits}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalAmount)}</p>
              <div className="flex items-center mt-2 text-sm text-red-600">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                -8.3%
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
              <p className="text-sm font-medium text-muted-foreground">Valor Médio</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.averageAmount)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendente Aprovação</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pendingAmount)}</p>
              <p className="text-sm text-muted-foreground mt-1">Requer atenção</p>
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
                placeholder="Buscar por destinatário, descrição ou ID da transação..."
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
              <option value="completed">Concluída</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="failed">Falhou</option>
              <option value="cancelled">Cancelada</option>
            </select>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Tipos</option>
              <option value="saque">Saque</option>
              <option value="estorno">Estorno</option>
              <option value="taxa_operacional">Taxa Operacional</option>
              <option value="multa_regulatoria">Multa Regulatória</option>
              <option value="despesa_administrativa">Despesa Admin.</option>
              <option value="outros">Outros</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de Saídas */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Saídas</h2>
          <p className="text-sm text-muted-foreground">
            {filteredExits.length} de {exits.length} saídas
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Risco</AdminTableHead>
                <AdminTableHead>Data</AdminTableHead>
                <AdminTableHead>Destinatário</AdminTableHead>
                <AdminTableHead>Descrição</AdminTableHead>
                <AdminTableHead>Tipo</AdminTableHead>
                <AdminTableHead>Método</AdminTableHead>
                <AdminTableHead>Valor</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Aprovado Por</AdminTableHead>
                <AdminTableHead>ID Transação</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredExits.map((exit) => (
                <AdminTableRow key={exit.id} className="hover:bg-accent/50">
                  <AdminTableCell>
                    {getRiskLevel(exit.type, exit.amount)}
                  </AdminTableCell>
                  <AdminTableCell className="font-medium">
                    {formatDate(exit.date)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{exit.recipient}</p>
                      <p className="text-sm text-muted-foreground">{exit.recipientId}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="max-w-xs">
                    <p className="truncate" title={exit.description}>{exit.description}</p>
                    <p className="text-sm text-muted-foreground truncate" title={exit.reason}>{exit.reason}</p>
                  </AdminTableCell>
                  <AdminTableCell>
                    {getTypeBadge(exit.type)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getPaymentMethodLabel(exit.paymentMethod)}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold text-red-600">
                    -{formatCurrency(exit.amount)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getStatusBadge(exit.status)}
                  </AdminTableCell>
                  <AdminTableCell className="text-sm">
                    {exit.approvedBy || '-'}
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-sm">
                    {exit.transactionId}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredExits.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma saída encontrada com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}