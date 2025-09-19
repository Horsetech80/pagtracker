// PAINEL ADMINISTRATIVO - Layout Principal
// Layout exclusivo para administração do SISTEMA (não confundir com painel cliente)
// Gerencia: tenants, usuários globais, configurações do sistema, monitoramento
// Acesso: apenas super admins autorizados

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider';
import { ToastProvider } from '@/lib/hooks/use-toast';
import { Toaster } from 'sonner';
import { useAdminAuth } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Usar autenticação real do Supabase
  const { adminUser, loading, error } = useAdminAuth();
  
  // Allow access to login page without authentication
  const isLoginPage = pathname === '/admin/login';
  
  if (isLoginPage) {
    return (
      <div className={cn(inter.className, "min-h-screen bg-background")}>
        {children}
      </div>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !adminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Você não tem permissão para acessar o painel administrativo.'}
          </p>
          <button 
            onClick={() => window.location.href = '/admin/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
        <AdminHeader 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <ToastProvider>
        <div className={`${inter.className} dark`}>
          <AdminLayoutContent>
            {children}
          </AdminLayoutContent>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            duration={4000}
            theme="dark"
          />
        </div>
      </ToastProvider>
    </AdminThemeProvider>
  );
}