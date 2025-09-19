/**
 * Classe base para todos os serviços de negócio da aplicação
 * Implementa a lógica de isolamento por tenant
 */
export abstract class BaseService {
  protected tenantId: string;
  protected userId: string;
  
  /**
   * @param tenantId ID do tenant para isolamento de dados
   * @param userId ID do usuário que está realizando a operação
   */
  constructor(tenantId: string, userId: string) {
    if (!tenantId) {
      throw new Error('TenantID é obrigatório para operações de serviço');
    }
    
    this.tenantId = tenantId;
    this.userId = userId;
  }
  
  /**
   * Adiciona filtros de tenant a uma consulta
   * 
   * @param query Objeto de consulta original
   * @returns Consulta com filtro de tenant adicionado
   */
  protected addTenantFilter<T extends Record<string, any>>(query: T): T & { tenant_id: string } {
    return {
      ...query,
      tenant_id: this.tenantId
    };
  }
  
  /**
   * Adiciona informações de tenant a novos dados
   * 
   * @param data Dados originais a serem salvos
   * @returns Dados com informações de tenant adicionadas
   */
  protected addTenantInfo<T extends Record<string, any>>(data: T): T & { 
    tenant_id: string;
    user_id: string;
    created_at?: string;
    updated_at: string;
  } {
    const now = new Date().toISOString();
    
    return {
      ...data,
      tenant_id: this.tenantId,
      user_id: this.userId,
      created_at: data.created_at || now,
      updated_at: now
    };
  }
  
  /**
   * Valida se um recurso pertence ao tenant atual
   * 
   * @param resource Recurso a ser validado
   * @throws Error se o recurso não pertencer ao tenant
   */
  protected validateTenantAccess<T extends { tenant_id: string }>(resource: T | null): T {
    if (!resource) {
      throw new Error('Recurso não encontrado');
    }
    
    if (resource.tenant_id !== this.tenantId) {
      throw new Error('Acesso não autorizado a este recurso');
    }
    
    return resource;
  }
  
  /**
   * Atualiza informações de um registro
   * 
   * @param data Dados originais
   * @param updates Atualizações a serem aplicadas
   * @returns Objeto atualizado com campo updated_at
   */
  protected applyUpdates<T extends Record<string, any>>(data: T, updates: Partial<T>): T {
    return {
      ...data,
      ...updates,
      updated_at: new Date().toISOString()
    };
  }
  
  /**
   * Remove dados sensíveis antes de retornar para o cliente
   * Método a ser implementado por serviços específicos
   */
  protected abstract sanitizeOutput<T>(data: T): Partial<T>;
} 