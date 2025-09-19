// PAINEL CLIENTE/GATEWAY - Layout Principal
// Layout exclusivo para operações do TENANT/CLIENTE (não confundir com painel administrativo)
// Gerencia: vendas, cobranças, clientes do tenant, configurações do tenant
// Acesso: usuários do tenant com autenticação multi-tenant

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  ShoppingCart, 
  Settings, 
  BarChart3,
  Wallet,
  Webhook,
  Split,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useTenantId } from '@/lib/hooks/useTenantId';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { TopOnboardingBar } from '@/components/onboarding/TopOnboardingBar';
import { UserProfileDropdown } from '@/components/dashboard/UserProfileDropdown';
import { OnboardingIndicator } from '@/components/onboarding/OnboardingIndicator';
import { useOnboardingIndicators } from '@/lib/hooks/useOnboardingIndicators';
import type { User } from '@supabase/supabase-js';
interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Navegação baseada na arquitetura PagTracker
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { name: 'Cobranças', href: '/cobrancas', icon: CreditCard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Carteira', href: '/carteira', icon: Wallet },
  { name: 'Split', href: '/split', icon: Split },
  { name: 'Checkout', href: '/checkout', icon: ShoppingCart },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  {
    name: 'Integrações',
    href: '/integracoes',
    icon: Zap,
    children: [
      { name: 'Webhooks', href: '/integracoes?section=webhooks' },
    ],
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    children: [
      { name: 'Dados Pessoais', href: '/configuracoes?section=pessoal' },
      { name: 'Empresa', href: '/configuracoes?section=empresa' },
      { name: 'CoProdução', href: '/configuracoes?section=coproducao' },
      { name: 'Taxas', href: '/configuracoes?section=taxas' },
      { name: 'Chave API', href: '/configuracoes?section=chave-api' },
      { name: 'IP Autorizado', href: '/configuracoes?section=ip-autorizado' },
      { name: 'Documentação API', href: '/configuracoes?section=documentacao-api' },
      { name: '2FA', href: '/configuracoes?section=2fa' },
    ],
  },
];

function DashboardContent({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configuracoesOpen, setConfiguracoesOpen] = useState(false);
  const [integracoesOpen, setIntegracoesOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { tenantId, tenant, isLoading } = useTenantId();
  const { shouldShowIndicator, shouldIndicatorBeActive } = useOnboardingIndicators();

  // O contexto de autenticação já gerencia o estado do usuário

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r border-border overflow-y-auto">
          {/* Logo removido para melhor UX - mais espaço para navegação */}
          
          {/* Logo PagTracker - Desktop */}
          <div className="flex-shrink-0 p-4 mx-2 mt-3">
            <div className="flex items-center justify-center">
              <Image 
                src="/images/pagtracker-logo.webp" 
                alt="PagTracker" 
                width={120}
                height={32}
                className="h-8 w-auto"
                style={{ width: 'auto', height: 'auto' }}
                priority
                quality={100}
              />
            </div>
          </div>
          
          {/* Carteira do Cliente - Desktop */}
          <div className="flex-shrink-0 bg-green-50 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Saldo Disponível</span>
                <Wallet className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-lg font-semibold text-green-800">R$ 0,00</div>
              <div className="text-xs text-green-600">Carteira Cliente</div>
            </div>
          </div>
          
          <div className="flex-grow flex flex-col py-3">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                if (item.children) {
                  const isIntegracoes = item.name === 'Integrações';
                  const isConfiguracoes = item.name === 'Configurações';
                  const isOpen = isIntegracoes ? integracoesOpen : configuracoesOpen;
                  const toggleOpen = isIntegracoes 
                    ? () => setIntegracoesOpen(!integracoesOpen)
                    : () => setConfiguracoesOpen(!configuracoesOpen);
                  
                  return (
                    <div key={item.name}>
                      <button
                        onClick={toggleOpen}
                        className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-none transition-all duration-200 ${
                          isActive
                            ? 'bg-green-50 text-green-700 border-l-2 border-green-600'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 flex-shrink-0 h-5 w-5 ${
                            isActive ? 'text-green-600' : 'text-muted-foreground group-hover:text-accent-foreground'
                          }`}
                        />
                        {item.name}
                        <OnboardingIndicator 
                          show={shouldShowIndicator(item.href, isOpen)} 
                          isActive={shouldIndicatorBeActive(item.href, isOpen)}
                          className="mr-2" 
                        />
                        {isOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const childIsActive = pathname.includes(child.href);
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`group flex items-center px-3 py-2 text-sm rounded-none transition-all duration-200 ${
                                  childIsActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-60" />
                                {child.name}
                                <OnboardingIndicator 
                                  show={shouldShowIndicator(child.href, isOpen)} 
                                  isActive={shouldIndicatorBeActive(child.href, isOpen)}
                                  className="ml-auto" 
                                />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-none transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground'
                      }`}
                    />
                    {item.name}
                    <OnboardingIndicator 
                      show={shouldShowIndicator(item.href)} 
                      isActive={shouldIndicatorBeActive(item.href)}
                      className="ml-auto" 
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
          
        </div>
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Building2 className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-xl font-bold text-gray-900">PagTracker</h1>
              </div>
              
              {/* Logo PagTracker - Mobile */}
              <div className="flex-shrink-0 p-4 mx-2 mt-3">
                <div className="flex items-center justify-center">
                  <Image 
                    src="/images/pagtracker-logo.webp" 
                    alt="PagTracker" 
                    width={120}
                    height={32}
                    className="h-8 w-auto"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
              </div>

              {/* Carteira do Cliente - Mobile - Topo */}
              <div className="flex-shrink-0 bg-green-50 p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Saldo Disponível</span>
                    <Wallet className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-lg font-semibold text-green-800">R$ 0,00</div>
                  <div className="text-xs text-green-600">Carteira Cliente</div>
                </div>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  
                  if (item.children) {
                    const isIntegracoes = item.name === 'Integrações';
                    const isConfiguracoes = item.name === 'Configurações';
                    const isOpen = isIntegracoes ? integracoesOpen : configuracoesOpen;
                    const toggleOpen = isIntegracoes 
                      ? () => setIntegracoesOpen(!integracoesOpen)
                      : () => setConfiguracoesOpen(!configuracoesOpen);
                    
                    return (
                      <div key={item.name}>
                        <button
                          onClick={toggleOpen}
                          className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-none transition-all duration-200 ${
                            isActive
                              ? 'bg-green-50 text-green-700 border-l-2 border-green-600'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <item.icon
                            className={`mr-3 flex-shrink-0 h-5 w-5 ${
                              isActive ? 'text-green-600' : 'text-muted-foreground group-hover:text-accent-foreground'
                            }`}
                          />
                          {item.name}
                          <OnboardingIndicator 
                            show={shouldShowIndicator(item.href, isOpen)} 
                            isActive={shouldIndicatorBeActive(item.href, isOpen)}
                            className="mr-2" 
                          />
                          {isOpen ? (
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => {
                              const childIsActive = pathname.includes(child.href);
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  className={`group flex items-center px-3 py-2 text-sm rounded-none transition-all duration-200 ${
                                    childIsActive
                                      ? 'bg-green-50 text-green-700 font-medium'
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                  }`}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-60" />
                                  {child.name}
                                  <OnboardingIndicator 
                                    show={shouldShowIndicator(child.href, isOpen)} 
                                    isActive={shouldIndicatorBeActive(child.href, isOpen)}
                                    className="ml-auto" 
                                  />
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-none transition-all duration-200 ${
                        isActive
                          ? 'bg-green-50 text-green-700 border-l-2 border-green-600'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive ? 'text-green-600' : 'text-muted-foreground group-hover:text-accent-foreground'
                        }`}
                      />
                      {item.name}
                      <OnboardingIndicator 
                        show={shouldShowIndicator(item.href)} 
                        isActive={shouldIndicatorBeActive(item.href)}
                        className="ml-auto" 
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>
            
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header desktop */}
        <nav className="hidden md:flex relative z-10 flex-shrink-0 h-16 bg-background border-b border-border">
          <div className="w-full container-responsive flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden lg:inline">
                Bem-vindo, {user?.email?.split('@')[0] || 'Usuário'}!
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfileDropdown />
            </div>
          </div>
        </nav>
        
        {/* Header mobile */}
        <nav className="md:hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-background border-b border-border shadow-sm">
            <button
              type="button"
              className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  PagTracker v4.0
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <UserProfileDropdown />
              </div>
            </div>
          </div>
        </nav>

        {/* Barra de Onboarding */}
        <TopOnboardingBar />
        
        {/* Área de conteúdo */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="container-responsive">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardContent>{children}</DashboardContent>
  );
}