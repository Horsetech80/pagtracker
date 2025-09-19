'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Building2,
  User,
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  Activity,
  AlertCircle,
  RefreshCw,
  Ban,
  Zap,
  Shield,
  Info
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FinancialReversal {
  id: string;
  originalTransactionId: string;
  tenantId: string;
  tenantName: string;
  tenantDocument: string;
  type: 'chargeback' | 'refund' | 'dispute' | 'fraud_reversal' | 'technical_error' | 'manual_reversal' | 'partial_reversal';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'disputed' | 'under_review';
  reason: string;
  detailedReason?: string;
  originalAmount: number;
  reversalAmount: number;
  fees: {
    processingFee: number;
    chargebackFee: number;
    disputeFee: number;
    totalFees: number;
  };
  netAmount: number;
  currency: string;
  originalDate: string;
  reversalDate: string;
  completedDate?: string;
  initiatedBy: {
    id: string;
    name: string;
    type: 'system' | 'admin' | 'customer' | 'bank' | 'acquirer';
  };
  processedBy?: {
    id: string;
    name: string;
    role: string;
  };
  paymentMethod: {
    type: 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'digital_wallet';
    brand?: string;
    lastFourDigits?: string;
  };
  acquirer: {
    name: string;
    transactionId: string;
    responseCode?: string;
    responseMessage?: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    document: string;
  };
  evidence?: {
    type: 'document' | 'screenshot' | 'communication' | 'receipt';
    description: string;
    url?: string;
    uploadedAt: string;
  }[];
  timeline: {
    date: string;
    action: string;
    description: string;
    performedBy: string;
  }[];
  riskScore: number;
  fraudIndicators?: string[];
  notes?: string;
  disputeDeadline?: string;
  expectedResolution?: string;
  impactAnalysis: {
    merchantImpact: 'low' | 'medium' | 'high';
    customerImpact: 'low' | 'medium' | 'high';
    reputationRisk: 'low' | 'medium' | 'high';
  };
  relatedReversals?: string[];
  preventionRecommendations?: string[];
}

interface ReversalSummary {
  totalReversals: number;
  pendingReversals: number;
  completedReversals: number;
  failedReversals: number;
  totalReversalAmount: number;
  totalFeesCollected: number;
  averageProcessingTime: number;
  chargebackRate: number;
  monthlyIncrease: number;
  topReversalReason: string;
}

const mockReversals: FinancialReversal[] = [
  {
    id: 'rev_001',
    originalTransactionId: 'txn_12345',
    tenantId: 'tenant_001',
    tenantName: 'Empresa ABC Ltda',
    tenantDocument: '12.345.678/0001-90',
    type: 'chargeback',
    status: 'processing',
    reason: 'Transação não reconhecida pelo portador',
    detailedReason: 'Cliente alega não ter realizado a compra. Solicitação de chargeback iniciada pelo banco emissor.',
    originalAmount: 1250.00,
    reversalAmount: 1250.00,
    fees: {
      processingFee: 15.00,
      chargebackFee: 25.00,
      disputeFee: 0,
      totalFees: 40.00
    },
    netAmount: -1290.00,
    currency: 'BRL',
    originalDate: '2024-01-10T14:30:00Z',
    reversalDate: '2024-01-20T09:15:00Z',
    initiatedBy: {
      id: 'bank_001',
      name: 'Banco Emissor',
      type: 'bank'
    },
    processedBy: {
      id: 'admin_001',
      name: 'Maria Silva',
      role: 'chargeback_analyst'
    },
    paymentMethod: {
      type: 'credit_card',
      brand: 'Visa',
      lastFourDigits: '1234'
    },
    acquirer: {
      name: 'Cielo',
      transactionId: 'CIE123456789',
      responseCode: '4855',
      responseMessage: 'Goods/Services Not Received'
    },
    customer: {
      id: 'cust_001',
      name: 'João Silva',
      email: 'joao@email.com',
      document: '123.456.789-00'
    },
    evidence: [
      {
        type: 'document',
        description: 'Comprovante de entrega',
        url: '/evidence/delivery_proof_001.pdf',
        uploadedAt: '2024-01-21T10:00:00Z'
      }
    ],
    timeline: [
      {
        date: '2024-01-10T14:30:00Z',
        action: 'Transação Original',
        description: 'Transação processada com sucesso',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-20T09:15:00Z',
        action: 'Chargeback Iniciado',
        description: 'Banco emissor iniciou processo de chargeback',
        performedBy: 'Banco Emissor'
      },
      {
        date: '2024-01-21T10:00:00Z',
        action: 'Evidência Enviada',
        description: 'Comprovante de entrega enviado para defesa',
        performedBy: 'Maria Silva'
      }
    ],
    riskScore: 75,
    fraudIndicators: ['transacao_nao_reconhecida', 'primeiro_chargeback'],
    notes: 'Cliente possui histórico limpo. Primeira ocorrência de chargeback.',
    disputeDeadline: '2024-01-30T23:59:59Z',
    expectedResolution: '2024-01-28T12:00:00Z',
    impactAnalysis: {
      merchantImpact: 'medium',
      customerImpact: 'low',
      reputationRisk: 'low'
    },
    preventionRecommendations: [
      'Implementar autenticação 3DS',
      'Melhorar comunicação pós-venda'
    ]
  },
  {
    id: 'rev_002',
    originalTransactionId: 'txn_67890',
    tenantId: 'tenant_002',
    tenantName: 'Commerce Plus',
    tenantDocument: '98.765.432/0001-10',
    type: 'refund',
    status: 'completed',
    reason: 'Produto defeituoso',
    detailedReason: 'Cliente reportou produto com defeito de fabricação. Solicitação de reembolso aprovada.',
    originalAmount: 890.50,
    reversalAmount: 890.50,
    fees: {
      processingFee: 8.90,
      chargebackFee: 0,
      disputeFee: 0,
      totalFees: 8.90
    },
    netAmount: -899.40,
    currency: 'BRL',
    originalDate: '2024-01-15T16:45:00Z',
    reversalDate: '2024-01-18T11:20:00Z',
    completedDate: '2024-01-18T11:25:00Z',
    initiatedBy: {
      id: 'cust_002',
      name: 'Maria Santos',
      type: 'customer'
    },
    processedBy: {
      id: 'admin_002',
      name: 'João Santos',
      role: 'customer_service'
    },
    paymentMethod: {
      type: 'credit_card',
      brand: 'Mastercard',
      lastFourDigits: '5678'
    },
    acquirer: {
      name: 'Rede',
      transactionId: 'RED987654321',
      responseCode: '00',
      responseMessage: 'Approved'
    },
    customer: {
      id: 'cust_002',
      name: 'Maria Santos',
      email: 'maria@email.com',
      document: '987.654.321-00'
    },
    timeline: [
      {
        date: '2024-01-15T16:45:00Z',
        action: 'Transação Original',
        description: 'Compra realizada com sucesso',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-17T14:30:00Z',
        action: 'Solicitação de Reembolso',
        description: 'Cliente solicitou reembolso por produto defeituoso',
        performedBy: 'Maria Santos'
      },
      {
        date: '2024-01-18T11:20:00Z',
        action: 'Reembolso Aprovado',
        description: 'Solicitação aprovada após análise',
        performedBy: 'João Santos'
      },
      {
        date: '2024-01-18T11:25:00Z',
        action: 'Reembolso Processado',
        description: 'Valor estornado para o cartão do cliente',
        performedBy: 'Sistema'
      }
    ],
    riskScore: 25,
    notes: 'Reembolso processado conforme política da empresa.',
    impactAnalysis: {
      merchantImpact: 'low',
      customerImpact: 'low',
      reputationRisk: 'low'
    }
  },
  {
    id: 'rev_003',
    originalTransactionId: 'txn_11111',
    tenantId: 'tenant_003',
    tenantName: 'Tech Solutions',
    tenantDocument: '11.222.333/0001-44',
    type: 'fraud_reversal',
    status: 'completed',
    reason: 'Transação fraudulenta detectada',
    detailedReason: 'Sistema anti-fraude detectou padrão suspeito. Transação revertida preventivamente.',
    originalAmount: 2500.00,
    reversalAmount: 2500.00,
    fees: {
      processingFee: 0,
      chargebackFee: 0,
      disputeFee: 0,
      totalFees: 0
    },
    netAmount: -2500.00,
    currency: 'BRL',
    originalDate: '2024-01-22T03:15:00Z',
    reversalDate: '2024-01-22T03:20:00Z',
    completedDate: '2024-01-22T03:22:00Z',
    initiatedBy: {
      id: 'system_fraud',
      name: 'Sistema Anti-Fraude',
      type: 'system'
    },
    processedBy: {
      id: 'admin_003',
      name: 'Carlos Oliveira',
      role: 'fraud_analyst'
    },
    paymentMethod: {
      type: 'credit_card',
      brand: 'Visa',
      lastFourDigits: '9999'
    },
    acquirer: {
      name: 'Stone',
      transactionId: 'STO555666777',
      responseCode: '00',
      responseMessage: 'Reversal Approved'
    },
    customer: {
      id: 'cust_003',
      name: 'Usuário Suspeito',
      email: 'suspeito@email.com',
      document: '000.000.000-00'
    },
    timeline: [
      {
        date: '2024-01-22T03:15:00Z',
        action: 'Transação Processada',
        description: 'Transação autorizada inicialmente',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-22T03:18:00Z',
        action: 'Fraude Detectada',
        description: 'Sistema anti-fraude identificou padrão suspeito',
        performedBy: 'Sistema Anti-Fraude'
      },
      {
        date: '2024-01-22T03:20:00Z',
        action: 'Reversão Iniciada',
        description: 'Processo de reversão automática iniciado',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-22T03:22:00Z',
        action: 'Reversão Concluída',
        description: 'Transação revertida com sucesso',
        performedBy: 'Sistema'
      }
    ],
    riskScore: 95,
    fraudIndicators: [
      'horario_suspeito',
      'valor_alto',
      'primeiro_uso_cartao',
      'ip_suspeito'
    ],
    notes: 'Reversão automática por detecção de fraude. Cartão bloqueado preventivamente.',
    impactAnalysis: {
      merchantImpact: 'low',
      customerImpact: 'medium',
      reputationRisk: 'low'
    },
    preventionRecommendations: [
      'Revisar regras anti-fraude',
      'Implementar verificação adicional para transações noturnas'
    ]
  },
  {
    id: 'rev_004',
    originalTransactionId: 'txn_22222',
    tenantId: 'tenant_004',
    tenantName: 'Digital Store',
    tenantDocument: '55.666.777/0001-88',
    type: 'dispute',
    status: 'under_review',
    reason: 'Contestação de cobrança',
    detailedReason: 'Cliente contesta a cobrança alegando cancelamento do serviço antes da cobrança.',
    originalAmount: 450.00,
    reversalAmount: 450.00,
    fees: {
      processingFee: 12.00,
      chargebackFee: 0,
      disputeFee: 20.00,
      totalFees: 32.00
    },
    netAmount: -482.00,
    currency: 'BRL',
    originalDate: '2024-01-12T10:00:00Z',
    reversalDate: '2024-01-25T14:30:00Z',
    initiatedBy: {
      id: 'cust_004',
      name: 'Ana Costa',
      type: 'customer'
    },
    processedBy: {
      id: 'admin_004',
      name: 'Lucia Ferreira',
      role: 'dispute_analyst'
    },
    paymentMethod: {
      type: 'debit_card',
      brand: 'Mastercard',
      lastFourDigits: '4321'
    },
    acquirer: {
      name: 'GetNet',
      transactionId: 'GET111222333',
      responseCode: 'PENDING',
      responseMessage: 'Under Review'
    },
    customer: {
      id: 'cust_004',
      name: 'Ana Costa',
      email: 'ana@email.com',
      document: '456.789.123-00'
    },
    evidence: [
      {
        type: 'communication',
        description: 'E-mail de cancelamento do cliente',
        url: '/evidence/cancellation_email_001.pdf',
        uploadedAt: '2024-01-25T15:00:00Z'
      },
      {
        type: 'document',
        description: 'Termos de serviço',
        url: '/evidence/terms_of_service.pdf',
        uploadedAt: '2024-01-25T15:05:00Z'
      }
    ],
    timeline: [
      {
        date: '2024-01-12T10:00:00Z',
        action: 'Cobrança Processada',
        description: 'Cobrança mensal do serviço',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-25T14:30:00Z',
        action: 'Contestação Recebida',
        description: 'Cliente contestou a cobrança',
        performedBy: 'Ana Costa'
      },
      {
        date: '2024-01-25T15:00:00Z',
        action: 'Análise Iniciada',
        description: 'Caso atribuído para análise',
        performedBy: 'Lucia Ferreira'
      }
    ],
    riskScore: 40,
    notes: 'Analisando documentação fornecida pelo cliente.',
    disputeDeadline: '2024-02-10T23:59:59Z',
    expectedResolution: '2024-02-05T12:00:00Z',
    impactAnalysis: {
      merchantImpact: 'medium',
      customerImpact: 'medium',
      reputationRisk: 'low'
    }
  },
  {
    id: 'rev_005',
    originalTransactionId: 'txn_33333',
    tenantId: 'tenant_005',
    tenantName: 'StartupXYZ',
    tenantDocument: '99.888.777/0001-66',
    type: 'technical_error',
    status: 'failed',
    reason: 'Erro técnico no processamento',
    detailedReason: 'Falha na comunicação com a adquirente resultou em cobrança duplicada.',
    originalAmount: 199.90,
    reversalAmount: 199.90,
    fees: {
      processingFee: 0,
      chargebackFee: 0,
      disputeFee: 0,
      totalFees: 0
    },
    netAmount: -199.90,
    currency: 'BRL',
    originalDate: '2024-01-20T08:30:00Z',
    reversalDate: '2024-01-20T09:00:00Z',
    initiatedBy: {
      id: 'system_monitor',
      name: 'Sistema de Monitoramento',
      type: 'system'
    },
    processedBy: {
      id: 'admin_005',
      name: 'Pedro Almeida',
      role: 'technical_support'
    },
    paymentMethod: {
      type: 'pix',
      brand: 'PIX'
    },
    acquirer: {
      name: 'EfiPay',
      transactionId: 'EFI999888777',
      responseCode: 'ERROR',
      responseMessage: 'Communication Timeout'
    },
    customer: {
      id: 'cust_005',
      name: 'Roberto Silva',
      email: 'roberto@email.com',
      document: '789.123.456-00'
    },
    timeline: [
      {
        date: '2024-01-20T08:30:00Z',
        action: 'Transação Iniciada',
        description: 'PIX iniciado pelo cliente',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-20T08:32:00Z',
        action: 'Erro Detectado',
        description: 'Timeout na comunicação com EfiPay',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-20T09:00:00Z',
        action: 'Reversão Tentada',
        description: 'Tentativa de reversão automática',
        performedBy: 'Sistema'
      },
      {
        date: '2024-01-20T09:05:00Z',
        action: 'Reversão Falhou',
        description: 'Falha na reversão - intervenção manual necessária',
        performedBy: 'Sistema'
      }
    ],
    riskScore: 10,
    notes: 'Erro técnico. Necessária intervenção manual para resolução.',
    impactAnalysis: {
      merchantImpact: 'low',
      customerImpact: 'high',
      reputationRisk: 'medium'
    },
    preventionRecommendations: [
      'Implementar retry automático',
      'Melhorar monitoramento de timeout'
    ]
  }
];

const mockSummary: ReversalSummary = {
  totalReversals: 1247,
  pendingReversals: 89,
  completedReversals: 1089,
  failedReversals: 69,
  totalReversalAmount: 2456789.00,
  totalFeesCollected: 45678.90,
  averageProcessingTime: 2.8,
  chargebackRate: 1.2,
  monthlyIncrease: -8.5,
  topReversalReason: 'chargeback'
};

function getReversalTypeBadge(type: FinancialReversal['type']) {
  const types = {
    chargeback: { label: 'Chargeback', color: 'bg-red-100 text-red-800', icon: Ban },
    refund: { label: 'Reembolso', color: 'bg-blue-100 text-blue-800', icon: ArrowLeft },
    dispute: { label: 'Contestação', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    fraud_reversal: { label: 'Reversão Fraude', color: 'bg-purple-100 text-purple-800', icon: Shield },
    technical_error: { label: 'Erro Técnico', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    manual_reversal: { label: 'Reversão Manual', color: 'bg-gray-100 text-gray-800', icon: RefreshCw },
    partial_reversal: { label: 'Reversão Parcial', color: 'bg-indigo-100 text-indigo-800', icon: Activity }
  };
  
  const typeInfo = types[type] || { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: Info };
  const IconComponent = typeInfo.icon;
  
  return (
    <AdminBadge variant="outline" className={typeInfo.color}>
      <IconComponent className="h-3 w-3 mr-1" />
      {typeInfo.label}
    </AdminBadge>
  );
}

function getStatusBadge(status: FinancialReversal['status']) {
  switch (status) {
    case 'pending':
      return <AdminBadge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</AdminBadge>;
    case 'processing':
      return <AdminBadge variant="outline" className="bg-blue-100 text-blue-800">Processando</AdminBadge>;
    case 'completed':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Concluída</AdminBadge>;
    case 'failed':
      return <AdminBadge variant="destructive">Falhou</AdminBadge>;
    case 'cancelled':
      return <AdminBadge variant="outline" className="bg-gray-100 text-gray-800">Cancelada</AdminBadge>;
    case 'disputed':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Contestada</AdminBadge>;
    case 'under_review':
      return <AdminBadge variant="secondary">Em Análise</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getImpactBadge(impact: 'low' | 'medium' | 'high') {
  switch (impact) {
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

function getRiskScoreColor(score: number) {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

export default function FinancialReversalPage() {
  const [reversals, setReversals] = useState<FinancialReversal[]>(mockReversals);
  const [summary, setSummary] = useState<ReversalSummary>(mockSummary);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('30');

  const filteredReversals = reversals.filter(reversal => {
    const matchesSearch = reversal.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reversal.originalTransactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reversal.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reversal.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || reversal.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || reversal.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
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
          <h1 className="text-3xl font-bold text-foreground">Reversa Financeira</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie estornos, chargebacks, reembolsos e reversões de transações
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
              <p className="text-sm font-medium text-muted-foreground">Total de Reversões</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalReversals.toLocaleString()}</p>
              <p className="text-sm text-orange-600 mt-1">{summary.pendingReversals} pendentes</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Revertido</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalReversalAmount)}</p>
              <p className="text-sm text-muted-foreground mt-1">Taxas: {formatCurrency(summary.totalFeesCollected)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taxa de Chargeback</p>
              <p className="text-2xl font-bold text-orange-600">{summary.chargebackRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">{summary.averageProcessingTime} dias médio</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reversões Concluídas</p>
              <p className="text-2xl font-bold text-green-600">{summary.completedReversals.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{summary.monthlyIncrease > 0 ? '+' : ''}{summary.monthlyIncrease}% este mês</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
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
                placeholder="Buscar por empresa, transação, cliente ou ID..."
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
              <option value="chargeback">Chargeback</option>
              <option value="refund">Reembolso</option>
              <option value="dispute">Contestação</option>
              <option value="fraud_reversal">Reversão Fraude</option>
              <option value="technical_error">Erro Técnico</option>
              <option value="manual_reversal">Reversão Manual</option>
              <option value="partial_reversal">Reversão Parcial</option>
            </select>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluída</option>
              <option value="failed">Falhou</option>
              <option value="cancelled">Cancelada</option>
              <option value="disputed">Contestada</option>
              <option value="under_review">Em Análise</option>
            </select>
            
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de Reversões */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Reversões Financeiras</h2>
          <p className="text-sm text-muted-foreground">
            {filteredReversals.length} de {reversals.length} reversões
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>ID / Transação</AdminTableHead>
                <AdminTableHead>Empresa / Cliente</AdminTableHead>
                <AdminTableHead>Tipo</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Valor Original</AdminTableHead>
                <AdminTableHead>Valor Revertido</AdminTableHead>
                <AdminTableHead>Taxas</AdminTableHead>
                <AdminTableHead>Impacto</AdminTableHead>
                <AdminTableHead>Data Reversão</AdminTableHead>
                <AdminTableHead>Ações</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredReversals.map((reversal) => (
                <AdminTableRow key={reversal.id} className="hover:bg-accent/50">
                  <AdminTableCell>
                    <div>
                      <p className="font-medium text-sm font-mono">{reversal.id}</p>
                      <p className="text-sm text-muted-foreground font-mono">{reversal.originalTransactionId}</p>
                      <p className="text-xs text-muted-foreground">{reversal.acquirer.name}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-semibold">{reversal.tenantName}</p>
                      <p className="text-sm text-muted-foreground">{reversal.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{reversal.customer.email}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {getReversalTypeBadge(reversal.type)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getStatusBadge(reversal.status)}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold">
                    {formatCurrency(reversal.originalAmount)}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold text-red-600">
                    -{formatCurrency(reversal.reversalAmount)}
                  </AdminTableCell>
                  <AdminTableCell className="font-medium text-orange-600">
                    {formatCurrency(reversal.fees.totalFees)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Merchant:</span>
                        {getImpactBadge(reversal.impactAnalysis.merchantImpact)}
                      </div>
                      <div className={`text-xs font-medium ${getRiskScoreColor(reversal.riskScore)}`}>
                        Risco: {reversal.riskScore}/100
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="text-sm">
                    {formatDate(reversal.reversalDate)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <AdminButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </AdminButton>
                      <AdminButton variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </AdminButton>
                      {reversal.status === 'pending' && (
                        <AdminButton variant="ghost" size="sm" className="text-blue-600">
                          <Zap className="h-4 w-4" />
                        </AdminButton>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredReversals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma reversão encontrada com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}