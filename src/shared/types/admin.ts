// Types for Admin Panel System
// Defines all TypeScript interfaces and types for the administrative functionality

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_login?: string;
  created_by?: string;
  notes?: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminSession {
  id: string;
  admin_user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
  last_activity: string;
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  admin_user?: {
    name: string;
    email: string;
  };
}

// Admin Dashboard Statistics
export interface AdminDashboardStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_revenue: number;
  pending_withdrawals: number;
  pending_withdrawals_amount: number;
  monthly_revenue: number;
  monthly_growth: number;
}

// Tenant Management
export interface TenantManagement {
  id: string;
  name: string;
  email: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
  subscription_plan?: string;
  monthly_revenue: number;
  total_transactions: number;
  last_activity?: string;
  owner_name?: string;
  phone?: string;
  document?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// Financial Management
export interface FinancialOverview {
  total_revenue: number;
  total_commissions: number;
  total_withdrawals: number;
  available_balance: number;
  reserved_balance: number;
  monthly_data: MonthlyFinancialData[];
}

export interface MonthlyFinancialData {
  month: string;
  revenue: number;
  commissions: number;
  withdrawals: number;
  net_profit: number;
}

export interface TransactionEntry {
  id: string;
  tenant_id: string;
  tenant_name: string;
  type: 'revenue' | 'commission' | 'withdrawal' | 'refund';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference_id?: string;
}

// Wallet Management
export interface WalletOverview {
  tenant_id: string;
  tenant_name: string;
  total_balance: number;
  available_balance: number;
  reserved_balance: number;
  pending_withdrawals: number;
  last_transaction?: string;
  status: 'active' | 'frozen' | 'suspended';
}

export interface WithdrawalRequest {
  id: string;
  tenant_id: string;
  tenant_name: string;
  amount: number;
  bank_details: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    pix_key?: string;
  };
  status: WithdrawalStatus;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
  fee_amount: number;
  net_amount: number;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';

// Infractions System
export interface Infraction {
  id: string;
  tenant_id: string;
  tenant_name: string;
  type: InfractionType;
  severity: InfractionSeverity;
  description: string;
  evidence?: string[];
  status: InfractionStatus;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  penalty?: {
    type: 'warning' | 'fine' | 'suspension' | 'termination';
    amount?: number;
    duration?: number; // days
  };
}

export type InfractionType = 
  | 'chargeback_abuse'
  | 'fraud_attempt'
  | 'policy_violation'
  | 'suspicious_activity'
  | 'compliance_issue'
  | 'other';

export type InfractionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type InfractionStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

// Reserve Management
export interface ReserveTransaction {
  id: string;
  tenant_id: string;
  tenant_name: string;
  type: 'reserve' | 'release';
  amount: number;
  reason: string;
  reference_transaction_id?: string;
  created_at: string;
  created_by: string;
  expires_at?: string;
  status: 'active' | 'released' | 'expired';
}

// Global Settings
export interface GlobalSettings {
  id: string;
  category: SettingCategory;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
  updated_by: string;
}

export type SettingCategory = 
  | 'payment_gateways'
  | 'commission_rates'
  | 'withdrawal_limits'
  | 'security'
  | 'notifications'
  | 'system';

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  config: Record<string, any>;
  commission_rate: number;
  processing_fee: number;
  supported_methods: string[];
}

export interface CommissionRate {
  id: string;
  name: string;
  payment_method: string;
  rate_type: 'percentage' | 'fixed';
  rate_value: number;
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
}

// TPV Billing System
export interface TPVBilling {
  id: string;
  tenant_id: string;
  tenant_name: string;
  billing_period: {
    start_date: string;
    end_date: string;
  };
  transaction_volume: number;
  transaction_count: number;
  commission_rate: number;
  commission_amount: number;
  additional_fees: {
    name: string;
    amount: number;
  }[];
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  paid_at?: string;
}

// Search and Filters
export interface AdminSearchFilters {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  tenant_id?: string;
  user_id?: string;
  amount_min?: number;
  amount_max?: number;
  type?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// API Response Types
export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

// Form Types
export interface CreateTenantForm {
  name: string;
  email: string;
  owner_name: string;
  phone: string;
  document: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  subscription_plan: string;
}

export interface UpdateTenantForm extends Partial<CreateTenantForm> {
  status?: TenantStatus;
}

export interface CreateAdminUserForm {
  email: string;
  name: string;
  role: AdminRole;
  permissions?: string[];
  notes?: string;
}

export interface ProcessWithdrawalForm {
  action: 'approve' | 'reject';
  notes?: string;
}

export interface CreateInfractionForm {
  tenant_id: string;
  type: InfractionType;
  severity: InfractionSeverity;
  description: string;
  evidence?: string[];
}

export interface ResolveInfractionForm {
  status: InfractionStatus;
  resolution_notes?: string;
  penalty?: {
    type: 'warning' | 'fine' | 'suspension' | 'termination';
    amount?: number;
    duration?: number;
  };
}

// Permission Constants
export const ADMIN_PERMISSIONS = {
  // Tenant Management
  MANAGE_TENANTS: 'manage_tenants',
  VIEW_TENANTS: 'view_tenants',
  
  // Financial Management
  MANAGE_FINANCES: 'manage_finances',
  VIEW_FINANCES: 'view_finances',
  APPROVE_WITHDRAWALS: 'approve_withdrawals',
  
  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',
  
  // Reports and Analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // System Administration
  MANAGE_SYSTEM: 'manage_system',
  VIEW_LOGS: 'view_logs'
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];

// Role Permissions Mapping
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: Object.values(ADMIN_PERMISSIONS),
  admin: [
    ADMIN_PERMISSIONS.VIEW_TENANTS,
    ADMIN_PERMISSIONS.MANAGE_FINANCES,
    ADMIN_PERMISSIONS.VIEW_FINANCES,
    ADMIN_PERMISSIONS.APPROVE_WITHDRAWALS,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_REPORTS,
    ADMIN_PERMISSIONS.EXPORT_DATA
  ],
  moderator: [
    ADMIN_PERMISSIONS.VIEW_TENANTS,
    ADMIN_PERMISSIONS.VIEW_FINANCES,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_REPORTS
  ]
};