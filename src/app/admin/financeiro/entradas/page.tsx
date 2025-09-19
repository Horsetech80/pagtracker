'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  Building2,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EntryTransaction {
  id: string;
  amount: number;
  description: string;
  client: string;
  clientId: string;
  type: 'comissao_pix' | 'comissao_cartao' | 'taxa_processamento' | 'multa' | 'outros';
  paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto';
  date: string;
  status: 'completed' | 'pending' | 'processing';
  transactionId: string;
  fee: number;
  netAmount: number;
}

interface EntrySummary {
  totalEntries: number;
  totalAmount: number;
  averageAmount: number;
  topClient: string;
  topClientAmount: number;
}

const mockEntries: EntryTransaction[] = [
  {
    id: '1',
    amount: 15750.00,
    description: 'Comissão PIX - Pagamento recebido',
    client: 'Empresa ABC Ltda',
    clientId: 'emp_001',
    type: 'comissao_pix',
    paymentMethod: 'pix',
    date: '2024-01-15T10:30:00Z',
    status: 'completed',
    transactionId: 'txn_abc123',
    fee: 157.50,
    netAmount: 15592.50
  },
  {
    id: '2',
    amount: 22100.00,
    description: 'Comissão Cartão de Crédito',
    client: 'Mega Store',
    clientId: 'emp_002',
    type: 'comissao_cartao',
    paymentMethod: 'cartao_credito',
    date: '2024-01-15T09:15:00Z',
    status: 'completed',
    transactionId: 'txn_def456',
    fee: 442.00,
    netAmount: 21658.00
  },
  {
    id: '3',
    amount: 8900.00,
    description: 'Taxa de processamento',
    client: 'Comércio XYZ',
    clientId: 'emp_003',
    type: 'taxa_processamento',
    paymentMethod: 'pix',
    date: '2024-01-14T16:45:00Z',
    status: 'completed',
    transactionId: 'txn_ghi789',
    fee: 89.00,
    netAmount: 8811.00
  },
  {
    id: '4',
    amount: 5600.00,
    description: 'Multa por atraso no pagamento',
    client: 'Tech Solutions',
    clientId: 'emp_004',
    type: 'multa',
    paymentMethod: 'boleto',
    date: '2024-01-14T14:20:00Z',
    status: 'pending',
    transactionId: 'txn_jkl012',
    fee: 0,
    netAmount: 5600.00
  },
  {
    id: '5',
    amount: 12300.00,
    description: 'Comissão PIX - Transferência',
    client: 'Loja Virtual 123',
    clientId: 'emp_005',
    type: 'comissao_pix',
    paymentMethod: 'pix',
    date: '2024-01-14T11:10:00Z',
    status: 'processing',
    transactionId: 'txn_mno345',
    fee: 123.00,
    netAmount: 12177.00
  },
  {
    id: '6',
    amount: 18750.00,
    description: 'Comissão Cartão de Débito',
    client: 'Empresa ABC Ltda',
    clientId: 'emp_001',
    type: 'comissao_cartao',
    paymentMethod: 'cartao_debito',
    date: '2024-01-13T15:30:00Z',
    status: 'completed',
    transactionId: 'txn_pqr678',
    fee: 187.50,
    netAmount: 18562.50
  }
];

const mockSummary: EntrySummary = {
  totalEntries: 156,
  totalAmount: 847650.00,
  averageAmount: 5433.01,
  topClient: 'Empresa ABC Ltda',
  topClientAmount: 125400.00
};

function getTypeLabel(type: EntryTransaction['type']) {
  const types = {
    comissao_pix: 'Comissão PIX',
    comissao_cartao: 'Comissão Cartão',
    taxa_processamento: 'Taxa Processamento',
    multa: 'Multa',
    outros: 'Outros'
  };
  return types[type] || 'Desconhecido';
}

function getPaymentMethodLabel(method: EntryTransaction['paymentMethod']) {
  const methods = {
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    boleto: 'Boleto'
  };
  return methods[method] || 'Desconhecido';
}

function getStatusBadge(status: EntryTransaction['status']) {
  switch (status) {
    case 'completed':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Concluída</AdminBadge>;
    case 'pending':
      return <AdminBadge variant="secondary">Pendente</AdminBadge>;
    case 'processing':
      return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Processando</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getTypeBadge(type: EntryTransaction['type']) {
  const colors = {
    comissao_pix: 'bg-green-100 text-green-800',
    comissao_cartao: 'bg-blue-100 text-blue-800',
    taxa_processamento: 'bg-purple-100 text-purple-800',
    multa: 'bg-red-100 text-red-800',
    outros: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <AdminBadge variant="outline" className={colors[type]}>
      {getTypeLabel(type)}
    </AdminBadge>
  );
}

export default function EntradasPage() {
  const [entries, setEntries] = useState<EntryTransaction[]>(mockEntries);
  const [summary, setSummary] = useState<EntrySummary>(mockSummary);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('30d');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    
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
          <h1 className="text-3xl font-bold text-foreground">Entradas Financeiras</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e monitore todas as entradas de receita da plataforma
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
              <p className="text-sm font-medium text-muted-foreground">Total de Entradas</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalEntries}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalAmount)}</p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +12.5%
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
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.averageAmount)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Maior Cliente</p>
              <p className="text-lg font-bold text-foreground">{summary.topClient}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(summary.topClientAmount)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Building2 className="h-6 w-6 text-orange-600" />
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
                placeholder="Buscar por cliente, descrição ou ID da transação..."
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
            </select>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Tipos</option>
              <option value="comissao_pix">Comissão PIX</option>
              <option value="comissao_cartao">Comissão Cartão</option>
              <option value="taxa_processamento">Taxa Processamento</option>
              <option value="multa">Multa</option>
              <option value="outros">Outros</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de Entradas */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Entradas</h2>
          <p className="text-sm text-muted-foreground">
            {filteredEntries.length} de {entries.length} entradas
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Data</AdminTableHead>
                <AdminTableHead>Cliente</AdminTableHead>
                <AdminTableHead>Descrição</AdminTableHead>
                <AdminTableHead>Tipo</AdminTableHead>
                <AdminTableHead>Método</AdminTableHead>
                <AdminTableHead>Valor Bruto</AdminTableHead>
                <AdminTableHead>Taxa</AdminTableHead>
                <AdminTableHead>Valor Líquido</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>ID Transação</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredEntries.map((entry) => (
                <AdminTableRow key={entry.id} className="hover:bg-accent/50">
                  <AdminTableCell className="font-medium">
                    {formatDate(entry.date)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{entry.client}</p>
                      <p className="text-sm text-muted-foreground">{entry.clientId}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="max-w-xs">
                    <p className="truncate" title={entry.description}>{entry.description}</p>
                  </AdminTableCell>
                  <AdminTableCell>
                    {getTypeBadge(entry.type)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getPaymentMethodLabel(entry.paymentMethod)}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold text-green-600">
                    {formatCurrency(entry.amount)}
                  </AdminTableCell>
                  <AdminTableCell className="text-red-600">
                    {entry.fee > 0 ? formatCurrency(entry.fee) : '-'}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold">
                    {formatCurrency(entry.netAmount)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getStatusBadge(entry.status)}
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-sm">
                    {entry.transactionId}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredEntries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma entrada encontrada com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}