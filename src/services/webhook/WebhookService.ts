import { EntityService, IRepository } from '../core/EntityService';
import { MemoryRepository } from '../core/MemoryRepository';
import { SupabaseFactory } from '../core/SupabaseFactory';
import { generateTenantResourceId } from '@/middleware/tenant/info';
import { log } from '@/lib/logger';

/**
 * Tipos de eventos de webhook
 */
export type WebhookEventType = 
  | 'payment.created'
  | 'payment.processing'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'checkout.created'
  | 'checkout.updated'
  | 'checkout.deleted';

/**
 * Interface para webhooks configurados
 */
export interface WebhookConfig {
  id: string;
  tenant_id: string;
  user_id: string;
  url: string;
  secret: string;
  description?: string;
  events: WebhookEventType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para eventos enviados aos webhooks
 */
export interface WebhookEvent {
  id: string;
  tenant_id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  resource_id: string;
  data: any;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  last_attempt?: string;
  response_code?: number;
  response_body?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Serviço para gerenciamento de webhooks
 */
export class WebhookService extends EntityService<WebhookConfig> {
  private eventRepository: IRepository<WebhookEvent>;
  
  /**
   * @param repository Repositório de configurações de webhook
   * @param eventRepository Repositório de eventos de webhook
   * @param tenantId ID do tenant
   * @param userId ID do usuário
   */
  constructor(
    repository: IRepository<WebhookConfig>,
    eventRepository: IRepository<WebhookEvent>,
    tenantId: string,
    userId: string
  ) {
    super(repository, tenantId, userId);
    this.eventRepository = eventRepository;
  }
  
  /**
   * Cria uma nova configuração de webhook
   */
  async createWebhook(data: Omit<Partial<WebhookConfig>, 'id' | 'tenant_id' | 'user_id' | 'secret' | 'created_at' | 'updated_at'>): Promise<WebhookConfig> {
    // Validar campos obrigatórios
    if (!data.url) {
      throw new Error('URL do webhook é obrigatória');
    }
    
    if (!data.events || data.events.length === 0) {
      throw new Error('Pelo menos um evento deve ser selecionado');
    }
    
    // Gerar ID único para o webhook
    const webhookId = generateTenantResourceId('whk', this.tenantId, { shortTenantId: true });
    
    // Gerar secret para assinatura
    const secret = generateWebhookSecret();
    
    // Criar o objeto de webhook
    const webhook: Partial<WebhookConfig> = {
      id: webhookId,
      secret,
      is_active: data.is_active !== false, // Default: true
      ...data
    };
    
    // Criar o webhook no repositório
    return this.create(webhook);
  }
  
  /**
   * Simula o envio de um evento para webhooks
   */
  async sendEvent(eventType: WebhookEventType, resourceId: string, data: any): Promise<WebhookEvent[]> {
    // Buscar webhooks ativos que assinam este tipo de evento
    const webhooks = await this.list({
      is_active: true,
      // Não é possível filtrar por array diretamente, então filtramos manualmente depois
    });
    
    const subscribedWebhooks = webhooks.filter(webhook => 
      webhook.events.includes(eventType)
    );
    
    // Se não há webhooks inscritos, retornar array vazio
    if (subscribedWebhooks.length === 0) {
      return [];
    }
    
    // Criar eventos para cada webhook inscrito
    const events: WebhookEvent[] = [];
    
    for (const webhook of subscribedWebhooks) {
      // Gerar ID único para o evento
      const eventId = generateTenantResourceId('evt', this.tenantId, { shortTenantId: true });
      
      // Criar o objeto de evento
      const event: WebhookEvent = {
        id: eventId,
        tenant_id: this.tenantId,
        webhook_id: webhook.id,
        event_type: eventType,
        resource_id: resourceId,
        data,
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Em uma implementação real, enviaríamos o evento para a URL do webhook
      // Aqui, apenas simulamos o registro do evento
      try {
        await this.eventRepository.create(event);
        
        // Simular envio bem-sucedido (em produção, faríamos uma requisição HTTP real)
        const updatedEvent = await this.eventRepository.update(eventId, {
          status: 'sent',
          attempts: 1,
          last_attempt: new Date().toISOString(),
          response_code: 200,
          response_body: '{"success":true}',
          updated_at: new Date().toISOString()
        });
        
        events.push(updatedEvent);
      } catch (error) {
        log.error('Erro ao registrar evento de webhook', {
          service: 'WebhookService',
          method: 'sendEvent',
          tenantId: this.tenantId,
          userId: this.userId,
          eventType,
          resourceId,
          webhookId: webhook.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return events;
  }
  
  /**
   * Busca eventos de webhook
   */
  async getEvents(filter: Partial<Pick<WebhookEvent, 'webhook_id' | 'event_type' | 'status'>> = {}, limit = 100): Promise<WebhookEvent[]> {
    // Adicionar filtro de tenant
    const query = this.addTenantFilter(filter);
    
    // Buscar eventos
    const events = await this.eventRepository.findMany(query, {
      limit,
      orderBy: { field: 'created_at', direction: 'desc' }
    });
    
    return events;
  }
  
  /**
   * Ativa ou desativa um webhook
   */
  async toggleActive(id: string, isActive: boolean): Promise<WebhookConfig> {
    return this.update(id, { is_active: isActive });
  }
  
  /**
   * Remove dados sensíveis
   */
  protected sanitizeOutput<T>(data: T): Partial<T> {
    // Cria uma cópia para não modificar o objeto original
    const sanitized = { ...data } as any;
    
    // Remove campos sensíveis
    if ('secret' in sanitized) {
      delete sanitized.secret;
    }
    
    return sanitized;
  }
  
  /**
   * Cria uma instância do serviço com repositórios em memória
   */
  static createWithMemoryRepo(
    tenantId: string,
    userId: string,
    initialWebhooks: WebhookConfig[] = [],
    initialEvents: WebhookEvent[] = []
  ): WebhookService {
    const webhookRepo = new MemoryRepository<WebhookConfig>(initialWebhooks);
    const eventRepo = new MemoryRepository<WebhookEvent>(initialEvents);
    return new WebhookService(webhookRepo, eventRepo, tenantId, userId);
  }
  
  /**
   * Cria uma instância do serviço com repositórios Supabase
   */
  static createWithSupabase(
    tenantId: string,
    userId: string
  ): WebhookService {
    const supabase = SupabaseFactory.getInstance();
    const webhookRepo = supabase.webhooks();
    const eventRepo = supabase.webhookEvents();
    return new WebhookService(webhookRepo, eventRepo, tenantId, userId);
  }
}

/**
 * Gera um secret aleatório para assinatura de webhooks
 */
function generateWebhookSecret(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  
  for (let i = 0; i < 24; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    secret += charset[randomIndex];
  }
  
  return secret;
}