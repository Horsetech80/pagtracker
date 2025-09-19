'use client';

import { useState, useEffect } from 'react';
import { AdminCard } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminBadge } from '@/components/admin/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeClients: number;
  totalTransactions: number;
  averageTicket: number;
  monthlyGrowth: number;
  pendingWithdrawals: number;
}

interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  client: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const mockMetrics: FinancialMetrics = {
  totalRevenue: 2847650.00,
  totalExpenses: 1234500.00,
  netProfit: 1613150.00,
  activeClients: 1247,
  totalTransactions: 15678,
  averageTicket: 181.65,
  monthlyGrowth: 12.5,
  pendingWithdrawals: 89750.00
};

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'entrada',
    amount: 15750.00,
    description: 'Comissão PIX - Empresa ABC',
    client: 'Empresa ABC Ltda',
    date: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    type: 'saida',
    amount: 2500.00,
    description: 'Saque solicitado',
    client: 'Tech Solutions',
    date: '2024-01-15T09:15:00Z',
    status: 'pending'
  },
  {
    id: '3',
    type: 'entrada',
    amount: 8900.00,
    description: 'Taxa de processamento',
    client: 'Comércio XYZ',
    date: '2024-01-14T16:45:00Z',
    status: 'completed'
  },
  {
    id: '4',
    type: 'saida',
    amount: 1200.00,
    description: 'Estorno de transação',
    client: 'Loja Virtual 123',
    date: '2024-01-14T14:20:00Z',
    status: 'completed'
  },
  {
    id: '5',
    type: 'entrada',
    amount: 22100.00,
    description: 'Comissão cartão de crédito',
    client: 'Mega Store',
    date: '2024-01-14T11:10:00Z',
    status: 'completed'
  }
];

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  className = '' 
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}) {
  return (
    <AdminCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </AdminCard>
  );
}

function getStatusBadge(status: Transaction['status']) {
  switch (status) {
    case 'completed':
      return <AdminBadge variant="default" className="bg-green-100 text-green-800">Concluída</AdminBadge>;
    case 'pending':
      return <AdminBadge variant="secondary">Pendente</AdminBadge>;
    case 'failed':
      return <AdminBadge variant="destructive">Falhou</AdminBadge>;
    default:
      return <AdminBadge variant="outline">Desconhecido</AdminBadge>;
  }
}

function getTransactionIcon(type: Transaction['type']) {
  return type === 'entrada' ? (
    <TrendingUp className="h-4 w-4 text-green-600" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-600" />
  );
}

export default function FinanceiroPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics>(mockMetrics);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('30d');

  useEffect(() => {
    // Simular carregamento de dados
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
          <h1 className="text-3xl font-bold text-foreground">Financeiro - Visão Geral</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as métricas financeiras e transações da plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminButton variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 dias
          </AdminButton>
          <AdminButton variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </AdminButton>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue={`+${metrics.monthlyGrowth}%`}
        />
        <MetricCard
          title="Despesas Totais"
          value={formatCurrency(metrics.totalExpenses)}
          icon={TrendingDown}
          trend="down"
          trendValue="-5.2%"
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(metrics.netProfit)}
          icon={TrendingUp}
          trend="up"
          trendValue="+18.7%"
        />
        <MetricCard
          title="Clientes Ativos"
          value={metrics.activeClients.toLocaleString()}
          icon={Users}
          trend="up"
          trendValue="+127"
        />
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total de Transações"
          value={metrics.totalTransactions.toLocaleString()}
          icon={CreditCard}
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(metrics.averageTicket)}
          icon={DollarSign}
        />
        <MetricCard
          title="Saques Pendentes"
          value={formatCurrency(metrics.pendingWithdrawals)}
          icon={TrendingDown}
          className="border-orange-200"
        />
      </div>

      {/* Transações recentes */}
      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Transações Recentes</h2>
          <AdminButton variant="outline" size="sm">
            Ver todas
          </AdminButton>
        </div>
        
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-lg">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{transaction.client}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'entrada' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(transaction.date)}
                  </p>
                </div>
                {getStatusBadge(transaction.status)}
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}