'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Banknote
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Reservation {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantDocument: string;
  tenantEmail: string;
  tenantPhone?: string;
  amount: number;
  type: 'security_deposit' | 'guarantee_fund' | 'operational_reserve' | 'risk_provision' | 'compliance_reserve';
  status: 'active' | 'released' | 'partial_release' | 'expired' | 'cancelled';
  reason: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  releasedAt?: string;
  releasedAmount?: number;
  remainingAmount: number;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    role: string;
  };
  relatedTransactions?: {
    id: string;
    amount: number;
    date: string;
    type: string;
  }[];
  documents?: {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  notes?: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
}

interface ReservationSummary {
  totalReservations: number;
  activeReservations: number;
  totalAmount: number;
  releasedAmount: number;
  pendingReleases: number;
  averageReservationTime: number;
  monthlyIncrease: number;
  topReservationType: string;
}

const mockReservations: Reservation[] = [
  {
    id: 'res_001',
    tenantId: 'tenant_001',
    tenantName: 'Empresa ABC Ltda',
    tenantDocument: '12.345.678/0001-90',
    tenantEmail: 'contato@empresaabc.com',
    tenantPhone: '(11) 99999-9999',
    amount: 50000.00,
    type: 'security_deposit',
    status: 'active',
    reason: 'Garantia para operações de alto risco',
    description: 'Reserva de segurança para cobertura de possíveis chargebacks e disputas.',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-07-15T10:00:00Z',
    remainingAmount: 50000.00,
    createdBy: {
      id: 'admin_001',
      name: 'Maria Silva',
      role: 'risk_analyst'
    },
    approvedBy: {
      id: 'admin_002',
      name: 'João Santos',
      role: 'risk_manager'
    },
    relatedTransactions: [
      {
        id: 'txn_001',
        amount: 1250.00,
        date: '2024-01-20T14:30:00Z',
        type: 'chargeback_coverage'
      }
    ],
    priority: 'high',
    tags: ['seguranca', 'alto_risco', 'chargeback'],
    notes: [
      {
        id: 'note_001',
        author: 'Maria Silva',
        content: 'Reserva criada devido ao histórico de chargebacks da empresa.',
        createdAt: '2024-01-15T10:05:00Z'
      }
    ]
  },
  {
    id: 'res_002',
    tenantId: 'tenant_002',
    tenantName: 'Commerce Plus',
    tenantDocument: '98.765.432/0001-10',
    tenantEmail: 'admin@commerceplus.com',
    tenantPhone: '(21) 88888-8888',
    amount: 25000.00,
    type: 'guarantee_fund',
    status: 'partial_release',
    reason: 'Fundo de garantia para novos clientes',
    description: 'Fundo de garantia para cobertura de operações durante período de avaliação.',
    createdAt: '2024-01-10T09:30:00Z',
    updatedAt: '2024-01-25T16:20:00Z',
    expiresAt: '2024-04-10T09:30:00Z',
    releasedAt: '2024-01-25T16:20:00Z',
    releasedAmount: 10000.00,
    remainingAmount: 15000.00,
    createdBy: {
      id: 'admin_003',
      name: 'Ana Costa',
      role: 'compliance_analyst'
    },
    approvedBy: {
      id: 'admin_004',
      name: 'Carlos Oliveira',
      role: 'compliance_manager'
    },
    priority: 'medium',
    tags: ['garantia', 'novo_cliente', 'avaliacao'],
    notes: [
      {
        id: 'note_002',
        author: 'Ana Costa',
        content: 'Liberação parcial aprovada após 30 dias de operação sem incidentes.',
        createdAt: '2024-01-25T16:25:00Z'
      }
    ]
  },
  {
    id: 'res_003',
    tenantId: 'tenant_003',
    tenantName: 'Tech Solutions',
    tenantDocument: '11.222.333/0001-44',
    tenantEmail: 'contato@techsolutions.com',
    amount: 75000.00,
    type: 'operational_reserve',
    status: 'active',
    reason: 'Reserva operacional para liquidez',
    description: 'Reserva para garantir liquidez em operações de grande volume.',
    createdAt: '2024-01-05T14:15:00Z',
    updatedAt: '2024-01-05T14:15:00Z',
    remainingAmount: 75000.00,
    createdBy: {
      id: 'admin_005',
      name: 'Lucia Ferreira',
      role: 'financial_analyst'
    },
    approvedBy: {
      id: 'admin_006',
      name: 'Pedro Almeida',
      role: 'financial_manager'
    },
    priority: 'high',
    tags: ['operacional', 'liquidez', 'grande_volume']
  },
  {
    id: 'res_004',
    tenantId: 'tenant_004',
    tenantName: 'Digital Store',
    tenantDocument: '55.666.777/0001-88',
    tenantEmail: 'suporte@digitalstore.com',
    amount: 15000.00,
    type: 'risk_provision',
    status: 'released',
    reason: 'Provisão para risco de crédito',
    description: 'Provisão para cobertura de riscos de crédito em operações específicas.',
    createdAt: '2023-12-20T11:45:00Z',
    updatedAt: '2024-01-20T09:30:00Z',
    releasedAt: '2024-01-20T09:30:00Z',
    releasedAmount: 15000.00,
    remainingAmount: 0,
    createdBy: {
      id: 'admin_007',
      name: 'Roberto Silva',
      role: 'credit_analyst'
    },
    approvedBy: {
      id: 'admin_008',
      name: 'Fernanda Costa',
      role: 'credit_manager'
    },
    priority: 'medium',
    tags: ['risco', 'credito', 'liberado']
  },
  {
    id: 'res_005',
    tenantId: 'tenant_005',
    tenantName: 'StartupXYZ',
    tenantDocument: '99.888.777/0001-66',
    tenantEmail: 'admin@startupxyz.com',
    amount: 30000.00,
    type: 'compliance_reserve',
    status: 'active',
    reason: 'Reserva para compliance regulatório',
    description: 'Reserva para atendimento de exigências regulatórias e auditorias.',
    createdAt: '2024-01-12T16:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
    expiresAt: '2024-12-12T16:00:00Z',
    remainingAmount: 30000.00,
    createdBy: {
      id: 'admin_009',
      name: 'Camila Santos',
      role: 'compliance_specialist'
    },
    priority: 'urgent',
    tags: ['compliance', 'regulatorio', 'auditoria']
  },
  {
    id: 'res_006',
    tenantId: 'tenant_006',
    tenantName: 'MegaCommerce',
    tenantDocument: '33.444.555/0001-22',
    tenantEmail: 'compliance@megacommerce.com',
    amount: 100000.00,
    type: 'security_deposit',
    status: 'expired',
    reason: 'Depósito de segurança vencido',
    description: 'Depósito de segurança que expirou sem utilização.',
    createdAt: '2023-07-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-15T10:00:00Z',
    remainingAmount: 100000.00,
    createdBy: {
      id: 'admin_010',
      name: 'Ricardo Oliveira',
      role: 'risk_analyst'
    },
    priority: 'low',
    tags: ['vencido', 'nao_utilizado', 'liberacao_pendente']
  }
];

const mockSummary: ReservationSummary = {
  totalReservations: 156,
  activeReservations: 89,
  totalAmount: 2450000.00,
  releasedAmount: 890000.00,
  pendingReleases: 12,
  averageReservationTime: 127,
  monthlyIncrease: 8.5,
  topReservationType: 'security_deposit'
};

function getReservationTypeBadge(type: Reservation['type']) {
  const types = {
    security_deposit: { label: 'Depósito Segurança', color: 'bg-blue-100 text-blue-800' },
    guarantee_fund: { label: 'Fundo Garantia', color: 'bg-green-100 text-green-800' },
    operational_reserve: { label: 'Reserva Operacional', color: 'bg-purple-100 text-purple-800' },
    risk_provision: { label: 'Provisão Risco', color: 'bg-orange-100 text-orange-800' },
    compliance_reserve: { label: 'Reserva Compliance', color: 'bg-indigo-100 text-indigo-800' }
  };
  
  const typeInfo = types[type];
  return <AdminBadge className={typeInfo.color}>{typeInfo.label}</AdminBadge>;
}

function getStatusBadge(status: Reservation['status']) {
  const statuses = {
    active: { label: 'Ativa', color: 'bg-green-100 text-green-800' },
    released: { label: 'Liberada', color: 'bg-blue-100 text-blue-800' },
    partial_release: { label: 'Liberação Parcial', color: 'bg-yellow-100 text-yellow-800' },
    expired: { label: 'Vencida', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800' }
  };
  
  const statusInfo = statuses[status];
  return <AdminBadge className={statusInfo.color}>{statusInfo.label}</AdminBadge>;
}

function getPriorityBadge(priority: Reservation['priority']) {
  const priorities = {
    low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
    medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };
  
  const priorityInfo = priorities[priority];
  return <AdminBadge className={priorityInfo.color}>{priorityInfo.label}</AdminBadge>;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [summary, setSummary] = useState<ReservationSummary>(mockSummary);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.tenantDocument.includes(searchTerm) ||
                         reservation.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    const matchesType = typeFilter === 'all' || reservation.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || reservation.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[80%] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservas Financeiras</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie reservas, depósitos de segurança e fundos de garantia
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
          <AdminButton size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Reserva
          </AdminButton>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Reservas</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalReservations}</p>
              <p className="text-sm text-blue-600 mt-1">{summary.activeReservations} ativas</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Banknote className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Reservado</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalAmount)}</p>
              <p className="text-sm text-green-600 mt-1">+{summary.monthlyIncrease}% este mês</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Liberado</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.releasedAmount)}</p>
              <p className="text-sm text-orange-600 mt-1">{summary.pendingReleases} liberações pendentes</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
              <p className="text-2xl font-bold text-purple-600">{summary.averageReservationTime} dias</p>
              <p className="text-sm text-muted-foreground mt-1">Duração das reservas</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filtros */}
      <AdminCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <AdminInput
                placeholder="Buscar por empresa, documento ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativa</option>
              <option value="released">Liberada</option>
              <option value="partial_release">Liberação Parcial</option>
              <option value="expired">Vencida</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="all">Todos os Tipos</option>
              <option value="security_deposit">Depósito Segurança</option>
              <option value="guarantee_fund">Fundo Garantia</option>
              <option value="operational_reserve">Reserva Operacional</option>
              <option value="risk_provision">Provisão Risco</option>
              <option value="compliance_reserve">Reserva Compliance</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>
      </AdminCard>

      {/* Lista de Reservas */}
      <AdminCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Lista de Reservas</h2>
            <div className="flex items-center gap-2">
              <AdminButton variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avançados
              </AdminButton>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando reservas...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>Empresa</AdminTableHead>
                    <AdminTableHead>Tipo</AdminTableHead>
                    <AdminTableHead>Valor</AdminTableHead>
                    <AdminTableHead>Status</AdminTableHead>
                    <AdminTableHead>Prioridade</AdminTableHead>
                    <AdminTableHead>Criada em</AdminTableHead>
                    <AdminTableHead>Expira em</AdminTableHead>
                    <AdminTableHead>Ações</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {filteredReservations.length === 0 ? (
                    <AdminTableRow>
                      <AdminTableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma reserva encontrada com os filtros aplicados.
                      </AdminTableCell>
                    </AdminTableRow>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <AdminTableRow key={reservation.id}>
                        <AdminTableCell>
                          <div>
                            <div className="font-medium text-foreground">{reservation.tenantName}</div>
                            <div className="text-sm text-muted-foreground">{reservation.tenantDocument}</div>
                            <div className="text-xs text-muted-foreground mt-1">{reservation.reason}</div>
                          </div>
                        </AdminTableCell>
                        <AdminTableCell>
                          {getReservationTypeBadge(reservation.type)}
                        </AdminTableCell>
                        <AdminTableCell>
                          <div>
                            <div className="font-medium text-foreground">{formatCurrency(reservation.amount)}</div>
                            <div className="text-sm text-muted-foreground">
                              Restante: {formatCurrency(reservation.remainingAmount)}
                            </div>
                          </div>
                        </AdminTableCell>
                        <AdminTableCell>
                          {getStatusBadge(reservation.status)}
                        </AdminTableCell>
                        <AdminTableCell>
                          {getPriorityBadge(reservation.priority)}
                        </AdminTableCell>
                        <AdminTableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(reservation.createdAt)}
                          </div>
                        </AdminTableCell>
                        <AdminTableCell>
                          <div className="text-sm text-muted-foreground">
                            {reservation.expiresAt ? formatDate(reservation.expiresAt) : 'Sem vencimento'}
                          </div>
                        </AdminTableCell>
                        <AdminTableCell>
                          <div className="flex items-center gap-2">
                            <AdminButton variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </AdminButton>
                            <AdminButton variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </AdminButton>
                            <AdminButton variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </AdminButton>
                          </div>
                        </AdminTableCell>
                      </AdminTableRow>
                    ))
                  )}
                </AdminTableBody>
              </AdminTable>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
}