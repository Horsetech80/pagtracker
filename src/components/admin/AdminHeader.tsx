// Admin Header Component
// Top navigation bar for the admin panel with breadcrumbs, search, and user actions

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminButton } from './ui/button';
import { AdminInput } from './ui/input';
import { useAdminAuth } from '@/hooks/useAdmin';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

// Breadcrumb mapping for admin routes
const routeLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/empresas': 'Empresas',
  '/admin/financeiro': 'Financeiro',
  '/admin/carteiras': 'Carteiras',
  '/admin/reservas': 'Reservas',
  '/admin/infracoes': 'Infrações',
  '/admin/usuarios': 'Usuários Admin',
  '/admin/configuracoes': 'Configurações',
  '/admin/configuracoes/adquirentes': 'Adquirentes',
  '/admin/configuracoes/taxas': 'Taxas',
  '/admin/faturamento': 'Faturamento TPV'
};

function Breadcrumbs() {
  const pathname = usePathname();
  
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  // Build breadcrumb path
  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ path: currentPath, label });
  }
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          <span 
            className={cn(
              index === breadcrumbs.length - 1 
                ? 'text-foreground font-medium' 
                : 'hover:text-foreground'
            )}
          >
            {crumb.label}
          </span>
        </div>
      ))}
    </nav>
  );
}

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'Nova solicitação de saque',
      message: 'Empresa ABC Ltda solicitou saque de R$ 5.000,00',
      time: '5 min atrás',
      unread: true
    },
    {
      id: 2,
      title: 'Infração detectada',
      message: 'Taxa de chargeback elevada detectada',
      time: '1 hora atrás',
      unread: true
    },
    {
      id: 3,
      title: 'Novo tenant registrado',
      message: 'Tech Solutions completou o cadastro',
      time: '2 horas atrás',
      unread: false
    }
  ];
  
  const unreadCount = notifications.filter(n => n.unread).length;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-popover rounded-lg shadow-lg border border-border z-20">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-popover-foreground">
                Notificações
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    'p-4 border-b border-border hover:bg-accent cursor-pointer',
                    notification.unread && 'bg-accent'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-popover-foreground">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.time}
                      </p>
                    </div>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <button className="text-sm text-primary hover:text-primary/80">
                Ver todas as notificações
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { adminUser, logout } = useAdminAuth();
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
          </span>
        </div>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-popover rounded-lg shadow-lg border border-border z-20">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-popover-foreground">
                    {adminUser?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {adminUser?.email}
                  </p>
                  <p className="text-xs text-primary">
                    {adminUser?.role === 'super_admin' ? 'Super Admin' : 
                     adminUser?.role === 'admin' ? 'Admin' : 'Moderador'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </button>
            </div>
            
            <div className="p-2 border-t border-border">
              <button 
                onClick={logout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminHeader({ onMenuToggle, isMobileMenuOpen }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <header className="bg-background border-b border-border py-4">
      <div className="container-responsive flex items-center justify-between">
        {/* Left side - Mobile menu toggle + Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          
          {/* Breadcrumbs */}
          <div className="hidden sm:block">
            <Breadcrumbs />
          </div>
        </div>
        
        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar empresas, transações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
      
      {/* Mobile breadcrumbs */}
      <div className="sm:hidden mt-4">
        <Breadcrumbs />
      </div>
    </header>
  );
}