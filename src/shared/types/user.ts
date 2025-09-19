export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
  merchant_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'merchant' | 'customer'; 