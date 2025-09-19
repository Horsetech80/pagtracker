'use client';

import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook simplificado para obter tenant ID
 * Compatível com a nova arquitetura multi-tenant
 */
export function useTenantId() {
  const { tenantId, tenant, isLoading } = useTenant();

  return {
    tenantId,
    tenant,
    isLoading,
    isValidTenant: !!tenant?.active,
  };
}

/**
 * Hook para validar se está no contexto correto do tenant
 */
export function useRequiredTenant() {
  const { tenantId, tenant, isLoading, error } = useTenant();

  if (isLoading) {
    return { tenantId: null, tenant: null, isLoading: true, error: null };
  }

  if (!tenantId || !tenant) {
    return { 
      tenantId: null, 
      tenant: null, 
      isLoading: false, 
      error: 'Tenant não encontrado' 
    };
  }

  if (!tenant.active) {
    return { 
      tenantId, 
      tenant, 
      isLoading: false, 
      error: 'Tenant inativo' 
    };
  }

  return { tenantId, tenant, isLoading: false, error: null };
} 