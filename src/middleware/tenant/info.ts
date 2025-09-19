import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

/**
 * Interface para informações do tenant e usuário
 * Atualizada para incluir campos de segurança production-ready
 */
export interface TenantInfo {
  tenantId: string;
  userId: string;
  userRole: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Extrai informações do tenant e usuário dos headers de uma requisição
 */
export function getTenantInfo(req?: NextRequest): TenantInfo | null {
  try {
    // Obter headers da requisição ou do contexto global
    const headersList = req ? req.headers : headers();
    
    const tenantId = headersList.get('x-tenant-id');
    const userId = headersList.get('x-user-id');
    const userRole = headersList.get('x-user-role');
    
    if (!tenantId || !userId) {
      return null;
    }
    
    return {
      tenantId,
      userId,
      userRole: userRole || 'USER'
    };
  } catch (error) {
    console.error('Erro ao extrair informações do tenant:', error);
    return null;
  }
}

/**
 * Validação específica para casos em que um usuário só pode acessar
 * recursos do seu próprio tenant
 */
export function validateTenantAccess(resourceTenantId: string, tenantInfo: TenantInfo): boolean {
  // Administradores podem acessar todos os tenants (se implementarmos super admin)
  if (tenantInfo.userRole === 'SUPER_ADMIN') {
    return true;
  }
  
  // Para usuários normais, verificar se o recurso pertence ao tenant do usuário
  return resourceTenantId === tenantInfo.tenantId;
}

/**
 * Gera um ID com prefixo específico para o tipo de recurso e incluindo referência ao tenant
 */
export function generateTenantResourceId(
  prefix: string, 
  tenantId: string,
  options?: { shortTenantId?: boolean }
): string {
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const tenantRef = options?.shortTenantId 
    ? tenantId.split('_')[1]?.substring(0, 4) || tenantId.substring(0, 4)
    : tenantId;
    
  return `${prefix}_${tenantRef}_${uniqueId}`;
} 