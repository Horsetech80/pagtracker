'use client';

import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from '@/components/admin/ui/card';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminBadge } from '@/components/admin/ui/badge';
import { MasterAccountBalanceCard } from '@/components/admin/MasterAccountBalanceCard';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Database, 
  Settings, 
  Activity,
  Server
} from 'lucide-react';

/**
 * PAINEL PRINCIPAL DO ADMINISTRADOR
 * 
 * Dashboard principal para super administradores do sistema
 * Exibe métricas gerais, status do sistema e acesso rápido às funcionalidades
 * 
 * Contexto: Administração global do sistema PagTracker
 */
export default function AdminPainelPage() {
  return (
    <div className="container-responsive space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel Administrativo</h2>
          <p className="text-muted-foreground">
            Gerencie usuários, transações e configurações do sistema
          </p>
        </div>
      </div>



      {/* Saldo da Conta Master EfiPay */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <MasterAccountBalanceCard 
          className="col-span-1"
          showRefreshButton={true}
          autoRefresh={false}
          showBlockedBalances={true}
        />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Usuários Ativos</AdminCardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Transações</AdminCardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">R$ 45.231,89</div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao mês anterior
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Taxa de Conversão</AdminCardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% em relação ao mês anterior
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AdminCardTitle className="text-sm font-medium">Uptime</AdminCardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Gerenciar Tenants</span>
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualizar, criar e configurar organizações
            </p>
            <AdminButton className="w-full" variant="outline">
              Acessar Tenants
            </AdminButton>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Usuários do Sistema</span>
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gerenciar usuários e permissões globais
            </p>
            <AdminButton className="w-full" variant="outline">
              Gerenciar Usuários
            </AdminButton>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Banco de Dados</span>
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitorar performance e backups
            </p>
            <AdminButton className="w-full" variant="outline">
              Ver Status DB
            </AdminButton>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configurações globais do sistema
            </p>
            <AdminButton className="w-full" variant="outline">
              Configurar Sistema
            </AdminButton>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Segurança</span>
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Logs de auditoria e segurança
            </p>
            <AdminButton className="w-full" variant="outline">
              Ver Logs
            </AdminButton>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Monitoramento</span>
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Métricas e performance em tempo real
            </p>
            <AdminButton className="w-full" variant="outline">
              Ver Métricas
            </AdminButton>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* System Info */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Informações do Sistema</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Detalhes técnicos e versões
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Versão</p>
              <p className="text-gray-600 dark:text-gray-400">PagTracker v4.0.0</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Ambiente</p>
              <p className="text-gray-600 dark:text-gray-400">Desenvolvimento</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Última Atualização</p>
              <p className="text-gray-600 dark:text-gray-400">Hoje às 14:30</p>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}