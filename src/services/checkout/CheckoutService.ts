import { EntityService, IRepository } from '../core/EntityService';
import { MemoryRepository } from '../core/MemoryRepository';
import { SupabaseRepository } from '../core/SupabaseRepository';
import { SupabaseFactory } from '../core/SupabaseFactory';
import { CheckoutConfigData } from '@/types/checkout';
import { generateTenantResourceId } from '@/middleware/tenant/info';

/**
 * Serviço para gerenciamento de checkouts
 */
export class CheckoutService extends EntityService<CheckoutConfigData> {
  /**
   * @param repository Repositório de checkouts
   * @param tenantId ID do tenant
   * @param userId ID do usuário
   */
  constructor(
    repository: IRepository<CheckoutConfigData>,
    tenantId: string,
    userId: string
  ) {
    super(repository, tenantId, userId);
  }
  
  /**
   * Cria um novo checkout
   * 
   * @param data Dados do checkout
   * @returns Checkout criado
   */
  async create(data: Partial<CheckoutConfigData>): Promise<CheckoutConfigData> {
    // Gera um ID para o checkout se não for fornecido
    if (!data.id) {
      data.id = generateTenantResourceId('chk', this.tenantId, { shortTenantId: true });
    }
    
    // Inicializa campos padrão se não forem fornecidos
    const checkout: Partial<CheckoutConfigData> = {
      ativado: true,
      campos_adicionais: {
        endereco: false,
        telefone: true,
        data_nascimento: false
      },
      cor_primaria: '#007bff',
      cor_secundaria: '#6c757d',
      api_key: '',
      ...data
    };
    
    // Valida campos obrigatórios
    if (!checkout.nome_loja) {
      throw new Error('Nome da loja é obrigatório');
    }
    
    return super.create(checkout);
  }
  
  /**
   * Busca checkouts por ambiente
   * 
   * @param environment Ambiente (live, test ou todos)
   * @returns Lista de checkouts
   */
  async findByEnvironment(environment: 'live' | 'test' | 'all' = 'all'): Promise<CheckoutConfigData[]> {
    const query = environment !== 'all' ? { environment } : {};
    return this.list(query);
  }
  
  /**
   * Ativa ou desativa um checkout
   * 
   * @param id ID do checkout
   * @param ativado Status (true/false)
   * @returns Checkout atualizado
   */
  async toggleActive(id: string, ativado: boolean): Promise<CheckoutConfigData> {
    // Verifica se o checkout existe e pertence ao tenant
    const checkout = await this.findById(id);
    if (!checkout) {
      throw new Error('Checkout não encontrado');
    }
    
    return this.update(id, { ativado });
  }
  
  /**
   * Remove dados sensíveis antes de retornar para o cliente
   * 
   * @param data Dados do checkout
   * @returns Checkout sem dados sensíveis
   */
  protected sanitizeOutput<T>(data: T): Partial<T> {
    // Cria uma cópia para não modificar o objeto original
    const sanitized = { ...data } as any;
    
    // Remove a chave secreta da API (se existir)
    if ('api_secret' in sanitized) {
      delete sanitized.api_secret;
    }
    
    return sanitized;
  }
  
  /**
   * Cria uma instância do serviço com um repositório em memória
   * Útil para testes e desenvolvimento
   * 
   * @param tenantId ID do tenant
   * @param userId ID do usuário
   * @param initialData Dados iniciais para o repositório
   */
  static createWithMemoryRepo(
    tenantId: string,
    userId: string,
    initialData: CheckoutConfigData[] = []
  ): CheckoutService {
    const repository = new MemoryRepository<CheckoutConfigData>(initialData);
    return new CheckoutService(repository, tenantId, userId);
  }
  
  /**
   * Cria uma instância do serviço com um repositório Supabase
   * 
   * @param tenantId ID do tenant
   * @param userId ID do usuário
   */
  static createWithSupabase(
    tenantId: string,
    userId: string
  ): CheckoutService {
    const repository = SupabaseFactory.getInstance().checkouts();
    return new CheckoutService(repository, tenantId, userId);
  }
} 