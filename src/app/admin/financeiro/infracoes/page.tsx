'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Building2,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Shield,
  DollarSign,
  CreditCard,
  Activity,
  AlertCircle,
  Ban,
  Gavel,
  MessageSquare,
  User,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Infraction {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantDocument: string;
  tenantEmail: string;
  tenantPhone?: string;
  tenantAddress?: string;
  type: 'chargeback_abuse' | 'suspicious_activity' | 'fraud_attempt' | 'policy_violation' | 'money_laundering' | 'document_fraud' | 'excessive_refunds' | 'account_manipulation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed' | 'escalated' | 'pending_action';
  description: string;
  detailedDescription?: string;
  evidences: {
    type: 'transaction' | 'document' | 'screenshot' | 'report' | 'log';
    description: string;
    url?: string;
    createdAt: string;
  }[];
  reportedBy: {
    id: string;
    name: string;
    role: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  penalty?: {
    type: 'warning' | 'fine' | 'suspension' | 'termination' | 'account_freeze';
    amount?: number;
    duration?: string;
    description: string;
  };
  relatedTransactions?: {
    id: string;
    amount: number;
    date: string;
    status: string;
  }[];
  riskScore: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  notes: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }[];
  escalationHistory?: {
    from: string;
    to: string;
    reason: string;
    date: string;
  }[];
}

interface InfractionSummary {
  totalInfractions: number;
  openInfractions: number;
  resolvedInfractions: number;
  criticalInfractions: number;
  averageResolutionTime: number;
  monthlyIncrease: number;
  topInfractionType: string;
  riskScore: number;
}

// Função para buscar infrações da API
const fetchInfractions = async (): Promise<Infraction[]> => {
  try {
    const response = await fetch('/api/admin/infractions');
    if (!response.ok) {
      throw new Error('Erro ao carregar infrações');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar infrações:', error);
    return [];
  }
};

// Função para buscar resumo de infrações da API
const fetchInfractionsSummary = async (): Promise<InfractionSummary> => {
  try {
    const response = await fetch('/api/admin/infractions/summary');
    if (!response.ok) {
      throw new Error('Erro ao carregar resumo de infrações');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar resumo de infrações:', error);
    return {
      totalInfractions: 0,
      openInfractions: 0,
      resolvedInfractions: 0,
      criticalInfractions: 0,
      averageResolutionTime: 0,
      monthlyIncrease: 0,
      topInfractionType: '',
      riskScore: 0
    };
  }
};

// Dados mockados removidos - agora usando API real

// Dados mockados removidos - agora usando API real

function getInfractionTypeBadge(type: Infraction['type']) {
  const types = {
    chargeback_abuse: { label: 'Abuso de Chargeback', color: 'bg-red-100 text-red-800' },
    suspicious_activity: { label: 'Atividade Suspeita', color: 'bg-orange-100 text-orange-800' },
    fraud_attempt: { label: 'Tentativa de Fraude', color: 'bg-red-100 text-red-800' },
    policy_violation: { label: 'Violação de Política', color: 'bg-yellow-100 text-yellow-800' },
    money_laundering: { label: 'Lavagem de Dinheiro', color: 'bg-purple-100 text-purple-800' },
    document_fraud: { label: 'Fraude Documental', color: 'bg-red-100 text-red-800' },
    excessive_refunds: { label: 'Reembolsos Excessivos', color: 'bg-orange-100 text-orange-800' },
    account_manipulation: { label: 'Manipulação de Conta', color: 'bg-red-100 text-red-800' }
  };
  
  const typeInfo = types[type] || { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
  
  return (
    <AdminBadge variant="outline" className={typeInfo.color}>
      {typeInfo.label}
    </AdminBadge>
  );
}

function getSeverityBadge(severity: Infraction['severity']) {
  switch (severity) {
    case 'low':
      return <AdminBadge variant="outline" className="bg-green-100 text-green-800">Baixa</AdminBadge>;
    case 'medium':
      return <AdminBadge variant="outline" className="bg-yellow-100 text-yellow-800">Média</AdminBadge>;
    case 'high':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Alta</AdminBadge>;
    case 'critical':
      return <AdminBadge variant="destructive">Crítica</AdminBadge>;
    default:
      return <AdminBadge variant="outline">-</AdminBadge>;
  }
}

function getStatusBadge(status: Infraction['status']) {
  switch (status) {
    case 'open':
      return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Aberta</AdminBadge>;
    case 'investigating':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Investigando</AdminBadge>;
    case 'resolved':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Resolvida</AdminBadge>;
    case 'dismissed':
      return <AdminBadge variant="outline" className="bg-gray-100 text-gray-800">Descartada</AdminBadge>;
    case 'escalated':
      return <AdminBadge variant="destructive">Escalada</AdminBadge>;
    case 'pending_action':
      return <AdminBadge variant="secondary">Pend. Ação</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getPriorityBadge(priority: Infraction['priority']) {
  switch (priority) {
    case 'low':
      return <AdminBadge variant="outline" className="bg-green-100 text-green-800">Baixa</AdminBadge>;
    case 'medium':
      return <AdminBadge variant="outline" className="bg-yellow-100 text-yellow-800">Média</AdminBadge>;
    case 'high':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Alta</AdminBadge>;
    case 'urgent':
      return <AdminBadge variant="destructive">Urgente</AdminBadge>;
    default:
      return <AdminBadge variant="outline">-</AdminBadge>;
  }
}

function getRiskScoreColor(score: number) {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

export default function InfractionsPage() {
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [summary, setSummary] = useState<InfractionSummary>({
    totalInfractions: 0,
    openInfractions: 0,
    resolvedInfractions: 0,
    criticalInfractions: 0,
    averageResolutionTime: 0,
    monthlyIncrease: 0,
    topInfractionType: '',
    riskScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredInfractions = infractions.filter(infraction => {
    const matchesSearch = infraction.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         infraction.tenantDocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         infraction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         infraction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || infraction.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || infraction.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || infraction.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || infraction.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesSeverity && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [infractionsData, summaryData] = await Promise.all([
          fetchInfractions(),
          fetchInfractionsSummary()
        ]);
        setInfractions(infractionsData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Erro ao carregar dados de infrações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[80%] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Infrações e Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie infrações, violações e atividades suspeitas
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
              <p className="text-sm font-medium text-muted-foreground">Total de Infrações</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalInfractions}</p>
              <p className="text-sm text-orange-600 mt-1">{summary.openInfractions} abertas</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Infrações Críticas</p>
              <p className="text-2xl font-bold text-red-600">{summary.criticalInfractions}</p>
              <p className="text-sm text-muted-foreground mt-1">Requer ação imediata</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo Médio Resolução</p>
              <p className="text-2xl font-bold text-foreground">{summary.averageResolutionTime} dias</p>
              <p className="text-sm text-green-600 mt-1">{summary.resolvedInfractions} resolvidas</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Score de Risco</p>
              <p className={`text-2xl font-bold ${getRiskScoreColor(summary.riskScore)}`}>{summary.riskScore}/100</p>
              <p className="text-sm text-orange-600 mt-1">+{summary.monthlyIncrease}% este mês</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600" />
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
                placeholder="Buscar por empresa, documento, descrição ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Tipos</option>
              <option value="chargeback_abuse">Abuso de Chargeback</option>
              <option value="suspicious_activity">Atividade Suspeita</option>
              <option value="fraud_attempt">Tentativa de Fraude</option>
              <option value="policy_violation">Violação de Política</option>
              <option value="money_laundering">Lavagem de Dinheiro</option>
              <option value="document_fraud">Fraude Documental</option>
              <option value="excessive_refunds">Reembolsos Excessivos</option>
              <option value="account_manipulation">Manipulação de Conta</option>
            </select>
            
            <select 
              value={severityFilter} 
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todas as Severidades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Status</option>
              <option value="open">Aberta</option>
              <option value="investigating">Investigando</option>
              <option value="resolved">Resolvida</option>
              <option value="dismissed">Descartada</option>
              <option value="escalated">Escalada</option>
              <option value="pending_action">Pend. Ação</option>
            </select>
            
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de Infrações */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Infrações</h2>
          <p className="text-sm text-muted-foreground">
            {filteredInfractions.length} de {infractions.length} infrações
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>ID / Empresa</AdminTableHead>
                <AdminTableHead>Tipo</AdminTableHead>
                <AdminTableHead>Severidade</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Prioridade</AdminTableHead>
                <AdminTableHead>Score de Risco</AdminTableHead>
                <AdminTableHead>Responsável</AdminTableHead>
                <AdminTableHead>Criada em</AdminTableHead>
                <AdminTableHead>Ações</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredInfractions.map((infraction) => (
                <AdminTableRow key={infraction.id} className="hover:bg-accent/50">
                  <AdminTableCell>
                    <div>
                      <p className="font-medium text-sm font-mono">{infraction.id}</p>
                      <p className="font-semibold">{infraction.tenantName}</p>
                      <p className="text-sm text-muted-foreground">{infraction.tenantDocument}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={infraction.description}>
                        {infraction.description}
                      </p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {getInfractionTypeBadge(infraction.type)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getSeverityBadge(infraction.severity)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getStatusBadge(infraction.status)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getPriorityBadge(infraction.priority)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className={`font-bold ${getRiskScoreColor(infraction.riskScore)}`}>
                      {infraction.riskScore}/100
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      {infraction.assignedTo ? (
                        <>
                          <p className="font-medium text-sm">{infraction.assignedTo.name}</p>
                          <p className="text-xs text-muted-foreground">{infraction.assignedTo.role}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não atribuída</span>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="text-sm">
                    {formatDate(infraction.createdAt)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <AdminButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </AdminButton>
                      <AdminButton variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </AdminButton>
                      {infraction.status === 'open' && (
                        <AdminButton variant="ghost" size="sm" className="text-green-600">
                          <CheckCircle className="h-4 w-4" />
                        </AdminButton>
                      )}
                      {infraction.severity === 'critical' && (
                        <AdminButton variant="ghost" size="sm" className="text-red-600">
                          <Ban className="h-4 w-4" />
                        </AdminButton>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredInfractions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma infração encontrada com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}