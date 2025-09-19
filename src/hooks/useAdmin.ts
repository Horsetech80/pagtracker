// Custom hooks for Admin Panel functionality
// Provides reusable logic for admin authentication, permissions, and data management

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminSupabase } from '@/lib/supabase/admin-client';
import type { 
  AdminUser, 
  AdminDashboardStats, 
  TenantManagement, 
  FinancialOverview,
  WalletOverview,
  WithdrawalRequest,
  Infraction,
  AdminSearchFilters,
  PaginatedResponse,
  AdminPermission
} from '@/types/admin';

// Admin Authentication Hook
export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkAdminAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await adminSupabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Não autenticado');
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await adminSupabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        throw new Error('Acesso negado: usuário não é administrador');
      }

      setAdminUser(adminData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de autenticação');
      setAdminUser(null);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await adminSupabase.auth.signOut();
      setAdminUser(null);
      router.push('/admin/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  }, [router]);

  const hasPermission = useCallback((permission: AdminPermission): boolean => {
    if (!adminUser) return false;
    
    // Super admin has all permissions
    if (adminUser.role === 'super_admin') return true;
    
    // Check if user has specific permission
    return adminUser.permissions.includes(permission);
  }, [adminUser]);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  return {
    adminUser,
    loading,
    error,
    logout,
    hasPermission,
    refetch: checkAdminAuth
  };
}

// Dashboard Statistics Hook
export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas do dashboard');
      }

      const stats = await response.json();
      setStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboardStats
  };
}

// Tenant Management Hook
export function useTenantManagement(filters?: AdminSearchFilters) {
  const [tenants, setTenants] = useState<PaginatedResponse<TenantManagement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.status) queryParams.append('status', filters.status);

      const response = await fetch(`/api/admin/tenants?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar tenants');
      }

      const data = await response.json();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateTenantStatus = useCallback(async (tenantId: string, status: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setTenants(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          data: prev.data.map(tenant => 
            tenant.id === tenantId 
              ? { ...tenant, status: status as any, updated_at: new Date().toISOString() }
              : tenant
          )
        };
      });
      
      return { success: true };
    } catch (err) {
      throw new Error('Erro ao atualizar status da empresa');
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    refetch: fetchTenants,
    updateTenantStatus
  };
}

// Financial Overview Hook
export function useFinancialOverview(filters?: AdminSearchFilters) {
  const [financial, setFinancial] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data
      const mockFinancial: FinancialOverview = {
        total_revenue: 2847392.50,
        total_commissions: 142369.63,
        total_withdrawals: 1950000.00,
        available_balance: 755022.87,
        reserved_balance: 89543.21,
        monthly_data: [
          { month: '2024-01', revenue: 245000, commissions: 12250, withdrawals: 180000, net_profit: 77250 },
          { month: '2024-02', revenue: 287000, commissions: 14350, withdrawals: 210000, net_profit: 91350 },
          { month: '2024-03', revenue: 312000, commissions: 15600, withdrawals: 245000, net_profit: 82600 }
        ]
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      setFinancial(mockFinancial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    financial,
    loading,
    error,
    refetch: fetchFinancialData
  };
}

// Wallet Management Hook
export function useWalletManagement(filters?: AdminSearchFilters) {
  const { adminUser } = useAdminAuth();
  const [wallets, setWallets] = useState<PaginatedResponse<WalletOverview> | null>(null);
  const [withdrawals, setWithdrawals] = useState<PaginatedResponse<WithdrawalRequest> | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados reais de saques via API
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        ...(filters?.status && { status: filters.status }),
        ...(filters?.tenant_id && { tenant_id: filters.tenant_id }),
        ...(filters?.user_id && { user_id: filters.user_id }),
        ...(filters?.date_from && { date_from: filters.date_from }),
        ...(filters?.date_to && { date_to: filters.date_to }),
        ...(filters?.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/withdrawals?${params}`, {
        headers: {
          'x-admin-id': adminUser?.id || 'anonymous'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados de saques');
      }

      const data = await response.json();
      
      // Converter dados de saques para o formato esperado
      const formattedWithdrawals: WithdrawalRequest[] = data.withdrawals.map((w: any) => ({
        id: w.id,
        tenant_id: w.tenant_id,
        tenant_name: w.tenant_name || w.tenant_id,
        amount: w.amount / 100, // Converter de centavos para reais
        bank_details: {
          pix_key: w.pix_key,
          pix_key_type: w.pix_key_type,
          bank_details: w.bank_details
        },
        status: w.status,
        requested_at: w.requested_at,
        processed_at: w.processed_at,
        fee_amount: (w.fee_amount || 0) / 100,
        net_amount: w.net_amount / 100,
        user_name: w.user_name,
        user_email: w.user_email,
        admin_notes: w.admin_notes,
        rejection_reason: w.rejection_reason
      }));

      setWithdrawals({
        data: formattedWithdrawals,
        pagination: data.pagination
      });

      // Processar estatísticas para o summary
      const stats = data.statistics;
      setSummary({
        totalRequests: stats.total_requests || 0,
        pendingRequests: stats.pending_requests || 0,
        totalAmount: (stats.total_amount || 0) / 100, // Converter de centavos para reais
        pendingAmount: (stats.pending_amount || 0) / 100, // Converter de centavos para reais
        averageAmount: (stats.average_amount || 0) / 100, // Converter de centavos para reais
        processingTime: stats.average_processing_time || 0,
        approvalRate: stats.total_requests > 0 ? Math.round((stats.approved_requests / stats.total_requests) * 100) : 0,
        dailyVolume: (stats.pending_amount || 0) / 100 // Usar pending_amount como proxy para volume diário
      });

      // Buscar dados reais de carteiras via API
      const walletsResponse = await fetch(`/api/admin/wallets?${params}`, {
        headers: {
          'x-admin-id': adminUser?.id || 'anonymous'
        }
      });

      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json();
        setWallets(walletsData);
      } else {
        // Se a API de carteiras não estiver disponível, definir como vazio
        setWallets({
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false
          }
        });
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados das carteiras:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados das carteiras');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const processWithdrawal = useCallback(async (withdrawalId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminUser?.id || 'anonymous'
        },
        body: JSON.stringify({
          withdrawal_id: withdrawalId,
          action,
          admin_notes: notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar solicitação de saque');
      }

      const result = await response.json();
      
      // Update local state
      setWithdrawals(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          data: prev.data.map(withdrawal => 
            withdrawal.id === withdrawalId 
              ? { 
                  ...withdrawal, 
                  status: action === 'approve' ? 'approved' : 'rejected',
                  processed_at: new Date().toISOString(),
                  admin_notes: notes
                }
              : withdrawal
          )
        };
      });
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Erro ao processar saque:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao processar solicitação de saque');
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return {
    wallets,
    withdrawals,
    summary,
    loading,
    error,
    refetch: fetchWalletData,
    processWithdrawal
  };
}

// Infractions Management Hook
export function useInfractions(filters?: AdminSearchFilters) {
  const [infractions, setInfractions] = useState<PaginatedResponse<Infraction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfractions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.tenant_id) queryParams.append('tenant_id', filters.tenant_id);

      const response = await fetch(`/api/admin/infractions?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar infrações');
      }

      const data = await response.json();
      setInfractions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar infrações');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const resolveInfraction = useCallback(async (infractionId: string, resolution: any) => {
    try {
      const response = await fetch('/api/admin/infractions/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          infraction_id: infractionId,
          ...resolution
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao resolver infração');
      }

      const result = await response.json();
      
      // Update local state
      setInfractions(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          data: prev.data.map(infraction => 
            infraction.id === infractionId 
              ? { 
                  ...infraction, 
                  status: resolution.status,
                  resolved_at: new Date().toISOString(),
                  resolution_notes: resolution.notes,
                  penalty: resolution.penalty
                }
              : infraction
          )
        };
      });
      
      return { success: true, data: result };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao resolver infração');
    }
  }, []);

  useEffect(() => {
    fetchInfractions();
  }, [fetchInfractions]);

  return {
    infractions,
    loading,
    error,
    refetch: fetchInfractions,
    resolveInfraction
  };
}