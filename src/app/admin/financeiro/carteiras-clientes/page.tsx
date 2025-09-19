'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminInput } from '@/components/admin/ui/input';
import { AdminBadge } from '@/components/admin/ui/badge';
import { AdminTable, AdminTableBody, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from '@/components/admin/ui/table';
import { 
  Wallet, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  Building2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Eye,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ClientWallet {
  id: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  balance: number;
  blockedBalance: number;
  availableBalance: number;
  totalReceived: number;
  totalWithdrawn: number;
  lastTransaction: string;
  status: 'active' | 'blocked' | 'suspended' | 'pending';
  walletType: 'individual' | 'business' | 'premium';
  createdAt: string;
  lastActivity: string;
  transactionCount: number;
  averageTransaction: number;
  riskLevel: 'low' | 'medium' | 'high';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  withdrawalLimit: number;
  monthlyVolume: number;
}

interface WalletSummary {
  totalWallets: number;
  totalBalance: number;
  totalBlockedBalance: number;
  activeWallets: number;
  averageBalance: number;
  topWalletBalance: number;
  monthlyGrowth: number;
  riskWallets: number;
}

// Função para buscar carteiras de clientes da API
const fetchClientWallets = async (): Promise<ClientWallet[]> => {
  try {
    const response = await fetch('/api/admin/client-wallets');
    if (!response.ok) throw new Error('Erro ao buscar carteiras');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar carteiras:', error);
    return [];
  }
};

// Função para buscar resumo das carteiras da API
const fetchWalletsSummary = async (): Promise<WalletSummary> => {
  try {
    const response = await fetch('/api/admin/client-wallets/summary');
    if (!response.ok) throw new Error('Erro ao buscar resumo das carteiras');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar resumo das carteiras:', error);
    return {
      totalWallets: 0,
      totalBalance: 0,
      totalBlockedBalance: 0,
      activeWallets: 0,
      averageBalance: 0,
      topWalletBalance: 0,
      monthlyGrowth: 0,
      riskWallets: 0
    };
  }
};

// Dados mockados removidos - agora usando API real
// Dados mockados removidos - agora usando API real

// Dados mockados removidos - agora usando API real

function getStatusBadge(status: ClientWallet['status']) {
  switch (status) {
    case 'active':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Ativa</AdminBadge>;
    case 'blocked':
      return <AdminBadge variant="destructive">Bloqueada</AdminBadge>;
    case 'suspended':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Suspensa</AdminBadge>;
    case 'pending':
      return <AdminBadge variant="secondary">Pendente</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getWalletTypeBadge(type: ClientWallet['walletType']) {
  const types = {
    individual: { label: 'Individual', color: 'bg-blue-100 text-blue-800' },
    business: { label: 'Empresarial', color: 'bg-purple-100 text-purple-800' },
    premium: { label: 'Premium', color: 'bg-yellow-100 text-yellow-800' }
  };
  
  const typeInfo = types[type];
  return (
    <AdminBadge variant="outline" className={typeInfo.color}>
      {typeInfo.label}
    </AdminBadge>
  );
}

function getRiskBadge(risk: ClientWallet['riskLevel']) {
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

function getKycBadge(status: ClientWallet['kycStatus']) {
  switch (status) {
    case 'approved':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Aprovado</AdminBadge>;
    case 'pending':
      return <AdminBadge variant="secondary">Pendente</AdminBadge>;
    case 'rejected':
      return <AdminBadge variant="destructive">Rejeitado</AdminBadge>;
    case 'expired':
      return <AdminBadge variant="outline" className="bg-orange-100 text-orange-800">Expirado</AdminBadge>;
    default:
      return <AdminBadge variant="outline">-</AdminBadge>;
  }
}

export default function CarteirasClientesPage() {
  const [wallets, setWallets] = useState<ClientWallet[]>([]);
  const [summary, setSummary] = useState<WalletSummary>({
    totalWallets: 0,
    totalBalance: 0,
    totalBlockedBalance: 0,
    activeWallets: 0,
    averageBalance: 0,
    topWalletBalance: 0,
    monthlyGrowth: 0,
    riskWallets: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');

  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = wallet.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.clientDocument.includes(searchTerm) ||
                         wallet.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wallet.status === statusFilter;
    const matchesType = typeFilter === 'all' || wallet.walletType === typeFilter;
    const matchesRisk = riskFilter === 'all' || wallet.riskLevel === riskFilter;
    const matchesKyc = kycFilter === 'all' || wallet.kycStatus === kycFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesRisk && matchesKyc;
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [walletsData, summaryData] = await Promise.all([
          fetchClientWallets(),
          fetchWalletsSummary()
        ]);
        setWallets(walletsData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Erro ao carregar dados das carteiras:', error);
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
          <h1 className="text-3xl font-bold text-foreground">Carteiras dos Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie as carteiras digitais de todos os clientes
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
              <p className="text-sm font-medium text-muted-foreground">Total de Carteiras</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalWallets.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{summary.activeWallets} ativas</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalBalance)}</p>
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
              <p className="text-sm font-medium text-muted-foreground">Saldo Médio</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.averageBalance)}</p>
              <p className="text-sm text-muted-foreground mt-1">Por carteira ativa</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-6 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Bloqueado</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalBlockedBalance)}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary.riskWallets} carteiras de risco</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Lock className="h-6 w-6 text-orange-600" />
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
                placeholder="Buscar por nome, email, documento ou ID da carteira..."
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
              <option value="active">Ativa</option>
              <option value="blocked">Bloqueada</option>
              <option value="suspended">Suspensa</option>
              <option value="pending">Pendente</option>
            </select>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Tipos</option>
              <option value="individual">Individual</option>
              <option value="business">Empresarial</option>
              <option value="premium">Premium</option>
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
            
            <select 
              value={kycFilter} 
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos KYC</option>
              <option value="approved">Aprovado</option>
              <option value="pending">Pendente</option>
              <option value="rejected">Rejeitado</option>
              <option value="expired">Expirado</option>
            </select>
            
            <AdminButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Tabela de Carteiras */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Lista de Carteiras</h2>
          <p className="text-sm text-muted-foreground">
            {filteredWallets.length} de {wallets.length} carteiras
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Cliente</AdminTableHead>
                <AdminTableHead>Tipo</AdminTableHead>
                <AdminTableHead>Saldo Total</AdminTableHead>
                <AdminTableHead>Saldo Disponível</AdminTableHead>
                <AdminTableHead>Saldo Bloqueado</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Risco</AdminTableHead>
                <AdminTableHead>KYC</AdminTableHead>
                <AdminTableHead>Transações</AdminTableHead>
                <AdminTableHead>Última Atividade</AdminTableHead>
                <AdminTableHead>Ações</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredWallets.map((wallet) => (
                <AdminTableRow key={wallet.id} className="hover:bg-accent/50">
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{wallet.clientName}</p>
                      <p className="text-sm text-muted-foreground">{wallet.clientDocument}</p>
                      <p className="text-xs text-muted-foreground">{wallet.clientEmail}</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {getWalletTypeBadge(wallet.walletType)}
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold">
                    {formatCurrency(wallet.balance)}
                  </AdminTableCell>
                  <AdminTableCell className="font-medium text-green-600">
                    {formatCurrency(wallet.availableBalance)}
                  </AdminTableCell>
                  <AdminTableCell className={wallet.blockedBalance > 0 ? 'font-medium text-orange-600' : 'text-muted-foreground'}>
                    {wallet.blockedBalance > 0 ? formatCurrency(wallet.blockedBalance) : '-'}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getStatusBadge(wallet.status)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getRiskBadge(wallet.riskLevel)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {getKycBadge(wallet.kycStatus)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <p className="font-medium">{wallet.transactionCount}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(wallet.averageTransaction)} médio</p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="text-sm">
                    {formatDate(wallet.lastActivity)}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <AdminButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </AdminButton>
                      {wallet.status === 'blocked' ? (
                        <AdminButton variant="ghost" size="sm" className="text-green-600">
                          <Unlock className="h-4 w-4" />
                        </AdminButton>
                      ) : (
                        <AdminButton variant="ghost" size="sm" className="text-orange-600">
                          <Lock className="h-4 w-4" />
                        </AdminButton>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </div>
        
        {filteredWallets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma carteira encontrada com os filtros aplicados.</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}