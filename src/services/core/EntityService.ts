import { BaseService } from './BaseService';

/**
 * Interface para repositórios de dados
 * Abstrai a implementação específica do banco de dados
 */
export interface IRepository<T> {
  findMany(query: any, options?: any): Promise<T[]>;
  findOne(query: any): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Classe base para serviços de entidades
 * Implementa operações CRUD básicas com isolamento por tenant
 */
export abstract class EntityService<T extends { id: string; tenant_id: string }> extends BaseService {
  protected repository: IRepository<T>;
  
  /**
   * @param repository Repositório para acesso aos dados
   * @param tenantId ID do tenant para isolamento de dados
   * @param userId ID do usuário que está realizando a operação
   */
  constructor(repository: IRepository<T>, tenantId: string, userId: string) {
    super(tenantId, userId);
    this.repository = repository;
  }
  
  /**
   * Lista entidades do tenant atual
   * 
   * @param query Filtros adicionais (além do tenant_id)
   * @param options Opções adicionais (paginação, ordenação, etc)
   * @returns Lista de entidades
   */
  async list(query: Record<string, any> = {}, options: Record<string, any> = {}): Promise<T[]> {
    const tenantQuery = this.addTenantFilter(query);
    const entities = await this.repository.findMany(tenantQuery, options);
    
    // Sanitiza cada item antes de retornar
    return entities.map(entity => this.sanitizeOutput(entity) as T);
  }
  
  /**
   * Busca uma entidade pelo ID
   * 
   * @param id ID da entidade
   * @returns Entidade encontrada ou null
   * @throws Error se a entidade não pertencer ao tenant
   */
  async findById(id: string): Promise<T | null> {
    const entity = await this.repository.findOne({ id });
    
    if (!entity) {
      return null;
    }
    
    // Valida se pertence ao tenant antes de retornar
    this.validateTenantAccess(entity);
    
    return this.sanitizeOutput(entity) as T;
  }
  
  /**
   * Cria uma nova entidade
   * 
   * @param data Dados da entidade
   * @returns Entidade criada
   */
  async create(data: Partial<T>): Promise<T> {
    // Adiciona informações de tenant e timestamp
    const entityData = this.addTenantInfo(data);
    
    // Salva no repositório
    const entity = await this.repository.create(entityData);
    
    return this.sanitizeOutput(entity) as T;
  }
  
  /**
   * Atualiza uma entidade existente
   * 
   * @param id ID da entidade
   * @param data Dados a serem atualizados
   * @returns Entidade atualizada
   * @throws Error se a entidade não for encontrada ou não pertencer ao tenant
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    // Busca a entidade para validar acesso
    const entity = await this.repository.findOne({ id });
    this.validateTenantAccess(entity);
    
    // Remove campos protegidos
    const { tenant_id, user_id, created_at, ...updateData } = data as any;
    
    // Atualiza no repositório
    const updated = await this.repository.update(id, {
      ...updateData,
      updated_at: new Date().toISOString()
    });
    
    return this.sanitizeOutput(updated) as T;
  }
  
  /**
   * Remove uma entidade
   * 
   * @param id ID da entidade
   * @returns true se removido com sucesso
   * @throws Error se a entidade não for encontrada ou não pertencer ao tenant
   */
  async delete(id: string): Promise<boolean> {
    // Busca a entidade para validar acesso
    const entity = await this.repository.findOne({ id });
    this.validateTenantAccess(entity);
    
    // Remove do repositório
    return this.repository.delete(id);
  }
} 