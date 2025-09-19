// Admin Sidebar Component
// Navigation sidebar specifically designed for the admin panel

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  DollarSign, 
  Wallet, 
  AlertTriangle, 
  Settings, 
  FileText, 
  Users, 
  Shield,
  ChevronDown,
  ChevronRight,
  LogOut,
  TrendingUp,
  TrendingDown,
  Percent,
  CreditCard,
  ArrowDownToLine,
  Search,
  RotateCcw,
  Activity,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminButton } from './ui/button';
import { useAdminAuth } from '@/hooks/useAdmin';
import { ADMIN_PERMISSIONS } from '@/types/admin';

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: ADMIN_PERMISSIONS.VIEW_REPORTS
  },
  {
    title: 'Empresas',
    href: '/admin/empresas',
    icon: Building2,
    permission: ADMIN_PERMISSIONS.VIEW_TENANTS
  },
  {
    title: 'Financeiro',
    icon: DollarSign,
    permission: ADMIN_PERMISSIONS.VIEW_FINANCES,
    children: [
      {
        title: 'Visão Geral',
        href: '/admin/financeiro',
        icon: DollarSign,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Entradas',
        href: '/admin/financeiro/entradas',
        icon: TrendingUp,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Saídas',
        href: '/admin/financeiro/saidas',
        icon: TrendingDown,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Comissões Pagas',
        href: '/admin/financeiro/comissoes',
        icon: Percent,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Carteiras dos Clientes',
        href: '/admin/financeiro/carteiras-clientes',
        icon: CreditCard,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Solicitações de Saque',
        href: '/admin/financeiro/saques',
        icon: ArrowDownToLine,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Reversa Financeira',
        href: '/admin/financeiro/reversa',
        icon: RotateCcw,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Buscar Transação',
        href: '/admin/financeiro/buscar',
        icon: Search,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'MEDs',
        href: '/admin/financeiro/meds',
        icon: Activity,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Infrações',
        href: '/admin/financeiro/infracoes',
        icon: AlertTriangle,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Carteiras',
        href: '/admin/carteiras',
        icon: Wallet,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      },
      {
        title: 'Reservas',
        href: '/admin/reservas',
        icon: Shield,
        permission: ADMIN_PERMISSIONS.VIEW_FINANCES
      }
    ]
  },

  {
    title: 'Verificação KYC',
    href: '/admin/kyc',
    icon: Shield,
    permission: ADMIN_PERMISSIONS.VIEW_REPORTS
  },
  {
    title: 'Usuários Admin',
    href: '/admin/usuarios',
    icon: Users,
    permission: ADMIN_PERMISSIONS.MANAGE_USERS
  },
  {
    title: 'Configurações',
    icon: Settings,
    permission: ADMIN_PERMISSIONS.VIEW_SETTINGS,
    children: [
      {
        title: 'Geral',
        href: '/admin/configuracoes',
        icon: Settings,
        permission: ADMIN_PERMISSIONS.VIEW_SETTINGS
      },
      {
        title: 'Adquirentes',
        href: '/admin/configuracoes/adquirentes',
        icon: Settings,
        permission: ADMIN_PERMISSIONS.MANAGE_SETTINGS
      },
      {
        title: 'Taxas',
        href: '/admin/configuracoes/taxas',
        icon: DollarSign,
        permission: ADMIN_PERMISSIONS.MANAGE_SETTINGS
      }
    ]
  },
  {
    title: 'Faturamento TPV',
    href: '/admin/faturamento',
    icon: FileText,
    permission: ADMIN_PERMISSIONS.VIEW_FINANCES
  }
];

interface SidebarItemComponentProps {
  item: SidebarItem;
  level?: number;
}

function SidebarItemComponent({ item, level = 0 }: SidebarItemComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { hasPermission } = useAdminAuth();
  
  // Check if user has permission to see this item
  if (item.permission && !hasPermission(item.permission as any)) {
    return null;
  }
  
  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };
  
  const ItemIcon = item.icon;
  
  if (hasChildren) {
    return (
      <div>
        <button
          onClick={handleClick}
          className={cn(
            'group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-none transition-all duration-200',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <ItemIcon
            className={cn(
              'mr-3 flex-shrink-0 h-5 w-5',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground'
            )}
          />
          {item.title}
          {isOpen ? (
            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200" />
          )}
        </button>
        {isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children?.map((child, index) => {
              const childIsActive = child.href ? pathname === child.href || pathname.startsWith(child.href + '/') : false;
              return (
                <Link
                  key={index}
                  href={child.href || '#'}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm rounded-none transition-all duration-200',
                    childIsActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-60" />
                  {child.title}
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
      href={item.href || '#'}
      className={cn(
        'group flex items-center px-3 py-2.5 text-sm font-medium rounded-none transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary border-l-2 border-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <ItemIcon
        className={cn(
          'mr-3 flex-shrink-0 h-5 w-5',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground'
        )}
      />
      {item.title}
    </Link>
  );
}

export function AdminSidebar() {
  const { adminUser, logout } = useAdminAuth();
  
  return (
    <div className="flex flex-col flex-grow bg-card border-r border-border overflow-y-auto">
      {/* Header */}
      <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-border">
        <Shield className="h-8 w-8 text-primary mr-3" />
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground">
            PagTracker v4.0
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-grow flex flex-col py-4">
        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item, index) => (
            <SidebarItemComponent key={index} item={item} />
          ))}
        </nav>
      </div>
      

    </div>
  );
}