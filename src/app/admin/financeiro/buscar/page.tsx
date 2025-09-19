'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
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
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw,
  Ban,
  Zap,
  Shield,
  Info,
  MapPin,
  Smartphone,
  Globe,
  Hash,
  Copy,
  ExternalLink,
  History,
  ScanLine,
  QrCode,
  Banknote,
  Wallet,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  externalId?: string;
  tenantId: string;
  tenantName: string;
  tenantDocument: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'disputed' | 'chargeback';
  type: 'payment' | 'refund' | 'chargeback' | 'fee' | 'withdrawal' | 'deposit' | 'transfer';
  paymentMethod: {
    type: 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'digital_wallet' | 'boleto';
    brand?: string;
    lastFourDigits?: string;
    bankCode?: string;
    bankName?: string;
  };
  acquirer: {
    name: string;
    transactionId: string;
    authorizationCode?: string;
    responseCode?: string;
    responseMessage?: string;
  };
  fees: {
    processingFee: number;
    acquirerFee: number;
    platformFee: number;
    totalFees: number;
  };
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  description?: string;
  metadata?: {
    orderId?: string;
    productName?: string;
    category?: string;
    installments?: number;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      state: string;
      city: string;
    };
  };
  riskAnalysis?: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  timeline: {
    date: string;
    event: string;
    description: string;
    source: string;
  }[];
  relatedTransactions?: string[];
  tags?: string[];
}

interface SearchFilters {
  searchTerm: string;
  transactionId: string;
  customerId: string;
  customerEmail: string;
  customerDocument: string;
  tenantId: string;
  status: string;
  type: string;
  paymentMethod: string;
  acquirer: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
  riskLevel: string;
}

interface SearchStats {
  totalFound: number;
  totalAmount: number;
  averageAmount: number;
  statusBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
}

const mockTransactions: Transaction[] = [
  {
    id: 'txn_001',
    externalId: 'ORD-2024-001',
    tenantId: 'tenant_001',
    tenantName: 'Empresa ABC Ltda',
    tenantDocument: '12.345.678/0001-90',
    customerId: 'cust_001',
    customerName: 'João Silva',
    customerEmail: 'joao@email.com',
    customerDocument: '123.456.789-00',
    amount: 1250.00,
    currency: 'BRL',
    status: 'completed',
    type: 'payment',
    paymentMethod: {
      type: 'credit_card',
      brand: 'Visa',
      lastFourDigits: '1234'
    },
    acquirer: {
      name: 'Cielo',
      transactionId: 'CIE123456789',
      authorizationCode: 'AUTH001',
      responseCode: '00',
      responseMessage: 'Approved'
    },
    fees: {
      processingFee: 37.50,
      acquirerFee: 25.00,
      platformFee: 12.50,
      totalFees: 75.00
    },
    netAmount: 1175.00,
    createdAt: '2024-01-15T14:30:00Z',
    updatedAt: '2024-01-15T14:32:00Z',
    completedAt: '2024-01-15T14:32:00Z',
    description: 'Compra de produto eletrônico',
    metadata: {
      orderId: 'ORD-2024-001',
      productName: 'Smartphone XYZ',
      category: 'electronics',
      installments: 3,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      deviceFingerprint: 'fp_abc123',
      location: {
        country: 'Brasil',
        state: 'São Paulo',
        city: 'São Paulo'
      }
    },
    riskAnalysis: {
      score: 25,
      level: 'low',
      factors: ['cliente_conhecido', 'historico_limpo']
    },
    timeline: [
      {
        date: '2024-01-15T14:30:00Z',
        event: 'created',
        description: 'Transação criada',
        source: 'api'
      },
      {
        date: '2024-01-15T14:31:00Z',
        event: 'authorized',
        description: 'Autorizada pela adquirente',
        source: 'cielo'
      },
      {
        date: '2024-01-15T14:32:00Z',
        event: 'completed',
        description: 'Transação concluída',
        source: 'system'
      }
    ],
    tags: ['high_value', 'electronics']
  },
  {
    id: 'txn_002',
    externalId: 'PIX-2024-002',
    tenantId: 'tenant_002',
    tenantName: 'Commerce Plus',
    tenantDocument: '98.765.432/0001-10',
    customerId: 'cust_002',
    customerName: 'Maria Santos',
    customerEmail: 'maria@email.com',
    customerDocument: '987.654.321-00',
    amount: 89.90,
    currency: 'BRL',
    status: 'completed',
    type: 'payment',
    paymentMethod: {
      type: 'pix',
      bankCode: '001',
      bankName: 'Banco do Brasil'
    },
    acquirer: {
      name: 'EfiPay',
      transactionId: 'EFI987654321',
      responseCode: '00',
      responseMessage: 'Approved'
    },
    fees: {
      processingFee: 0.89,
      acquirerFee: 0.45,
      platformFee: 0.44,
      totalFees: 1.78
    },
    netAmount: 88.12,
    createdAt: '2024-01-16T09:15:00Z',
    updatedAt: '2024-01-16T09:16:00Z',
    completedAt: '2024-01-16T09:16:00Z',
    description: 'Pagamento via PIX',
    metadata: {
      orderId: 'PIX-2024-002',
      productName: 'Assinatura mensal',
      category: 'subscription',
      ipAddress: '10.0.0.50',
      userAgent: 'Mobile App v2.1',
      location: {
        country: 'Brasil',
        state: 'Rio de Janeiro',
        city: 'Rio de Janeiro'
      }
    },
    riskAnalysis: {
      score: 15,
      level: 'low',
      factors: ['pix_instantaneo', 'valor_baixo']
    },
    timeline: [
      {
        date: '2024-01-16T09:15:00Z',
        event: 'created',
        description: 'PIX criado',
        source: 'mobile_app'
      },
      {
        date: '2024-01-16T09:16:00Z',
        event: 'completed',
        description: 'PIX confirmado',
        source: 'efipay'
      }
    ],
    tags: ['pix', 'subscription']
  },
  {
    id: 'txn_003',
    tenantId: 'tenant_003',
    tenantName: 'Tech Solutions',
    tenantDocument: '11.222.333/0001-44',
    customerId: 'cust_003',
    customerName: 'Carlos Oliveira',
    customerEmail: 'carlos@email.com',
    customerDocument: '456.789.123-00',
    amount: 2500.00,
    currency: 'BRL',
    status: 'chargeback',
    type: 'chargeback',
    paymentMethod: {
      type: 'credit_card',
      brand: 'Mastercard',
      lastFourDigits: '5678'
    },
    acquirer: {
      name: 'Rede',
      transactionId: 'RED555666777',
      authorizationCode: 'AUTH002',
      responseCode: '4855',
      responseMessage: 'Goods/Services Not Received'
    },
    fees: {
      processingFee: 75.00,
      acquirerFee: 50.00,
      platformFee: 25.00,
      totalFees: 150.00
    },
    netAmount: -2650.00,
    createdAt: '2024-01-10T11:20:00Z',
    updatedAt: '2024-01-20T16:45:00Z',
    description: 'Chargeback - Produto não recebido',
    metadata: {
      orderId: 'ORD-2024-003',
      productName: 'Notebook Gamer',
      category: 'electronics',
      installments: 12,
      ipAddress: '172.16.0.10',
      userAgent: 'Chrome/120.0.0.0',
      location: {
        country: 'Brasil',
        state: 'Minas Gerais',
        city: 'Belo Horizonte'
      }
    },
    riskAnalysis: {
      score: 85,
      level: 'high',
      factors: ['chargeback', 'valor_alto', 'primeiro_chargeback']
    },
    timeline: [
      {
        date: '2024-01-10T11:20:00Z',
        event: 'created',
        description: 'Transação original criada',
        source: 'website'
      },
      {
        date: '2024-01-10T11:22:00Z',
        event: 'completed',
        description: 'Transação aprovada',
        source: 'rede'
      },
      {
        date: '2024-01-20T16:45:00Z',
        event: 'chargeback',
        description: 'Chargeback iniciado pelo banco',
        source: 'bank'
      }
    ],
    relatedTransactions: ['rev_001'],
    tags: ['chargeback', 'high_risk', 'electronics']
  },
  {
    id: 'txn_004',
    externalId: 'BOL-2024-004',
    tenantId: 'tenant_004',
    tenantName: 'Digital Store',
    tenantDocument: '55.666.777/0001-88',
    customerId: 'cust_004',
    customerName: 'Ana Costa',
    customerEmail: 'ana@email.com',
    customerDocument: '789.123.456-00',
    amount: 450.00,
    currency: 'BRL',
    status: 'pending',
    type: 'payment',
    paymentMethod: {
      type: 'boleto'
    },
    acquirer: {
      name: 'Banco Bradesco',
      transactionId: 'BOL123456789',
      responseCode: 'PENDING',
      responseMessage: 'Awaiting Payment'
    },
    fees: {
      processingFee: 4.50,
      acquirerFee: 2.25,
      platformFee: 2.25,
      totalFees: 9.00
    },
    netAmount: 441.00,
    createdAt: '2024-01-22T13:45:00Z',
    updatedAt: '2024-01-22T13:45:00Z',
    description: 'Boleto bancário - Curso online',
    metadata: {
      orderId: 'BOL-2024-004',
      productName: 'Curso de Marketing Digital',
      category: 'education',
      ipAddress: '203.0.113.10',
      userAgent: 'Safari/17.0',
      location: {
        country: 'Brasil',
        state: 'Bahia',
        city: 'Salvador'
      }
    },
    riskAnalysis: {
      score: 30,
      level: 'low',
      factors: ['boleto', 'cliente_novo']
    },
    timeline: [
      {
        date: '2024-01-22T13:45:00Z',
        event: 'created',
        description: 'Boleto gerado',
        source: 'website'
      }
    ],
    tags: ['boleto', 'education', 'pending']
  },
  {
    id: 'txn_005',
    tenantId: 'tenant_005',
    tenantName: 'StartupXYZ',
    tenantDocument: '99.888.777/0001-66',
    customerId: 'cust_005',
    customerName: 'Roberto Silva',
    customerEmail: 'roberto@email.com',
    customerDocument: '321.654.987-00',
    amount: 199.90,
    currency: 'BRL',
    status: 'failed',
    type: 'payment',
    paymentMethod: {
      type: 'credit_card',
      brand: 'Visa',
      lastFourDigits: '9999'
    },
    acquirer: {
      name: 'Stone',
      transactionId: 'STO999888777',
      responseCode: '05',
      responseMessage: 'Do Not Honor'
    },
    fees: {
      processingFee: 0,
      acquirerFee: 0,
      platformFee: 0,
      totalFees: 0
    },
    netAmount: 0,
    createdAt: '2024-01-23T18:30:00Z',
    updatedAt: '2024-01-23T18:31:00Z',
    description: 'Transação negada - Cartão sem limite',
    metadata: {
      orderId: 'ORD-2024-005',
      productName: 'Plano Premium',
      category: 'subscription',
      ipAddress: '198.51.100.5',
      userAgent: 'Firefox/121.0',
      location: {
        country: 'Brasil',
        state: 'Paraná',
        city: 'Curitiba'
      }
    },
    riskAnalysis: {
      score: 60,
      level: 'medium',
      factors: ['transacao_negada', 'tentativa_multipla']
    },
    timeline: [
      {
        date: '2024-01-23T18:30:00Z',
        event: 'created',
        description: 'Transação iniciada',
        source: 'api'
      },
      {
        date: '2024-01-23T18:31:00Z',
        event: 'failed',
        description: 'Negada pela adquirente',
        source: 'stone'
      }
    ],
    tags: ['failed', 'subscription', 'declined']
  }
];

const initialFilters: SearchFilters = {
  searchTerm: '',
  transactionId: '',
  customerId: '',
  customerEmail: '',
  customerDocument: '',
  tenantId: '',
  status: 'all',
  type: 'all',
  paymentMethod: 'all',
  acquirer: 'all',
  amountMin: '',
  amountMax: '',
  dateFrom: '',
  dateTo: '',
  riskLevel: 'all'
};

function getStatusBadge(status: Transaction['status']) {
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
    case 'refunded':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Reembolsada</AdminBadge>;
    case 'disputed':
      return <AdminBadge variant="outline" className="bg-purple-100 text-purple-800">Contestada</AdminBadge>;
    case 'chargeback':
      return <AdminBadge variant="destructive">Chargeback</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getTypeBadge(type: Transaction['type']) {
  const types = {
    payment: { label: 'Pagamento', color: 'bg-green-100 text-green-800', icon: DollarSign },
    refund: { label: 'Reembolso', color: 'bg-blue-100 text-blue-800', icon: ArrowLeft },
    chargeback: { label: 'Chargeback', color: 'bg-red-100 text-red-800', icon: Ban },
    fee: { label: 'Taxa', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
    withdrawal: { label: 'Saque', color: 'bg-purple-100 text-purple-800', icon: Banknote },
    deposit: { label: 'Depósito', color: 'bg-indigo-100 text-indigo-800', icon: Wallet },
    transfer: { label: 'Transferência', color: 'bg-gray-100 text-gray-800', icon: ArrowRight }
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

function getPaymentMethodIcon(method: Transaction['paymentMethod']) {
  switch (method.type) {
    case 'credit_card':
    case 'debit_card':
      return <CreditCardIcon className="h-4 w-4" />;
    case 'pix':
      return <QrCode className="h-4 w-4" />;
    case 'bank_transfer':
      return <Building2 className="h-4 w-4" />;
    case 'digital_wallet':
      return <Wallet className="h-4 w-4" />;
    case 'boleto':
      return <FileText className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
}

function getRiskLevelColor(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export default function SearchTransactionPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions] = useState<Transaction[]>(mockTransactions);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [stats, setStats] = useState<SearchStats | null>(null);

  const handleSearch = () => {
    setLoading(true);
    setSearchPerformed(true);
    
    setTimeout(() => {
      const filtered = allTransactions.filter(transaction => {
        // Busca geral
        const searchMatch = !filters.searchTerm || 
          transaction.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          transaction.externalId?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          transaction.tenantName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          transaction.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          transaction.customerEmail.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          transaction.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        // Filtros específicos
        const idMatch = !filters.transactionId || transaction.id.toLowerCase().includes(filters.transactionId.toLowerCase());
        const customerIdMatch = !filters.customerId || transaction.customerId.toLowerCase().includes(filters.customerId.toLowerCase());
        const emailMatch = !filters.customerEmail || transaction.customerEmail.toLowerCase().includes(filters.customerEmail.toLowerCase());
        const documentMatch = !filters.customerDocument || transaction.customerDocument.includes(filters.customerDocument);
        const tenantMatch = !filters.tenantId || transaction.tenantId.toLowerCase().includes(filters.tenantId.toLowerCase());
        const statusMatch = filters.status === 'all' || transaction.status === filters.status;
        const typeMatch = filters.type === 'all' || transaction.type === filters.type;
        const paymentMethodMatch = filters.paymentMethod === 'all' || transaction.paymentMethod.type === filters.paymentMethod;
        const acquirerMatch = filters.acquirer === 'all' || transaction.acquirer.name.toLowerCase().includes(filters.acquirer.toLowerCase());
        const riskMatch = filters.riskLevel === 'all' || transaction.riskAnalysis?.level === filters.riskLevel;
        
        // Filtros de valor
        const minAmountMatch = !filters.amountMin || transaction.amount >= parseFloat(filters.amountMin);
        const maxAmountMatch = !filters.amountMax || transaction.amount <= parseFloat(filters.amountMax);
        
        // Filtros de data
        const fromDateMatch = !filters.dateFrom || new Date(transaction.createdAt) >= new Date(filters.dateFrom);
        const toDateMatch = !filters.dateTo || new Date(transaction.createdAt) <= new Date(filters.dateTo + 'T23:59:59');
        
        return searchMatch && idMatch && customerIdMatch && emailMatch && documentMatch && 
               tenantMatch && statusMatch && typeMatch && paymentMethodMatch && acquirerMatch && 
               riskMatch && minAmountMatch && maxAmountMatch && fromDateMatch && toDateMatch;
      });
      
      setTransactions(filtered);
      
      // Calcular estatísticas
      const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
      const statusBreakdown = filtered.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const typeBreakdown = filtered.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const paymentMethodBreakdown = filtered.reduce((acc, t) => {
        acc[t.paymentMethod.type] = (acc[t.paymentMethod.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setStats({
        totalFound: filtered.length,
        totalAmount,
        averageAmount: filtered.length > 0 ? totalAmount / filtered.length : 0,
        statusBreakdown,
        typeBreakdown,
        paymentMethodBreakdown
      });
      
      setLoading(false);
    }, 1000);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setTransactions([]);
    setStats(null);
    setSearchPerformed(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[80%] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Buscar Transação</h1>
          <p className="text-muted-foreground mt-1">
            Pesquise e localize transações específicas no sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="outline" size="sm" onClick={handleClearFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar
          </AdminButton>
          {stats && (
            <AdminButton variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </AdminButton>
          )}
        </div>
      </div>

      {/* Filtros de Busca */}
      <AdminCard className="p-6">
        <div className="space-y-4">
          {/* Busca Principal */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <AdminInput
                  placeholder="Buscar por ID, nome, email, empresa ou descrição..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <AdminButton onClick={handleSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar
            </AdminButton>
            <AdminButton 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </AdminButton>
          </div>

          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">ID da Transação</label>
                  <AdminInput
                    placeholder="txn_123..."
                    value={filters.transactionId}
                    onChange={(e) => setFilters(prev => ({ ...prev, transactionId: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">ID do Cliente</label>
                  <AdminInput
                    placeholder="cust_123..."
                    value={filters.customerId}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerId: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email do Cliente</label>
                  <AdminInput
                    placeholder="cliente@email.com"
                    value={filters.customerEmail}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerEmail: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">CPF/CNPJ</label>
                  <AdminInput
                    placeholder="123.456.789-00"
                    value={filters.customerDocument}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerDocument: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendente</option>
                    <option value="processing">Processando</option>
                    <option value="completed">Concluída</option>
                    <option value="failed">Falhou</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="refunded">Reembolsada</option>
                    <option value="disputed">Contestada</option>
                    <option value="chargeback">Chargeback</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Tipo</label>
                  <select 
                    value={filters.type} 
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Todos</option>
                    <option value="payment">Pagamento</option>
                    <option value="refund">Reembolso</option>
                    <option value="chargeback">Chargeback</option>
                    <option value="fee">Taxa</option>
                    <option value="withdrawal">Saque</option>
                    <option value="deposit">Depósito</option>
                    <option value="transfer">Transferência</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Método de Pagamento</label>
                  <select 
                    value={filters.paymentMethod} 
                    onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Todos</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="bank_transfer">Transferência</option>
                    <option value="digital_wallet">Carteira Digital</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Nível de Risco</label>
                  <select 
                    value={filters.riskLevel} 
                    onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Todos</option>
                    <option value="low">Baixo</option>
                    <option value="medium">Médio</option>
                    <option value="high">Alto</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Valor Mínimo</label>
                  <AdminInput
                    type="number"
                    placeholder="0.00"
                    value={filters.amountMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Valor Máximo</label>
                  <AdminInput
                    type="number"
                    placeholder="999999.99"
                    value={filters.amountMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Data Inicial</label>
                  <AdminInput
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Data Final</label>
                  <AdminInput
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Estatísticas da Busca */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transações Encontradas</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalFound.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.averageAmount)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.statusBreakdown.completed || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.totalFound > 0 ? Math.round(((stats.statusBreakdown.completed || 0) / stats.totalFound) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* Resultados da Busca */}
      {searchPerformed && (
        <AdminCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Resultados da Busca</h2>
            {stats && (
              <p className="text-sm text-muted-foreground">
                {stats.totalFound} transações encontradas
              </p>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Buscando transações...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>ID / Dados</AdminTableHead>
                    <AdminTableHead>Cliente / Empresa</AdminTableHead>
                    <AdminTableHead>Tipo / Status</AdminTableHead>
                    <AdminTableHead>Método</AdminTableHead>
                    <AdminTableHead>Valor</AdminTableHead>
                    <AdminTableHead>Adquirente</AdminTableHead>
                    <AdminTableHead>Risco</AdminTableHead>
                    <AdminTableHead>Data</AdminTableHead>
                    <AdminTableHead>Ações</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {transactions.map((transaction) => (
                    <AdminTableRow key={transaction.id} className="hover:bg-accent/50">
                      <AdminTableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm font-mono">{transaction.id}</p>
                            <AdminButton 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(transaction.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </AdminButton>
                          </div>
                          {transaction.externalId && (
                            <p className="text-xs text-muted-foreground font-mono">{transaction.externalId}</p>
                          )}
                          {transaction.metadata?.orderId && (
                            <p className="text-xs text-muted-foreground">Pedido: {transaction.metadata.orderId}</p>
                          )}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div>
                          <p className="font-semibold">{transaction.customerName}</p>
                          <p className="text-sm text-muted-foreground">{transaction.customerEmail}</p>
                          <p className="text-xs text-muted-foreground">{transaction.tenantName}</p>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="space-y-1">
                          {getTypeBadge(transaction.type)}
                          {getStatusBadge(transaction.status)}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <div>
                            <p className="text-sm font-medium">
                              {transaction.paymentMethod.brand || transaction.paymentMethod.type.toUpperCase()}
                            </p>
                            {transaction.paymentMethod.lastFourDigits && (
                              <p className="text-xs text-muted-foreground">****{transaction.paymentMethod.lastFourDigits}</p>
                            )}
                          </div>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div>
                          <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                          {transaction.fees.totalFees > 0 && (
                            <p className="text-xs text-muted-foreground">Taxa: {formatCurrency(transaction.fees.totalFees)}</p>
                          )}
                          <p className="text-xs text-muted-foreground">Líquido: {formatCurrency(transaction.netAmount)}</p>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div>
                          <p className="text-sm font-medium">{transaction.acquirer.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{transaction.acquirer.transactionId}</p>
                          {transaction.acquirer.responseCode && (
                            <p className="text-xs text-muted-foreground">Código: {transaction.acquirer.responseCode}</p>
                          )}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        {transaction.riskAnalysis && (
                          <div>
                            <p className={`text-sm font-medium ${getRiskLevelColor(transaction.riskAnalysis.level)}`}>
                              {transaction.riskAnalysis.score}/100
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {transaction.riskAnalysis.level}
                            </p>
                          </div>
                        )}
                      </AdminTableCell>
                      <AdminTableCell className="text-sm">
                        {formatDate(transaction.createdAt)}
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex items-center gap-2">
                          <AdminButton variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </AdminButton>
                          <AdminButton variant="ghost" size="sm">
                            <History className="h-4 w-4" />
                          </AdminButton>
                          <AdminButton variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </AdminButton>
                        </div>
                      </AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminTable>
            </div>
          ) : (
            <div className="text-center py-8">
              <ScanLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma transação encontrada com os critérios especificados.</p>
              <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </AdminCard>
      )}

      {/* Estado Inicial */}
      {!searchPerformed && (
        <AdminCard className="p-12">
          <div className="text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Buscar Transações</h3>
            <p className="text-muted-foreground mb-6">
              Use os filtros acima para localizar transações específicas no sistema.
              Você pode buscar por ID, cliente, empresa, valor, data e muito mais.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span>Busca por ID da transação</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Filtros por cliente</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Filtros por empresa</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Filtros por valor</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Filtros por data</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Análise de risco</span>
              </div>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}